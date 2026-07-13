# Corrector de Writing · HCA

Plataforma web para corregir *writings* de exámenes de Cambridge English (A2 Key, B1 Preliminary, B2 First, C1 Advanced, C2 Proficiency) usando IA, con los colores institucionales del Colegio y Liceo Hans Christian Andersen.

**¿Qué hace?** Subís un PDF o fotos del writing (o pegás el texto), elegís el nivel, y la IA actúa como examinador oficial de Cambridge: puntúa con los criterios oficiales (Content, Communicative Achievement, Organisation, Language), arma una tabla de errores con explicaciones, reescribe una versión mejorada y genera un plan de acción para el estudiante.

**Transcripción de writings a mano.** Al subir fotos o PDF aparecen dos botones que dejan el texto editable en la pestaña "Pegar texto" para revisarlo antes de corregir:

- **✍️ Transcribir con IA** *(recomendado para manuscrita)*: usa el modelo configurado como transcriptor puro. Lee letra a mano con mucha precisión pero **no corrige nada**: conserva textualmente los errores del estudiante (verificado: no "arregla" ortografía ni gramática), marca palabras ilegibles con [?] e ignora tachaduras. Consume una llamada mínima a la API (gratis con la capa de Gemini).
- **🔍 OCR local sin IA**: [Tesseract.js](https://tesseract.projectnaptha.com/) corriendo 100% en el navegador — gratis, sin límites y sin enviar nada a ningún servidor, con preprocesamiento de imagen (binarización Otsu) para mejorar fotos de celular. Muy bueno con texto impreso/tipeado y aceptable con imprenta prolija; la manuscrita cursiva no es lo suyo.

## 🌐 Publicar en GitHub Pages (una sola vez)

1. En GitHub, entrá a **Settings → Pages** de este repositorio.
2. En **Source** elegí **Deploy from a branch**.
3. Branch: **main**, carpeta: **/ (root)** → **Save**.
4. En 1-2 minutos el sitio queda en: `https://martinferrerahca.github.io/Corrector-de-writing/` (GitHub te muestra la URL exacta en esa misma pantalla).

## 🔑 Clave de API

El sitio es 100% estático: la clave de API se guarda **solo en tu navegador** (localStorage) y las llamadas van directo del navegador al proveedor de IA. Nadie más ve tu clave ni los writings.

### Código de acceso del colegio (lo más simple)

La clave de Gemini del colegio está guardada en el repo **cifrada** (`shared-key.js`, AES-256-GCM). Al entrar al sitio por primera vez, alcanza con escribir el **código de acceso** en el banner de arriba: el navegador descifra la clave y la deja activada. No hace falta manejar la clave larga.

- El código no está en el repo; lo comparte el docente responsable.
- ⚠️ Nunca pongas la clave **en texto plano** en el repo: GitHub escanea los repositorios públicos y Google la revoca automáticamente.
- Para cambiar la clave o el código: `node tools/encrypt-key.mjs <API_KEY> <CODIGO> > shared-key.js` y pusheá a main.
- Cualquiera que tenga el código puede usar la clave, así que conviene mantener la cuenta de Google **sin facturación habilitada** (capa gratuita): el peor caso es quedarse sin cuota del día, nunca un gasto.

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
| **Gemini Flash** (`gemini-flash-latest`) | Capa gratuita; luego ~US$ 0,30 / 2,50 | **Gratis** o ~US$ 0,01 |
| Gemini Flash-Lite (`gemini-flash-lite-latest`) | ~US$ 0,10 / 0,40 | < US$ 0,005 |
| **Claude Haiku 4.5** | US$ 1 / 5 | ~US$ 0,02 |
| Claude Sonnet 5 | US$ 3 / 15 | ~US$ 0,07 |

El sitio usa los alias `-latest` de Gemini, que siempre apuntan al modelo Flash/Pro vigente: así no deja de funcionar cuando Google retira una versión vieja (nos pasó con `gemini-2.5-flash`, que ya no acepta cuentas nuevas).

Otras opciones baratas que se podrían agregar más adelante: OpenAI `gpt-4o-mini`, DeepSeek, Groq (Llama, gratis). Con Gemini o Claude ya queda cubierto el caso de uso con PDFs y fotos.

## 📋 Criterios oficiales de Cambridge — integrados ✅

Las escalas oficiales de evaluación (band descriptors) de las *Teacher Guides for Writing* de Cambridge están integradas en el sitio (`criteria.js`) para los 5 niveles: A2 Key, B1 Preliminary, B2 First, C1 Advanced y C2 Proficiency.

En cada corrección se envía automáticamente la escala del nivel elegido, y la IA está instruida para usarla como referencia principal y obligatoria al puntuar. Si elegís "Detectar automáticamente", se envían las 5 escalas y la IA aplica la que corresponda.

Además hay una sección opcional de **criterios o instrucciones adicionales** (texto o PDF) por si querés ajustar la exigencia para un grupo en particular.

## ☁️ Login con Google + corpus común de errores

El sitio incluye (desactivado hasta configurar Firebase):

- **Entrar con Google**: con la nube activa, se pide iniciar sesión para usar el corrector.
- **Base de datos común**: cada corrección se guarda automáticamente en Firestore con sus errores estructurados (texto original, tipo, corrección, explicación).
- **📚 Corpus de errores frecuentes**: agrega los errores de todas las correcciones del colegio — un pequeño *Cambridge Learner Corpus* propio — agrupados por tipo, con los errores repetidos entre estudiantes destacados (×2, ×3…), filtrable por nivel.

### Activarlo (una sola vez, ~5 minutos)

1. Entrá a [console.firebase.google.com](https://console.firebase.google.com) con la cuenta de Google del colegio → **Agregar proyecto** (ej. `corrector-hca`, sin Analytics).
2. **Authentication → Comenzar → Sign-in method →** habilitá **Google**.
3. **Authentication → Settings → Authorized domains →** agregá `martinferrerahca.github.io`.
4. **Firestore Database → Crear base de datos** (modo producción; ubicación `southamerica-east1`). En la pestaña **Reglas**, pegá esto y publicá:

   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /corrections/{doc} {
         allow read: if request.auth != null;
         allow create: if request.auth != null
                       && request.resource.data.uid == request.auth.uid;
         allow update, delete: if request.auth != null
                               && resource.data.uid == request.auth.uid;
       }
     }
   }
   ```

   (Cualquier persona con cuenta de Google que entre al sitio puede leer y aportar. Para restringirlo a cuentas del colegio, agregá a cada `if`: `&& request.auth.token.email.matches('.*@hca[.]edu[.]uy')`.)
5. **⚙️ Configuración del proyecto → Tus apps → agregar app Web (`</>`)** → copiá el objeto `firebaseConfig` y pegalo en `firebase-config.js` reemplazando el `null` (o pasáselo a Claude y lo integra). Ese objeto no es secreto: la seguridad la dan las reglas y los dominios autorizados.

**Privacidad:** en el corpus se guarda el texto de los writings; conviene que los estudiantes no escriban su nombre completo en la hoja, o taparlo en la foto.

## 🛠️ Estructura del proyecto

```
index.html    → estructura de la página
styles.css    → estilos (paleta HCA: azul #242B59, rojo #E21C21)
app.js        → lógica: prompt del examinador, llamadas a Gemini/Claude, historial
criteria.js   → escalas oficiales de Cambridge (band descriptors) de los 5 niveles
cloud.js      → login con Google y base común de correcciones (Firebase)
firebase-config.js → configuración de Firebase (null = nube desactivada)
shared-key.js → clave de API del colegio, cifrada
assets/       → logo del colegio
```

Sin frameworks ni build: HTML, CSS y JavaScript puros, listo para GitHub Pages.
