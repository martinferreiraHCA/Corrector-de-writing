/* ===== Corrector de Writing · HCA =====
   Sitio estático: las llamadas a la IA se hacen directamente desde el navegador
   con la API key del usuario (guardada solo en localStorage). */

"use strict";

/* ---------- Prompt del examinador ---------- */

const SYSTEM_PROMPT = `Actúa como un Examinador Oficial Experto de Cambridge English y un Tutor de Escritura de Alto Nivel.

**Tu objetivo:**
Vas a recibir redacciones (writings) de estudiantes que se preparan para exámenes de Cambridge (A2 Key, B1 Preliminary, B2 First, C1 Advanced, C2 Proficiency), como texto, PDF o fotos. Tu tarea es evaluar el texto, corregir los errores y generar un plan de mejora estructurado. Si el writing llega como imagen o PDF escaneado, primero transcribí mentalmente el texto manuscrito con cuidado.

**Instrucciones paso a paso:**

1. **Procesamiento del documento:** Leé el writing. Si no se indica el nivel o el tipo de texto, deducilos del contenido y decláralo como "(detectado)".

2. **Análisis de errores (micro-nivel):** Detectá y clasificá los errores en estas categorías:
   - **Gramática:** tiempos verbales, concordancia, preposiciones, estructura de las oraciones.
   - **Lenguaje / Vocabulario:** uso incorrecto de palabras, vocabulario por debajo del nivel, errores de collocations.
   - **Cohesión y coherencia:** mal uso o ausencia de conectores (linking words), transiciones abruptas, pronombres de referencia incorrectos.
   - **Organización:** estructura de párrafos, puntuación, formato inadecuado para el tipo de texto.
   - **Ortografía (Spelling):** errores de escritura de palabras.

3. **Evaluación según criterios de Cambridge (macro-nivel):** Evaluá con las rúbricas oficiales (0 a 5 puntos por criterio). En el mensaje del usuario se incluye la escala oficial de evaluación de Cambridge (band descriptors) del nivel correspondiente: usala como referencia principal y obligatoria para asignar cada banda, citando los descriptores cuando justifiques la nota.
   - Para **B1, B2, C1 y C2**: Content, Communicative Achievement, Organisation y Language (total sobre 20).
   - Para **A2 Key**: los criterios oficiales son solo tres — Content, Organisation y Language (total sobre 15).

4. **Formato de salida obligatorio.** Tu respuesta debe estar en español (con las citas del texto del alumno en inglés) y tener **estrictamente** esta estructura en Markdown:

### 📊 Resumen de la Evaluación
- **Nivel y Tipo de Texto:** [Ej. B2 First — Essay]
- **Puntuación Estimada:** [Ej. 14/20]
- **Comentario general:** [1-2 frases alentadoras y honestas]

### 📝 Evaluación por Criterios de Cambridge
- **Content (X/5):** [¿Se respondieron todas las partes de la tarea? Explicación de la nota.]
- **Communicative Achievement (X/5):** [¿El tono y registro son adecuados? ¿Mantiene la atención del lector?] (omitir en A2 Key)
- **Organisation (X/5):** [¿Están bien estructurados los párrafos? ¿Se usan conectores adecuadamente?]
- **Language (X/5):** [¿Hay buen rango de vocabulario y estructuras gramaticales para el nivel?]

### 🔍 Análisis Detallado de Errores
Una tabla con TODOS los errores relevantes encontrados:

| Texto Original | Tipo de Error | Corrección Sugerida | Explicación / Regla |
|---|---|---|---|
| "I look forward to hear from you" | Gramática | "I look forward to hearing from you" | El phrasal verb 'look forward to' siempre va seguido de un verbo en -ing. |

### ✨ Versión Mejorada
Reescribí el texto completo en inglés. Mantené la voz y las ideas del estudiante original, pero corregí todos los errores, elevá el vocabulario y mejorá la fluidez para que alcance la nota máxima de su nivel objetivo (no de un nivel superior). Resaltá en **negrita** los cambios más importantes.

### 🚀 Plan de Acción para Mejorar
Una lista de 3 a 5 recomendaciones accionables y concretas para este estudiante en particular (ej. "Estudiar oraciones condicionales tipo 2", "Aprender 5 conectores de contraste: however, although, despite, whereas, nevertheless").

Sé riguroso pero constructivo: el objetivo es que el estudiante entienda exactamente qué debe mejorar.`;

