# Corrector de Writing · HCA

Plataforma web para corregir *writings* de exámenes de Cambridge English (A2 Key, B1 Preliminary, B2 First, C1 Advanced, C2 Proficiency) usando IA, con los colores institucionales del Colegio y Liceo Hans Christian Andersen.

**¿Qué hace?** Subís un PDF o fotos del writing (o pegás el texto), elegís el nivel, y la IA actúa como examinador oficial de Cambridge: puntúa con los criterios oficiales (Content, Communicative Achievement, Organisation, Language), arma una tabla de errores con explicaciones, reescribe una versión mejorada y genera un plan de acción para el estudiante.

## 🌐 Publicar en GitHub Pages (una sola vez)

1. En GitHub, entrá a **Settings → Pages** de este repositorio.
2. En **Source** elegí **Deploy from a branch**.
3. Branch: **main**, carpeta: **/ (root)** → **Save**.
4. En 1-2 minutos el sitio queda en: `https://martinferrerahca.github.io/Corrector-de-writing/` (GitHub te muestra la URL exacta en esa misma pantalla).

## 🔑 Conseguir una API key

El sitio es 100% estático: la clave de API se guarda **solo en tu navegador** (localStorage) y las llamadas van directo del navegador al proveedor de IA. Nadie más ve tu clave ni los writings.

### Opción recomendada: Google Gemini (gratis)

1. Entrá a [Google AI Studio](https://aistudio.google.com/apikey) con tu cuenta de Google.
2. Hacé clic en **Create API key** y copiala.
3. En el sitio, tocá el engranaje ⚙️ → proveedor **Google Gemini** → pegá la clave → Guardar.

La capa gratuita de Gemini alcanza de sobra para el uso de un docente (decenas de correcciones por día sin pagar).

### Opción alternativa: Anthropic Claude

1. Creá una cuenta en [console.anthropic.com](https://console.anthropic.com/settings/keys) y cargá crédito (mínimo 5 USD).
2. Generá una API key y pegala en ⚙️ → proveedor **Anthropic Claude**.

## 💰 Costos aproximados por corrección

Una corrección típica (writing de 1-2 carillas + respuesta completa) usa unos 3.000-6.000 tokens de entrada y 2.000-4.000 de salida:

| Proveedor / modelo | Precio (entrada / salida por millón de tokens) | Costo por corrección |
|---|---|---|
| **Gemini 2.5 Flash** | Capa gratuita; luego ~US$ 0,30 / 2,50 | **Gratis** o ~US$ 0,01 |
| Gemini 2.5 Flash-Lite | ~US$ 0,10 / 0,40 | < US$ 0,005 |
| **Claude Haiku 4.5** | US$ 1 / 5 | ~US$ 0,02 |
| Claude Sonnet 5 | US$ 3 / 15 | ~US$ 0,07 |

Otras opciones baratas que se podrían agregar más adelante: OpenAI `gpt-4o-mini`, DeepSeek, Groq (Llama, gratis). Con Gemini o Claude ya queda cubierto el caso de uso con PDFs y fotos.

## 📋 Criterios oficiales de Cambridge

En el formulario hay una sección **"Criterios oficiales de Cambridge"** donde podés:

- Pegar el texto de la *Assessment Scale* (queda guardado en el navegador para las próximas correcciones), y/o
- Adjuntar el PDF oficial de criterios en cada corrección.

Si me pasás los PDFs de los criterios, también se pueden **integrar directamente al sitio** para que se usen siempre sin tener que subirlos.

## 🛠️ Estructura del proyecto

```
index.html    → estructura de la página
styles.css    → estilos (paleta HCA: azul #242B59, rojo #E21C21)
app.js        → lógica: prompt del examinador, llamadas a Gemini/Claude, historial
assets/       → logo del colegio
```

Sin frameworks ni build: HTML, CSS y JavaScript puros, listo para GitHub Pages.
