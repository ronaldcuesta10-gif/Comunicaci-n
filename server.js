const http = require("http");
const fs = require("fs/promises");
const path = require("path");

const port = Number(process.env.PORT) || 3000;
const publicDirectory = path.join(__dirname, "public");
const dataDirectory = path.join(__dirname, "data");
const contentFile = path.join(dataDirectory, "site-data.json");
const proposalsFile = path.join(dataDirectory, "proposals.json");
const maxBodySize = 1_000_000;

const mimeTypes = {
  ".css": "text/css; charset=utf-8",
  ".html": "text/html; charset=utf-8",
  ".ico": "image/x-icon",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml"
};

function send(response, statusCode, body, headers = {}) {
  response.writeHead(statusCode, {
    "Cache-Control": "no-store",
    "X-Content-Type-Options": "nosniff",
    ...headers
  });
  response.end(body);
}

function sendJson(response, statusCode, data) {
  send(response, statusCode, JSON.stringify(data), {
    "Content-Type": "application/json; charset=utf-8"
  });
}

async function readJson(filePath, fallback) {
  try {
    return JSON.parse(await fs.readFile(filePath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return fallback;
    throw error;
  }
}

async function writeJson(filePath, data) {
  const temporaryFile = `${filePath}.tmp`;
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(temporaryFile, `${JSON.stringify(data, null, 2)}\n`, "utf8");
  await fs.rename(temporaryFile, filePath);
}

function cleanText(value, maximumLength) {
  return String(value || "").trim().slice(0, maximumLength);
}

function cleanLink(value) {
  const link = cleanText(value, 500);
  if (!link) return "";

  try {
    const url = new URL(link);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function normaliseContent(payload) {
  if (!payload || typeof payload !== "object") {
    throw new Error("El contenido recibido no es valido.");
  }

  const members = Array.isArray(payload.members) ? payload.members.slice(0, 12) : [];
  const evidences = Array.isArray(payload.evidences) ? payload.evidences.slice(0, 20) : [];

  return {
    members: members.map((member, index) => ({
      id: cleanText(member.id, 60) || `member-${index + 1}`,
      name: cleanText(member.name, 90) || `Aprendiz ${String(index + 1).padStart(2, "0")}`,
      role: cleanText(member.role, 120),
      description: cleanText(member.description, 600),
      reflection: cleanText(member.reflection, 900)
    })),
    evidences: evidences.map((evidence, index) => ({
      id: cleanText(evidence.id, 60) || `evidence-${index + 1}`,
      title: cleanText(evidence.title, 120) || "Evidencia sin titulo",
      type: cleanText(evidence.type, 90),
      owner: cleanText(evidence.owner, 90),
      description: cleanText(evidence.description, 600),
      link: cleanLink(evidence.link)
    }))
  };
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let size = 0;
    const chunks = [];

    request.on("data", (chunk) => {
      size += chunk.length;
      if (size > maxBodySize) {
        request.destroy();
        reject(new Error("La solicitud es demasiado grande."));
        return;
      }
      chunks.push(chunk);
    });

    request.on("end", () => {
      try {
        resolve(JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"));
      } catch {
        reject(new Error("El cuerpo debe ser JSON valido."));
      }
    });

    request.on("error", reject);
  });
}

function normaliseProposal(payload) {
  const proposal = {
    project: cleanText(payload.project, 120),
    counterpart: cleanText(payload.counterpart, 120),
    scope: Number(payload.scope),
    deadlineWeeks: Number(payload.deadlineWeeks),
    weeklyHours: Number(payload.weeklyHours),
    recommendation: cleanText(payload.recommendation, 1200),
    createdAt: new Date().toISOString()
  };

  if (!proposal.project || !proposal.counterpart) {
    throw new Error("Indica el proyecto y la persona con quien negocias.");
  }

  if (![proposal.scope, proposal.deadlineWeeks, proposal.weeklyHours].every(Number.isFinite)) {
    throw new Error("Los datos de la propuesta no son validos.");
  }

  return proposal;
}

async function serveStaticFile(requestPath, response) {
  let decodedPath;
  try {
    decodedPath = decodeURIComponent(requestPath);
  } catch {
    send(response, 400, "Solicitud invalida.", { "Content-Type": "text/plain; charset=utf-8" });
    return;
  }

  const relativePath = decodedPath === "/" ? "index.html" : decodedPath.replace(/^\/+/, "");
  const filePath = path.normalize(path.join(publicDirectory, relativePath));

  if (!filePath.startsWith(`${publicDirectory}${path.sep}`)) {
    send(response, 403, "Acceso no permitido.", { "Content-Type": "text/plain; charset=utf-8" });
    return;
  }

  try {
    const file = await fs.readFile(filePath);
    const extension = path.extname(filePath).toLowerCase();
    send(response, 200, file, {
      "Content-Security-Policy": "default-src 'self'; img-src 'self' https://images.unsplash.com data:; style-src 'self'; script-src 'self'; connect-src 'self'; base-uri 'self'; frame-ancestors 'none'",
      "Content-Type": mimeTypes[extension] || "application/octet-stream"
    });
  } catch (error) {
    if (error.code === "ENOENT") {
      send(response, 404, "Pagina no encontrada.", { "Content-Type": "text/plain; charset=utf-8" });
      return;
    }
    throw error;
  }
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url, `http://${request.headers.host || "localhost"}`);

  try {
    if (request.method === "GET" && url.pathname === "/api/health") {
      sendJson(response, 200, { status: "ok" });
      return;
    }

    if (request.method === "GET" && url.pathname === "/api/content") {
      sendJson(response, 200, await readJson(contentFile, { members: [], evidences: [] }));
      return;
    }

    if (request.method === "PUT" && url.pathname === "/api/content") {
      const content = normaliseContent(await readRequestBody(request));
      await writeJson(contentFile, content);
      sendJson(response, 200, content);
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/proposals") {
      const proposals = await readJson(proposalsFile, []);
      const proposal = normaliseProposal(await readRequestBody(request));
      proposals.unshift(proposal);
      await writeJson(proposalsFile, proposals.slice(0, 100));
      sendJson(response, 201, { message: "Propuesta guardada.", proposal });
      return;
    }

    if (url.pathname.startsWith("/api/")) {
      sendJson(response, 404, { error: "Ruta de API no encontrada." });
      return;
    }

    await serveStaticFile(url.pathname, response);
  } catch (error) {
    console.error(error);
    sendJson(response, 400, { error: error.message || "No fue posible procesar la solicitud." });
  }
});

server.listen(port, () => {
  console.log(`Acuerdo Lab disponible en http://localhost:${port}`);
});