/* ---------- Configuración de proveedores ---------- */

const PROVIDERS = {
  gemini: {
    name: "Google Gemini",
    keyHelp:
      'Conseguí una clave gratis en <a href="https://aistudio.google.com/apikey" target="_blank" rel="noopener">Google AI Studio</a> (botón "Create API key").',
    models: [
      { id: "gemini-flash-latest", label: "Gemini Flash — recomendado (capa gratuita)" },
      { id: "gemini-flash-lite-latest", label: "Gemini Flash-Lite — el más barato" },
      { id: "gemini-pro-latest", label: "Gemini Pro — máxima calidad" },
    ],
    hint: "Flash tiene capa gratuita generosa y es más que suficiente para corregir writings.",
  },
  anthropic: {
    name: "Anthropic Claude",
    keyHelp:
      'Creá una clave en la <a href="https://console.anthropic.com/settings/keys" target="_blank" rel="noopener">consola de Anthropic</a> (requiere cargar crédito, mínimo 5 USD).',
    models: [
      { id: "claude-haiku-4-5", label: "Claude Haiku 4.5 — económico y rápido" },
      { id: "claude-sonnet-5", label: "Claude Sonnet 5 — máxima calidad" },
    ],
    hint: "Haiku 4.5 cuesta centavos por corrección y da muy buenos resultados.",
  },
};

const DEFAULT_SETTINGS = {
  provider: "gemini",
  models: { gemini: "gemini-flash-latest", anthropic: "claude-haiku-4-5" },
  keys: { gemini: "", anthropic: "" },
};

/* ---------- Estado ---------- */

let settings = loadJSON("cw_settings", DEFAULT_SETTINGS);
// Migración: si el modelo guardado ya no existe en la lista (ej. Google lo retiró),
// se vuelve al modelo por defecto del proveedor.
for (const p of Object.keys(PROVIDERS)) {
  if (!PROVIDERS[p].models.some((m) => m.id === settings.models?.[p])) {
    settings.models[p] = DEFAULT_SETTINGS.models[p];
  }
}
let history = loadJSON("cw_history", []);
let writingFiles = []; // {name, mime, base64}
let rubricFile = null; // {name, mime, base64}
let currentMarkdown = "";

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return structuredClone(fallback);
    return { ...structuredClone(fallback), ...JSON.parse(raw) };
  } catch {
    return structuredClone(fallback);
  }
}
function saveJSON(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}

/* ---------- Elementos ---------- */

const $ = (id) => document.getElementById(id);
const els = {
  banner: $("banner-no-key"),
  level: $("sel-level"),
  type: $("sel-type"),
  task: $("txt-task"),
  tabFile: $("tab-file"),
  tabText: $("tab-text"),
  panelFile: $("panel-file"),
  panelText: $("panel-text"),
  dropzone: $("dropzone"),
  inputFiles: $("input-files"),
  fileList: $("file-list"),
  writingText: $("txt-writing"),
  rubricText: $("txt-rubric"),
  inputRubric: $("input-rubric"),
  rubricFileName: $("rubric-file-name"),
  btnCorrect: $("btn-correct"),
  status: $("status"),
  resultCard: $("result-card"),
  result: $("result"),
  historyList: $("history-list"),
  historyEmpty: $("history-empty"),
  dlg: $("dlg-settings"),
  selProvider: $("sel-provider"),
  selModel: $("sel-model"),
  modelHint: $("model-hint"),
  inputKey: $("input-key"),
  keyHelp: $("key-help"),
};

/* ---------- Inicialización ---------- */

