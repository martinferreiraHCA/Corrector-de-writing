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

/* Prompt para el modo transcripción: leer manuscrita SIN corregir nada */
const TRANSCRIBE_PROMPT = `Sos un transcriptor experto de textos manuscritos de estudiantes.

Transcribí EXACTAMENTE el texto de las imágenes o PDF adjuntos, tal como está escrito y en su idioma original (normalmente inglés).

Reglas estrictas:
- NO corrijas nada: ni ortografía, ni gramática, ni puntuación, ni mayúsculas. Los errores del estudiante deben conservarse tal cual, porque el texto va a ser evaluado después.
- Mantené los saltos de párrafo y la estructura del original.
- Si una palabra es completamente ilegible, escribí [?] en su lugar. Si dudás entre dos lecturas, elegí la más probable.
- Ignorá el texto tachado por el estudiante.
- Si hay texto impreso de la consigna en la hoja, no lo incluyas: transcribí solo lo que escribió el estudiante.
- Devolvé SOLO el texto transcripto, sin comentarios, títulos ni explicaciones.`;

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

/* structuredClone no existe en navegadores viejos (Chrome <98, Safari <15.4).
   Declarada como function (no const) para que esté disponible desde el inicio. */
function deepClone(o) {
  return typeof structuredClone === "function" ? structuredClone(o) : JSON.parse(JSON.stringify(o));
}

function loadJSON(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return deepClone(fallback);
    return { ...deepClone(fallback), ...JSON.parse(raw) };
  } catch {
    return deepClone(fallback);
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

  // Si sueltan la foto fuera de la zona de carga, que no navegue fuera del
  // sitio: se acepta el archivo igual, caiga donde caiga.
  window.addEventListener("dragover", (e) => e.preventDefault());
  window.addEventListener("drop", (e) => {
    e.preventDefault();
    if (e.dataTransfer?.files?.length) {
      switchTab("file");
      addFiles(e.dataTransfer.files);
    }
  });

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

  // Transcripción con IA y OCR local (sin IA)
  $("btn-transcribe").addEventListener("click", transcribe);
  $("btn-ocr").addEventListener("click", runOcr);

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

  // Nube (login con Google + corpus). cloud.js avisa cuando terminó de cargar.
  if (window.CloudReady) initCloudUI();
  else document.addEventListener("cloud-ready", initCloudUI, { once: true });

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

const MIME_BY_EXT = {
  pdf: "application/pdf",
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  heic: "image/heic",
  heif: "image/heif",
};
const MAX_TOTAL_MB = 18;
const MAX_IMG_SIDE = 2200; // las fotos se reducen a este lado máximo antes de enviarse

/* Algunos celulares entregan las fotos sin tipo MIME: se infiere por la extensión */
function guessMime(file) {
  if (file.type && file.type !== "application/octet-stream") return file.type;
  const ext = (file.name.match(/\.(\w+)$/) || [])[1]?.toLowerCase();
  return MIME_BY_EXT[ext] || "";
}

async function addFiles(fileList) {
  for (const f of fileList) {
    const mime = guessMime(f);
    const ok = mime === "application/pdf" || mime.startsWith("image/");
    if (!ok) {
      setStatus(`"${f.name}" no es un PDF ni una imagen compatible (tipo: ${f.type || "desconocido"}). Formatos aceptados: PDF, JPG, PNG, WebP, HEIC.`, true);
      continue;
    }
    try {
      writingFiles.push(await fileToPayload(f, mime));
      setStatus("");
    } catch (err) {
      console.error(err);
      setStatus(`No se pudo leer "${f.name}". Probá con otra foto o convertila a JPG.`, true);
    }
  }
  els.inputFiles.value = "";
  const totalMB = writingFiles.reduce((s, f) => s + f.base64.length * 0.75, 0) / 1e6;
  if (totalMB > MAX_TOTAL_MB) {
    setStatus(`Los archivos superan ${MAX_TOTAL_MB} MB en total. Sacá alguno o usá fotos más livianas.`, true);
  }
  renderFileList();
}

async function fileToPayload(file, mime) {
  mime = mime || guessMime(file);
  // Las fotos se achican y comprimen a JPEG: sube más rápido, evita los límites
  // de tamaño de las APIs y alcanza de sobra para leer la letra.
  if (mime.startsWith("image/") && !/heic|heif/.test(mime)) {
    const jpeg = await imageToJpegPayload(file);
    if (jpeg) return jpeg;
  }
  return rawPayload(file, mime);
}

function rawPayload(file, mime) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64 = String(reader.result).split(",")[1];
      resolve({ name: file.name, mime, base64 });
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/* Reescala la foto (respetando la rotación EXIF) y la comprime a JPEG.
   Devuelve null si el navegador no puede decodificarla (se usa el original). */
async function imageToJpegPayload(file) {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: "from-image" });
    const scale = Math.min(1, MAX_IMG_SIDE / Math.max(bmp.width, bmp.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bmp.width * scale);
    canvas.height = Math.round(bmp.height * scale);
    canvas.getContext("2d").drawImage(bmp, 0, 0, canvas.width, canvas.height);
    bmp.close?.();
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    const base64 = dataUrl.split(",")[1];
    if (!base64) return null;
    const name = file.name.replace(/\.\w+$/, "") + ".jpg";
    return { name, mime: "image/jpeg", base64 };
  } catch {
    return null;
  }
}

