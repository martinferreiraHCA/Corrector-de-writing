/* ===== Clave de API compartida del colegio (cifrada) =====
   La clave de Google Gemini está cifrada con AES-256-GCM; solo se puede
   recuperar con el código de acceso del colegio (que NO está en este repo).
   Para regenerarla: node tools/encrypt-key.mjs <API_KEY> <CODIGO> > shared-key.js */

"use strict";

const SHARED_KEYS = {
  gemini: {
    salt: "fq0WqpaRN5ejS/0DAfVwJQ==",
    iv: "1+RwE5sx7zIbsSdz",
    data: "tkhsjVam07hDgyinfn7tZWldpGBwIaJAixhLOZjTV46aYrgFQ04X+p75J34ZBtPmJ70XOnafEZHUQ8WVr4gchV3ygmt5",
  },
};
