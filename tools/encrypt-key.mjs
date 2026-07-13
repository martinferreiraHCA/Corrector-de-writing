#!/usr/bin/env node
/* Genera el contenido de shared-key.js con la clave de API cifrada (AES-256-GCM,
   clave derivada del código de acceso con PBKDF2-SHA256, 310.000 iteraciones).

   Uso:  node tools/encrypt-key.mjs <API_KEY> <CODIGO_DE_ACCESO> > shared-key.js
*/
import { webcrypto as crypto } from "node:crypto";

const [apiKey, code] = process.argv.slice(2);
if (!apiKey || !code) {
  console.error("Uso: node tools/encrypt-key.mjs <API_KEY> <CODIGO_DE_ACCESO> > shared-key.js");
  process.exit(1);
}

const enc = new TextEncoder();
const salt = crypto.getRandomValues(new Uint8Array(16));
const iv = crypto.getRandomValues(new Uint8Array(12));

const material = await crypto.subtle.importKey("raw", enc.encode(code), "PBKDF2", false, ["deriveKey"]);
const key = await crypto.subtle.deriveKey(
  { name: "PBKDF2", salt, iterations: 310000, hash: "SHA-256" },
  material,
  { name: "AES-GCM", length: 256 },
  false,
  ["encrypt"]
);
const data = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, enc.encode(apiKey)));

const b64 = (u) => Buffer.from(u).toString("base64");
console.log(`/* ===== Clave de API compartida del colegio (cifrada) =====
   La clave de Google Gemini está cifrada con AES-256-GCM; solo se puede
   recuperar con el código de acceso del colegio (que NO está en este repo).
   Para regenerarla: node tools/encrypt-key.mjs <API_KEY> <CODIGO> > shared-key.js */

"use strict";

const SHARED_KEYS = {
  gemini: {
    salt: "${b64(salt)}",
    iv: "${b64(iv)}",
    data: "${b64(data)}",
  },
};`);