function renderFileList() {
  $("ocr-row").classList.toggle("hidden", writingFiles.length === 0);
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

/* ---------- Nube: login con Google, guardado y corpus ---------- */

function initCloudUI() {
  if (!window.Cloud) return; // sin Firebase configurado: el sitio sigue como siempre

  $("auth-area").classList.remove("hidden");
  $("corpus-card").classList.remove("hidden");

  $("btn-login").addEventListener("click", async () => {
    try {
      await Cloud.signIn();
    } catch (err) {
      console.error(err);
      setStatus("No se pudo iniciar sesión con Google. Probá de nuevo.", true);
    }
  });
  $("btn-logout").addEventListener("click", () => Cloud.signOut());
  $("btn-corpus").addEventListener("click", loadCorpus);
  $("corpus-level").addEventListener("change", loadCorpus);

  Cloud.onUser((u) => {
    $("btn-login").classList.toggle("hidden", Boolean(u));
    $("user-chip").classList.toggle("hidden", !u);
    if (u) {
      $("user-name").textContent = (u.displayName || u.email || "").split(" ")[0];
      $("user-pic").src = u.photoURL || "";
      loadCorpus();
    } else {
      $("corpus-body").innerHTML = "";
    }
  });
}

/* Con la nube activa, se pide sesión iniciada para usar el sistema */
function requireLogin() {
  if (window.Cloud && !Cloud.user) {
    setStatus("Entrá con Google (botón arriba a la derecha) para usar el corrector y sumar al corpus común.", true);
    return false;
  }
  return true;
}

/* Extrae las filas de la tabla "🔍 Análisis Detallado de Errores" del markdown */
function parseErrorsFromMarkdown(md) {
  const sec = md.split(/###\s*🔍[^\n]*\n/)[1];
  if (!sec) return [];
  const stop = sec.search(/\n###\s/);
  const table = stop === -1 ? sec : sec.slice(0, stop);
  const rows = [];
  for (const line of table.split("\n")) {
    const t = line.trim();
    if (!t.startsWith("|")) continue;
    const inner = t.replace(/^\|/, "").replace(/\|$/, "");
    const cells = inner.split("|").map((c) => c.replace(/\*\*/g, "").trim());
    if (cells.length < 4) continue;
    if (/^[-: ]+$/.test(cells[0]) || /texto original/i.test(cells[0])) continue;
    rows.push({
      original: cells[0].replace(/^["“]|["”]$/g, ""),
      tipo: cells[1],
      correccion: cells[2].replace(/^["“]|["”]$/g, ""),
      explicacion: cells[3],
    });
  }
  return rows;
}

/* Guarda la corrección en la base común (si hay sesión) */
async function saveToCloud(markdown) {
  if (!window.Cloud || !Cloud.user) return;
  try {
    const title = (markdown.match(/Nivel y Tipo de Texto:?\*{0,2}\s*\*{0,2}\s*\[?([^\n\]]+)/i)?.[1] || "").trim();
    const levelKey = (title.match(/\b(A2|B1|B2|C1|C2)\b/) || [])[1] || (CRITERIA_LEVEL_MAP[els.level.value] || "");
    const score = markdown.match(/Puntuaci[oó]n Estimada:?\*{0,2}\s*\*{0,2}\s*\[?(\d{1,2}\s*\/\s*\d{2})/i)?.[1]?.replace(/\s/g, "") || null;
    await Cloud.saveCorrection({
      level: levelKey,
      title: title.replace(/[*\]]+$/, "").trim() || "Writing",
      score,
      task: els.task.value.trim().slice(0, 500),
      markdown,
      errors: parseErrorsFromMarkdown(markdown),
    });
    setStatus("Listo ✓ Corrección guardada en la base común del colegio.");
  } catch (err) {
    console.error(err);
    setStatus("Corrección lista ✓ pero no se pudo guardar en la base común (" + (err.message || "").slice(0, 80) + ").", true);
  }
}

/* ---- Corpus: agregación y render ---- */

async function loadCorpus() {
  if (!window.Cloud || !Cloud.user) return;
  const body = $("corpus-body");
  body.innerHTML = '<p class="muted"><span class="spinner"></span>Cargando corpus…</p>';
  try {
    const rows = await Cloud.fetchCorpus(500);
    renderCorpus(rows, $("corpus-level").value);
  } catch (err) {
    console.error(err);
    body.innerHTML = `<p class="muted">No se pudo cargar el corpus (${(err.message || "").slice(0, 120)}).</p>`;
  }
}

function renderCorpus(rows, levelFilter) {
  const body = $("corpus-body");
  const filtered = levelFilter ? rows.filter((r) => r.level === levelFilter) : rows;

  const allErrors = [];
  for (const r of filtered) for (const e of r.errors || []) allErrors.push(e);

  if (filtered.length === 0) {
    body.innerHTML = '<p class="muted">Todavía no hay correcciones guardadas' + (levelFilter ? " para este nivel" : "") + ". ¡Corregí el primer writing!</p>";
    return;
  }

  // Agrupar por tipo de error
  const byType = new Map();
  for (const e of allErrors) {
    const tipo = normalizeTipo(e.tipo);
    if (!byType.has(tipo)) byType.set(tipo, { count: 0, examples: new Map() });
    const g = byType.get(tipo);
    g.count++;
    const k = (e.original || "").toLowerCase().trim();
    if (!k) continue;
    const prev = g.examples.get(k);
    if (prev) prev.n++;
    else g.examples.set(k, { ...e, n: 1 });
  }

  const types = [...byType.entries()].sort((a, b) => b[1].count - a[1].count);
  const esc = (s) => String(s || "").replace(/&/g, "&amp;").replace(/</g, "&lt;");

  let html = `<p class="corpus-summary"><strong>${filtered.length}</strong> correcciones · <strong>${allErrors.length}</strong> errores registrados${levelFilter ? ` · nivel <strong>${levelFilter}</strong>` : ""}</p>`;

  for (const [tipo, g] of types) {
    const examples = [...g.examples.values()]
      .sort((a, b) => b.n - a.n)
      .slice(0, 5);
    html += `<details class="corpus-type">
      <summary><span class="corpus-count">${g.count}</span> ${esc(tipo)}</summary>
      <div class="table-wrap"><table>
        <tr><th>Error del estudiante</th><th>Corrección</th><th>Veces</th></tr>
        ${examples
          .map(
            (e) =>
              `<tr><td>"${esc(e.original)}"</td><td>"${esc(e.correccion)}"</td><td>${e.n > 1 ? "×" + e.n : "1"}</td></tr>`
          )
          .join("")}
      </table></div>
    </details>`;
  }

  html += `<details class="corpus-type"><summary>Últimas correcciones guardadas</summary>
    <ul class="corpus-recent">${filtered
      .slice(0, 15)
      .map(
        (r) =>
          `<li><strong>${esc(r.title)}</strong>${r.score ? ` · ${esc(r.score)}` : ""} · ${esc(r.userName || "")} · ${
            r.createdAt ? new Date(r.createdAt).toLocaleDateString("es-UY") : ""
          }</li>`
      )
      .join("")}</ul></details>`;

  body.innerHTML = html;
}

function normalizeTipo(t) {
  const s = (t || "").toLowerCase();
  if (s.includes("gram")) return "Gramática";
  if (s.includes("voca") || s.includes("lenguaje") || s.includes("collocation") || s.includes("lexis")) return "Lenguaje / Vocabulario";
  if (s.includes("cohe")) return "Cohesión y coherencia";
  if (s.includes("organiza") || s.includes("puntuaci")) return "Organización";
  if (s.includes("ortograf") || s.includes("spelling")) return "Ortografía";
  return (t || "Otro").trim() || "Otro";
}

/* ---------- Transcripción con IA (lee manuscrita, no corrige) ---------- */

async function transcribe() {
  if (!requireLogin()) return;
  const provider = settings.provider;
  const key = settings.keys[provider];
  if (!key) {
    openSettings();
    return;
  }
  if (writingFiles.length === 0) return;
  if (provider === "anthropic" && writingFiles.some((f) => /heic|heif/.test(f.mime))) {
    setStatus("Las fotos HEIC (iPhone) solo son compatibles con Google Gemini. Convertilas a JPG o cambiá el proveedor en ⚙️.", true);
    return;
  }

  const btn = $("btn-transcribe");
  btn.disabled = true;
  setStatus('<span class="spinner"></span>Transcribiendo la letra del estudiante… puede tardar un minuto.');
  try {
    const userText =
      "Transcribí el texto manuscrito de los archivos adjuntos siguiendo estrictamente tus reglas (textual, sin corregir nada).";
    const files = [...writingFiles];
    const text =
      provider === "gemini"
        ? await callGemini(key, settings.models.gemini, TRANSCRIBE_PROMPT, userText, files)
        : await callAnthropic(key, settings.models.anthropic, TRANSCRIBE_PROMPT, userText, files);

    finishTranscription(text.trim(), "Transcripción con IA lista ✓");
  } catch (err) {
    console.error(err);
    setStatus(friendlyError(err), true);
  } finally {
    btn.disabled = false;
  }
}

/* Deja el texto extraído/transcripto en la pestaña de texto para revisión */
function finishTranscription(text, okMessage) {
  els.writingText.value = text;
  switchTab("text");
  const soloTexto = confirm(
    "Texto listo ✓ Quedó en la pestaña «Pegar texto» para que lo revises y edites.\n\n" +
      "¿Querés usar SOLO el texto? (Aceptar = las fotos/PDF ya no se envían a la IA al corregir)"
  );
  if (soloTexto) {
    writingFiles = [];
    renderFileList();
  }
  setStatus(okMessage + " Revisalo y después apretá «Corregir writing».");
}

/* ---------- OCR local (Tesseract.js, sin IA) ---------- */

const CDN_OCR = {
  tesseract: "https://cdn.jsdelivr.net/npm/tesseract.js@5/dist/tesseract.min.js",
  pdfjs: "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.min.js",
  pdfjsWorker: "https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/build/pdf.worker.min.js",
};

function loadScript(src) {
  return new Promise((resolve, reject) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve();
    const s = document.createElement("script");
    s.src = src;
    s.onload = resolve;
    s.onerror = () => reject(new Error("No se pudo cargar " + src));
    document.head.appendChild(s);
  });
}

async function runOcr() {
  if (writingFiles.length === 0) return;
  const btn = $("btn-ocr");
  btn.disabled = true;
  let worker = null;
  try {
    setStatus('<span class="spinner"></span>Preparando OCR… la primera vez descarga el motor (~15 MB).');
    await loadScript(CDN_OCR.tesseract);
    worker = await Tesseract.createWorker("eng", 1, {
      logger: (m) => {
        if (m.status === "recognizing text") {
          setStatus(`<span class="spinner"></span>Reconociendo texto… ${Math.round(m.progress * 100)}%`);
        }
      },
    });

    const pieces = [];
    for (const f of writingFiles) {
      if (f.mime === "application/pdf") {
        const pages = await pdfToImages(f);
        for (const img of pages) pieces.push(await ocrOne(worker, await preprocessForOcr(img)));
      } else {
        pieces.push(await ocrOne(worker, await preprocessForOcr(`data:${f.mime};base64,${f.base64}`)));
      }
    }

    const text = pieces.join("\n\n").replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
    if (!text) {
      setStatus("No se detectó texto. Probá con una foto más nítida y derecha, o usá «Transcribir con IA», que lee mucho mejor la letra a mano.", true);
      return;
    }

    finishTranscription(text, "Texto extraído con OCR ✓ La manuscrita puede tener errores de reconocimiento:");
  } catch (err) {
    console.error(err);
    setStatus("No se pudo completar el OCR: " + (err.message || "error desconocido"), true);
  } finally {
    if (worker) worker.terminate().catch(() => {});
    btn.disabled = false;
  }
}

async function ocrOne(worker, imageLike) {
  const { data } = await worker.recognize(imageLike);
  return (data.text || "").trim();
}

/* Preprocesa la imagen para mejorar el OCR con fotos de celular:
   escala de grises + binarización (umbral de Otsu) + ampliación si es chica.
   Si algo falla, devuelve la imagen original. */
function preprocessForOcr(dataUrl) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      try {
        const scale = img.width < 1400 ? Math.min(2, 1400 / img.width) : 1;
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        const ctx = canvas.getContext("2d");
        ctx.imageSmoothingEnabled = true;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

        const imgData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const px = imgData.data;

        // Escala de grises + histograma
        const hist = new Array(256).fill(0);
        const grays = new Uint8Array(px.length / 4);
        for (let i = 0, g = 0; i < px.length; i += 4, g++) {
          const gray = Math.round(0.299 * px[i] + 0.587 * px[i + 1] + 0.114 * px[i + 2]);
          grays[g] = gray;
          hist[gray]++;
        }

        // Umbral de Otsu
        const total = grays.length;
        let sum = 0;
        for (let t = 0; t < 256; t++) sum += t * hist[t];
        let sumB = 0, wB = 0, maxVar = 0, threshold = 127;
        for (let t = 0; t < 256; t++) {
          wB += hist[t];
          if (wB === 0) continue;
          const wF = total - wB;
          if (wF === 0) break;
          sumB += t * hist[t];
          const mB = sumB / wB;
          const mF = (sum - sumB) / wF;
          const between = wB * wF * (mB - mF) * (mB - mF);
          if (between > maxVar) {
            maxVar = between;
            threshold = t;
          }
        }

        // Binarizar
        for (let i = 0, g = 0; i < px.length; i += 4, g++) {
          const v = grays[g] > threshold ? 255 : 0;
          px[i] = px[i + 1] = px[i + 2] = v;
        }
        ctx.putImageData(imgData, 0, 0);
        resolve(canvas.toDataURL("image/png"));
      } catch {
        resolve(dataUrl);
      }
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
}

/* Convierte cada página de un PDF en imagen (canvas) para poder pasarla por OCR */
async function pdfToImages(f) {
  await loadScript(CDN_OCR.pdfjs);
  pdfjsLib.GlobalWorkerOptions.workerSrc = CDN_OCR.pdfjsWorker;
  const bytes = Uint8Array.from(atob(f.base64), (c) => c.charCodeAt(0));
  const pdf = await pdfjsLib.getDocument({ data: bytes }).promise;
  const images = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    setStatus(`<span class="spinner"></span>Convirtiendo página ${p} de ${pdf.numPages} del PDF…`);
    const page = await pdf.getPage(p);
    const viewport = page.getViewport({ scale: 2 });
    const canvas = document.createElement("canvas");
    canvas.width = viewport.width;
    canvas.height = viewport.height;
    await page.render({ canvasContext: canvas.getContext("2d"), viewport }).promise;
    images.push(canvas.toDataURL("image/png"));
  }
  return images;
}

