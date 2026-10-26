const fallbackContent = {
  members: [
    {
      id: "member-1",
      name: "Aprendiz 01",
      role: "Análisis de requerimientos",
      description: "Organiza la información del caso, identifica necesidades y convierte solicitudes generales en acuerdos que el equipo puede revisar.",
      reflection: "Comprendí que una fecha no se negocia de forma aislada: debo explicar el alcance, mostrar el esfuerzo y escuchar la necesidad del cliente antes de proponer una alternativa."
    },
    {
      id: "member-2",
      name: "Aprendiz 02",
      role: "Planeación y recursos",
      description: "Relaciona las tareas con la capacidad disponible del equipo y prepara opciones cuando el tiempo solicitado no alcanza para todo el alcance.",
      reflection: "Aprendí a plantear límites con respeto. Decir lo que se necesita para entregar calidad no es negarse a colaborar; es cuidar el proyecto y acordar prioridades."
    },
    {
      id: "member-3",
      name: "Aprendiz 03",
      role: "Comunicación y acuerdos",
      description: "Redacta los compromisos de la reunión, confirma responsables y ayuda a que cada decisión quede clara para el cliente y para el equipo.",
      reflection: "La comunicación asertiva me permitió pasar de opiniones generales a acuerdos verificables. Preguntar, resumir y confirmar evita malentendidos y fortalece el trabajo en equipo."
    }
  ],
  evidences: [
    {
      id: "evidence-1",
      title: "Mapa de necesidades del proyecto",
      type: "Análisis inicial",
      owner: "Aprendiz 01",
      description: "Registro de lo que el cliente necesita, lo que es prioritario y las preguntas que deben resolverse antes de comprometer una fecha.",
      link: ""
    },
    {
      id: "evidence-2",
      title: "Matriz de plazo, alcance y capacidad",
      type: "Planeación",
      owner: "Aprendiz 02",
      description: "Comparación entre el esfuerzo estimado, las horas disponibles y los ajustes posibles para lograr un acuerdo realista.",
      link: ""
    },
    {
      id: "evidence-3",
      title: "Guion de conversación asertiva",
      type: "Comunicación",
      owner: "Aprendiz 03",
      description: "Propuesta de mensajes claros para presentar riesgos, escuchar al cliente y cerrar compromisos con responsables y fecha de revisión.",
      link: ""
    }
  ]
};

const communicationTypes = {
  assertive: {
    title: "Comunicación asertiva",
    description: "Expone necesidades y límites de forma clara, directa y respetuosa. Busca un acuerdo sin perder de vista la calidad ni la relación con la otra persona.",
    example: "“Con la capacidad actual podemos entregar el módulo prioritario el viernes. Para incluir los reportes necesitamos una semana adicional o ajustar otra tarea.”"
  },
  passive: {
    title: "Comunicación pasiva",
    description: "Evita expresar una necesidad para no incomodar. El problema no desaparece: suele aparecer más tarde como retraso, cansancio o trabajo incompleto.",
    example: "“Está bien, intentaremos tenerlo listo”, aunque el equipo sepa que la fecha no es viable."
  },
  aggressive: {
    title: "Comunicación agresiva",
    description: "Defiende una posición atacando o descalificando a la otra persona. Puede cerrar una discusión rápido, pero afecta la confianza y no construye una solución conjunta.",
    example: "“Esa fecha no tiene sentido; ustedes nunca entienden cómo funciona el desarrollo.”"
  },
  "passive-aggressive": {
    title: "Comunicación pasivo-agresiva",
    description: "Evita decir el desacuerdo de frente, pero lo comunica con ironías, evasiones o incumplimientos. Hace difícil detectar el problema y corregirlo a tiempo.",
    example: "“Claro, lo hacemos para mañana, como si no hubiera otras tareas”, sin abrir una conversación sobre prioridades."
  }
};

const scopeLabels = ["", "Mínimo", "Esencial", "Intermedio", "Amplio", "Integral"];

function escapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function initialFromName(name) {
  return (name || "A").trim().charAt(0).toUpperCase() || "A";
}

function renderEvidence(evidences) {
  const target = document.querySelector("#evidence-list");
  if (!target) return;

  if (!evidences.length) {
    target.innerHTML = '<p class="empty-state">Aún no se han registrado evidencias.</p>';
    return;
  }

  target.innerHTML = evidences.map((evidence) => {
    const link = evidence.link
      ? `<a href="${escapeHtml(evidence.link)}" target="_blank" rel="noreferrer">Abrir evidencia</a>`
      : "<span>Documento del equipo</span>";

    return `
      <article class="evidence-card">
        <p class="meta">${escapeHtml(evidence.type || "Evidencia")}</p>
        <h3>${escapeHtml(evidence.title)}</h3>
        <p>${escapeHtml(evidence.description)}</p>
        <div class="evidence-footer"><span>${escapeHtml(evidence.owner || "Equipo")}</span>${link}</div>
      </article>
    `;
  }).join("");
}

function renderTeam(members) {
  const teamTarget = document.querySelector("#team-list");
  const reflectionTarget = document.querySelector("#reflection-list");
  if (!teamTarget || !reflectionTarget) return;

  if (!members.length) {
    teamTarget.innerHTML = '<p class="empty-state">Aún no se han registrado integrantes.</p>';
    reflectionTarget.innerHTML = '<p class="empty-state">Aún no se han registrado reflexiones.</p>';
    return;
  }

  teamTarget.innerHTML = members.map((member) => `
    <article class="team-card">
      <span class="team-initial" aria-hidden="true">${escapeHtml(initialFromName(member.name))}</span>
      <p class="team-role">${escapeHtml(member.role || "Aprendiz")}</p>
      <h3>${escapeHtml(member.name)}</h3>
      <p>${escapeHtml(member.description || "Sin descripción registrada.")}</p>
    </article>
  `).join("");

  reflectionTarget.innerHTML = members.map((member) => `
    <article class="reflection-item">
      <strong>${escapeHtml(member.name)}</strong>
      <p>${escapeHtml(member.reflection || "Sin reflexión registrada.")}</p>
    </article>
  `).join("");
}

