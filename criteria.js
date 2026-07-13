/* ===== Criterios oficiales de Cambridge English =====
   Escalas de evaluación de writing (band descriptors) extraídas textualmente de las
   guías oficiales para docentes de Cambridge:
   - Teacher Guide for Writing: A2 Key for Schools
   - Teacher Guide for Writing: B1 Preliminary for Schools
   - Teacher Guide for Writing: B2 First for Schools
   - Teacher Guide for Writing: C1 Advanced
   - Teacher Guide for Writing: C2 Proficiency
   Se inyectan automáticamente en cada corrección según el nivel elegido. */

"use strict";

const CAMBRIDGE_CRITERIA = {
  A2: `A2 KEY FOR SCHOOLS — WRITING
Estructura del examen: Part 6 — email corto (25 palabras o más, debe responder a los 3 puntos de la consigna), 15 puntos máximo. Part 7 — historia corta (35 palabras o más, basada en las 3 viñetas), 15 puntos máximo.
Se evalúa con 3 subescalas (0–5 puntos cada una): Content, Organisation y Language. Total sobre 15.

ESCALA OFICIAL (band descriptors, texto original de Cambridge):

Band 5:
- Content: All content is relevant to the task. Target reader is fully informed.
- Organisation: Text is connected and coherent, using basic linking words and a limited number of cohesive devices.
- Language: Uses everyday vocabulary generally appropriately, while occasionally overusing certain lexis. Uses simple grammatical forms with a good degree of control. While errors are noticeable, meaning can still be determined.

Band 4: Performance shares features of Bands 3 and 5.

Band 3:
- Content: Minor irrelevances and/or omissions may be present. Target reader is on the whole informed.
- Organisation: Text is connected using basic, high-frequency linking words.
- Language: Uses basic vocabulary reasonably appropriately. Uses simple grammatical forms with some degree of control. Errors may impede meaning at times.

Band 2: Performance shares features of Bands 1 and 3.

Band 1:
- Content: Irrelevances and misinterpretation of task may be present. Target reader is minimally informed.
- Organisation: Production unlikely to be connected, though punctuation and simple connectors (i.e. 'and') may on occasion be used.
- Language: Produces basic vocabulary of isolated words and phrases. Produces few simple grammatical forms with only limited control.

Band 0:
- Content: Content is totally irrelevant. Target reader is not informed.
- Organisation y Language: Performance below Band 1.`,

  B1: `B1 PRELIMINARY FOR SCHOOLS — WRITING
Estructura del examen: Part 1 — email (aprox. 100 palabras, obligatorio). Part 2 — a elección: article o story (aprox. 100 palabras). Cada parte vale 20 puntos.
Se evalúa con 4 subescalas (0–5 puntos cada una): Content, Communicative Achievement, Organisation y Language. Total sobre 20.

ESCALA OFICIAL (band descriptors, texto original de Cambridge):

Band 5:
- Content: All content is relevant to the task. Target reader is fully informed.
- Communicative Achievement: Uses the conventions of the communicative task to hold the target reader's attention and communicate straightforward ideas.
- Organisation: Text is generally well organised and coherent, using a variety of linking words and cohesive devices.
- Language: Uses a range of everyday vocabulary appropriately, with occasional inappropriate use of less common lexis. Uses a range of simple and some complex grammatical forms with a good degree of control. Errors do not impede communication.

Band 4: Performance shares features of Bands 3 and 5.

Band 3:
- Content: Minor irrelevances and/or omissions may be present. Target reader is on the whole informed.
- Communicative Achievement: Uses the conventions of the communicative task in generally appropriate ways to communicate straightforward ideas.
- Organisation: Text is connected and coherent, using basic linking words and a limited number of cohesive devices.
- Language: Uses everyday vocabulary generally appropriately, while occasionally overusing certain lexis. Uses simple grammatical forms with a good degree of control. While errors are noticeable, meaning can still be determined.

Band 2: Performance shares features of Bands 1 and 3.

Band 1:
- Content: Irrelevances and misinterpretation of task may be present. Target reader is minimally informed.
- Communicative Achievement: Produces text that communicates simple ideas in simple ways.
- Organisation: Text is connected using basic, high-frequency linking words.
- Language: Uses basic vocabulary reasonably appropriately. Uses simple grammatical forms with some degree of control. Errors may impede meaning at times.

Band 0:
- Content: Content is totally irrelevant. Target reader is not informed.
- Resto de subescalas: Performance below Band 1.`,

  B2: `B2 FIRST FOR SCHOOLS — WRITING
Estructura del examen: Part 1 — essay (140–190 palabras, obligatorio). Part 2 — a elección: article, email/letter, review o story (140–190 palabras). Cada parte vale 20 puntos.
Se evalúa con 4 subescalas (0–5 puntos cada una): Content, Communicative Achievement, Organisation y Language. Total sobre 20.

ESCALA OFICIAL (band descriptors, texto original de Cambridge):

Band 5:
- Content: All content is relevant to the task. Target reader is fully informed.
- Communicative Achievement: Uses the conventions of the communicative task effectively to hold the target reader's attention and communicate straightforward and complex ideas, as appropriate.
- Organisation: Text is well organised and coherent, using a variety of cohesive devices and organisational patterns to generally good effect.
- Language: Uses a range of vocabulary, including less common lexis, appropriately. Uses a range of simple and complex grammatical forms with control and flexibility. Occasional errors may be present but do not impede communication.

Band 4: Performance shares features of Bands 3 and 5.

Band 3:
- Content: Minor irrelevances and/or omissions may be present. Target reader is on the whole informed.
- Communicative Achievement: Uses the conventions of the communicative task to hold the target reader's attention and communicate straightforward ideas.
- Organisation: Text is generally well organised and coherent, using a variety of linking words and cohesive devices.
- Language: Uses a range of everyday vocabulary appropriately, with occasional inappropriate use of less common lexis. Uses a range of simple and some complex grammatical forms with a good degree of control. Errors do not impede communication.

Band 2: Performance shares features of Bands 1 and 3.

Band 1:
- Content: Irrelevances and misinterpretation of task may be present. Target reader is minimally informed.
- Communicative Achievement: Uses the conventions of the communicative task in generally appropriate ways to communicate straightforward ideas.
- Organisation: Text is connected and coherent, using basic linking words and a limited number of cohesive devices.
- Language: Uses everyday vocabulary generally appropriately, while occasionally overusing certain lexis. Uses simple grammatical forms with a good degree of control. While errors are noticeable, meaning can still be determined.

Band 0:
- Content: Content is totally irrelevant. Target reader is not informed.
- Resto de subescalas: Performance below Band 1.`,

  C1: `C1 ADVANCED — WRITING
Estructura del examen: Part 1 — essay (220–260 palabras, obligatorio). Part 2 — a elección: letter/email, proposal, report o review (220–260 palabras). Cada parte vale 20 puntos.
Se evalúa con 4 subescalas (0–5 puntos cada una): Content, Communicative Achievement, Organisation y Language. Total sobre 20.

ESCALA OFICIAL (band descriptors, texto original de Cambridge):

Band 5:
- Content: All content is relevant to the task. Target reader is fully informed.
- Communicative Achievement: Uses the conventions of the communicative task with sufficient flexibility to communicate complex ideas in an effective way, holding the target reader's attention with ease, fulfilling all communicative purposes.
- Organisation: Text is a well-organised, coherent whole, using a variety of cohesive devices and organisational patterns with flexibility.
- Language: Uses a range of vocabulary, including less common lexis, effectively and precisely. Uses a wide range of simple and complex grammatical forms with full control, flexibility and sophistication. Errors, if present, are related to less common words and structures, or occur as slips.

Band 4: Performance shares features of Bands 3 and 5.

Band 3:
- Content: Minor irrelevances and/or omissions may be present. Target reader is on the whole informed.
- Communicative Achievement: Uses the conventions of the communicative task effectively to hold the target reader's attention and communicate straightforward and complex ideas, as appropriate.
- Organisation: Text is well organised and coherent, using a variety of cohesive devices and organisational patterns to generally good effect.
- Language: Uses a range of vocabulary, including less common lexis, appropriately. Uses a range of simple and complex grammatical forms with control and flexibility. Occasional errors may be present but do not impede communication.

Band 2: Performance shares features of Bands 1 and 3.

Band 1:
- Content: Irrelevances and misinterpretation of task may be present. Target reader is minimally informed.
- Communicative Achievement: Uses the conventions of the communicative task to hold the target reader's attention and communicate straightforward ideas.
- Organisation: Text is generally well organised and coherent, using a variety of linking words and cohesive devices.
- Language: Uses a range of everyday vocabulary appropriately, with occasional inappropriate use of less common lexis. Uses a range of simple and some complex grammatical forms with a good degree of control. Errors do not impede communication.

Band 0:
- Content: Content is totally irrelevant. Target reader is not informed.
- Resto de subescalas: Performance below Band 1.`,

  C2: `C2 PROFICIENCY — WRITING
Estructura del examen: Part 1 — essay (240–280 palabras, obligatorio). Part 2 — a elección: article, letter, report o review (280–320 palabras). Cada parte vale 20 puntos.
Se evalúa con 4 subescalas (0–5 puntos cada una): Content, Communicative Achievement, Organisation y Language. Total sobre 20.

ESCALA OFICIAL (band descriptors, texto original de Cambridge):

Band 5:
- Content: All content is relevant to the task. Target reader is fully informed.
- Communicative Achievement: Demonstrates complete command of the conventions of the communicative task. Communicates complex ideas in an effective and convincing way, holding the target reader's attention with ease, fulfilling all communicative purposes.
- Organisation: Text is organised impressively and coherently using a wide range of cohesive devices and organisational patterns with complete flexibility.
- Language: Uses a wide range of vocabulary, including less common lexis, with fluency, precision, sophistication and style. Use of grammar is sophisticated, fully controlled and completely natural. Any inaccuracies occur only as slips.

Band 4: Performance shares features of Bands 3 and 5.

Band 3:
- Content: Minor irrelevances and/or omissions may be present. Target reader is on the whole informed.
- Communicative Achievement: Uses the conventions of the communicative task with sufficient flexibility to communicate complex ideas in an effective way, holding the target reader's attention with ease, fulfilling all communicative purposes.
- Organisation: Text is a well-organised, coherent whole, using a variety of cohesive devices and organisational patterns with flexibility.
- Language: Uses a range of vocabulary, including less common lexis, effectively and precisely. Uses a wide range of simple and complex grammatical forms with full control, flexibility and sophistication. Errors, if present, are related to less common words and structures, or occur as slips.

Band 2: Performance shares features of Bands 1 and 3.

Band 1:
- Content: Irrelevances and misinterpretation of task may be present. Target reader is minimally informed.
- Communicative Achievement: Uses the conventions of the communicative task effectively to hold the target reader's attention and communicate straightforward and complex ideas, as appropriate.
- Organisation: Text is well organised and coherent, using a variety of cohesive devices and organisational patterns to generally good effect.
- Language: Uses a range of vocabulary, including less common lexis, appropriately. Uses a range of simple and complex grammatical forms with control and flexibility. Occasional errors may be present but do not impede communication.

Band 0:
- Content: Content is totally irrelevant. Target reader is not informed.
- Resto de subescalas: Performance below Band 1.`,
};

/* Mapea el valor del selector de nivel al nivel de la escala */
const CRITERIA_LEVEL_MAP = {
  "A2 Key (KET)": "A2",
  "B1 Preliminary (PET)": "B1",
  "B2 First (FCE)": "B2",
  "C1 Advanced (CAE)": "C1",
  "C2 Proficiency (CPE)": "C2",
};