/* ---------- Corrección ---------- */

async function correct() {
  if (!requireLogin()) return;
  const provider = settings.provider;
  const key = settings.keys[provider];
  if (!key) {
    setStatus("Falta activar la IA: ingresá el código de acceso del colegio en el recuadro de arriba, o cargá tu propia clave en Configuración (⚙️).", true);
    openSettings();
    return;
  }

  const text = els.writingText.value.trim();
  if (writingFiles.length === 0 && !text) {
    setStatus("Subí un archivo o pegá el texto del writing.", true);
    return;
  }
  if (provider === "anthropic" && writingFiles.some((f) => /heic|heif/.test(f.mime))) {
    setStatus("Las fotos HEIC (iPhone) solo son compatibles con Google Gemini. Convertilas a JPG o cambiá el proveedor en ⚙️.", true);
    return;
  }

  els.btnCorrect.disabled = true;
  setStatus('<span class="spinner"></span>Corrigiendo… con fotos puede tardar 1 a 2 minutos, no cierres la pestaña.');

  try {
    const userText = buildUserText(text);
    const files = [...writingFiles];
    if (rubricFile) files.push(rubricFile);

    const markdown =
      provider === "gemini"
        ? await callGemini(key, settings.models.gemini, SYSTEM_PROMPT, userText, files)
        : await callAnthropic(key, settings.models.anthropic, SYSTEM_PROMPT, userText, files);

    currentMarkdown = markdown;
    renderResult(markdown);
    addToHistory(markdown);
    setStatus("Listo ✓");
    await saveToCloud(markdown);
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

/* fetch con límite de tiempo: si la IA no responde en 4 minutos se corta,
   así los botones nunca quedan trabados. */
async function fetchWithTimeout(url, options, ms = 240000) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { ...options, signal: ctrl.signal });
  } finally {
    clearTimeout(t);
  }
}

