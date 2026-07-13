# Corrector de Writing (HCA)

Sitio estático (HTML/CSS/JS puro, sin build) para GitHub Pages que corrige writings de Cambridge English con IA. El usuario es docente del Colegio y Liceo Hans Christian Andersen (Uruguay) y se comunica en español.

## Regla de git — IMPORTANTE

**El usuario autorizó explícitamente que cada cambio que pida se commitee y pushee directamente a `main`**, porque GitHub Pages sirve el sitio desde `main`. Después de completar cualquier cambio solicitado: commit con mensaje claro y `git push origin main` (además del branch de trabajo designado si el entorno lo exige).

## Arquitectura

- `index.html` / `styles.css` / `app.js` — todo el sitio. Sin dependencias locales; `marked` y `DOMPurify` se cargan por CDN.
- Las llamadas a la IA se hacen **directo desde el navegador** con la API key del usuario (localStorage, clave `cw_settings`). Proveedores implementados: Google Gemini (`generateContent`, header `x-goog-api-key`) y Anthropic (`/v1/messages` con `anthropic-dangerous-direct-browser-access: true`).
- PDFs e imágenes se envían en base64 (Gemini: `inline_data`; Anthropic: bloques `document`/`image`).
- El prompt del examinador de Cambridge vive en `SYSTEM_PROMPT` dentro de `app.js`. El formato de salida (secciones 📊 📝 🔍 ✨ 🚀) es contrato con el render/historial: `addToHistory()` extrae la puntuación con regex sobre "Puntuación Estimada".
- Historial en localStorage (`cw_history`, máx. 20 entradas); criterios pegados en `cw_rubric`.

## Estilo

- Paleta institucional HCA: azul marino `#242B59`, rojo `#E21C21`, blanco. Diseño minimalista.
- Todo el texto de la interfaz en español rioplatense (voseo: "pegá", "subí").

## Pendientes conocidos

- El usuario va a pasar los PDFs de criterios oficiales de Cambridge para integrarlos al repo (cargarlos como assets y adjuntarlos automáticamente a cada corrección, o convertirlos a texto e inyectarlos en el prompt).