document.addEventListener("DOMContentLoaded", () => {
  els.rubricText.value = localStorage.getItem("cw_rubric") || "";
  updateBanner();
  renderHistory();

  // Tabs
  els.tabFile.addEventListener("click", () => switchTab("file"));
  els.tabText.addEventListener("click", () => switchTab("text"));

  // Archivos del writing
  els.inputFiles.addEventListener("change", () => addFiles(els.inputFiles.files));
  ["dragover", "dragenter"].forEach((ev) =>
    els.dropzone.addEventListener(ev, (e) => {
      e.preventDefault();
      els.dropzone.classList.add("dragover");
    })
  );
  ["dragleave", "drop"].forEach((ev) =>
    els.dropzone.addEventListener(ev, (e) => {
      e.preventDefault();
      els.dropzone.classList.remove("dragover");
    })
  );
  els.dropzone.addEventListener("drop", (e) => addFiles(e.dataTransfer.files));

  // Criterios
  els.rubricText.addEventListener("input", () =>
    localStorage.setItem("cw_rubric", els.rubricText.value)
  );
  els.inputRubric.addEventListener("change", async () => {
    const f = els.inputRubric.files[0];
    if (!f) return;
    rubricFile = await fileToPayload(f);
    els.rubricFileName.textContent = `✓ ${f.name}`;
  });

  // Acción principal
  els.btnCorrect.addEventListener("click", correct);

  // Resultado
  $("btn-copy").addEventListener("click", copyResult);
  $("btn-print").addEventListener("click", () => window.print());

  // Historial
  $("btn-clear-history").addEventListener("click", () => {
    if (confirm("¿Borrar todo el historial de correcciones?")) {
      history = [];
      saveJSON("cw_history", history);
      renderHistory();
    }
  });

  // Código de acceso (clave compartida del colegio, cifrada en shared-key.js)
  $("btn-access-code").addEventListener("click", activateSharedKey);
  $("input-access-code").addEventListener("keydown", (e) => {
    if (e.key === "Enter") activateSharedKey();
  });

  // Configuración
  $("btn-settings").addEventListener("click", openSettings);
  $("banner-open-settings").addEventListener("click", openSettings);
  $("btn-close-settings").addEventListener("click", () => els.dlg.close());
  $("btn-save-settings").addEventListener("click", saveSettings);
  $("btn-show-key").addEventListener("click", () => {
    els.inputKey.type = els.inputKey.type === "password" ? "text" : "password";
  });
  els.selProvider.addEventListener("change", () => refreshSettingsUI(true));
});

function switchTab(which) {
  const isFile = which === "file";
  els.tabFile.classList.toggle("active", isFile);
  els.tabText.classList.toggle("active", !isFile);
  els.panelFile.classList.toggle("hidden", !isFile);
  els.panelText.classList.toggle("hidden", isFile);
}

function updateBanner() {
  const key = settings.keys[settings.provider];
  els.banner.classList.toggle("hidden", Boolean(key));
  // Sin clave compartida en el repo no se muestra el campo de código
  const hasShared = typeof SHARED_KEYS !== "undefined" && SHARED_KEYS.gemini;
  $("input-access-code").classList.toggle("hidden", !hasShared);
  $("btn-access-code").classList.toggle("hidden", !hasShared);
}

/* ---------- Clave compartida del colegio ---------- */

async function activateSharedKey() {
  const code = $("input-access-code").value.trim();
  const errEl = $("access-code-error");
  errEl.classList.add("hidden");
  if (!code) return;

  const btn = $("btn-access-code");
  btn.disabled = true;
  const key = await decryptSharedKey("gemini", code);
  btn.disabled = false;

  if (key) {
    settings.provider = "gemini";
    settings.keys.gemini = key;
    saveJSON("cw_settings", settings);
    $("input-access-code").value = "";
    updateBanner();
    setStatus("Clave del colegio activada en este navegador ✓");
  } else {
    errEl.classList.remove("hidden");
  }
}