/* Errores pasajeros del servicio (saturación): conviene reintentar solos */
const TRANSIENT_STATUS = new Set([500, 503, 529]);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function callGemini(key, model, system, userText, files) {
  const parts = files.map((f) => ({
    inline_data: { mime_type: f.mime, data: f.base64 },
  }));
  parts.push({ text: userText });
  const body = JSON.stringify({
    system_instruction: { parts: [{ text: system }] },
    contents: [{ role: "user", parts }],
    generationConfig: { temperature: 0.4, maxOutputTokens: 32768 },
  });

  // Plan de intentos: 2 veces el modelo elegido; si Google sigue saturado,
  // una última vez con Flash-Lite (suele tener capacidad cuando Flash no).
  const plan = [model, model];
  if (model !== "gemini-flash-lite-latest") plan.push("gemini-flash-lite-latest");

  let lastErr;
  for (let i = 0; i < plan.length; i++) {
    try {
      return await geminiOnce(key, plan[i], body);
    } catch (err) {
      lastErr = err;
      if (!TRANSIENT_STATUS.has(err.status) || i === plan.length - 1) throw err;
      const esLite = plan[i + 1] !== model;
      setStatus(
        `<span class="spinner"></span>El servicio de Google está saturado; ${
          esLite ? "probando con el modelo liviano (Flash-Lite)" : "reintentando"
        }… (intento ${i + 2} de ${plan.length})`
      );
      await sleep(3000 + i * 3000);
    }
  }
  throw lastErr;
}

