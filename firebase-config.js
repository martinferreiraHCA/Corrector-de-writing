/* ===== Configuración de Firebase (login con Google + base de datos común) =====

   Mientras este valor sea null, el sitio funciona sin nube (sin login ni corpus).

   Para activarlo:
   1. Entrá a https://console.firebase.google.com y creá un proyecto (sin Analytics).
   2. Authentication → Sign-in method → habilitá "Google".
   3. Authentication → Settings → Authorized domains → agregá: martinferrerahca.github.io
   4. Firestore Database → Crear base de datos (modo producción, ubicación southamerica-east1)
      y en "Reglas" pegá las reglas que están en el README.
   5. Configuración del proyecto (⚙️) → Tus apps → agregar app Web (</>) → copiá el
      objeto firebaseConfig y pegalo acá abajo reemplazando null. Ejemplo:

   const FIREBASE_CONFIG = {
     apiKey: "AIza...",
     authDomain: "corrector-hca.firebaseapp.com",
     projectId: "corrector-hca",
     storageBucket: "corrector-hca.appspot.com",
     messagingSenderId: "1234567890",
     appId: "1:1234567890:web:abc123",
   };

   (Este objeto NO es secreto: identifica el proyecto; la seguridad la dan las
   reglas de Firestore y los dominios autorizados.) */

"use strict";

const FIREBASE_CONFIG = null;
