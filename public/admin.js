const defaultContent = {
  members: [],
  evidences: []
};

let content = structuredClone(defaultContent);

function escapeAttribute(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function renderMembersEditor() {
  const target = document.querySelector("#members-editor");
  target.innerHTML = content.members.map((member, index) => `
    <article class="editor-card" data-member="${index}">
      <header>
        <h3>Integrante ${index + 1}</h3>
        <button class="remove-item" type="button" data-remove-member="${index}">Quitar</button>
      </header>
      <label>Nombre
        <input data-field="name" type="text" maxlength="90" value="${escapeAttribute(member.name)}" required>
      </label>
      <label>Rol o aporte
        <input data-field="role" type="text" maxlength="120" value="${escapeAttribute(member.role)}" required>
      </label>
      <label>Descripción
        <textarea data-field="description" maxlength="600" required>${escapeAttribute(member.description)}</textarea>
      </label>
      <label>Reflexión final
        <textarea data-field="reflection" maxlength="900" required>${escapeAttribute(member.reflection)}</textarea>
      </label>
    </article>
  `).join("");

  target.querySelectorAll("[data-remove-member]").forEach((button) => {
    button.addEventListener("click", () => {
      content.members.splice(Number(button.dataset.removeMember), 1);
      renderMembersEditor();
    });
  });
}

function renderEvidencesEditor() {
  const target = document.querySelector("#evidences-editor");
  target.innerHTML = content.evidences.map((evidence, index) => `
    <article class="editor-card" data-evidence="${index}">
      <header>
        <h3>Evidencia ${index + 1}</h3>
        <button class="remove-item" type="button" data-remove-evidence="${index}">Quitar</button>
      </header>
      <label>Título
        <input data-field="title" type="text" maxlength="120" value="${escapeAttribute(evidence.title)}" required>
      </label>
      <label>Tipo
        <input data-field="type" type="text" maxlength="90" value="${escapeAttribute(evidence.type)}" required>
      </label>
      <label>Responsable
        <input data-field="owner" type="text" maxlength="90" value="${escapeAttribute(evidence.owner)}" required>
      </label>
      <label>Descripción
        <textarea data-field="description" maxlength="600" required>${escapeAttribute(evidence.description)}</textarea>
      </label>
      <label>Enlace a la evidencia
        <input data-field="link" type="url" maxlength="500" value="${escapeAttribute(evidence.link)}" placeholder="https://...">
      </label>
    </article>
  `).join("");

  target.querySelectorAll("[data-remove-evidence]").forEach((button) => {
    button.addEventListener("click", () => {
      content.evidences.splice(Number(button.dataset.removeEvidence), 1);
      renderEvidencesEditor();
    });
  });
}

function readEditors() {
  content.members = [...document.querySelectorAll("[data-member]")].map((card, index) => ({
    id: content.members[index]?.id || makeId("member"),
    name: card.querySelector('[data-field="name"]').value.trim(),
    role: card.querySelector('[data-field="role"]').value.trim(),
    description: card.querySelector('[data-field="description"]').value.trim(),
    reflection: card.querySelector('[data-field="reflection"]').value.trim()
  }));

  content.evidences = [...document.querySelectorAll("[data-evidence]")].map((card, index) => ({
    id: content.evidences[index]?.id || makeId("evidence"),
    title: card.querySelector('[data-field="title"]').value.trim(),
    type: card.querySelector('[data-field="type"]').value.trim(),
    owner: card.querySelector('[data-field="owner"]').value.trim(),
    description: card.querySelector('[data-field="description"]').value.trim(),
    link: card.querySelector('[data-field="link"]').value.trim()
  }));
}

async function loadContent() {
  const response = await fetch("/api/content");
  if (!response.ok) throw new Error("No fue posible cargar los datos.");
  content = await response.json();
  content.members ||= [];
  content.evidences ||= [];
  renderMembersEditor();
  renderEvidencesEditor();
}

function wireEvents() {
  document.querySelector("#add-member").addEventListener("click", () => {
    content.members.push({
      id: makeId("member"),
      name: "",
      role: "",
      description: "",
      reflection: ""
    });
    renderMembersEditor();
  });

  document.querySelector("#add-evidence").addEventListener("click", () => {
    content.evidences.push({
      id: makeId("evidence"),
      title: "",
      type: "",
      owner: "",
      description: "",
      link: ""
    });
    renderEvidencesEditor();
  });

  document.querySelector("#content-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const feedback = document.querySelector("#admin-feedback");
    readEditors();
    feedback.textContent = "Guardando...";

    try {
      const response = await fetch("/api/content", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(content)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No fue posible guardar los cambios.");
      content = result;
      feedback.textContent = "Cambios guardados. Ya se ven en la página principal.";
      renderMembersEditor();
      renderEvidencesEditor();
    } catch (error) {
      feedback.textContent = error.message || "No fue posible guardar los cambios.";
    }
  });
}

async function initialise() {
  wireEvents();
  try {
    await loadContent();
  } catch (error) {
    document.querySelector("#admin-feedback").textContent = error.message || "Inicia el servidor para gestionar el contenido.";
  }
}

initialise();
