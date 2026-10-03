# 📚 GUÍA OFICIAL DE CREACIÓN DE CLASES — TECLINGO

**Documento maestro para crear y rediseñar cualquier clase de Teclingo.**

---

## 🎯 ORDEN DE CREACIÓN (IMPORTANTE)

1. VIDEO CLASE (fuente de verdad)
2. TEMARIO / 4 SECCIONES DE LA CLASE
3. TEXTO BASE (creado a partir del tema del video)
4. EJERCICIOS (creados a partir del texto base)
5. VOCABULARIO (extraído del texto base)
6. TEORÍA + TEACHER VIRTUAL (explicación del tema)

Cada paso DEPENDE del anterior.

---

## 1. VIDEO CLASE — La fuente de verdad

Antes de crear cualquier contenido, verificar:

- El video coincide con el tema de la clase
- El video y el título de la clase son el mismo tema
- El tema del video define TODO el contenido

Estructura en la BD:
- Lesson.videoUrl = URL del YouTube Short
- Lesson.tituloVideo = Título descriptivo del video
- Lesson.temaPrincipal = Tema central
- Lesson.title = Título de la clase (debe coincidir)

Checklist:
- [ ] El título del video coincide con el tema
- [ ] El tema del video está en temaPrincipal
- [ ] El título de la clase refleja el video
- [ ] El video está disponible (URL funciona)

---

## 2. LAS 4 SECCIONES DE LA CLASE

| # | Sección | Propósito |
|---|---------|-----------|
| 1 | Video de la Lección | Intro visual (YouTube Short) |
| 2 | Vocabulario Clave | Términos con dicción |
| 3 | Fundamentos de la Clase | Teoría + Teacher Virtual |
| 4 | Ejercicios (5 skills) | 50 reactivos + texto base |

---

## 3. TEXTO BASE — El corazón de la clase

El texto base es la FUENTE de:
- Vocabulario (extrae los términos)
- Frases para WRITING (dictado)
- Frases para SPEAKING (repetición)
- Contexto para READING (comprensión)
- Ejemplos para LISTENING
- Estructuras para GRAMMAR

Reglas del texto base:
- Extensión: 60-100 palabras (nivel A1)
- Vocabulario: solo del tema + básico
- Estructura: simple
- Coherencia: mini-historia
- Traducción: SIEMPRE al español
- Personajes: recurrentes (Alex, Luis, Maria)

Estructura en la BD:
- lessonId, title, content, translation
- wordCount, difficulty, timeAudioSec
- vocabList, verbsList
- perfil, fase, parrafos, active

Checklist:
- [ ] El texto habla del tema del video
- [ ] Usa personajes recurrentes
- [ ] Tiene traducción al español
- [ ] Extensión 60-100 palabras
- [ ] vocabList completo
- [ ] verbsList completo

---

## 4. EJERCICIOS — 50 reactivos (10 por skill)

Todos los ejercicios salen del TEXTO BASE.

Reglas generales:
- Cantidad: 10 por skill × 5 = 50
- Idioma: questionText en inglés
- CorrectAnswer: TEXTO, nunca letra
- Opciones: 4 (excepto WRITING/SPEAKING)
- Distractores: reales, no inventados
- Sin español en QT

### 4.1 GRAMMAR (10)

Tipo: Selección múltiple conceptual

Reglas:
- Pregunta 100% en inglés
- Distractores: errores típicos del hispanohablante