async function decryptSharedKey(provider, code) {
  const s = typeof SHARED_KEYS !== "undefined" ? SHARED_KEYS[provider] : null;
  if (!s || !window.crypto?.subtle) return null;
  const b64 = (x) => Uint8Array.from(atob(x), (c) => c.charCodeAt(0));
  try {
    const material = await crypto.subtle.importKey(
      "raw", new TextEncoder().encode(code), "PBKDF2", false, ["deriveKey"]
    );
    const key = await crypto.subtle.deriveKey(
      { name: "PBKDF2", salt: b64(s.salt), iterations: 310000, hash: "SHA-256" },
      material,
      { name: "AES-GCM", length: 256 },
      false,
      ["decrypt"]
    );
    const plain = await crypto.subtle.decrypt({ name: "AES-GCM", iv: b64(s.iv) }, key, b64(s.data));
    return new TextDecoder().decode(plain);
  } catch {
    return null; // código incorrecto
  }
}

/* ---------- Archivos ---------- */

const ACCEPTED = ["application/pdf", "image/png", "image/jpeg", "image/webp", "image/gif"];
const MAX_TOTAL_MB = 18;

async function addFiles(fileList) {
  for (const f of fileList) {
    if (!ACCEPTED.includes(f.type)) {
      alert(`"${f.name}" no es un PDF ni una imagen compatible.`);
      continue;
    }
    writingFiles.push(await fileToPayload(f));
  }
  els.inputFiles.value = "";
  const totalMB = writingFiles.reduce((s, f) => s + f.base64.length * 0.75, 0) / 1e6;
  if (totalMB > MAX_TOTAL_MB) {
    alert(`Los archivos superan ${MAX_TOTAL_MB} MB en total. Sacá alguno o usá fotos más livianas.`);
  }
  renderFileList();
}

function fileToPayload(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = String(reader.result).split(",")[1];
      resolve({ name: file.name, mime: file.type, base64 });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function renderFileList() {
  els.fileList.innerHTML = "";
  writingFiles.forEach((f, i) => {
    const li = document.createElement("li");
    const icon = f.mime === "application/pdf" ? "📄" : "🖼️";
    li.innerHTML = `<span>${icon}</span><span class="file-name"></span>
      <button class="file-remove" title="Quitar">✕</button>`;
    li.querySelector(".file-name").textContent = f.name;
    li.querySelector(".file-remove").addEventListener("click", () => {
      writingFiles.splice(i, 1);
      renderFileList();
    });
    els.fileList.appendChild(li);
  });
}

/* ---------- Corrección ---------- */

async function correct() {
  const provider = settings.provider;
  const key = settings.keys[provider];
  if (!key) {
    openSettings();
    return;
  }

  const text = els.writingText.value.trim();
  if (writingFiles.length === 0 && !text) {
    setStatus("Subí un archivo o pegá el texto del writing.", true);
    return;
  }

  els.btnCorrect.disabled = true;
  setStatus('<span class="spinner"></span>Corrigiendo… puede tardar hasta un minuto.');

  try {
    const userText = buildUserText(text);
    const files = [...writingFiles];
    if (rubricFile) files.push(rubricFile);

    const markdown =
      provider === "gemini"
        ? await callGemini(key, settings.models.gemini, userText, files)
        : await callAnthropic(key, settings.models.anthropic, userText, files);

    currentMarkdown = markdown;
    renderResult(markdown);
    addToHistory(markdown);
    setStatus("Listo ✓");
  } catch (err) {
    console.error(err);
    setStatus(friendlyError(err), true);
  } finally {
    els.btnCorrect.disabled = false;
  }
}

function buildUserText(pastedText) {
  const parts = [];
  const level = els.level.value;
  const type = els.type.value;
  parts.push(level ? `Nivel del examen: ${level}` : "Nivel del examen: detectalo vos.");
  parts.push(type ? `Tipo de texto: ${type}` : "Tipo de texto: detectalo vos.");

  const task = els.task.value.trim();
  if (task) parts.push(`Consigna de la tarea:\n${task}`);

  // Escala oficial de Cambridge integrada (criteria.js), según el nivel elegido
  if (typeof CAMBRIDGE_CRITERIA !== "undefined") {
    const levelKey = CRITERIA_LEVEL_MAP[level];
    if (levelKey) {
      parts.push(
        `ESCALA OFICIAL DE EVALUACIÓN DE CAMBRIDGE PARA ESTE NIVEL (referencia principal y obligatoria):\n\n${CAMBRIDGE_CRITERIA[levelKey]}`
      );
    } else {
      const all = Object.values(CAMBRIDGE_CRITERIA).join("\n\n---\n\n");
      parts.push(
        `ESCALAS OFICIALES DE EVALUACIÓN DE CAMBRIDGE (detectá el nivel y usá la escala correspondiente como referencia principal):\n\n${all}`
      );
    }
  }

  const rubric = els.rubricText.value.trim();
  if (rubric) parts.push(`Criterios o instrucciones adicionales del docente:\n${rubric}`);
  if (rubricFile) parts.push(`Además adjunto un PDF con criterios adicionales ("${rubricFile.name}").`);

  if (writingFiles.length > 0) {
    parts.push("El writing del estudiante está en los archivos adjuntos.");
  }
  if (pastedText) {
    parts.push(`Texto del writing del estudiante:\n"""\n${pastedText}\n"""`);
  }
  parts.push("Evaluá el writing siguiendo estrictamente el formato de salida indicado.");
  return parts.join("\n\n");
}

/* ---------- Llamadas a las APIs ---------- */

async function callGemini(key, model, userText, files) {
  const parts = files.map((f) => ({
    inline_data: { mime_type: f.mime, data: f.base64 },
  }));
  parts.push({ text: userText });

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: SYSTEM_PROMPT }] },
        contents: [{ role: "user", parts }],
        generationConfig: { temperature: 0.4, maxOutputTokens: 32768 },
      }),
    }
  );

  if (!res.ok) throw await apiError(res);
  const data = await res.json();
  const out = data.candidates?.[0]?.content?.parts
    ?.filter((p) => p.text)
    .map((p) => p.text)
    .join("");
  if (!out) throw new Error("La IA no devolvió texto. Probá de nuevo.");
  return out;
}