async function geminiOnce(key, model, body) {
  const res = await fetchWithTimeout(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body,
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

async function callAnthropic(key, model, system, userText, files) {
  const content = files.map((f) =>
    f.mime === "application/pdf"
      ? { type: "document", source: { type: "base64", media_type: "application/pdf", data: f.base64 } }
      : { type: "image", source: { type: "base64", media_type: f.mime, data: f.base64 } }
  );
  content.push({ type: "text", text: userText });

  let lastErr;
  for (let intento = 1; intento <= 3; intento++) {
    try {
      const res = await fetchWithTimeout("https://api.anthropic.com/v1/messages", {
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
          system,
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
    } catch (err) {
      lastErr = err;
      if (!TRANSIENT_STATUS.has(err.status) || intento === 3) throw err;
      setStatus(`<span class="spinner"></span>El servicio de Claude está saturado; reintentando… (intento ${intento + 1} de 3)`);
      await sleep(3000 * intento);
    }
  }
  throw lastErr;
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
  if (err.name === "AbortError")
    return "La IA tardó demasiado en responder y se cortó la espera. Probá de nuevo (si la foto es muy pesada, sacala con menos resolución).";
  if (err.status === 401 || err.status === 403 || msg.includes("api key not valid") || msg.includes("invalid x-api-key"))
    return "La clave de API no es válida. Revisala en Configuración (⚙️).";
  if (err.status === 429)
    return "Se alcanzó el límite de uso gratuito de la API. Esperá un minuto y probá de nuevo.";
  if (err.status === 413 || msg.includes("payload size") || msg.includes("request entity too large"))
    return "Los archivos son demasiado pesados para la API. Sacá alguno o usá fotos más livianas.";
  if (err.status === 503 || err.status === 529 || err.status >= 500)
    return "El servicio de IA está saturado en este momento (pasa a veces con la capa gratuita). Ya se reintentó automáticamente; esperá unos minutos y probá de nuevo, o cambiá de modelo en ⚙️.";
  if (msg.includes("failed to fetch"))
    return "No se pudo conectar con la API. Revisá tu conexión a internet.";
  return "Error: " + (err.message || "desconocido").slice(0, 300);
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