Distractores válidos:
- Singular vs plural (house vs houses)
- Otra palabra real (home vs house)
- Posesivo mal (house's)
- NUNCA inventar palabras (housies, housees)

### 4.2 LISTENING (10)

Tipo: Comprensión auditiva

Reglas:
- Pregunta 100% en inglés
- El TTS lee la pregunta
- 4 opciones en inglés

### 4.3 READING (10)

Tipo: Comprensión lectora

Reglas:
- Pregunta 100% en inglés
- Basada en el texto base
- 4 opciones en inglés

### 4.4 SPEAKING (10)

Tipo: Repetición de frase completa

Reglas:
- Frase completa (3-6 palabras)
- Frase VISIBLE entre comillas
- TTS lee SOLO la frase (voz female)
- Micrófono capta bien

Estructura:
- instruction: "Read aloud"
- questionText: "I am Alex." (con comillas)
- correctAnswer: "I am Alex."
- instructionTTS: segmento con la frase
- translationSentence: traducción

NO hacer:
- Frases de 1 palabra
- Frases sin comillas
- TTS leyendo la instrucción

### 4.5 WRITING (10)

Tipo: Dictado + búsqueda en texto

Reglas:
- Frase completa (4-7 palabras)
- questionText VACÍO
- instruction: "Escucha y escribe la frase que oigas."
- TTS lee SOLO la frase
- Alumno BUSCA en el texto y copia
- Frases DESORDENADAS
- Botón "Ver traducción" (translationSentence)

NO hacer:
- Frases de 1 palabra
- Mostrar la frase en pantalla
- Frases en secuencia

---

## 5. VOCABULARIO — Extraído del texto base

Reglas:
- Cantidad: 15-30 términos
- Fuente: texto base
- Término: inglés
- Traducción: español
- Dicción: fonética latina (/ái/, /búk/)
- Tipo: pronoun, noun, verb, adjective, expression
- Ejemplo: frase del texto

Estructura en la BD:
- lessonId, term, translation, type
- pronunciationAf, exampleUse, tags

Categorización (por type):
- pronoun → Pronombres Personales
- noun → Sustantivos Clave
- verb → Verbos
- adjective → Adjetivos
- expression → Expresiones

Checklist:
- [ ] Todos con dicción
- [ ] Todos con exampleUse
- [ ] Tipo correcto
- [ ] Traducción natural

---

## 6. TEORÍA + TEACHER VIRTUAL

### 6.1 Teoría (LessonTheorySection)

Mínimo 4 secciones:
1. Concepto principal
2. Ejemplos
3. Reglas
4. Fundamento académico

### 6.2 Teacher Virtual (TeacherScript)

Guion narrado de 150-250 palabras.

Estructura:
- lessonId, title, content, duration

Checklist:
- [ ] 4+ secciones de teoría
- [ ] Teacher Virtual con guion
- [ ] Todo en inglés

---

## REGLAS DE PROTECCIÓN DE DATOS

CRÍTICO:

1. NUNCA borrar ejercicios — solo UPDATE, nunca DELETE
2. NUNCA cambiar lessonId sin verificar UserProgress
3. NUNCA eliminar lecciones con progreso
4. Backup antes de cambios masivos
5. Verificar después: sin huérfanos
6. Scripts deben mostrar conteo antes y después

Comando de verificación:
cd ~/teclingo && node -e "const { PrismaClient } = require('@prisma/client'); const p = new PrismaClient(); (async () => { const u = await p.user.count(); const pr = await p.userProgress.count(); const s = await p.submission.count(); console.log('Users:', u, 'Progress:', pr, 'Subs:', s); await p.\$disconnect(); })();"

---

## BACKUPS — CUÁNDO HACERLOS

Momento 1: ANTES de empezar una clase (obligatorio)

cd ~/teclingo && PGPASSWORD='MiPasswordLocal123' pg_dump -h localhost -U teclingo_user -d teclingo_db > ~/backups/backup-pre-claseXX-$(date +%Y%m%d-%H%M).sql

Momento 2: AL TERMINAR la clase (obligatorio)

cd ~/teclingo && PGPASSWORD='MiPasswordLocal123' pg_dump -h localhost -U teclingo_user -d teclingo_db > ~/backups/backup-post-claseXX-$(date +%Y%m%d-%H%M).sql

Momento 3: Al final de la sesión (recomendado)

cd ~/teclingo && PGPASSWORD='MiPasswordLocal123' pg_dump -h localhost -U teclingo_user -d teclingo_db > ~/backups/backup-sesion-$(date +%Y%m%d-%H%M).sql

Guardar en: ~/backups/

Retención: últimos 7 de cada tipo

Restaurar:
cd ~/teclingo && PGPASSWORD='MiPasswordLocal123' psql -h localhost -U teclingo_user -d teclingo_db < ~/backups/ARCHIVO.sql

---

## CHECKLIST MAESTRO

Video:
- [ ] URL funciona
- [ ] Título coincide con el tema

Texto Base:
- [ ] 60-100 palabras
- [ ] Traducción al español
- [ ] vocabList y verbsList

Ejercicios:
- [ ] GRAMMAR 10 con 4 ops reales
- [ ] LISTENING 10 con 4 ops
- [ ] READING 10 con 4 ops
- [ ] SPEAKING 10 frases completas
- [ ] WRITING 10 dictadas
- [ ] correctAnswer como texto
- [ ] questionText en inglés

Vocabulario:
- [ ] 15+ términos con dicción
- [ ] exampleUse del texto
- [ ] Tipos correctos

Teoría:
- [ ] 4+ secciones
- [ ] Teacher Virtual

Protección:
- [ ] Backup pre-clase
- [ ] UserProgress intacto
- [ ] Backup post-clase

---

## REGLAS DE ORO

1. El video es la fuente de verdad
2. El texto base es el corazón
3. Inglés puro en TTS
4. 4 opciones siempre (excepto SPEAKING/WRITING)
5. Distractores reales
6. Frases completas en SPEAKING/WRITING
7. CorrectAnswer como texto
8. Backup antes y después de cada clase
9. NUNCA borrar ejercicios
10. Verificar después

---

**Última actualización:** 2026-10-01
**Mantenido por:** Equipo Teclingo

---

## 🎯 REGLAS ADICIONALES (Agregadas 2026-10-02)

### Regla 6: Personajes explícitos
NUNCA uses "her/his/su" sin contexto en nivel A1.
Siempre menciona el nombre del personaje: "la madre de Alex", "el carro de Luis".
El audio TTS también debe mencionar el nombre.

### Regla 7: Preguntas bilingües en A1
La pregunta debe estar en español con el inglés al lado.
El alumno A1 no debe adivinar qué se pregunta.
Formato: "Pregunta en español\n(English question?)"

### Regla 8: TTS lee la frase completa
Si el questionText tiene ________ (underline), el TTS lee la frase completa con la respuesta.
El alumno debe escuchar la respuesta mientras intenta adivinarla.

### Regla 9: 4 opciones siempre
4 opciones excepto WRITING/SPEAKING.
Con 2 o 3 opciones, el alumno acierta por probabilidad.

### Regla 10: Traducción en SPEAKING y WRITING
La frase en inglés debe tener su traducción al español en translationSentence.
El alumno debe saber qué está diciendo.

### Regla 11: Opciones bilingües
Las opciones en GRAMMAR/LISTENING/READING deben ser bilingües.
Formato: "Español (English)"

### Regla 12: NUNCA borrar ejercicios (protección de datos)
Los scripts de rediseño deben usar upsert (update si existe, create si no).
NUNCA usar deleteMany + create. Los ejercicios pueden tener Submissions vinculados que rompen el DELETE.

### Regla 13: Scripts en ~/teclingo/ (no /tmp/)
Los scripts de seed SIEMPRE van en ~/teclingo/, NO en /tmp/.
Así Node encuentra @prisma/client correctamente.

### Regla 14: optionsJson: [] obligatorio
Los ejercicios abiertos (WRITING/SPEAKING) deben incluir optionsJson: [].
Prisma rechaza el create sin ese campo.