async function callAnthropic(key, model, userText, files) {
  const content = files.map((f) =>
    f.mime === "application/pdf"
      ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: f.base64 } }
      : { type: "image", source: { type: "base64", media_type: f.mime, data: f.base64 } }
  );
  content.push({ type: "text", text: userText });

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": key,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model,
      max_tokens: 8192,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content }],
    }),
  });

  if (!res.ok) throw await apiError(res);
  const data = await res.json();
  const out = data.content
    ?.filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");
  if (!out) throw new Error("La IA no devolvió texto. Probá de nuevo.");
  return out;
}

async function apiError(res) {
  let detail = "";
  try {
    const body = await res.json();
    detail = body?.error?.message || JSON.stringify(body).slice(0, 300);
  } catch {
    detail = await res.text().catch(() => "");
  }
  const err = new Error(detail || `Error HTTP ${res.status}`);
  err.status = res.status;
  return err;
}

function friendlyError(err) {
  const msg = (err.message || "").toLowerCase();
  if (err.status === 401 || err.status === 403 || msg.includes("api key not valid") || msg.includes("invalid x-api-key"))
    return "La clave de API no es válida. Revisala en Configuración (⚙️).";
  if (err.status === 429)
    return "Se alcanzó el límite de uso de la API. Esperá un minuto y probá de nuevo.";
  if (err.status === 529 || err.status >= 500)
    return "El servicio de IA está sobrecargado. Probá de nuevo en unos segundos.";
  if (msg.includes("failed to fetch"))
    return "No se pudo conectar con la API. Revisá tu conexión a internet.";
  return "Error: " + (err.message || "desconocido").slice(0, 200);
}

function setStatus(html, isError = false) {
  els.status.innerHTML = html;
  els.status.classList.toggle("error", isError);
}

/* ---------- Render del resultado ---------- */