async function loadContent() {
  try {
    const response = await fetch("/api/content");
    if (!response.ok) throw new Error("No se pudo cargar el contenido.");
    return await response.json();
  } catch {
    return fallbackContent;
  }
}

function setCommunicationType(type) {
  const data = communicationTypes[type];
  const card = document.querySelector("#communication-card");
  if (!data || !card) return;

  card.innerHTML = `
    <h3>${data.title}</h3>
    <p>${data.description}</p>
    <p class="communication-example">${data.example}</p>
  `;

  document.querySelectorAll(".communication-tab").forEach((button) => {
    const active = button.dataset.type === type;
    button.classList.toggle("active", active);
    button.setAttribute("aria-selected", String(active));
  });
}

function getNegotiationScenario() {
  const scope = Number(document.querySelector("#scope").value);
  const weeks = Number(document.querySelector("#deadline").value);
  const weeklyHours = Number(document.querySelector("#capacity").value);
  const estimatedEffort = scope * 90;
  const availableCapacity = weeks * weeklyHours;
  const difference = availableCapacity - estimatedEffort;

  let state;
  let copy;
  let script;

  if (difference < -60) {
    state = "Capacidad insuficiente";
    copy = `Faltan ${Math.abs(difference)} horas para cubrir todo el alcance. La propuesta más responsable es definir una primera entrega con lo esencial y calendarizar el resto.`;
    script = "Con la capacidad actual, entregar todo el alcance en esta fecha pondría en riesgo la calidad. Propongo priorizar las funciones esenciales ahora y acordar una segunda entrega para las restantes.";
  } else if (difference < 0) {
    state = "Ajuste necesario";
    copy = `Faltan ${Math.abs(difference)} horas. El escenario puede funcionar si se reduce una parte del alcance, se extiende el plazo o se liberan algunas horas adicionales.`;
    script = "El plan está cerca de ser viable, pero necesitamos ajustar una variable. Podemos extender el plazo, liberar capacidad del equipo o dejar una funcionalidad para la siguiente entrega.";
  } else if (difference < 45) {
    state = "Escenario viable";
    copy = `Hay un margen de ${difference} horas. Es un acuerdo posible si se confirma que no aparecen cambios importantes durante el desarrollo.`;
    script = "Con el alcance actual contamos con un margen pequeño. Confirmemos prioridades y dejemos una revisión intermedia para cuidar la fecha acordada.";
  } else {
    state = "Margen saludable";
    copy = `Hay un margen de ${difference} horas para pruebas, ajustes y cambios controlados. Es una base sólida para negociar compromisos claros.`;
    script = "La capacidad cubre el alcance y deja tiempo para validar calidad. Propongo registrar este acuerdo y revisar avances en un punto intermedio.";
  }

  return { scope, weeks, weeklyHours, estimatedEffort, availableCapacity, state, copy, script };
}

function updateNegotiationOutput() {
  const scenario = getNegotiationScenario();
  document.querySelector("#scope-output").textContent = scopeLabels[scenario.scope];
  document.querySelector("#deadline-output").textContent = `${scenario.weeks} ${scenario.weeks === 1 ? "semana" : "semanas"}`;
  document.querySelector("#capacity-output").textContent = `${scenario.weeklyHours} h/semana`;
  document.querySelector("#estimated-effort").textContent = `${scenario.estimatedEffort} h`;
  document.querySelector("#available-capacity").textContent = `${scenario.availableCapacity} h`;
  document.querySelector("#proposal-status").textContent = scenario.state;
  document.querySelector("#proposal-copy").textContent = scenario.copy;
  document.querySelector("#proposal-script").textContent = scenario.script;
  return scenario;
}

function wireMenu() {
  const toggle = document.querySelector(".menu-toggle");
  const navigation = document.querySelector(".site-nav");
  if (!toggle || !navigation) return;

  toggle.addEventListener("click", () => {
    const open = navigation.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });

  navigation.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navigation.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

function wireSimulator() {
  const form = document.querySelector("#negotiation-form");
  if (!form) return;

  document.querySelectorAll("#scope, #deadline, #capacity").forEach((input) => {
    input.addEventListener("input", updateNegotiationOutput);
  });

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const feedback = document.querySelector("#save-feedback");
    const scenario = updateNegotiationOutput();
    const formData = new FormData(form);
    const payload = {
      project: formData.get("project"),
      counterpart: formData.get("counterpart"),
      scope: scenario.scope,
      deadlineWeeks: scenario.weeks,
      weeklyHours: scenario.weeklyHours,
      recommendation: `${scenario.state}. ${scenario.copy} ${scenario.script}`
    };

    feedback.textContent = "Preparando propuesta...";
    try {
      const response = await fetch("/api/proposals", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "No fue posible guardar la propuesta.");
      feedback.textContent = "Propuesta registrada en el backend local.";
    } catch (error) {
      feedback.textContent = error.message || "No fue posible guardar la propuesta.";
    }
  });
}

async function initialise() {
  wireMenu();
  setCommunicationType("assertive");
  document.querySelectorAll(".communication-tab").forEach((button) => {
    button.addEventListener("click", () => setCommunicationType(button.dataset.type));
  });
  updateNegotiationOutput();
  wireSimulator();

  const content = await loadContent();
  renderEvidence(content.evidences || []);
  renderTeam(content.members || []);
}

initialise();
