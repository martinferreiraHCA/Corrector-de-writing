# Corrector de Writing (HCA)

Sitio estático (HTML/CSS/JS puro, sin build) para GitHub Pages que corrige writings de Cambridge English con IA. El usuario es docente del Colegio y Liceo Hans Christian Andersen (Uruguay) y se comunica en español.

## Regla de git — IMPORTANTE

**El usuario autorizó explícitamente que cada cambio que pida se commitee y pushee directamente a `main`**, porque GitHub Pages sirve el sitio desde `main`. Después de completar cualquier cambio solicitado: commit con mensaje claro y `git push origin main` (además del branch de trabajo designado si el entorno lo exige).

## Arquitectura

- `index.html` / `styles.css` / `app.js` / `criteria.js` — todo el sitio. Sin dependencias locales; `marked` y `DOMPurify` se cargan por CDN.
- `criteria.js` — escalas oficiales de evaluación de Cambridge (band descriptors) de los 5 niveles, extraídas textualmente de las Teacher Guides for Writing oficiales. Se inyectan automáticamente en el prompt según el nivel elegido (o las 5 si el nivel es "detectar"). No editar los descriptores en inglés: son texto oficial de Cambridge.
- Las llamadas a la IA se hacen **directo desde el navegador** con la API key del usuario (localStorage, clave `cw_settings`). Proveedores implementados: Google Gemini (`generateContent`, header `x-goog-api-key`) y Anthropic (`/v1/messages` con `anthropic-dangerous-direct-browser-access: true`).
- PDFs e imágenes se envían en base64 (Gemini: `inline_data`; Anthropic: bloques `document`/`image`).
- El prompt del examinador de Cambridge vive en `SYSTEM_PROMPT` dentro de `app.js`. El formato de salida (secciones 📊 📝 🔍 ✨ 🚀) es contrato con el render/historial: `addToHistory()` extrae la puntuación con regex sobre "Puntuación Estimada".
- Historial en localStorage (`cw_history`, máx. 20 entradas); criterios pegados en `cw_rubric`.

## Estilo

- Paleta institucional HCA: azul marino `#242B59`, rojo `#E21C21`, blanco. Diseño minimalista.
- Todo el texto de la interfaz en español rioplatense (voseo: "pegá", "subí").

## Notas

- Los criterios oficiales ya están integrados (ver `criteria.js`). Los PDFs completos de las guías no están en el repo (pesan ~38 MB y no hacen falta en runtime).
- **Nunca commitear API keys al repo**: el sitio es público. Las claves van solo en el navegador del usuario vía la pantalla de configuración.