function renderResult(markdown) {
  let html;
  if (window.marked && window.DOMPurify) {
    html = DOMPurify.sanitize(marked.parse(markdown, { gfm: true, breaks: true }));
  } else {
    const esc = markdown.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    html = `<pre style="white-space:pre-wrap">${esc}</pre>`;
  }
  els.result.innerHTML = html;
  // Tablas con scroll horizontal en pantallas chicas
  els.result.querySelectorAll("table").forEach((t) => {
    const wrap = document.createElement("div");
    wrap.className = "table-wrap";
    t.parentNode.insertBefore(wrap, t);
    wrap.appendChild(t);
  });
  els.resultCard.classList.remove("hidden");
  els.resultCard.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function copyResult() {
  try {
    await navigator.clipboard.writeText(currentMarkdown);
    setStatus("Resultado copiado al portapapeles ✓");
  } catch {
    setStatus("No se pudo copiar automáticamente.", true);
  }
}

/* ---------- Historial ---------- */

function addToHistory(markdown) {
  const score = markdown.match(/Puntuaci[oó]n Estimada:?\*{0,2}\s*\*{0,2}\s*\[?(\d{1,2}\s*\/\s*\d{2})/i);
  const levelType = markdown.match(/Nivel y Tipo de Texto:?\*{0,2}\s*\*{0,2}\s*\[?([^\n\]]+)/i);
  history.unshift({
    id: Date.now(),
    date: new Date().toLocaleString("es-UY", { dateStyle: "short", timeStyle: "short" }),
    title: (levelType?.[1] || "Writing").trim().replace(/[*\]]+$/, "").trim(),
    score: score ? score[1].replace(/\s/g, "") : null,
    markdown,
  });
  if (history.length > 20) history = history.slice(0, 20);
  try {
    saveJSON("cw_history", history);
  } catch {
    // localStorage lleno: guardamos menos entradas
    history = history.slice(0, 5);
    try { saveJSON("cw_history", history); } catch { /* sin espacio */ }
  }
  renderHistory();
}

function renderHistory() {
  els.historyList.innerHTML = "";
  els.historyEmpty.classList.toggle("hidden", history.length > 0);
  for (const item of history) {
    const li = document.createElement("li");
    li.innerHTML = `
      <div class="history-meta">
        <div class="history-title"></div>
        <div class="muted"></div>
      </div>
      ${item.score ? `<span class="history-score">${item.score}</span>` : ""}
      <button class="history-delete" title="Eliminar">🗑️</button>`;
    li.querySelector(".history-title").textContent = item.title;
    li.querySelector(".muted").textContent = item.date;
    li.addEventListener("click", () => {
      currentMarkdown = item.markdown;
      renderResult(item.markdown);
    });
    li.querySelector(".history-delete").addEventListener("click", (e) => {
      e.stopPropagation();
      history = history.filter((h) => h.id !== item.id);
      saveJSON("cw_history", history);
      renderHistory();
    });
    els.historyList.appendChild(li);
  }
}

/* ---------- Configuración ---------- */

function openSettings() {
  els.selProvider.value = settings.provider;
  refreshSettingsUI(false);
  els.dlg.showModal();
}

function refreshSettingsUI(providerChanged) {
  const provider = els.selProvider.value;
  const conf = PROVIDERS[provider];

  els.selModel.innerHTML = "";
  for (const m of conf.models) {
    const opt = document.createElement("option");
    opt.value = m.id;
    opt.textContent = m.label;
    els.selModel.appendChild(opt);
  }
  els.selModel.value = settings.models[provider] || conf.models[0].id;
  els.modelHint.textContent = conf.hint;
  els.keyHelp.innerHTML = conf.keyHelp;
  els.inputKey.value = settings.keys[provider] || "";
  els.inputKey.type = "password";
}

function saveSettings() {
  const provider = els.selProvider.value;
  settings.provider = provider;
  settings.models[provider] = els.selModel.value;
  settings.keys[provider] = els.inputKey.value.trim();
  saveJSON("cw_settings", settings);
  updateBanner();
  els.dlg.close();
  setStatus(settings.keys[provider] ? "Configuración guardada ✓" : "");
}
