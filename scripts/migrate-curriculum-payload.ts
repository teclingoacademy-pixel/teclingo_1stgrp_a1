/**
 * Payload curricular del panel del Director (extruido de DirectorLibrary.tsx).
 * Solo para el script one-shot de migracion; se elimina junto con el script.
 */

export const SEMESTERS = [
  { code: 'Semestre 01', name: 'Principiante A1', order: 1, cefrTag: 'A1.1' },
  { code: 'Semestre 02', name: 'Principiante A1', order: 2, cefrTag: 'A1.2' },
  { code: 'Semestre 03', name: 'Elemental A2', order: 3, cefrTag: 'A2.1' },
  { code: 'Semestre 04', name: 'Elemental A2', order: 4, cefrTag: 'A2.2' },
  { code: 'Semestre 05', name: 'Intermedio B1', order: 5, cefrTag: 'B1.1' },
  { code: 'Semestre 06', name: 'Intermedio B1', order: 6, cefrTag: 'B1.2' },
];

type Skill = {
  skill: string;
  name: string;
  englishName: string;
  iconKey: string;
  kpi: string;
  accreditation: string;
  description: string;
};

const A1 = (cefrTag: string): Skill[] => [
  {
    skill: 'grammar', name: 'Gramática / Structure', englishName: 'Sentence Analysis & Structure', iconKey: 'Edit3',
    kpi: 'Min. 75% Aciertos', accreditation: `ACREDITACIÓN OBLIGATORIA (CEFR ${cefrTag})`,
    description: 'Estructuras Base e Identidad. Dominio de oraciones simples, sujeto obligatorio, verbo BE y presente simple.',
  },
  {
    skill: 'listening', name: 'Comprensión Auditiva', englishName: 'Academic Listening Comprehension', iconKey: 'Headphones',
    kpi: 'Min. 80% Comprensión', accreditation: 'Acreditación Inicial',
    description: 'Instrucciones Cortas. Habilidad para entender frases cotidianas, saludos lentos y comandos directos de la plataforma.',
  },
  {
    skill: 'reading', name: 'Lectura Certificada', englishName: 'Academic Reading Comprehension', iconKey: 'FileText',
    kpi: 'Min. 80% Lectura', accreditation: 'Acreditación Directiva Obligatoria',
    description: 'Textos Ultra-Cortos. Identificación de nombres, palabras familiares y datos explícitos en letreros o manuales base.',
  },
  {
    skill: 'writing', name: 'Escritura Formal', englishName: 'Integrated & Academic Writing', iconKey: 'BookOpen',
    kpi: 'Min. 75% Coherencia', accreditation: 'Acreditación Escrita Inicial',
    description: 'Producción de Frases. Construcción de enunciados simples, llenado de formularios de contacto y biografías cortas.',
  },
  {
    skill: 'speaking', name: 'Habla & Fluidez IA', englishName: 'Spoken Academic Fluency AI', iconKey: 'Mic',
    kpi: 'Min. 80% Pronunciación', accreditation: 'Acreditación Directa',
    description: 'Fonética Elemental (SafeZone). Producción oral pausada con enfoque en la pérdida del miedo escénico y pronunciación de palabras clave.',
  },
];

const A2 = (cefrTag: string): Skill[] => [
  {
    skill: 'grammar', name: 'Gramática / Structure', englishName: 'Sentence Analysis & Structure', iconKey: 'Edit3',
    kpi: 'Min. 80% Aciertos', accreditation: `ACREDITACIÓN OBLIGATORIA (CEFR ${cefrTag})`,
    description: 'Conectores y Rutinas. Uso de tiempos pasados, futuros simples, adverbios de frecuencia y conectores básicos.',
  },
  {
    skill: 'listening', name: 'Comprensión Auditiva', englishName: 'Academic Listening Comprehension', iconKey: 'Headphones',
    kpi: 'Min. 82% Comprensión', accreditation: 'Acreditación Intermedia',
    description: 'Interacciones Cotidianas. Comprensión de diálogos descriptivos sobre el entorno, trabajo y pasatiempos a velocidad media.',
  },
  {
    skill: 'reading', name: 'Lectura Certificada', englishName: 'Academic Reading Comprehension', iconKey: 'FileText',
    kpi: 'Min. 85% Lectura', accreditation: 'Acreditación Directiva Regulada',
    description: 'Comprensión de Mensajes. Lectura de textos lineales simples, correos operativos y descripciones de procesos técnicos cortos.',
  },
  {
    skill: 'writing', name: 'Escritura Formal', englishName: 'Integrated & Academic Writing', iconKey: 'BookOpen',
    kpi: 'Min. 80% Coherencia', accreditation: 'Acreditación Escrita Intermedia',
    description: 'Párrafos Descriptivos. Escritura de textos breves enlazados con conectores lineales sobre temas de interés.',
  },
  {
    skill: 'speaking', name: 'Habla & Fluidez IA', englishName: 'Spoken Academic Fluency AI', iconKey: 'Mic',
    kpi: 'Min. 88% Pronunciación', accreditation: 'Acreditación por Conversación',
    description: 'Intercambio Directo. Capacidad para responder preguntas directas sobre su perfil y entablar diálogos guiados por el bot.',
  },
];

const B1 = (cefrTag: string): Skill[] => [
  {
    skill: 'grammar', name: 'Gramática / Structure', englishName: 'Sentence Analysis & Structure', iconKey: 'Edit3',
    kpi: 'Min. 85% Aciertos', accreditation: `ACREDITACIÓN OBLIGATORIA (CEFR ${cefrTag})`,
    description: 'Sintaxis Compleja TOEFL. Dominio de voz pasiva, condicionales, cláusulas relativas y concordancia avanzada.',
  },
  {
    skill: 'listening', name: 'Comprensión Auditiva', englishName: 'Academic Listening Comprehension', iconKey: 'Headphones',
    kpi: 'Min. 85% Comprensión', accreditation: 'Acreditación Profesional',
    description: 'Discurso Académico. Habilidad para entender debates, conferencias magistrales y modismos universitarios nativos.',
  },
  {
    skill: 'reading', name: 'Lectura Certificada', englishName: 'Academic Reading Comprehension', iconKey: 'FileText',
    kpi: 'Min. 90% Lectura', accreditation: 'Acreditación Directiva Avanzada',
    description: 'Análisis Crítico Técnico. Comprensión y análisis de artículos científicos, documentación y ensayos extensos de TOEFL.',
  },
  {
    skill: 'writing', name: 'Escritura Formal', englishName: 'Integrated & Academic Writing', iconKey: 'BookOpen',
    kpi: 'Min. 82% Coherencia', accreditation: 'Acreditación Escrita Avanzada',
    description: 'Ensayos Argumentativos. Construcción de ensayos estructurados con transiciones formales y vocabulario corporativo.',
  },
  {
    skill: 'speaking', name: 'Habla & Fluidez IA', englishName: 'Spoken Academic Fluency AI', iconKey: 'Mic',
    kpi: 'Min. 93% Pronunciación', accreditation: 'Acreditación de Alta Oratoria',
    description: 'Oratoria Institucional. Fluidez espontánea, ritmo discursivo correcto, entonación nativa y velocidad de pitch de negocios.',
  },
];

export const SKILL_MATRIX: Record<string, Skill[]> = {
  'Semestre 01': A1('A1.1'),
  'Semestre 02': A1('A1.2'),
  'Semestre 03': A2('A2.1'),
  'Semestre 04': A2('A2.2'),
  'Semestre 05': B1('B1.1'),
  'Semestre 06': B1('B1.2'),
};
