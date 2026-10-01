import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

const TOPICS = [
  {
    id: 'third-person',
    title: 'La Tercera Persona (Singular vs Plural)',
    titleEn: 'Third Person Singular & Plural',
    mcer: 'A1',
    category: 'Grammar',
    summary: 'Aprende cómo conjugar verbos en Presente Simple usando pronombres en tercera persona singular (he, she, it) y plural (they).',
    explanation: `En inglés, la conjugación del Presente Simple varía dependiendo de si nos referimos a la tercera persona **singular** o **plural**:

### 1. Tercera Persona Singular (He, She, It)
Cuando el sujeto es *He* (Él), *She* (Ella) o *It* (Eso - objeto/animal), el verbo principal **SIEMPRE cambia** en oraciones afirmativas de presente simple agregando una desinencia:
*   **Regla general:** Añadimos **-s** al final del verbo.
    *   *Ejemplo:* Work -> Work**s**, Play -> Play**s**.
*   **Terminaciones en -ch, -sh, -ss, -x, -z, -o:** Añadimos **-es**.
    *   *Ejemplo:* Watch -> Watch**es**, Go -> Go**es**, Wash -> Wash**es**.
*   **Consonante + Y:** Cambiamos la 'y' por **-ies**.
    *   *Ejemplo:* Study -> Stud**ies**, Fly -> Fl**ies** (Atención: *Play* tiene vocal antes de la Y, por lo tanto solo añade -s: *Plays*).

### 2. Tercera Persona Plural (They)
Cuando el sujeto es *They* (Ellos o Ellas), **NO se modifica el verbo**. Se utiliza el verbo en su **forma base (infinitivo sin "to")**. Esta es una confusión muy común porque en español pensamos en "ellos" como tercera persona y queremos cambiar la terminación, pero en inglés *They* se conjuga exactamente igual que *I*, *You* y *We*.
*   *Ejemplo:* They study (Ellos estudian), They watch (Ellos miran), They go (Ellos van).

### Oraciones Negativas e Interrogativas (Auxiliares)
*   **Singular (He, She, It):** Usa el auxiliar **Does** (oración interrogativa) o **Does not / Doesn't** (oración negativa). El verbo principal vuelve a su **forma base** porque el auxiliar ya lleva la marca de tercera persona.
    *   *Negativa:* He **doesn't work** here. (NO: He doesn't works).
    *   *Pregunta:* **Does** she **like** coffee? (NO: Does she likes).
*   **Plural (They):** Usa el auxiliar **Do** o **Do not / Don't**.
    *   *Negativa:* They **don't work** here.
    *   *Pregunta:* **Do** they **like** coffee?`,
    structure: 'Singular: He/She/It + Verbo(-s/-es) + Comp. | Plural: They + Verbo(Base) + Comp.',
    examples: [
      { en: 'He lives in London.', es: 'Él vive en Londres.', note: 'Tercera persona singular: añade "-s"' },
      { en: 'They live in London.', es: 'Ellos viven en Londres.', note: 'Tercera persona plural: verbo en su forma base' },
      { en: 'She does not speak French.', es: 'Ella no habla francés.', note: 'Auxiliar "does" con verbo base "speak"' },
      { en: 'They do not speak French.', es: 'Ellos no hablan francés.', note: 'Auxiliar "do" con verbo base "speak"' },
      { en: 'Does she study everyday?', es: '¿Ella estudia todos los días?', note: 'Estructura interrogativa para singular' }
    ],
    keywords: ['tercera persona', 'singular', 'plural', 'they', 'he', 'she', 'it', 'pronoun', 'pronombres', 'verbo conjugacion', 'terminacion s', 'doesn\'t', 'does']
  },
  {
    id: 'past-perfect',
    title: 'Pasado Perfecto (Past Perfect Simple)',
    titleEn: 'Past Perfect Tense',
    mcer: 'B1',
    category: 'Grammar',
    summary: 'Domina los eventos que ocurrieron antes de otro punto de referencia en el pasado. Clave para narraciones complejas.',
    explanation: `El Pasado Perfecto se utiliza para indicar que una acción ocurrió en el pasado **antes** que otra acción también en el pasado (que normalmente se describe en Pasado Simple). Actúa como el "pasado del pasado".

### Estructura y Construcción
Se forma utilizando el verbo auxiliar **had** (para todos los sujetos, sin distinción de persona) más el **participio pasado** del verbo principal:
*   **Verbos Regulares:** El participio pasado termina en **-ed** (igual que el pasado simple).
*   **Verbos Irregulares:** Debes usar la tercera columna de los verbos (ej: *go* -> *went* -> **gone**).

### Usos Comunes
1.  **Secuencia de Eventos:** Para clarificar cuál de dos eventos pasados ocurrió primero.
    *   *Ejemplo:* When I arrived at the station, the train **had** already **left**. (Primero se fue el tren, luego llegué yo).
2.  **Conectores Temporales:** Frecuentemente se acompaña de palabras como *already*, *just*, *never*, *before*, *after*, *by the time*.
    *   *By the time we got there, they had finished.* (Para cuando llegamos, ellos habían terminado).
3.  **Condicionales Imaginarios (Tercer Condicional):** Se usa para situaciones hipotéticas del pasado.
    *   *If I had studied, I would have passed.* (Si hubiera estudiado, habría aprobado).`,
    structure: 'Sujeto + had + Verbo(Participio Pasado) + Complemento',
    examples: [
      { en: 'I could not log in because I had forgotten my password.', es: 'No pude iniciar sesión porque había olvidado mi contraseña.', note: 'Olvidar la contraseña ocurrió antes del intento de inicio de sesión' },
      { en: 'The field was wet because it had rained all night.', es: 'El campo estaba mojado porque había llovido toda la noche.', note: 'Llover ocurrió antes de que el campo estuviera mojado' },
      { en: 'Alex went to bed after he had finished his homework.', es: 'Alex se fue a la cama después de haber terminado su tarea.', note: 'Terminar la tarea ocurrió antes de irse a dormir' },
      { en: 'By the time she arrived, they had already decided.', es: 'Para cuando ella llegó, ellos ya habían decidido.', note: 'Decidir ocurrió antes de la llegada' }
    ],
    keywords: ['past perfect', 'pasado perfecto', 'had', 'participio', 'pasado del pasado', 'already', 'before', 'by the time', 'hubiera', 'habia', 'haber']
  },
  {
    id: 'present-vs-continuous',
    title: 'Presente Simple vs Presente Continuo',
    titleEn: 'Present Simple vs Present Continuous',
    mcer: 'A2',
    category: 'Grammar',
    summary: 'Aprende a diferenciar el uso de hábitos habituales (Simple) frente a acciones temporales en progreso (Continuo).',
    explanation: `La diferencia entre el Presente Simple y el Presente Continuo es crucial para expresarte con precisión temporal en inglés.

### 1. Presente Simple (Habits & Facts)
Se utiliza para situaciones que son permanentes, hábitos, rutinas diarias o hechos científicos.
*   **Palabras Clave:** *Always, usually, sometimes, never, every day, on Mondays.*
*   *Uso:* Se enfoca en la regularidad de una acción.
*   *Fórmula afirmativa:* Sujeto + Verbo (añade -s en singular para he/she/it).

### 2. Presente Continuo (Temporary action / Right Now)
Se utiliza para acciones que están sucediendo **exactamente ahora**, alrededor del momento presente, o para situaciones temporales actuales.
*   **Palabras Clave:** *Now, at the moment, currently, right now, look, listen.*
*   *Uso:* Se enfoca en que la acción está en desarrollo activo en este instante.
*   *Fórmula afirmativa:* Sujeto + Verbo auxiliar *to be* (am, is, are) + Verbo principal con terminación **-ing**.

### Verbos de Estado (Stative Verbs) - ¡Excepción Importante!
Ciertos verbos que describen estados, opiniones, sentimientos o posesión **no se suelen usar en tiempos continuos**, incluso si ocurren en este momento.
*   *Verbos comunes:* *like, love, hate, know, understand, believe, need, want, belong.*
*   *Incorrecto:* I am wanting a coffee right now.
*   *Correcto:* I **want** a coffee right now.`,
    structure: 'Simple: Sujeto + Verbo | Continuo: Sujeto + am/is/are + Verbo(-ing)',
    examples: [
      { en: 'I am a teacher and I teach English every day.', es: 'Soy profesor y enseño inglés todos los días.', note: 'Presente simple para una rutina/profesión permanente' },
      { en: 'Shh! I am teaching a class right now.', es: '¡Shh! Estoy enseñando una clase justo ahora.', note: 'Presente continuo para una acción en progreso en este momento' },
      { en: 'They usually wear sneakers, but today they are wearing formal shoes.', es: 'Ellos usualmente usan tenis, pero hoy llevan zapatos formales.', note: 'Contrasta rutina general (Simple) con excepción hoy (Continuo)' },
      { en: 'I do not understand this grammar rule.', es: 'No entiendo esta regla gramatical.', note: 'Usa presente simple porque "understand" es un verbo de estado' }
    ],
    keywords: ['present simple', 'present continuous', 'presente simple', 'presente continuo', 'ing', 'now', 'always', 'rutina', 'habito', 'hecho', 'stative verbs']
  },
  {
    id: 'conditionals-1-2',
    title: 'Condicionales: Tipo 1 (Real) y Tipo 2 (Imaginario)',
    titleEn: 'First & Second Conditionals',
    mcer: 'B1',
    category: 'Structure',
    summary: 'Aprende a formular hipótesis sobre el futuro real y probable (First) frente a escenarios imaginarios u utópicos (Second).',
    explanation: `Los enunciados condicionales se utilizan para especular sobre lo que podría ocurrir, lo que podría haber ocurrido y lo que desearíamos que ocurriese.

### 1. Primer Condicional (First Conditional) - Realidad
Habla de situaciones que son **muy posibles, probables o reales** en el futuro si se cumple una circunstancia determinada.
*   **Estructura:** Condición en presente + Consecuencia en futuro simple (*will*).
*   *Fórmula:* **If + Present Simple, ... Will + Verb(Base)**
*   *Ejemplo:* If you study, you will pass your exam. (Si estudias, pasarás tu examen).

### 2. Segundo Condicional (Second Conditional) - Hipótesis / Sueños
Habla de situaciones que son **altamente improbables, ficticias, imaginarias o imposibles** en el presente o futuro.
*   **Estructura:** Condición en pasado simple + Consecuencia con el auxiliar *would*.
*   *Fórmula:* **If + Past Simple, ... Would + Verb(Base)**
*   *Ejemplo:* If I won the lottery, I would travel around the world. (Si ganara la lotería, viajaría por el mundo).
*   *Nota Gramatical:* Con el verbo "to be" en la condición del Segundo Condicional, tradicionalmente se prefiere usar **were** para todas las personas en lenguaje formal (ej: *If I **were** you...* - Si yo fuera tú; *If she **were** here...* - Si ella estuviera aquí).`,
    structure: 'First: If + Present, will + Verb | Second: If + Past, would + Verb',
    examples: [
      { en: 'If it rains tomorrow, we will stay at home.', es: 'Si llueve mañana, nos quedaremos en casa.', note: 'Primer Condicional: Posibilidad meteorológica real' },
      { en: 'If I had infinite money, I would buy a certified library.', es: 'Si tuviera dinero infinito, compraría una biblioteca certificada.', note: 'Segundo Condicional: Escenario irreal en el presente' },
      { en: 'If I were you, I would practice with Teclingo daily.', es: 'Si yo fuera tú, practicaría con Teclingo diariamente.', note: 'Uso formal de "were" para dar un consejo hipotético' },
      { en: 'If they find her keys, they will call her.', es: 'Si encuentran sus llaves, la llamarán.', note: 'Primer Condicional: Probabilidad real de encontrar las llaves' }
    ],
    keywords: ['conditionals', 'condicionales', 'if', 'will', 'would', 'first conditional', 'second conditional', 'hipotetico', 'posibilidad', 'were you', 'won']
  },
  {
    id: 'passive-voice',
    title: 'La Voz Pasiva (Passive Voice)',
    titleEn: 'Passive Voice',
    mcer: 'B2',
    category: 'Syntax',
    summary: 'Transfiere el enfoque comunicativo desde el agente activo hacia el recibidor del evento. Esencial para escritura académica.',
    explanation: `En inglés, utilizamos la **Voz Pasiva** cuando queremos enfocar la atención del receptor en el **objeto o la acción de la oración**, en lugar de en el "sujeto activo" que la realiza. También se prefiere cuando no sabemos quién realizó la acción o no es relevante mencionarlo.

### Cómo Convertir de Activa a Pasiva
1.  El **objeto** de la oración activa se convierte en el **sujeto** de la pasiva.
2.  Agregamos el verbo auxiliar **to be** conjugado en el **mismo tiempo verbal** que tenía la oración activa.
3.  Agregamos el verbo principal en su forma de **participio pasado**.
4.  (Opcional) Si es relevante mencionar quién realizó la acción, lo introducimos con la preposición **by** (el agente).

### Ejemplos en Diferentes Tiempos
*   **Presente Simple:**
    *   *Activa:* Shakespeare writes books.
    *   *Pasiva:* Books **are written** by Shakespeare.
*   **Pasado Simple:**
    *   *Activa:* Alex designed this app.
    *   *Pasiva:* This app **was designed** by Alex.
*   **Futuro Simple:**
    *   *Activa:* The company will launch the product.
    *   *Pasiva:* The product **will be launched** by the company.`,
    structure: 'Objeto/Paciente + Verbo TO BE (Conjugado) + Participio Pasado [+ by Agente]',
    examples: [
      { en: 'The English rules were established by academic committees.', es: 'Las reglas de inglés fueron establecidas por comités académicos.', note: 'Enfoque en las reglas, no en los comités' },
      { en: 'The grammar library is updated every single week.', es: 'La biblioteca de gramática es actualizada cada semana.', note: 'No se menciona al agente porque se sobreentiende o no importa' },
      { en: 'The test had been corrected before the system crashed.', es: 'La prueba había sido corregida antes de que el sistema fallara.', note: 'Pasiva en Pasado Perfecto ("had been + participio")' }
    ],
    keywords: ['passive voice', 'voz pasiva', 'was', 'were', 'been', 'by', 'objeto receptivo', 'participio pasado', 'acciones academicas']
  },
  {
    id: 'reported-speech',
    title: 'Estilo Indirecto (Reported Speech - Indirect Speech)',
    titleEn: 'Reported Speech',
    mcer: 'B2',
    category: 'Syntax',
    summary: 'Aprende a contar lo que otra persona ha dicho aplicando las leyes de retroceso temporal de los verbos (Backshifting).',
    explanation: `El **Reported Speech** se utiliza para contarle a otra persona lo que un tercero dijo en un momento previo, sin necesidad de citar sus palabras textuales (que sería el *Direct Speech*).

### La Regla del "Paso Atrás" (Verb Backshift)
Dado que estamos informando algo que se dijo en el pasado, la regla general en inglés es que los tiempos verbales **vuelven un paso hacia el pasado** (backshift):

| Direct Speech (Mensaje Original) | Reported Speech (Mensaje Reportado) |
| :--- | :--- |
| **Present Simple** (*"I go"*) | **Past Simple** (*She said she went*) |
| **Present Continuous** (*"I am going"*) | **Past Continuous** (*She said she was going*) |
| **Past Simple** / **Present Perfect** (*"I went" / "I have gone"*) | **Past Perfect** (*She said she had gone*) |
| **Future Simple (Will)** (*"I will go"*) | **Conditional (Would)** (*She said she would go*) |
| **Can** | **Could** |
| **Must / Have to** | **Had to** |

### Cambio de Expresiones Temporales y Pronombres
Recuerda adaptar también los pronombres (I -> he/she, we -> they) y las expresiones de tiempo/espacio para que todo tenga coherencia lógica:
*   *here* -> *there*
*   *now* -> *then / at that moment*
*   *tomorrow* -> *the next day / the following day*
*   *yesterday* -> *the day before / the previous day*`,
    structure: 'Sujeto + said/told [+ persona] + (that) + Sujeto_2 + Verbo (Backshifted) + Comp.',
    examples: [
      { en: 'Direct: "I teach English." -> Reported: He said that he taught English.', es: 'Directo: "Enseño inglés." -> Indirecto: Él dijo que enseñaba inglés.', note: '"teach" (presente) cambia a "taught" (pasado)' },
      { en: 'Direct: "We have finished." -> Reported: She told me they had finished.', es: 'Directo: "Hemos terminado." -> Indirecto: Ella me dijo que habían terminado.', note: '"have finished" (presente perfecto) cambia a "had finished" (pasado perfecto)' },
      { en: 'Direct: "I will call you tomorrow." -> Reported: She said she would call me the following day.', es: 'Directo: "Te llamaré mañana." -> Indirecto: Ella dijo que me llamaría al día siguiente.', note: '"will" cambia a "would"; "tomorrow" cambia a "the following day"' }
    ],
    keywords: ['reported speech', 'indirect speech', 'estilo indirecto', 'say', 'tell', 'said', 'told', 'that', 'backshift', 'tiempos verbales', 'retroceso', 'gramatica']
  },
  {
    id: 'modal-deduction',
    title: 'Verbos Modales de Deducción (Must, Might, Can\'t)',
    titleEn: 'Modal Verbs of Deduction & Probability',
    mcer: 'B1',
    category: 'Structure',
    summary: 'Aprende a expresar tu grado de certeza y probabilidad sobre eventos presentes y pasados usando verbos auxiliares modales.',
    explanation: `Los verbos modales de deducción sirven para indicar qué tan seguros estamos respecto a una afirmación o conclusión basada en la evidencia disponible.

### 1. Certeza Absoluta / Cero Dudas (Afirmativo)
*   **Must:** Utilizado cuando estás 90-100% seguro de que algo es cierto porque hay pruebas innegables. Significa "debe de".
    *   *Ejemplo:* The lights are on. They **must** be at home. (Las luces están encendidas. Deben de estar en casa).

### 2. Posibilidad / Duda Moderada
*   **Might / May / Could:** Utilizados cuando consideras que algo es posible pero no estás completamente seguro (un 30-50% de probabilidad). Significa "puede que" o "podría".
    *   *Ejemplo:* She is not in class. She **might** be sick. (No está en clase. Puede que esté enferma).

### 3. Certeza Absoluta de que algo NO es posible (Negativo)
*   **Can't:** Utilizado cuando estás 90-100% seguro de que algo **es imposible** o falso según tu lógica y evidencia. Significa "no puede ser que".
    *   *Ejemplo:* He just ate a massive lunch. He **can\'t** be hungry already! (Acaba de devorar un gran almuerzo. ¡No puede tener hambre ya!).
    *   *¡Cuidado!* No uses *mustn't* para deducción de imposibilidad. *Mustn't* significa prohibición (ej: *You mustn\'t park here*), mientras que *Can't* es el opuesto deductivo de *Must*.`,
    structure: 'Sujeto + must/might/could/can\'t + Verbo(Base) + Complemento',
    examples: [
      { en: 'You have been studying all evening, you must be exhausted.', es: 'Has estado estudiando toda la tarde, debes estar agotado.', note: 'Deducción lógica con alta certeza basada en evidencia' },
      { en: 'Don\'t eat that plant, it might be poisonous.', es: 'No te comas esa planta, podría ser venenosa.', note: 'Expresa una posibilidad o advertencia en el presente' },
      { en: 'It is 2:00 AM. That can\'t be the postman knocking at the door.', es: 'Son las 2:00 AM. Ese no puede ser el cartero llamando a la puerta.', note: 'Certeza deductiva negativa: es totalmente improbable por la hora' }
    ],
    keywords: ['modal verbs', 'must', 'might', 'could', 'can\'t', 'may', 'deduccion', 'probabilidad', 'certeza', 'posibilidad', 'modales']
  },
  {
    id: 'relative-clauses',
    title: 'Cláusulas Relativas (Relative Clauses: Who, Which, That, Whose)',
    titleEn: 'Defining & Non-Defining Relative Clauses',
    mcer: 'B1',
    category: 'Syntax',
    summary: 'Aprende a unir oraciones complejas y ampliar información de personas, lugares, pertenencias y objetos de forma fluida.',
    explanation: `Las cláusulas relativas sirven para unir dos frases u ofrecer información adicional detallada sobre una persona, objeto, lugar o concepto sin tener que iniciar una nueva oración de forma robótica.

### Pronombres Relativos Clave
*   **Who o That:** Para referirse a **personas**.
    *   *Ejemplo:* The teacher **who** explained Past Perfect was Alex.
*   **Which o That:** Para referirse a **cosas, objetos o animales**.
    *   *Ejemplo:* The framework **which** powers this chatbot is Gemini.
*   **Where:** Para referirse a **lugares**.
    *   *Ejemplo:* This is the school **where** I passed the B2 exam.
*   **Whose:** Para referirse a **posesión o pertenencia** (significa "cuyo/cuya").
    *   *Ejemplo:* The student **whose** paper got an A is celebrating.

### Cláusulas Relativas Especificativas (Defining) vs Explicativas (Non-Defining)
1.  **Defining (Especificativas):** Son esenciales. Sin esta información, la oración no tiene sentido completo. No llevan comas.
    *   *The computer **that** I bought is fast.* (¿Cuál computadora? La que compré).
2.  **Non-Defining (Explicativas / Suplementarias):** Proporcionan información adicional "extra" y prescindible que puede ser eliminada sin perder el sentido de la frase. Van **siempre entre comas** y el pronombre **never** puede cambiarse por *that*.
    *   *Alex, **who** is a pedagogical tutor, wrote a list of English structures.* (Alex escribió una lista de estructuras... el hecho de que sea tutor es información adicional).`,
    structure: 'Sujeto + Pronombre Relativo (who/which/where/whose) + Frase Relativa + Complemento',
    examples: [
      { en: 'She is the tutor who helped me understand the differences.', es: 'Ella es la tutora que me ayudó a comprender las diferencias.', note: 'Cláusula especificativa (defining) para personas' },
      { en: 'This online library, which contains CEFR explanations, is fully active.', es: 'Esta biblioteca en línea, la cual contiene explicaciones MCER, está completamente activa.', note: 'Cláusula explicativa (non-defining) entre comas para cosas' },
      { en: 'The boy whose toy was broken began to cry.', es: 'El niño cuyo juguete estaba roto comenzó a llorar.', note: 'Uso de "whose" para reflejar posesión' },
      { en: 'The office where they teach English is on the third floor.', es: 'La oficina donde enseñan inglés está en el tercer piso.', note: 'Uso de "where" para lugares' }
    ],
    keywords: ['relative clauses', 'clausulas relativas', 'who', 'which', 'that', 'where', 'whose', 'whom', 'defining relative', 'non defining', 'unir oraciones']
  }
];

// ============================================================
// MIGRACION: Actualizar los 8 temas con contenido completo
// ============================================================
async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('  MIGRANDO GRAMMAR LIBRARY (8 temas)');
  console.log('═══════════════════════════════════════════════\n');

  let updated = 0;
  let examplesCreated = 0;

  for (const topic of TOPICS) {
    try {
      // 1. Verificar si existe
      const existing = await p.grammarTopic.findUnique({ where: { id: topic.id } });
      
      if (!existing) {
        console.log('  ⚠️  No existe en DB:', topic.id, '- creando...');
        await p.grammarTopic.create({
          data: {
            id: topic.id,
            title: topic.title,
            titleEn: topic.titleEn,
            mcer: topic.mcer,
            category: topic.category,
            summary: topic.summary,
            explanation: topic.explanation,
            structure: topic.structure,
            keywords: topic.keywords,
            order: 0,
            active: true,
          },
        });
      } else {
        // 2. Actualizar el tema existente
        await p.grammarTopic.update({
          where: { id: topic.id },
          data: {
            title: topic.title,
            titleEn: topic.titleEn,
            mcer: topic.mcer,
            category: topic.category,
            summary: topic.summary,
            explanation: topic.explanation,
            structure: topic.structure,
            keywords: topic.keywords,
            active: true,
          },
        });
      }

      // 3. Recrear los ejemplos
      await p.grammarExample.deleteMany({ where: { topicId: topic.id } });
      for (let i = 0; i < topic.examples.length; i++) {
        await p.grammarExample.create({
          data: {
            topicId: topic.id,
            order: i + 1,
            en: topic.examples[i].en,
            es: topic.examples[i].es,
            note: topic.examples[i].note || null,
          },
        });
        examplesCreated++;
      }

      console.log('  ✅', topic.id, '|', topic.mcer, '|', topic.examples.length, 'ejemplos');
      updated++;
    } catch (e) {
      console.log('  ❌', topic.id, ':', e.message);
    }
  }

  console.log('');
  console.log('═══════════════════════════════════════════════');
  console.log('  MIGRACION COMPLETADA');
  console.log('═══════════════════════════════════════════════');
  console.log('Temas actualizados:', updated);
  console.log('Ejemplos creados:', examplesCreated);

  // Verificacion
  const total = await p.grammarTopic.count({ where: { active: true } });
  const conEjemplos = await p.grammarTopic.count({
    where: { active: true, examples: { some: {} } }
  });
  console.log('');
  console.log('Total temas ACTIVOS:', total);
  console.log('Temas con ejemplos:', conEjemplos);

  await p.$disconnect();
}

main().catch(e => { console.error('ERROR FATAL:', e); process.exit(1); });
