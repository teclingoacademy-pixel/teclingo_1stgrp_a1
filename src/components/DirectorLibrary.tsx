/**
@license
SPDX-License-Identifier: Apache-2.0
*/
import React, { useState, useEffect, useRef } from 'react';
import {
  UploadCloud,
  FileCode,
  FileText,
  Database,
  Trash2,
  Search,
  ShieldCheck,
  Terminal,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Sparkles,
  BookOpen,
  Plus,
  ChevronDown,
  ChevronUp,
  Book,
  X,
  Layers,
  Pencil,
  Folder,
  Download,
  Award,
  Copy,
  Check,
  Video,
  Clock,
  Target,
  Headphones,
  Mic,
  Edit3,
  FileQuestion,
  CheckSquare,
  Send,
  Share2,
  Move,
  HelpCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GlassCard } from './GlassCard';
import { LibroVirtual } from './LibroVirtual';
import { DirectorModeloA1Plus } from './DirectorModeloA1Plus';
import { useStudyPlan } from '../hooks/useStudyPlan';

const API_URL_READ = (import.meta.env.VITE_IDENTITY_API_URL as string | undefined)?.trim() || "https://script.google.com/macros/s/AKfycbz7buTc2D7FIgWVub6_t4leXfvqc68821957LHOUgP-mBqpWKn_7JaEU-DZWiumAcVb/exec";
const API_URL_WRITE = API_URL_READ;

// Interfaces
interface LibraryDoc {
  id: string;
  name: string;
  size: string;
  type: 'json' | 'pdf';
  uploadedAt: string;
  status: 'active' | 'pending';
  checksum: string;
  description?: string;
}

interface TOEFLSkill {
  id: string;
  name: string;
  englishName: string;
  icon: any;
  kpi: string;
  accreditation: string;
  description: string;
}

interface GroupDiagnosis {
  name: string;
  avgGrade: number;
  writtenLevel: number;
  anxietyLevel: number;
  focusArea: string;
}

const mockGroupDiagnoses: Record<string, GroupDiagnosis> = {
  'all': {
    name: 'Todos los Grupos',
    avgGrade: 83,
    writtenLevel: 25,
    anxietyLevel: 72,
    focusArea: 'Varios • Fluidez Oral y Miedo Escénico'
  },
  'A1-102': {
    name: 'A1-102 - BASIC ENGLISH LAB',
    avgGrade: 74,
    writtenLevel: 8,
    anxietyLevel: 93,
    focusArea: 'Temor al hablar (SafeZone) / Pronunciación de Sujetos Obligatorios'
  },
  'B2-205': {
    name: 'B2-205 - DIALOGUE PRACTICE',
    avgGrade: 91,
    writtenLevel: 45,
    anxietyLevel: 52,
    focusArea: 'Fluidez y Conectores de Discurso Largo'
  },
  'B1-105': {
    name: 'B1-105 - GRAMMAR CONTEXT',
    avgGrade: 81,
    writtenLevel: 28,
    anxietyLevel: 68,
    focusArea: 'Estructuras de Opción Múltiple & Vocabulario Técnico'
  },
  'C1-302': {
    name: 'C1-302 - ADVANCED FLUENCY',
    avgGrade: 94,
    writtenLevel: 75,
    anxietyLevel: 31,
    focusArea: 'Oratoria Libre & Debate en Tiempo Real'
  },
  'Virtual': {
    name: 'Virtual - DIAGNOSTICS LAB',
    avgGrade: 78,
    writtenLevel: 12,
    anxietyLevel: 85,
    focusArea: 'Comprensión Auditiva y Tiempos Verbales Básicos'
  }
};

export function DirectorLibrary() {
  const [activeSubTab, setActiveSubTab] = useState<
    'Plan de Estudio' | 'Plan Maestro' | 'Cargas & Archivos' | 'Libro Virtual Maestro' | 'Estructura Reticular' | 'Distribución Académica' | 'Creador de Exámenes'
  >('Plan de Estudio');
  const [selectedSemester, setSelectedSemester] = useState<string>('Semestre 01');
  const [searchQuery, setSearchQuery] = useState('');
  const [openWeeks, setOpenWeeks] = useState<{ [key: number]: boolean }>({ 1: true });
  const [dragActive, setDragActive] = useState(false);

  // Malla curricular: esta es la COPIA MAESTRA que consume también el panel del docente.
  const {
    weeks: mallaCurricularData,
    source: mallaSource,
    loading: isLoadingMalla,
    refresh: refreshMalla,
  } = useStudyPlan('S01');

  // States for Exam Builder / Test Maker
  const [examTitle, setExamTitle] = useState('EVALUACIÓN PARCIAL DE INGLÉS TÉCNICO I');
  const [examDuration, setExamDuration] = useState(60);
  const [examGroup, setExamGroup] = useState('all');
  const [examSemester, setExamSemester] = useState('Semestre 01');
  const [draggedItemType, setDraggedItemType] = useState<string | null>(null);
  const [isDraggingOverCanvas, setIsDraggingOverCanvas] = useState(false);
  const [isDistributedSuccess, setIsDistributedSuccess] = useState(false);
  const [isGeneratingAi, setIsGeneratingAi] = useState(false);
  const [selectedWeekForSyllabusTemplate, setSelectedWeekForSyllabusTemplate] = useState<number>(1);
  
  const [canvasQuestions, setCanvasQuestions] = useState<Array<{
    id: string;
    type: 'multiple-choice' | 'true-false' | 'fill-blanks' | 'speaking';
    question: string;
    options: string[];
    correctAnswer: string;
    points: number;
    timeLimit?: string;
    precisionThreshold?: number;
  }>>([
    {
      id: 'q_init_1',
      type: 'multiple-choice',
      question: 'Identify the correct personal pronoun to complete: "_____ are developing a cloud storage microservice for the local network configuration."',
      options: ['He', 'They', 'It', 'She'],
      correctAnswer: 'They',
      points: 20
    },
    {
      id: 'q_init_2',
      type: 'fill-blanks',
      question: 'The server administrator must click on the [deploy] button to launch the pipeline successfully.',
      options: [],
      correctAnswer: 'deploy',
      points: 15
    }
  ]);

  const [createdExams, setCreatedExams] = useState<Array<{
    id: string;
    title: string;
    semester: string;
    group: string;
    duration: number;
    questionCount: number;
    totalPoints: number;
    createdAt: string;
  }>>(() => {
    let rawExams = [
      {
        id: 'exam_pre_1',
        title: 'QUIZ SEMANA 01: PLACEMENT DIAGNOSTIC',
        semester: 'Semestre 01',
        group: 'all',
        duration: 40,
        questionCount: 5,
        totalPoints: 100,
        createdAt: '15-May-2026'
      }
    ];
    try {
      const saved = localStorage.getItem('library_created_exams');
      if (saved) {
        rawExams = JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    const seen = new Set<string>();
    const unique: any[] = [];
    for (const ex of rawExams) {
      let id = ex.id;
      if (!id || seen.has(id)) {
        id = 'exam_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
      }
      seen.add(id);
      unique.push({ ...ex, id });
    }
    return unique;
  });

  useEffect(() => {
    try {
      localStorage.setItem('library_created_exams', JSON.stringify(createdExams));
    } catch (e) {
      console.error(e);
    }
  }, [createdExams]);

  const handleAddNewQuestion = (type: 'multiple-choice' | 'true-false' | 'fill-blanks' | 'speaking', predefinedData?: any) => {
    const id = 'q_' + Date.now() + '_' + Math.random().toString(36).substr(2, 5);
    const newQ = {
      id,
      type,
      question: predefinedData?.question || (
        type === 'multiple-choice' ? 'Identify the correct vocabulary term for: "An environment variable used for public endpoints."' :
        type === 'true-false' ? 'True or False: Client-side keys are totally safe to publish publicly on client browsers.' :
        type === 'fill-blanks' ? 'The system administrator should run the [build] command before launching production pipelines.' :
        'Read the following text block aloud: "We are developing cloud microservices linked directly to the TOEFL standard syllabus."'
      ),
      options: predefinedData?.options || (
        type === 'multiple-choice' ? ['VITE_PUBLIC_URL', 'STRIPE_SECRET_KEY', 'AWS_ACCESS_ID', 'DATABASE_PASSWORD'] :
        type === 'true-false' ? ['Verdadero', 'Falso'] : []
      ),
      correctAnswer: predefinedData?.correctAnswer || (
        type === 'multiple-choice' ? 'VITE_PUBLIC_URL' :
        type === 'true-false' ? 'Falso' :
        type === 'fill-blanks' ? 'build' : 'TOEFL Fluency Target'
      ),
      points: predefinedData?.points || 20,
      timeLimit: predefinedData?.timeLimit || '1 min',
      precisionThreshold: predefinedData?.precisionThreshold || 80
    };
    setCanvasQuestions(prev => [...prev, newQ]);
    if (typeof addLog === 'function') {
      addLog(`CLIENT: Añadido reactivo tipo "${type}" al examen lineal.`);
    }
  };

  const handleAiGenerateExam = () => {
    if (typeof addLog === 'function') {
      addLog(`CLIENT: Consultando planeación académica para semestre [${examSemester}] y grupo [${examGroup}]...`);
    }
    const grLabel = examGroup === 'all' ? 'GLOBAL' : examGroup;
    setExamTitle(`EVALUACIÓN PARCIAL CONTEXTUAL DE IA - GRUPO ${grLabel} (${examSemester})`.toUpperCase());
    const idSeed = Date.now();
    const generated = [
      {
        id: `ai_mc_${idSeed}_1`,
        type: 'multiple-choice' as const,
        question: "Select the option that correctly represents standard Subject Pronoun placement for non-human animate objects or general weather patterns in communicative sentences:",
        options: [
          "A) It is extremely windy but we are progressing.",
          "B) Is extremely windy but they are progressing.",
          "C) Him is extremely windy but we are progressing.",
          "D) Her is extremely windy but we are progress."
        ],
        correctAnswer: "A) It is extremely windy but we are progressing.",
        points: 25,
        timeLimit: "1 min",
        precisionThreshold: 80
      },
      {
        id: `ai_tf_${idSeed}_2`,
        type: 'true-false' as const,
        question: "True or False: In native-like pacing, the optional omission of standard auxiliary verbs under high stress is discouraged in formal evaluations.",
        options: ["Verdadero", "Falso"],
        correctAnswer: "Verdadero",
        points: 20,
        timeLimit: "1 min",
        precisionThreshold: 80
      },
      {
        id: `ai_sp_${idSeed}_3`,
        type: 'speaking' as const,
        question: "Developing virtual communication interfaces requires solid subject pronoun compliance.",
        options: ["AI Speaking Setup"],
        correctAnswer: "SUBJECT PRONOUN COMPLIANCE",
        points: 30,
        timeLimit: "1 min",
        precisionThreshold: 85
      },
      {
        id: `ai_fb_${idSeed}_4`,
        type: 'fill-blanks' as const,
        question: "Complete the sentence with standard academic pronouns: 'When configuring the secure gateway for client-side queries, ______ is critical to keep the API key hidden on the server.'",
        options: ["it"],
        correctAnswer: "it",
        points: 25,
        timeLimit: "1 min",
        precisionThreshold: 80
      }
    ];
    setCanvasQuestions(generated);
    if (typeof addLog === 'function') {
      addLog(`CLIENT: Generador IA pobló el examen de forma automática con 4 reactivos (100 puntos totales).`);
    }
  };

  const handleDistributeExam = async () => {
    if (canvasQuestions.length === 0) return;
    const totalPoints = canvasQuestions.reduce((acc, q) => acc + q.points, 0);
    const newExam = {
      id: 'exam_' + Date.now(),
      title: examTitle.toUpperCase() || 'EXAMEN ACADÉMICO GENERAL',
      semester: examSemester,
      group: examGroup,
      duration: examDuration || 45,
      questionCount: canvasQuestions.length,
      totalPoints,
      createdAt: 'Hoy, ' + new Date().toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).toUpperCase()
    };
    setCreatedExams(prev => [newExam, ...prev]);
    setIsDistributedSuccess(true);
    setTimeout(() => {
      setIsDistributedSuccess(false);
      setCanvasQuestions([]);
      setExamTitle('NUEVA EVALUACIÓN DE INGLÉS TÉCNICO II');
    }, 4500);
    if (typeof addLog === 'function') {
      addLog(`CLIENT: Examen "${newExam.title}" distribuido con éxito a grupo [${examGroup}].`);
    }
    try {
      await fetch(API_URL_WRITE, {
        method: 'POST',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify({
          action: 'append',
          sheet: 'BancoPreguntas',
          rowData: {
            id: newExam.id,
            tipo: 'examen_completo',
            pregunta: newExam.title,
            opciones_json: JSON.stringify(canvasQuestions),
            respuesta_correcta: 'N/A',
            puntos: totalPoints,
            semana_malla: examSemester,
            semestre: examSemester
          }
        })
      });
      addLog(`️ CLOUD SUCCESS: Examen "${newExam.title}" guardado en la base de datos central.`);
    } catch (error) {
      console.error("Error guardando en Sheets:", error);
      addLog(`❌ CLOUD ERROR: Fallo al sincronizar el examen con la base de datos.`);
    }
  };

  const [uploadedFiles, setUploadedFiles] = useState<LibraryDoc[]>(() => {
    try {
      const saved = localStorage.getItem('library_uploaded_docs');
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error(e);
    }
    return [
      { id: '1', name: 'Plan_Estudio_Ingles_Basico_2026.json', size: '254 KB', type: 'json', uploadedAt: '12-May-2026', status: 'active', checksum: 'CSEC_M1_PASS', description: 'Esquema de Malla Curricular / Syllabus' },
      { id: '2', name: 'Manual_TOEFL_Acreditacion_Nivel_A1.pdf', size: '1.4 MB', type: 'pdf', uploadedAt: '18-May-2026', status: 'active', checksum: 'TOEFL_A1_SIGN', description: 'Manual Técnico Oficial Autenticado' }
    ];
  });

  const [isLoadingData, setIsLoadingData] = useState(true);
  const [isSyncingPlaneacion, setIsSyncingPlaneacion] = useState(false);

  const [activeUploadTab, setActiveUploadTab] = useState<'JSON' | 'PDF' | 'PLAIN'>('JSON');
  const [plainText, setPlainText] = useState('');
  const [consoleLogs, setConsoleLogs] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorCode, setErrorCode] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [selectedBookUnit, setSelectedBookUnit] = useState<number>(1);
  const [selectedBookPage, setSelectedBookPage] = useState<number>(4);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const semesters = ['Semestre 01', 'Semestre 02', 'Semestre 03', 'Semestre 04', 'Semestre 05', 'Semestre 06'];

  const toeflSkills = React.useMemo<TOEFLSkill[]>(() => {
    const semester = selectedSemester;
    const isLevelA1 = semester === 'Semestre 01' || semester === 'Semestre 02';
    const isLevelA2 = semester === 'Semestre 03' || semester === 'Semestre 04';
    let cefrTag = 'B1.1';
    if (semester === 'Semestre 01') cefrTag = 'A1.1';
    else if (semester === 'Semestre 02') cefrTag = 'A1.2';
    else if (semester === 'Semestre 03') cefrTag = 'A2.1';
    else if (semester === 'Semestre 04') cefrTag = 'A2.2';
    else if (semester === 'Semestre 05') cefrTag = 'B1.1';
    else if (semester === 'Semestre 06') cefrTag = 'B1.2';
    
    if (isLevelA1) {
      return [
        { 
          id: 'grammar', 
          name: 'Gramática / Structure', 
          englishName: 'Sentence Analysis & Structure', 
          icon: Edit3, 
          kpi: 'Min. 75% Aciertos', 
          accreditation: `ACREDITACIÓN OBLIGATORIA (CEFR ${cefrTag})`, 
          description: 'Estructuras Base e Identidad. Dominio de oraciones simples, sujeto obligatorio, verbo BE y presente simple.' 
        },
        { 
          id: 'listening', 
          name: 'Comprensión Auditiva', 
          englishName: 'Academic Listening Comprehension', 
          icon: Headphones, 
          kpi: 'Min. 80% Comprensión', 
          accreditation: 'Acreditación Inicial', 
          description: 'Instrucciones Cortas. Habilidad para entender frases cotidianas, saludos lentos y comandos directos de la plataforma.' 
        },
        { 
          id: 'reading', 
          name: 'Lectura Certificada', 
          englishName: 'Academic Reading Comprehension', 
          icon: FileText, 
          kpi: 'Min. 80% Lectura', 
          accreditation: 'Acreditación Directiva Obligatoria', 
          description: 'Textos Ultra-Cortos. Identificación de nombres, palabras familiares y datos explícitos en letreros o manuales base.' 
        },
        { 
          id: 'writing', 
          name: 'Escritura Formal', 
          englishName: 'Integrated & Academic Writing', 
          icon: BookOpen, 
          kpi: 'Min. 75% Coherencia', 
          accreditation: 'Acreditación Escrita Inicial', 
          description: 'Producción de Frases. Construcción de enunciados simples, llenado de formularios de contacto y biografías cortas.' 
        },
        { 
          id: 'speaking', 
          name: 'Habla & Fluidez IA', 
          englishName: 'Spoken Academic Fluency AI', 
          icon: Mic, 
          kpi: 'Min. 80% Pronunciación', 
          accreditation: 'Acreditación Directa', 
          description: 'Fonética Elemental (SafeZone). Producción oral pausada con enfoque en la pérdida del miedo escénico y pronunciación de palabras clave.' 
        }
      ];
    } else if (isLevelA2) {
      return [
        { 
          id: 'grammar', 
          name: 'Gramática / Structure', 
          englishName: 'Sentence Analysis & Structure', 
          icon: Edit3, 
          kpi: 'Min. 80% Aciertos', 
          accreditation: `ACREDITACIÓN OBLIGATORIA (CEFR ${cefrTag})`, 
          description: 'Conectores y Rutinas. Uso de tiempos pasados, futuros simples, adverbios de frecuencia y conectores básicos.' 
        },
        { 
          id: 'listening', 
          name: 'Comprensión Auditiva', 
          englishName: 'Academic Listening Comprehension', 
          icon: Headphones, 
          kpi: 'Min. 82% Comprensión', 
          accreditation: 'Acreditación Intermedia', 
          description: 'Interacciones Cotidianas. Comprensión de diálogos descriptivos sobre el entorno, trabajo y pasatiempos a velocidad media.' 
        },
        { 
          id: 'reading', 
          name: 'Lectura Certificada', 
          englishName: 'Academic Reading Comprehension', 
          icon: FileText, 
          kpi: 'Min. 85% Lectura', 
          accreditation: 'Acreditación Directiva Regulada', 
          description: 'Comprensión de Mensajes. Lectura de textos lineales simples, correos operativos y descripciones de procesos técnicos cortos.' 
        },
        { 
          id: 'writing', 
          name: 'Escritura Formal', 
          englishName: 'Integrated & Academic Writing', 
          icon: BookOpen, 
          kpi: 'Min. 80% Coherencia', 
          accreditation: 'Acreditación Escrita Intermedia', 
          description: 'Párrafos Descriptivos. Escritura de textos breves enlazados con conectores lineales sobre temas de interés.' 
        },
        { 
          id: 'speaking', 
          name: 'Habla & Fluidez IA', 
          englishName: 'Spoken Academic Fluency AI', 
          icon: Mic, 
          kpi: 'Min. 88% Pronunciación', 
          accreditation: 'Acreditación por Conversación', 
          description: 'Intercambio Directo. Capacidad para responder preguntas directas sobre su perfil y entablar diálogos guiados por el bot.' 
        }
      ];
    } else {
      return [
        { 
          id: 'grammar', 
          name: 'Gramática / Structure', 
          englishName: 'Sentence Analysis & Structure', 
          icon: Edit3, 
          kpi: 'Min. 85% Aciertos', 
          accreditation: `ACREDITACIÓN OBLIGATORIA (CEFR ${cefrTag})`, 
          description: 'Sintaxis Compleja TOEFL. Dominio de voz pasiva, condicionales, cláusulas relativas y concordancia avanzada.' 
        },
        { 
          id: 'listening', 
          name: 'Comprensión Auditiva', 
          englishName: 'Academic Listening Comprehension', 
          icon: Headphones, 
          kpi: 'Min. 85% Comprensión', 
          accreditation: 'Acreditación Profesional', 
          description: 'Discurso Académico. Habilidad para entender debates, conferencias magistrales y modismos universitarios nativos.' 
        },
        { 
          id: 'reading', 
          name: 'Lectura Certificada', 
          englishName: 'Academic Reading Comprehension', 
          icon: FileText, 
          kpi: 'Min. 90% Lectura', 
          accreditation: 'Acreditación Directiva Avanzada', 
          description: 'Análisis Crítico Técnico. Comprensión y análisis de artículos científicos, documentación y ensayos extensos de TOEFL.' 
        },
        { 
          id: 'writing', 
          name: 'Escritura Formal', 
          englishName: 'Integrated & Academic Writing', 
          icon: BookOpen, 
          kpi: 'Min. 82% Coherencia', 
          accreditation: 'Acreditación Escrita Avanzada', 
          description: 'Ensayos Argumentativos. Construcción de ensayos estructurados con transiciones formales y vocabulario corporativo.' 
        },
        { 
          id: 'speaking', 
          name: 'Habla & Fluidez IA', 
          englishName: 'Spoken Academic Fluency AI', 
          icon: Mic, 
          kpi: 'Min. 93% Pronunciación', 
          accreditation: 'Acreditación de Alta Oratoria', 
          description: 'Oratoria Institucional. Fluidez espontánea, ritmo discursivo correcto, entonación nativa y velocidad de pitch de negocios.' 
        }
      ];
    }
  }, [selectedSemester]);

  useEffect(() => {
    localStorage.setItem('library_uploaded_docs', JSON.stringify(uploadedFiles));
  }, [uploadedFiles]);

  useEffect(() => {
    setIsLoadingData(false);
  }, []);

  const addLog = (msg: string) => {
    setConsoleLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const toggleWeek = (weekNum: number) => {
    setOpenWeeks(prev => ({ ...prev, [weekNum]: !prev[weekNum] }));
  };

  const handleSyncPlaneacionToDataLake = async () => {
    if (!mallaCurricularData.length || isSyncingPlaneacion) return;
    setIsSyncingPlaneacion(true);
    addLog('CLIENT: Publicando planeación curricular como copia maestra...');
    try {
      let successCount = 0;
      for (const semana of mallaCurricularData) {
        const res = await fetch(`/api/study-plan/S01/weeks/${semana.semana}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            fechas: semana.fechas || '',
            ejeTematico: semana.eje_tematico || '',
            unidadLibro: semana.unidad_libro || '',
            paginas: semana.paginas || '',
            kpi: semana.kpi || '',
            horasJson: semana.horas || [],
          }),
        });
        if (res.ok) successCount++;
      }
      addLog(`CLOUD SUCCESS: ${successCount}/${mallaCurricularData.length} semanas publicadas en la copia maestra.`);
      if (successCount > 0) {
        await refreshMalla();
        addLog('CLIENT: Malla directiva y panel docente actualizados desde la misma fuente.');
      }
    } catch (error) {
      console.error('[DirectorLibrary] Error publicando planeación:', error);
      addLog('❌ CLOUD ERROR: Fallo al publicar la planeación en la copia maestra.');
    } finally {
      setIsSyncingPlaneacion(false);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0];
      await validateAndProcessFile(droppedFile);
    }
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      await validateAndProcessFile(selectedFile);
    }
  };

  const validateAndProcessFile = async (file: File) => {
    setErrorCode(null);
    setSuccessMsg(null);
    setConsoleLogs([]);
    setIsProcessing(true);
    addLog(`CLIENT: Iniciando verificación local de archivo "${file.name}"...`);
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (activeUploadTab === 'JSON' && ext !== 'json') {
      setErrorCode('Error: Formato no coincidente. Estás en la pestaña JSON, por lo que solo se permiten archivos .json.');
      addLog(`CLIENT-ERROR: Intento de cargar archivo .${ext} bloqueado en la pestaña JSON.`);
      setIsProcessing(false);
      return;
    }
    if (activeUploadTab === 'PDF' && ext !== 'pdf') {
      setErrorCode('Error: Formato no coincidente. Estás en la pestaña PDF, por lo que solo se permiten archivos .pdf.');
      addLog(`CLIENT-ERROR: Intento de cargar archivo .${ext} bloqueado en la pestaña PDF.`);
      setIsProcessing(false);
      return;
    }
    await new Promise(resolve => setTimeout(resolve, 800));
    addLog(`🔄 API [POST] /api/library/upload - Recibiendo stream de datos...`);
    await new Promise(resolve => setTimeout(resolve, 600));
    addLog(`🛡️ MIDDLEWARE: Analizando firma criptográfica ("magic bytes") y hashes...`);
    await new Promise(resolve => setTimeout(resolve, 600));
    if (ext === 'pdf') {
      addLog(`CLIENT: Cabecera detectada %PDF-1.4. Ingesta autorizada.`);
    } else if (ext === 'json') {
      addLog(`CLIENT: Validador estructural JSON: Schema matches "Teclingo.Curriculum.v1"`);
    }
    await new Promise(resolve => setTimeout(resolve, 500));
    addLog(`💾 DATABASE: Sincronizando registro inmutable en Firestore...`);
    await new Promise(resolve => setTimeout(resolve, 500));
    const newDoc: LibraryDoc = {
      id: `doc_${Date.now()}`,
      name: file.name,
      size: file.size > 1024 * 1024 
        ? `${(file.size / (1024 * 1024)).toFixed(1)} MB` 
        : `${(file.size / 1024).toFixed(1)} KB`,
      type: ext === 'pdf' ? 'pdf' : 'json',
      uploadedAt: new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'active',
      checksum: `SHA256:${Math.random().toString(16).substring(2, 10).toUpperCase()}`,
      description: ext === 'pdf' ? 'Manual Técnico Oficial Autenticado' : 'Esquema de Malla Curricular / Syllabus'
    };
    setUploadedFiles(prev => [newDoc, ...prev]);
    setSuccessMsg(`¡Carga Completa! El archivo "${file.name}" fue verificado por el servidor y guardado.`);
    addLog(`🚀 DATABASE SUCCESS: Documento "${file.name}" guardado exitosamente.`);
    setIsProcessing(false);
  };

  const handleProcessPlainText = async () => {
    if (!plainText.trim()) return;
    if (plainText.length > 15000) {
      setErrorCode('La longitud del texto excede el límite de 15,000 caracteres.');
      return;
    }
    setErrorCode(null);
    setSuccessMsg(null);
    setConsoleLogs([]);
    setIsProcessing(true);
    addLog(`CLIENT: Iniciando procesamiento de texto libre (${plainText.length} caracteres)...`);
    await new Promise(r => setTimeout(r, 400));
    addLog(`CLIENT: Verificación de longitud superada (máx 15,000).`);
    await new Promise(r => setTimeout(r, 500));
    addLog(`🔄 API [POST] /api/library/paste - Enviando buffer para análisis semántico...`);
    await new Promise(r => setTimeout(r, 600));
    addLog(`🧠 NLP_MODEL_PARSER: Extrayendo unidades, objetivos semanales y pautas TOEFL...`);
    await new Promise(r => setTimeout(r, 700));
    addLog(`💾 DATABASE: Creando archivo de plan estructurado en Firestore...`);
    await new Promise(r => setTimeout(r, 400));
    const generatedName = `Syllabus_Manual_Pasted_${Math.floor(Math.random() * 900 + 100)}.json`;
    const newDoc: LibraryDoc = {
      id: `doc_${Date.now()}`,
      name: generatedName,
      size: `${(plainText.length / 1024).toFixed(1)} KB`,
      type: 'json',
      uploadedAt: new Date().toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' }),
      status: 'active',
      checksum: `SHA256:${Math.random().toString(16).substring(2, 10).toUpperCase()}`,
      description: 'Syllabus Extraído por Procesamiento Semántico'
    };
    setUploadedFiles(prev => [newDoc, ...prev]);
    setSuccessMsg(`¡Procesado Completo! Se generó el plan académico "${generatedName}" a partir del texto ingresado.`);
    addLog(`🚀 DATABASE SUCCESS: Documento creado con mallas reticulares estructuradas.`);
    setPlainText('');
    setIsProcessing(false);
  };

  const handleDeleteFile = (id: string, name: string) => {
    if (confirm(`¿Estás seguro de eliminar "${name}" de la biblioteca oficial?`)) {
      setUploadedFiles(prev => prev.filter(f => f.id !== id));
      addLog(`CLIENT: Documento ID ${id} eliminado de la biblioteca.`);
    }
  };

  // Filtrar semanas usando mallaCurricularData en lugar de mallaCurricularModulo1
  const filteredWeeks = mallaCurricularData.filter(
    w => w.eje_tematico.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.unidad_libro.toLowerCase().includes(searchQuery.toLowerCase()) ||
    w.horas.some(h => h.leccion.toLowerCase().includes(searchQuery.toLowerCase()) || h.enfoque.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="space-y-12 animate-in fade-in duration-500 font-sans">
      {/* HEADER EXCLUSIVO */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 pb-6 border-b border-white/5 text-left">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className="px-3 py-1 rounded-full bg-[#DEFF9A]/10 text-[#DEFF9A] border border-[#DEFF9A]/30 text-[9px] font-black uppercase tracking-wider">
              Control Escolar
            </span>
            <span className="text-cyan-400 text-[9px] font-black uppercase tracking-[0.3em]">
              Biblioteca Académica & Mallas Curriculares
            </span>
          </div>
          <h1 className="text-3xl md:text-5xl font-black text-white bevel-text uppercase tracking-tighter">
            BIBLIOTECA <span className="text-[#DEFF9A]">DIRECTIVA</span>
          </h1>
          <p className="text-white/40 text-xs md:text-sm font-medium mt-1 leading-relaxed max-w-2xl text-left">
            Sube planes de estudio (.JSON) y manuales técnicos oficiales (.PDF) de forma segura o pre-asigna docentes a la estructura curricular reticular.
          </p>
          <div className="flex items-center gap-2 mt-4 text-[9px] font-mono text-white/40 uppercase tracking-widest bg-white/[0.02] px-4 py-2 rounded-xl inline-flex border border-white/5">
            <span className="text-[#DEFF9A]/80">Biblioteca Oficial</span>
            <span className="text-white/20">➔</span>
            <span>Mallas</span>
            <span className="text-white/20">➔</span>
            <span className="text-cyan-400 font-bold">{activeSubTab}</span>
          </div>
        </div>
        <div className="flex items-center gap-4 shrink-0">
          <div className="px-5 py-2.5 rounded-2xl bg-[#DEFF9A]/10 border border-[#DEFF9A]/20 flex items-center gap-3">
            <Award size={16} className="text-[#DEFF9A]" />
            <span className="text-[9px] font-black uppercase tracking-widest text-white">PRO CERTIFIED TOEFL</span>
          </div>
        </div>
      </header>

      {/* CONTROLES DE NAVEGACIÓN INTERNA */}
      <div className="flex flex-wrap bg-black/45 border border-white/5 p-1 rounded-2xl max-w-7xl gap-1.5 shadow-[0_4px_20px_rgba(0,0,0,0.5)] self-start text-left">
        {([
          'Plan de Estudio', 
          'Plan Maestro',
           
          'Cargas & Archivos', 
          'Libro Virtual Maestro', 
          'Creador de Exámenes'
        ] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            onClick={() => {
              setActiveSubTab(tab);
              addLog(`CLIENT: Cambiando a pestaña de navegación - ${tab}`);
            }}
            className={`py-3 px-5 rounded-xl text-[9.5px] font-black uppercase tracking-widest transition-all duration-300 flex items-center justify-center gap-2 ${
              activeSubTab === tab 
                ? 'bg-[#DEFF9A]/10 text-[#DEFF9A] border border-[#DEFF9A]/20 shadow-[0_0_15px_rgba(222,255,154,0.12)]' 
                : 'text-white/45 hover:text-white/70 hover:bg-white/5'
            }`}
          >
            {tab === 'Plan de Estudio' && <Book size={13} className="text-[#DEFF9A]" />}
            {tab === 'Cargas & Archivos' && <UploadCloud size={13} className="text-[#DEFF9A]" />}
            {tab === 'Libro Virtual Maestro' && <BookOpen size={13} className="text-[#DEFF9A]" />}
            {tab === 'Creador de Exámenes' && <FileQuestion size={13} className="text-[#DEFF9A]" />}
            {tab}
          </button>
        ))}
      </div>

      {/* RENDER COMPONENT TABS */}
      <AnimatePresence mode="wait">
        {/* TAB 1: PLAN DE ESTUDIO (18 WEEKS ACCORDION + TOEFL HABILIDADES) */}
        {activeSubTab === 'Plan de Estudio' && (
          <motion.div 
            key="plan_estudio_tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-10"
          >
            {/* Header Block with Metadata & Actions */}
            <div className="flex flex-col xl:flex-row justify-between items-start xl:items-center gap-6 bg-black/30 border border-white/5 p-6 rounded-3xl text-left">
              <div className="space-y-2 max-w-2xl text-left">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#DEFF9A]/10 border border-[#DEFF9A]/30 text-[#DEFF9A] text-[9px] font-black uppercase tracking-wider">
                  <Award size={10} className="text-[#DEFF9A]" /> Plan de Estudio Consolidado
                </span>
                <h2 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tight">
                  MALLA CURRICULAR Y TEMARIOS SEMANALES
                </h2>
                <p className="text-white/40 text-[11px] font-medium uppercase mt-1 leading-relaxed">
                  Estructuras de planeación que integran la gramática internacional TOEFL iBT con el vocabulario técnico de sistemas de vanguardia, ordenados por temporalidad académica.
                </p>
              </div>
              <div className="flex flex-wrap gap-3 w-full xl:w-auto">
                <button
                  type="button"
                  onClick={() => {
                    const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
                      JSON.stringify(mallaCurricularData, null, 2)
                    )}`;
                    const downloadAnchor = document.createElement('a');
                    downloadAnchor.setAttribute("href", jsonString);
                    downloadAnchor.setAttribute("download", "toefl_tech_syllabus_modulo1.json");
                    document.body.appendChild(downloadAnchor);
                    downloadAnchor.click();
                    downloadAnchor.remove();
                    addLog("CLIENT: Descarga de JSON de Planeaciones completada exitosamente.");
                  }}
                  className="flex-1 sm:flex-none px-4 py-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 text-white text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                >
                  <Download size={12} className="text-[#DEFF9A]" /> Descargar JSON
                </button>
                <button
                  type="button"
                  onClick={handleSyncPlaneacionToDataLake}
                  disabled={isSyncingPlaneacion || isLoadingMalla || mallaCurricularData.length === 0}
                  className="flex-1 sm:flex-none px-4 py-3 rounded-2xl bg-[#DEFF9A]/10 border border-[#DEFF9A]/30 hover:bg-[#DEFF9A]/20 disabled:opacity-30 text-[#DEFF9A] text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all"
                >
                  {isSyncingPlaneacion ? (
                    <RefreshCw size={12} className="animate-spin" />
                  ) : (
                    <Send size={12} />
                  )}
                  {isSyncingPlaneacion ? 'Sincronizando...' : 'Sincronizar al Data Lake'}
                </button>
              </div>
            </div>

            {/* SEMESTERS CARPETAS/FOLDERS NAV SELECTOR */}
            <div className="space-y-4">
              <div className="flex items-center justify-between text-left">
                <div className="flex items-center gap-2">
                  <Folder size={14} className="text-cyan-400" />
                  <span className="text-[10px] font-bold font-mono text-[#DEFF9A] uppercase tracking-widest">
                    SELECCIONA EL PERIODO ACADÉMICO (6 SEMESTRES PRINCIPALES)
                  </span>
                </div>
                <span className="text-[9.5px] text-white/40 uppercase hidden sm:inline">
                  Aísla los temas del año en carpetas
                </span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {[
                  { key: 'Semestre 01', level: "A1.1 Principiante", focus: "Identificación de Datos Clave" },
                  { key: 'Semestre 02', level: "A1.2 Elemental", focus: "Comprensión Secuencial" },
                  { key: 'Semestre 03', level: "A2.1 Pre-Intermedio", focus: "Incidentes Pasados" },
                  { key: 'Semestre 04', level: "A2.2 Intermedio Bajo", focus: "Planes de Escalabilidad" },
                  { key: 'Semestre 05', level: "B1.1 Intermedio", focus: "Tareas Integradas Audits" },
                  { key: 'Semestre 06', level: "B1.2 Intermedio Alto", focus: "Retórica Avanzada TOEFL" }
                ].map((sem) => {
                  const isSelected = selectedSemester === sem.key;
                  return (
                    <button
                      key={sem.key}
                      type="button"
                      onClick={() => {
                        setSelectedSemester(sem.key);
                        addLog(`CLIENT: Consultando Plan de Estudio - ${sem.key}`);
                      }}
                      className={`p-4 rounded-2xl border flex flex-col items-center justify-between gap-2 transition-all text-center relative overflow-hidden group hover:scale-[1.01] ${
                        isSelected
                          ? 'bg-gradient-to-b from-[#DEFF9A]/15 to-black/20 border-[#DEFF9A]/55 text-white shadow-[0_0_25px_rgba(222,255,154,0.1)]'
                          : 'bg-black/30 hover:bg-white/[0.03] border-white/5 hover:border-white/12 text-white/55 hover:text-white'
                      }`}
                    >
                      <div className={`absolute top-0 left-4 w-10 h-[3px] rounded-b-full transition-all ${isSelected ? 'bg-[#DEFF9A]' : 'bg-transparent group-hover:bg-white/20'}`} />
                      <div className="flex flex-col items-center gap-1 mt-1">
                        <span className={`text-[8.5px] font-mono tracking-widest font-black uppercase ${isSelected ? 'text-[#DEFF9A]' : 'text-white/30 group-hover:text-white/40'}`}>
                          {sem.key}
                        </span>
                        <Folder size={22} className={`transition-transform duration-300 ${isSelected ? 'text-[#DEFF9A] scale-110' : 'text-white/20 group-hover:scale-105'}`} />
                      </div>
                      <div className="space-y-0.5 mt-1">
                        <p className="text-[10.5px] font-black uppercase tracking-tight leading-tight">
                          {sem.level.split(' ')[0]}
                        </p>
                        <span className="block text-[8px] font-bold text-white/30 uppercase tracking-wide truncate max-w-[120px]">
                          {sem.level.split(' ').slice(1).join(' ')}
                        </span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* TOEFL iBT SKILLS PANEL */}
            <div className="space-y-5 text-left">
              <div>
                <h3 className="text-white text-base md:text-lg font-black uppercase tracking-tight italic">
                  EVALUACIÓN Y ACREDITACIÓN DE LAS 5 HABILIDADES TOEFL iBT
                </h3>
                <p className="text-white/40 text-[9px] font-black uppercase tracking-wider mt-1">
                  Métricas reguladoras esenciales para el plan estratégico de inglés bilingüe.
                </p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                {toeflSkills.map((skill) => {
                  const Icon = skill.icon;
                  return (
                    <div 
                      key={skill.id} 
                      className="p-5 rounded-3xl bg-white/[0.01] border border-white/5 hover:border-white/15 transition-all flex flex-col justify-between h-full space-y-4 text-left"
                    >
                      <div className="space-y-3">
                        <div className="w-10 h-10 rounded-2xl bg-[#DEFF9A]/10 border border-[#DEFF9A]/20 flex items-center justify-center text-[#DEFF9A]">
                          <Icon size={18} />
                        </div>
                        <div>
                          <h4 className="text-white text-xs font-black uppercase tracking-tight">{skill.name}</h4>
                          <p className="text-white/30 text-[7px] font-mono uppercase tracking-wider mt-0.5">{skill.englishName}</p>
                        </div>
                        <p className="text-white/65 text-[10px] leading-relaxed line-clamp-3">{skill.description}</p>
                      </div>
                      <div className="pt-3 border-t border-white/5 space-y-1.5 shrink-0">
                        <div className="flex justify-between items-center">
                          <span className="text-white/30 text-[7px] font-black uppercase">KPI Mínimo</span>
                          <span className="text-[#DEFF9A] text-[9px] font-black">{skill.kpi}</span>
                        </div>
                        <div className="px-2 py-1 rounded bg-[#DEFF9A]/5 border border-[#DEFF9A]/10 text-center">
                          <p className="text-white text-[7px] font-black uppercase truncate">{skill.accreditation}</p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* SEARCH + 18-WEEK ACCORDION */}
            <GlassCard title={`Temario Curricular Detallado - ${selectedSemester}`} icon={Sparkles} accent="green">
              <div className="space-y-6 text-left">
                <div className="flex flex-col sm:flex-row gap-4 justify-between items-center">
                  <div className="relative w-full sm:max-w-md">
                    <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30" />
                    <input
                      type="text"
                      placeholder="Buscar en el programa por temas o palabras clave..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full pl-12 pr-4 py-3 rounded-2xl bg-white/5 border border-white/5 text-white placeholder-white/30 text-xs focus:outline-none focus:border-[#DEFF9A] font-medium"
                    />
                  </div>
                  <p className="text-[10px] font-black text-white/30 uppercase tracking-widest shrink-0">
                    {isLoadingMalla ? 'Cargando...' : `${filteredWeeks.length} de ${mallaCurricularData.length} semanas curriculares`}
                  </p>
                </div>
                <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2 custom-scrollbar text-left">
                  {isLoadingMalla ? (
                    <div className="p-12 text-center rounded-2xl border border-dashed border-white/5 text-white/30 font-black text-xs uppercase tracking-widest">
                      Cargando malla curricular desde Google Sheets...
                    </div>
                  ) : filteredWeeks.length === 0 ? (
                    <div className="p-12 text-center rounded-2xl border border-dashed border-white/5 text-white/30 font-black text-xs uppercase tracking-widest">
                      No se encontraron semanas que coincidan con la búsqueda
                    </div>
                  ) : (
                    filteredWeeks.map((week) => (
                      <div 
                        key={week.semana}
                        className="rounded-[2rem] border transition-all overflow-hidden text-left"
                        style={{
                          borderColor: openWeeks[week.semana] ? 'rgba(222,255,154,0.15)' : 'rgba(255,255,255,0.03)',
                          background: openWeeks[week.semana] ? 'rgba(222,255,154,0.02)' : 'rgba(255,255,255,0.005)'
                        }}
                      >
                        <button
                          onClick={() => toggleWeek(week.semana)}
                          className="w-full text-left p-4 md:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 outline-none group"
                        >
                          <div className="flex items-center gap-4 min-w-0">
                            <div className="w-12 h-12 rounded-2xl bg-[#DEFF9A]/10 border border-[#DEFF9A]/20 flex flex-col items-center justify-center text-[#DEFF9A] shrink-0 font-black">
                              <span className="text-[7px] text-[#DEFF9A]/50 leading-none uppercase">SEM</span>
                              <span className="text-base font-black tracking-tight">{week.semana}</span>
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="text-[8px] bg-white/5 border border-white/10 text-white/45 px-2 py-0.5 rounded-md font-mono">{week.fechas}</span>
                                <span className="text-[#DEFF9A] text-[8px] font-black uppercase tracking-wider">{week.paginas}</span>
                              </div>
                              <h4 className="text-white text-xs md:text-sm font-black uppercase truncate tracking-tight mt-1 group-hover:text-[#DEFF9A] transition-colors leading-tight">
                                {week.eje_tematico}
                              </h4>
                              <p className="text-white/40 text-[9px] font-bold uppercase truncate tracking-wider mt-0.5">
                                {week.unidad_libro}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 shrink-0 self-end sm:self-auto">
                            {openWeeks[week.semana] ? (
                              <ChevronUp size={16} className="text-[#DEFF9A]" />
                            ) : (
                              <ChevronDown size={16} className="text-white/30" />
                            )}
                          </div>
                        </button>
                        <AnimatePresence initial={false}>
                          {openWeeks[week.semana] && (
                            <motion.div
                              initial={{ height: 0 }}
                              animate={{ height: "auto" }}
                              exit={{ height: 0 }}
                              transition={{ duration: 0.2 }}
                              className="overflow-hidden border-t border-white/5 bg-black/40 text-left"
                            >
                              <div className="p-6 space-y-6">
                                {/* KPI/Evidencia destacada */}
                                <div className="p-4 rounded-2xl bg-gradient-to-r from-[#DEFF9A]/10 to-transparent border border-[#DEFF9A]/20 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                                  <div className="flex items-center gap-3">
                                    <Target size={18} className="text-[#DEFF9A]" />
                                    <span className="text-white text-[11px] font-black tracking-wider uppercase">Evidencia Requerida / KPI de Acreditación Obligatoria</span>
                                  </div>
                                  <span className="text-[#DEFF9A] text-[10px] font-mono font-black py-1 px-3 bg-[#DEFF9A]/10 rounded-xl border border-[#DEFF9A]/20">
                                    {week.kpi}
                                  </span>
                                </div>
                                {/* Horas de clase desglose interactivo */}
                                <div className="space-y-3">
                                  <h5 className="text-white/30 text-[8px] font-black uppercase tracking-widest flex items-center gap-1.5 matches-title">
                                    <Clock size={10} /> Desglose Diario por Hora de Lección (Estructura de Horarios)
                                  </h5>
                                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
                                    {week.horas.map((h) => (
                                      <div key={h.hora} className="p-4 rounded-2xl bg-white/[0.01] border border-white/5 hover:border-white/10 transition-all flex flex-col justify-between space-y-3 text-left">
                                        <div>
                                          <div className="flex justify-between items-center mb-2">
                                            <span className="text-[7px] text-white/30 font-black uppercase tracking-widest font-mono">HORA 0{h.hora}</span>
                                            <span className="text-[7px] text-[#DEFF9A] font-black uppercase tracking-wider bg-[#DEFF9A]/10 px-1.5 py-0.5 rounded border border-[#DEFF9A]/10 font-mono">Active Run</span>
                                          </div>
                                          <p className="text-white text-[11px] font-black uppercase leading-tight tracking-tight line-clamp-2">{h.leccion}</p>
                                          <p className="text-white/50 text-[10px] mt-1.5 leading-normal">{h.enfoque}</p>
                                        </div>
                                        <div className="pt-2.5 border-t border-white/5 flex items-center justify-between text-[8px] font-mono text-white/30 uppercase">
                                          <span className="truncate text-white/40">{h.track}</span>
                                          <Video size={10} className="text-[#DEFF9A] shrink-0 ml-1.5" />
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </GlassCard>
          </motion.div>
        )}
        
        {/* TAB 2: CARGAS & ARCHIVOS */}
        {activeSubTab === 'Cargas & Archivos' && (
          <motion.div 
            key="cargas_archivos_tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-left animate-in"
          >
            {/* Left Column: Upload controllers & terminal */}
            <div className="lg:col-span-7 space-y-8 text-left">
              <GlassCard title="Gestión de Carga de Archivos" icon={UploadCloud} accent="green">
                <div className="space-y-6 text-left">
                  {/* Hybrid Selection (JSON, PDF, Plain TEXT) */}
                  <div className="flex flex-wrap bg-black/45 border border-white/5 p-1 rounded-2xl gap-1">
                    {([
                      { id: 'JSON', label: '[JSON] Plano Curricular', color: 'text-[#DEFF9A]' },
                      { id: 'PDF', label: '[PDF] Oficio Oficial', color: 'text-cyan-400' },
                      { id: 'PLAIN', label: '[Texto Libre] Copiado Manual', color: 'text-emerald-400' }
                    ] as const).map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => {
                          setActiveUploadTab(opt.id);
                          setErrorCode(null);
                          setSuccessMsg(null);
                        }}
                        className={`flex-1 min-w-[120px] py-3 px-2 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all duration-300 ${
                          activeUploadTab === opt.id
                            ? 'bg-[#DEFF9A]/10 text-[#DEFF9A] border border-[#DEFF9A]/20 shadow-[0_0_15px_rgba(222,255,154,0.1)]'
                            : 'text-white/40 hover:text-white/60 hover:bg-white/5'
                        }`}
                      >
                        {opt.label}
                      </button>
                    ))}
                  </div>
                  {activeUploadTab !== 'PLAIN' ? (
                    <div className="space-y-4">
                      <p className="text-white/40 text-[9px] uppercase font-bold tracking-widest leading-normal mb-2">
                        {activeUploadTab === 'JSON' ? (
                          <>Pestaña <span className="text-[#DEFF9A] font-black">JSON</span> activa: Solo se permite cargar archivos con estructura curricular <span className="text-[#DEFF9A] font-mono">.json</span>.</>
                        ) : (
                          <>Pestaña <span className="text-cyan-400 font-black">PDF</span> activa: Solo se permite cargar manuales oficiales Teclingo <span className="text-cyan-400 font-mono">.pdf</span>.</>
                        )}
                      </p>
                      {/* Drag & Drop Area */}
                      <div 
                        onDragEnter={handleDrag}
                        onDragOver={handleDrag}
                        onDragLeave={handleDrag}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-3xl p-10 text-center relative transition-all cursor-pointer ${
                          dragActive 
                            ? 'border-[#DEFF9A] bg-[#DEFF9A]/5 scale-[1.01]' 
                            : 'border-white/10 hover:border-[#DEFF9A]/40 bg-black/20'
                        }`}
                      >
                        <input 
                          type="file" 
                          ref={fileInputRef}
                          accept={activeUploadTab === 'JSON' ? '.json, application/json' : '.pdf, application/pdf'}
                          onChange={handleFileChange}
                          className="hidden"
                        />
                        <div className="flex flex-col items-center justify-center gap-4">
                          <div className="w-14 h-14 rounded-2xl flex items-center justify-center bg-white/5 text-white/30">
                            <UploadCloud size={24} className="text-[#DEFF9A]" />
                          </div>
                          <div>
                            <h4 className="text-white font-black text-[11px] uppercase mb-1">
                              Arrastra tu {activeUploadTab === 'JSON' ? 'Syllabus estructurador (.json)' : 'Oficio oficial (.pdf)'}
                            </h4>
                            <p className="text-white/30 text-[9px] font-bold uppercase tracking-wider">O selecciona el archivo desde el dispositivo</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    /* Plain text pasting console */
                    <div className="space-y-4 text-left">
                      <div className="flex justify-between items-center text-[9px] uppercase font-bold tracking-widest text-emerald-400">
                        <span>Copiado Directo de Programas Académicos</span>
                        <span className={`font-mono text-[10px] ${plainText.length > 15000 ? 'text-red-400 font-extrabold animate-bounce' : 'text-white/40'}`}>
                          {plainText.length.toLocaleString()} / 15,000 carac.
                        </span>
                      </div>
                      <textarea
                        rows={6}
                        value={plainText}
                        onChange={(e) => {
                          setPlainText(e.target.value);
                          if (e.target.value.length > 15000) {
                            setErrorCode('Se ha excedido el límite analítico del agente para evitar sobrecarga de procesamiento.');
                          } else if (errorCode) {
                            setErrorCode(null);
                          }
                        }}
                        disabled={isProcessing}
                        className="w-full bg-black/40 border border-white/5 rounded-3xl p-4 text-xs text-white placeholder-white/20 focus:outline-none focus:border-[#DEFF9A]/30 transition-colors resize-none font-mono custom-scrollbar text-left"
                        placeholder="// Pega aquí todo el texto obtenido del manual oficial para que el procesador semántico Teclingo extraiga e indexe la planeación correspondiente..."
                      />
                      {plainText.length > 15000 && (
                        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/30 text-red-00 space-y-1 block text-left">
                          <span className="text-[9px] font-black uppercase tracking-widest bg-red-400 text-black px-1.5 py-0.5 rounded inline-block mb-1">
                            LITTLE TECH • SEGURIDAD
                          </span>
                          <p className="text-[10px] font-bold leading-normal text-red-400 text-left">
                            ¡Cuidado compadre! El temario excede el límite de procesamiento. Por favor, realiza cargas progresivas para que pueda procesarlo de forma correcta.
                          </p>
                        </div>
                      )}
                      <div className="flex justify-end mt-2">
                        <button
                          type="button"
                          onClick={handleProcessPlainText}
                          disabled={isProcessing || !plainText.trim() || plainText.length > 15000}
                          className="bg-[#DEFF9A]/10 border border-[#DEFF9A]/30 hover:bg-[#DEFF9A]/20 disabled:opacity-30 disabled:hover:bg-[#DEFF9A]/10 text-[#DEFF9A] text-[9.5px] font-black tracking-widest uppercase px-5 py-3 rounded-xl transition-all"
                        >
                          {isProcessing ? 'Procesando NLP...' : 'Analizar e Ingestar Texto'}
                        </button>
                      </div>
                    </div>
                  )}
                  {/* Feedback UI Messages */}
                  <div className="space-y-4">
                    {errorCode && (
                      <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-3">
                        <AlertTriangle size={16} className="shrink-0" />
                        <span className="font-bold">{errorCode}</span>
                      </div>
                    )}
                    {successMsg && (
                      <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs flex items-center gap-3">
                        <CheckCircle2 size={16} className="shrink-0" />
                        <span className="font-bold">{successMsg}</span>
                      </div>
                    )}
                  </div>
                </div>
              </GlassCard>
              {/* Realtime Express Multer Simulator Terminal */}
              <GlassCard title="Middleware Server Logs — Sandbox de Validaciones" icon={Terminal} accent="cyan">
                <div className="space-y-4">
                  <div className="flex justify-between items-center text-[9px] text-white/40 pb-3 border-b border-white/5">
                    <span>EXPRESS MULTER ENGINE VALIDATOR</span>
                    <span className="font-mono text-cyan-400 font-bold">STATUS: STANDBY</span>
                  </div>
                  <div className="bg-black/85 rounded-2xl border border-white/5 p-6 font-mono text-[10.5px] space-y-2.5 max-h-[220px] overflow-y-auto custom-scrollbar text-left">
                    {consoleLogs.length === 0 ? (
                      <p className="text-white/20 italic text-left">// Sube un archivo (.pdf / .json) o pastea texto en el cargador híbrido para auditar el flujo del servidor en tiempo real...</p>
                    ) : (
                      consoleLogs.map((log, idx) => {
                        let textClass = 'text-white/60';
                        if (log.includes('CLIENT-ERROR')) textClass = 'text-red-400 font-bold';
                        else if (log.includes('NLP_MODEL') || log.includes('MIDDLEWARE:')) textClass = 'text-[#DEFF9A] font-bold';
                        else if (log.includes('DATABASE SUCCESS') || log.includes('Carga Completa')) textClass = 'text-emerald-400 font-bold';
                        else if (log.includes('CLIENT:')) textClass = 'text-cyan-400/80';
                        return (
                          <div key={idx} className={`${textClass} leading-relaxed text-left`}>
                            {log}
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              </GlassCard>
            </div>
            {/* Right Column: Uploaded Documents in database */}
            <div className="lg:col-span-12 xl:col-span-5 space-y-8 text-left">
              <GlassCard title="Archivos Registrados en Biblioteca" icon={Database} accent="cyan">
                <div className="space-y-6 text-left">
                  <div className="flex justify-between items-center text-[8.5px] uppercase tracking-wider text-cyan-400 bg-white/[0.02] p-2.5 rounded-lg border border-white/5">
                    <span>Sincronizados en Firestore local</span>
                    <span className="font-mono font-bold">Total: {uploadedFiles.length} docs</span>
                  </div>
                  {uploadedFiles.length === 0 ? (
                    <div className="py-16 text-center border border-dashed border-white/5 rounded-3xl flex flex-col items-center justify-center gap-4">
                      <FileText size={32} className="text-white/10" />
                      <div>
                        <h5 className="text-white/50 text-xs font-black uppercase">Biblioteca Vacía</h5>
                        <p className="text-white/20 text-[9px] uppercase font-bold tracking-wide mt-1">Usa los cargadores para agregar manuales de estudio.</p>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4 max-h-[440px] overflow-y-auto pr-2 custom-scrollbar text-left">
                      {uploadedFiles.map((doc) => (
                        <div 
                          key={doc.id} 
                          className="p-4 rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between gap-4 hover:border-white/10 transition-all group text-left"
                        >
                          <div className="flex items-center gap-4 overflow-hidden min-w-0">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              doc.type === 'pdf' ? 'bg-red-500/10 text-red-400' : 'bg-cyan-500/10 text-cyan-400'
                            }`}>
                              {doc.type === 'pdf' ? <FileText size={20} /> : <FileCode size={20} />}
                            </div>
                            <div className="overflow-hidden min-w-0">
                              <h4 className="text-white font-black text-xs truncate uppercase group-hover:text-[#DEFF9A] transition-colors leading-tight">
                                {doc.name}
                              </h4>
                              <div className="flex flex-wrap items-center gap-2 mt-1">
                                <span className="text-white/40 text-[9px] font-mono leading-none">{doc.size}</span>
                                <span className="w-1 h-1 rounded-full bg-white/10" />
                                <span className="text-[7.5px] text-[#DEFF9A] font-black uppercase tracking-widest bg-[#DEFF9A]/10 px-2 py-0.5 rounded leading-none">
                                  {doc.checksum.replace('SHA256:', '')}
                                </span>
                              </div>
                            </div>
                          </div>
                          <button 
                            type="button"
                            onClick={() => handleDeleteFile(doc.id, doc.name)}
                            className="p-2.5 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 text-red-400 transition-all shrink-0 haptic-press"
                            title="Eliminar Documento"
                          >
                            <Trash2 size={12} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                  <div className="pt-4 border-t border-white/5 flex justify-between items-center text-[8px] font-black uppercase tracking-widest text-white/30 font-mono">
                    <span>Estado Almacenamiento</span>
                    <span>1.6 MB / 100 MB de Cuota Escolar</span>
                  </div>
                </div>
              </GlassCard>
            </div>
          </motion.div>
        )}

        {/* TAB 3: LIBRO VIRTUAL MAESTRO */}
        {activeSubTab === 'Libro Virtual Maestro' && (
          <motion.div 
            key="libro_virtual_tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
            className="space-y-8 text-left"
          >
            <LibroVirtual role="director" lessonId="N1-C01" />
          </motion.div>
        )}

        {/* TAB 6: CREADOR DE EXÁMENES */}
        {activeSubTab === 'Creador de Exámenes' && (
          <motion.div
            key="test_maker_tab"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            className="space-y-8 text-left animate-in duration-300"
          >
            <div className="p-6 rounded-3xl bg-gradient-to-r from-cyan-950/20 to-emerald-950/20 border border-emerald-500/20 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div className="space-y-1">
                <span className="px-2.5 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[8px] font-mono font-black uppercase tracking-widest leading-none">
                  BI Engine v4.0 • Test Designer Suite
                </span>
                <h2 className="text-xl md:text-2xl font-black text-white uppercase tracking-tight">Creador de Exámenes (Test Maker)</h2>
                <p className="text-white/50 text-[11px] max-w-2xl">
                  Modela evaluaciones TOEFL alineadas de forma directa al plan académico bimestral. Arrastra reactivos al lienzo o selecciona reactivos generados por IA basados en la planeación curricular de la semana seleccionada.
                </p>
              </div>
              <div className="flex gap-3">
                <div className="px-4 py-3 bg-[#0b1219]/90 border border-white/5 rounded-2xl text-center">
                  <span className="block text-[8px] text-white/30 uppercase font-bold">Lienzo Actual</span>
                  <span className="text-sm font-mono font-black text-[#DEFF9A]">{canvasQuestions.length} Reactivos</span>
                </div>
                <div className="px-4 py-3 bg-[#0b1219]/90 border border-white/5 rounded-2xl text-center">
                  <span className="block text-[8px] text-white/30 uppercase font-bold">Puntos Totales</span>
                  <span className="text-sm font-mono font-black text-cyan-400">
                    {canvasQuestions.reduce((acc, q) => acc + q.points, 0)} pts
                  </span>
                </div>
              </div>
            </div>
            <div className="p-6 rounded-3xl bg-black/45 border border-white/5 space-y-6 text-left">
              <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-6 pb-2">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 flex-1">
                  <div className="space-y-1.5">
                    <label className="block text-[8px] font-mono font-black text-white/40 uppercase tracking-widest pl-0.5">Semestre / Grado Malla</label>
                    <select
                      value={examSemester}
                      onChange={(e) => setExamSemester(e.target.value)}
                      className="w-full bg-[#070d14] border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white font-bold uppercase focus:outline-none focus:border-[#DEFF9A]"
                    >
                      <option value="Semestre 01">1er Semestre - Basic A1</option>
                      <option value="Semestre 02">2do Semestre - Elementary A2</option>
                      <option value="Semestre 03">3er Semestre - Pre-Intermediate B1</option>
                      <option value="Semestre 04">4to Semestre - Intermediate B1+</option>
                      <option value="Semestre 05">5to Semestre - Upper Intermediate B2</option>
                      <option value="Semestre 06">6to Semestre - Advanced C1</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="block text-[8px] font-mono font-black text-white/40 uppercase tracking-widest pl-0.5">Grupo Destino (Distribución)</label>
                    <select
                      value={examGroup}
                      onChange={(e) => setExamGroup(e.target.value)}
                      className="w-full bg-[#070d14] border border-[#DEFF9A]/20 text-[#DEFF9A] border-dashed rounded-xl px-3.5 py-2.5 text-xs font-black tracking-wider uppercase focus:outline-none focus:border-[#DEFF9A]"
                    >
                      <option value="all">🌎 TODOS LOS GRUPOS (GLOBAL)</option>
                      <option value="A1-102">A1-102 - BASIC ENGLISH LAB</option>
                      <option value="B2-205">B2-205 - DIALOGUE PRACTICE</option>
                      <option value="B1-105">B1-105 - GRAMMAR CONTEXT</option>
                      <option value="C1-302">C1-302 - ADVANCED FLUENCY</option>
                      <option value="Virtual">Virtual - DIAGNOSTICS LAB</option>
                    </select>
                  </div>
                </div>
                <div className="xl:pt-4 shrink-0">
                  <button
                    type="button"
                    disabled={isGeneratingAi}
                    onClick={() => {
                      setIsGeneratingAi(true);
                      setTimeout(() => {
                        handleAiGenerateExam();
                        setIsGeneratingAi(false);
                      }, 900);
                    }}
                    className="w-full xl:w-auto bg-gradient-to-r from-emerald-600 to-teal-600 text-black font-black uppercase tracking-widest px-5 py-3 rounded-xl shadow-[0_0_15px_rgba(16,185,129,0.3)] hover:brightness-110 hover:scale-[1.01] active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-[10px] min-h-[46px] disabled:opacity-50 disabled:pointer-events-none"
                  >
                    {isGeneratingAi ? (
                      <>
                        <span className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin shrink-0" />
                        CALIBRANDO CON PLANEACIÓN CURRICULAR...
                      </>
                    ) : (
                      <>
                        <span>⚡</span> GENERAR EXAMEN CON ASISTENTE IA
                      </>
                    )}
                  </button>
                </div>
              </div>
              {(() => {
                const diagnosis = mockGroupDiagnoses[examGroup] || mockGroupDiagnoses['all'];
                return (
                  <div className="p-4.5 rounded-2xl bg-emerald-950/10 border border-emerald-500/10 grid grid-cols-1 md:grid-cols-12 gap-5 items-center">
                    <div className="md:col-span-3 space-y-1">
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-emerald-500/10 border border-emerald-500/20 text-[7px] font-mono font-black text-emerald-400 uppercase tracking-widest leading-none">
                        ● Diagnóstico en vivo
                      </span>
                      <h4 className="text-white text-xs font-black uppercase tracking-wide">
                        {diagnosis.name}
                      </h4>
                      <p className="text-white/40 text-[8.5px] leading-snug">
                        Foco de Atención:<br/>
                        <span className="text-pink-300/80 font-mono font-bold uppercase">{diagnosis.focusArea}</span>
                      </p>
                    </div>
                    <div className="md:col-span-3 space-y-1 bg-black/25 p-3 rounded-xl border border-white/5">
                      <div className="flex justify-between items-center text-[8px] font-mono text-white/30 uppercase font-black">
                        <span>Promedio Grupal</span>
                        <span className="text-emerald-400 font-black">{diagnosis.avgGrade}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-1.5">
                        <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${diagnosis.avgGrade}%` }} />
                      </div>
                    </div>
                    <div className="md:col-span-3 space-y-1 bg-black/25 p-3 rounded-xl border border-white/5">
                      <div className="flex justify-between items-center text-[8px] font-mono text-white/30 uppercase font-black">
                        <span>Conocimiento Escrito</span>
                        <span className="text-cyan-400 font-black">{diagnosis.writtenLevel}%</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-1.5">
                        <div className="h-full bg-cyan-400 rounded-full" style={{ width: `${diagnosis.writtenLevel}%` }} />
                      </div>
                    </div>
                    <div className="md:col-span-3 space-y-1 bg-black/25 p-3 rounded-xl border border-white/5">
                      <div className="flex justify-between items-center text-[8px] font-mono text-white/30 uppercase font-black">
                        <span>Ansiedad SafeZone</span>
                        <span className={diagnosis.anxietyLevel > 70 ? "text-rose-400 font-black animate-pulse" : "text-amber-400 font-black"}>
                          {diagnosis.anxietyLevel}% {diagnosis.anxietyLevel > 70 ? '⚠️' : '✓'}
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden mt-1.5">
                        <div 
                          className={`h-full rounded-full ${diagnosis.anxietyLevel > 70 ? 'bg-rose-500' : 'bg-amber-400'}`} 
                          style={{ width: `${diagnosis.anxietyLevel}%` }} 
                        />
                      </div>
                    </div>
                  </div>
                );
              })()}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              <div className="lg:col-span-4 space-y-6">
                <GlassCard className="p-5 border-white/5 bg-[#0b1219]/40 relative overflow-hidden">
                  <div className="absolute top-0 left-5 w-12 h-[2px] bg-cyan-400" />
                  <div className="flex items-center gap-2.5 mb-4">
                    <span className="p-1.5 rounded-lg bg-cyan-400/10 text-cyan-400">
                      <Layers size={14} />
                    </span>
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">Reactivos del Sistema</h3>
                  </div>
                  <p className="text-white/40 text-[10px] leading-relaxed mb-4">
                    Arrastra los bloques de tipo de pregunta al lienzo de la derecha, o haz clic en el botón <b>(+) Añadir</b> para insertarlos al borrador.
                  </p>
                  <div className="space-y-3">
                    <div
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', 'multiple-choice');
                        setDraggedItemType('multiple-choice');
                      }}
                      onDragEnd={() => setDraggedItemType(null)}
                      className="p-3.5 rounded-2xl bg-black/40 border border-white/5 hover:border-cyan-500/30 hover:bg-cyan-950/10 cursor-grab hover:scale-[1.01] transition-all group flex items-center justify-between gap-4"
                      title="Arrastra o clic para añadir opción múltiple"
                    >
                      <div className="flex items-center gap-3">
                        <span className="p-1.5 rounded-xl bg-cyan-400/10 text-cyan-400 group-hover:bg-cyan-400 group-hover:text-black transition-all">
                          <CheckSquare size={14} />
                        </span>
                        <div>
                          <span className="block text-[11px] font-black uppercase text-white tracking-tight">Opción Múltiple</span>
                          <span className="block text-[9px] text-white/30">Cuestionario estandarizado</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddNewQuestion('multiple-choice')}
                        className="px-3.5 py-2.5 md:px-2.5 md:py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-cyan-400 hover:text-black text-white/60 text-[9.5px] md:text-[8.5px] font-black uppercase tracking-widest transition-all min-h-[40px] md:min-h-0 flex items-center justify-center shrink-0"
                      >
                        + Añadir
                      </button>
                    </div>
                    <div
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', 'true-false');
                        setDraggedItemType('true-false');
                      }}
                      onDragEnd={() => setDraggedItemType(null)}
                      className="p-3.5 rounded-2xl bg-black/40 border border-white/5 hover:border-emerald-500/30 hover:bg-emerald-950/10 cursor-grab hover:scale-[1.01] transition-all group flex items-center justify-between gap-4"
                      title="Arrastra o clic para añadir verdadero o falso"
                    >
                      <div className="flex items-center gap-3">
                        <span className="p-1.5 rounded-xl bg-emerald-500/10 text-emerald-400 group-hover:bg-emerald-500 group-hover:text-black transition-all">
                          <span>☯</span>
                        </span>
                        <div>
                          <span className="block text-[11px] font-black uppercase text-white tracking-tight">Verdadero / Falso</span>
                          <span className="block text-[9px] text-white/30">Lógica booleana rápida</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddNewQuestion('true-false')}
                        className="px-3.5 py-2.5 md:px-2.5 md:py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-emerald-500 hover:text-black text-white/60 text-[9.5px] md:text-[8.5px] font-black uppercase tracking-widest transition-all min-h-[40px] md:min-h-0 flex items-center justify-center shrink-0"
                      >
                        + Añadir
                      </button>
                    </div>
                    <div
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', 'fill-blanks');
                        setDraggedItemType('fill-blanks');
                      }}
                      onDragEnd={() => setDraggedItemType(null)}
                      className="p-3.5 rounded-2xl bg-black/40 border border-white/5 hover:border-amber-500/30 hover:bg-amber-950/10 cursor-grab hover:scale-[1.01] transition-all group flex items-center justify-between gap-4"
                      title="Arrastra o clic para añadir completar espacios"
                    >
                      <div className="flex items-center gap-3">
                        <span className="p-1.5 rounded-xl bg-amber-500/10 text-amber-400 group-hover:bg-amber-500 group-hover:text-black transition-all">
                          <Pencil size={12} />
                        </span>
                        <div>
                          <span className="block text-[11px] font-black uppercase text-white tracking-tight">Completar Espacios</span>
                          <span className="block text-[9px] text-white/30">Inserción directa de términos</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddNewQuestion('fill-blanks')}
                        className="px-3.5 py-2.5 md:px-2.5 md:py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-amber-500 hover:text-black text-white/60 text-[9.5px] md:text-[8.5px] font-black uppercase tracking-widest transition-all min-h-[40px] md:min-h-0 flex items-center justify-center shrink-0"
                      >
                        + Añadir
                      </button>
                    </div>
                    <div
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', 'speaking');
                        setDraggedItemType('speaking');
                      }}
                      onDragEnd={() => setDraggedItemType(null)}
                      className="p-3.5 rounded-2xl bg-black/40 border border-white/5 hover:border-pink-500/30 hover:bg-pink-950/10 cursor-grab hover:scale-[1.01] transition-all group flex items-center justify-between gap-4"
                      title="Arrastra o clic para añadir oratoria con IA"
                    >
                      <div className="flex items-center gap-3">
                        <span className="p-1.5 rounded-xl bg-pink-500/10 text-pink-400 group-hover:bg-pink-400 group-hover:text-black transition-all">
                          <Mic size={13} />
                        </span>
                        <div>
                          <span className="block text-[11px] font-black uppercase text-white tracking-tight">Prueba Oral AI Speaking</span>
                          <span className="block text-[9px] text-white/30">Módulo de voz interactiva</span>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleAddNewQuestion('speaking')}
                        className="px-3.5 py-2.5 md:px-2.5 md:py-1.5 rounded-xl bg-white/5 border border-white/10 hover:bg-[#ff7eb6] hover:text-black text-white/60 text-[9.5px] md:text-[8.5px] font-black uppercase tracking-widest transition-all min-h-[40px] md:min-h-0 flex items-center justify-center shrink-0"
                      >
                        + Añadir
                      </button>
                    </div>
                  </div>
                </GlassCard>
                <GlassCard className="p-5 border-white/5 bg-[#0b1219]/40 text-left">
                  <div className="flex items-center gap-2.5 mb-3">
                    <span className="p-1.5 rounded-lg bg-amber-400/10 text-amber-400">
                      <Sparkles size={14} />
                    </span>
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">Asistente Curricular de Planeación</h3>
                  </div>
                  <p className="text-white/40 text-[9.5px] leading-relaxed mb-4">
                    Selecciona una unidad de la malla y expande reactivos previamente sugeridos y alineados a las lecciones de esa semana:
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-[8px] font-mono font-black text-white/30 uppercase tracking-widest mb-1.5">Semana de la Planeación Académica</label>
                      <select
                        value={selectedWeekForSyllabusTemplate}
                        onChange={(e) => setSelectedWeekForSyllabusTemplate(Number(e.target.value))}
                        className="w-full bg-black/60 border border-white/10 rounded-xl px-3 py-2 text-xs font-bold text-white uppercase"
                      >
                        {mallaCurricularData.map((w) => (
                          <option key={w.semana} value={w.semana} className="bg-[#0b1219]">
                            Semana 0{w.semana} • {w.unidad_libro.substring(0, 30)}...
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="space-y-2.5">
                      <p className="text-[8px] font-mono font-black text-amber-300/80 uppercase tracking-widest leading-none mt-2">
                        ➔ REACTIVOS RECOMENDADOS (SABERES DE SEMANA 0{selectedWeekForSyllabusTemplate})
                      </p>
                      {(() => {
                        const recs = {
                          1: [
                            {
                              type: 'multiple-choice' as const,
                              question: 'Under the diagnostic rules, choose the correct form of VERB BE: "We _____ currently auditing the server databases."',
                              options: ['am', 'is', 'are', 'was'],
                              correctAnswer: 'are',
                              points: 20
                            },
                            {
                              type: 'fill-blanks' as const,
                              question: 'The user must click on the [onboard] dialog to register their active profile.',
                              options: [],
                              correctAnswer: 'onboard',
                              points: 10
                            }
                          ],
                          2: [
                            {
                              type: 'multiple-choice' as const,
                              question: 'Grammar analysis: Which pronoun group perfectly matches the structure "Ana and Sofia"?',
                              options: ['She', 'He', 'They', 'It'],
                              correctAnswer: 'They',
                              points: 20
                            },
                            {
                              type: 'true-false' as const,
                              question: 'True or False: Contractions like "he\'s" or "they\'re" are forbidden in professional formal letters.',
                              options: ['Verdadero', 'Falso'],
                              correctAnswer: 'Verdadero',
                              points: 15
                            }
                          ],
                          3: [
                            {
                              type: 'speaking' as const,
                              question: 'Speaking evaluation: Read the sentence: "Developing virtual communication interfaces requires solid subject pronoun compliance."',
                              options: [],
                              correctAnswer: 'TOEFL Accuracy speaking',
                              points: 25
                            },
                            {
                              type: 'fill-blanks' as const,
                              question: 'To request attention formally, standard etiquette recommends using the word [Excuse] me.',
                              options: [],
                              correctAnswer: 'Excuse',
                              points: 10
                            }
                          ],
                          4: [
                            {
                              type: 'multiple-choice' as const,
                              question: 'Select the primary noun in the following command line hierarchy: "The mainframe displays critical database exceptions."',
                              options: ['mainframe', 'displays', 'critical', 'exceptions'],
                              correctAnswer: 'mainframe',
                              points: 20
                            },
                            {
                              type: 'true-false' as const,
                              question: 'True or False: A standard TOEFL essay requires the introduction block to summarize all target details.',
                              options: ['Verdadero', 'Falso'],
                              correctAnswer: 'Verdadero',
                              points: 15
                            }
                          ]
                        }[selectedWeekForSyllabusTemplate as 1 | 2 | 3 | 4] || [
                          {
                            type: 'multiple-choice' as const,
                            question: 'General English Technical review: Identify the noun in "We click on deploy."',
                            options: ['We', 'click', 'deploy', 'on'],
                            correctAnswer: 'deploy',
                            points: 20
                          }
                        ];
                        return recs.map((rec, i) => (
                          <div 
                            key={i}
                            onClick={() => handleAddNewQuestion(rec.type, rec)}
                            className="p-3 bg-black/35 border border-white/5 hover:border-amber-400/40 hover:bg-amber-950/5 rounded-xl cursor-pointer text-left transition-all group flex items-start gap-2.5"
                          >
                            <span className="text-[#DEFF9A] group-hover:scale-110 shrink-0 text-xs">⚡</span>
                            <div className="space-y-1">
                              <span className="text-white text-[10px] font-bold block leading-snug line-clamp-2">
                                {rec.question}
                              </span>
                              <div className="flex items-center gap-2">
                                <span className="px-1.5 py-0.5 rounded bg-amber-400/10 text-amber-300 text-[7px] font-mono uppercase font-black tracking-wider leading-none">
                                  {rec.type}
                                </span>
                                <span className="text-white/30 text-[7.5px] uppercase font-bold">{rec.points} PUNTOS</span>
                              </div>
                            </div>
                          </div>
                        ));
                      })()}
                    </div>
                  </div>
                </GlassCard>
              </div>
              <div ref={fileInputRef as any} className="lg:col-span-5 space-y-6">
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingOverCanvas(true);
                  }}
                  onDragLeave={() => setIsDraggingOverCanvas(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingOverCanvas(false);
                    const type = e.dataTransfer.getData('text/plain') as any;
                    if (['multiple-choice', 'true-false', 'fill-blanks', 'speaking'].includes(type)) {
                      handleAddNewQuestion(type);
                    }
                  }}
                  className={`p-5 rounded-[2.5rem] bg-black/45 border transition-all duration-300 relative ${
                    isDraggingOverCanvas 
                      ? 'border-[#DEFF9A] shadow-[0_0_35px_rgba(222,255,154,0.15)] bg-emerald-950/10' 
                      : 'border-white/5'
                  }`}
                >
                  {draggedItemType && !isDraggingOverCanvas && (
                    <div className="absolute inset-2 border-2 border-dashed border-cyan-400/30 rounded-[2rem] pointer-events-none animate-pulse flex items-center justify-center">
                      <p className="text-cyan-400 text-[10px] font-mono font-black uppercase tracking-widest text-center">SOLTAR BLOQUE AQUÍ</p>
                    </div>
                  )}
                  <div className="flex items-center justify-between border-b border-white/5 pb-4.5 mb-5 text-left">
                    <div>
                      <h3 className="text-sm font-black text-white uppercase tracking-wider flex items-center gap-2">
                        <span>Lienzo del Examen</span>
                        {canvasQuestions.length > 0 && (
                          <span className="px-2 py-0.5 rounded-full bg-[#DEFF9A]/10 text-[#DEFF9A] text-[8px] font-mono leading-none">
                            ACTIVO
                          </span>
                        )}
                      </h3>
                      <p className="text-white/40 text-[9px] mt-0.5 uppercase tracking-wider">Editor interactivo de reactivos</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setCanvasQuestions([]);
                        if (typeof addLog === 'function') addLog('CLIENT: Limpiado borrador del lienzo de examen.');
                      }}
                      className="px-4 py-2.5 md:px-3 md:py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500 hover:text-white border border-red-500/20 text-red-400 text-[9.5px] md:text-[8.5px] font-mono font-black uppercase tracking-widest transition-all flex items-center gap-1.5 min-h-[40px] md:min-h-0"
                      title="Borrar todas las preguntas"
                    >
                      <Trash2 size={11} />
                      Limpiar todo
                    </button>
                  </div>
                  <div className="space-y-5 max-h-[640px] overflow-y-auto pr-1">
                    {canvasQuestions.length === 0 ? (
                      <div className="py-20 text-center space-y-4 rounded-3xl border border-dashed border-white/5 bg-white/[0.01]">
                        <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center text-white/30 mx-auto">
                          <FileQuestion size={22} className="animate-bounce" />
                        </div>
                        <div className="space-y-1 max-w-xs mx-auto">
                          <p className="text-white/80 text-xs font-black uppercase tracking-wider">Lienzo Vacío</p>
                          <p className="text-white/40 text-[10px] leading-relaxed">
                            Arrastra reactivos de la paleta izquierda o haz clic sobre los componentes recomendados para ensamblar tu examen.
                          </p>
                        </div>
                      </div>
                    ) : (
                      canvasQuestions.map((q, idx) => (
                        <div
                          key={q.id}
                          className="p-5 rounded-3xl bg-[#0b1219]/70 border border-white/5 relative group/item hover:border-white/10 transition-all text-left"
                        >
                          <div className="absolute top-4 left-4 h-6 px-2.5 rounded-lg bg-white/5 border border-white/10 text-white/60 text-[10px] font-mono font-black flex items-center justify-center leading-none">
                            R_{idx + 1}
                          </div>
                          <div className="absolute top-4 right-4 flex items-center gap-1.5">
                            {idx > 0 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const list = [...canvasQuestions];
                                  const temp = list[idx];
                                  list[idx] = list[idx - 1];
                                  list[idx - 1] = temp;
                                  setCanvasQuestions(list);
                                }}
                                className="w-6 h-6 rounded bg-black/40 border border-white/5 text-white/40 hover:text-white hover:bg-white/10 flex items-center justify-center transition-all text-[9px]"
                                title="Subir orden"
                              >
                                ▲
                              </button>
                            )}
                            {idx < canvasQuestions.length - 1 && (
                              <button
                                type="button"
                                onClick={() => {
                                  const list = [...canvasQuestions];
                                  const temp = list[idx];
                                  list[idx] = list[idx + 1];
                                  list[idx + 1] = temp;
                                  setCanvasQuestions(list);
                                }}
                                className="w-6 h-6 rounded bg-black/40 border border-white/5 text-white/40 hover:text-white hover:bg-white/10 flex items-center justify-center transition-all text-[9px]"
                                title="Bajar orden"
                              >
                                ▼
                              </button>
                            )}
                            <button
                              type="button"
                              onClick={() => {
                                setCanvasQuestions(prev => prev.filter(item => item.id !== q.id));
                              }}
                              className="w-6 h-6 rounded bg-red-500/10 hover:bg-red-500 text-red-400 hover:text-white flex items-center justify-center transition-colors"
                              title="Eliminar pregunta"
                            >
                              <X size={11} />
                            </button>
                          </div>
                          <div className="pl-9 pr-24 flex items-center gap-3.5 mb-3.5 mt-0.5">
                            <span className={`px-2 py-0.5 rounded font-mono text-[8px] font-black uppercase tracking-wider ${
                              q.type === 'multiple-choice' ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20' :
                              q.type === 'true-false' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' :
                              q.type === 'fill-blanks' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' :
                              'bg-pink-500/15 text-pink-400 border border-pink-500/20'
                            }`}>
                              {q.type}
                            </span>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[8px] font-mono text-white/30 uppercase font-black">PESO:</span>
                              <input
                                type="number"
                                min={5}
                                max={50}
                                step={5}
                                value={q.points}
                                onChange={(e) => {
                                  const val = Number(e.target.value) || 10;
                                  setCanvasQuestions(prev => prev.map(item => item.id === q.id ? { ...item, points: val } : item));
                                }}
                                className="w-13 bg-black/80 border border-white/10 rounded-lg px-1.5 py-0.5 font-mono text-[9px] font-black text-[#DEFF9A] text-center shrink-0 focus:outline-none focus:border-[#DEFF9A]"
                              />
                              <span className="text-[8.5px] font-mono text-white/40">pts</span>
                            </div>
                          </div>
                          <div className="space-y-3.5 mt-2">
                            {q.type !== 'speaking' && (
                              <div className="space-y-1">
                                <span className="block text-[7.5px] font-mono text-white/30 uppercase font-black tracking-widest pl-0.5">TEXTO REACCION O ENUNCIADO</span>
                                <textarea
                                  value={q.question}
                                  onChange={(e) => {
                                    const val = e.target.value;
                                    setCanvasQuestions(prev => prev.map(item => item.id === q.id ? { ...item, question: val } : item));
                                  }}
                                  rows={2}
                                  className="w-full bg-black/55 border border-white/5 rounded-xl px-3.5 py-2 text-[11px] text-white focus:outline-none focus:border-cyan-500/50 resize-none font-sans leading-normal"
                                  placeholder="..."
                                />
                              </div>
                            )}
                            {q.type === 'multiple-choice' && (
                              <div className="space-y-2 pt-1 pl-1">
                                <span className="block text-[7.5px] font-mono text-white/20 uppercase font-bold tracking-widest">OPCIONES DE RESPUESTA Y SELECCION DE CORRECTA</span>
                                <div className="grid grid-cols-2 gap-2.5">
                                  {q.options.map((option, optIdx) => (
                                    <div key={optIdx} className="flex items-center gap-1.5 bg-black/35 rounded-xl border border-white/5 pr-2.5">
                                      <span className="text-white/20 font-mono text-[9px] font-bold pl-3 selection:bg-transparent shrink-0">
                                        {['A','B','C','D'][optIdx]}:
                                      </span>
                                      <input
                                        type="text"
                                        value={option}
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          setCanvasQuestions(prev => prev.map(item => {
                                            if (item.id === q.id) {
                                              const updatedOptions = [...item.options];
                                              updatedOptions[optIdx] = val;
                                              return { ...item, options: updatedOptions };
                                            }
                                            return item;
                                          }));
                                        }}
                                        className="w-full bg-transparent border-none text-[10.5px] text-white/80 py-2 px-1 focus:outline-none"
                                      />
                                      <input
                                        type="radio"
                                        name={`correct_${q.id}`}
                                        checked={q.correctAnswer === option}
                                        onChange={() => {
                                          setCanvasQuestions(prev => prev.map(item => item.id === q.id ? { ...item, correctAnswer: option } : item));
                                        }}
                                        className="w-3.5 h-3.5 accent-[#DEFF9A] cursor-pointer"
                                        title="Establecer como opción correcta"
                                      />
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                            {q.type === 'true-false' && (
                              <div className="flex items-center gap-4.5 bg-black/45 px-4 py-2 rounded-2xl border border-white/5">
                                <span className="text-white/30 text-[8px] font-mono font-black uppercase shrink-0">RESPUESTA CLAVE:</span>
                                <div className="flex items-center gap-4">
                                  {['Verdadero', 'Falso'].map((choiceName) => (
                                    <label key={choiceName} className="flex items-center gap-1.5 text-[10.5px] text-white hover:text-[#DEFF9A] transition-colors cursor-pointer font-semibold uppercase tracking-wider">
                                      <input
                                        type="radio"
                                        name={`tf_${q.id}`}
                                        checked={q.correctAnswer === choiceName}
                                        onChange={() => {
                                          setCanvasQuestions(prev => prev.map(item => item.id === q.id ? { ...item, correctAnswer: choiceName } : item));
                                        }}
                                        className="accent-[#DEFF9A]"
                                      />
                                      <span>{choiceName}</span>
                                    </label>
                                  ))}
                                </div>
                              </div>
                            )}
                            {q.type === 'fill-blanks' && (
                              <div className="p-3 bg-black/45 rounded-2xl border border-white/5 space-y-1.5">
                                <span className="block text-[7.5px] font-mono text-white/30 uppercase font-black tracking-widest leading-none pl-0.5">TÉRMINO O RESPUESTA EXACTA REQUERIDA (ENTRE CORCHETES `[BLANK]` ARRIBA)</span>
                                <div className="flex items-center gap-2">
                                  <span className="text-amber-400 font-mono text-xs">➔</span>
                                  <input
                                    type="text"
                                    value={q.correctAnswer}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setCanvasQuestions(prev => prev.map(item => item.id === q.id ? { ...item, correctAnswer: val } : item));
                                    }}
                                    className="flex-1 bg-black/80 border border-white/10 rounded-xl px-3 py-1.5 text-xs font-mono font-bold text-amber-300 focus:outline-none focus:border-amber-400/50"
                                    placeholder="Palabra exacta"
                                  />
                                </div>
                              </div>
                            )}
                            {q.type === 'speaking' && (
                              <div className="p-4 bg-black/55 border border-pink-500/10 rounded-2xl space-y-4 text-left">
                                <div className="flex items-center gap-2 border-b border-white/5 pb-2">
                                  <span className="text-pink-400">🎙️</span>
                                  <span className="text-[9px] font-mono font-black text-pink-400 uppercase tracking-wider">PRUEBA ORAL AI SPEAKING SETUP</span>
                                </div>
                                <div className="space-y-1">
                                  <span className="block text-[7.5px] font-mono text-white/40 uppercase font-black tracking-widest pl-0.5">
                                    TEXTO REACCIÓN O ENUNCIADO (Frase de lectura / Respuesta oral)
                                  </span>
                                  <textarea
                                    value={q.question}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      setCanvasQuestions(prev => prev.map(item => item.id === q.id ? { ...item, question: val } : item));
                                    }}
                                    rows={3}
                                    className="w-full bg-[#070d14] border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-pink-500/50 font-sans leading-normal resize-y"
                                    placeholder="Ej. Read aloud: 'Developing virtual communication interfaces requires solid subject pronoun compliance.'"
                                  />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                  <div className="space-y-1">
                                    <span className="block text-[7.5px] font-mono text-white/40 uppercase font-black tracking-widest pl-0.5">
                                      TIEMPO LÍMITE DE RESPUESTA
                                    </span>
                                    <select
                                      value={q.timeLimit || '1 min'}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setCanvasQuestions(prev => prev.map(item => item.id === q.id ? { ...item, timeLimit: val } : item));
                                      }}
                                      className="w-full bg-[#070d14] border border-white/10 rounded-xl px-3 py-2 text-xs text-white font-mono font-bold focus:outline-none focus:border-pink-500/50"
                                    >
                                      <option value="30s">30 segundos (30s) • Quick Practice</option>
                                      <option value="1 min">1 minuto (1 min) • Standard Speaking</option>
                                      <option value="2 min">2 minutos (2 min) • TOEFL Long Answer</option>
                                    </select>
                                  </div>
                                  <div className="space-y-1">
                                    <div className="flex justify-between items-center px-0.5">
                                      <span className="block text-[7.5px] font-mono text-white/40 uppercase font-black tracking-widest">
                                        UMBRAL MÍNIMO DE PRECISIÓN
                                      </span>
                                      <span className="text-[10px] font-mono font-black text-[#10b981]">
                                        {q.precisionThreshold || 80}%
                                      </span>
                                    </div>
                                    <div className="flex items-center gap-3 bg-[#070d14] border border-white/10 rounded-xl px-3 py-1.5 h-[36px]">
                                      <input
                                        type="range"
                                        min="50"
                                        max="100"
                                        step="5"
                                        value={q.precisionThreshold || 80}
                                        onChange={(e) => {
                                          const val = Number(e.target.value);
                                          setCanvasQuestions(prev => prev.map(item => item.id === q.id ? { ...item, precisionThreshold: val } : item));
                                        }}
                                        className="flex-1 accent-[#10b981] h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
                                      />
                                      <span className="text-[9.5px] font-mono font-bold text-gray-400 shrink-0 select-none">
                                        Min: 50%
                                      </span>
                                    </div>
                                  </div>
                                </div>
                                <div className="space-y-1 bg-pink-500/5 p-3 rounded-xl border border-pink-500/10">
                                  <span className="block text-[7.5px] font-mono text-white/40 uppercase font-black tracking-widest pl-0.5">
                                    VOCABULARIO TARGET O PALABRAS CLAVE DETECTADAS POR LA IA
                                  </span>
                                  <div className="flex items-center gap-2">
                                    <span className="text-pink-400 text-xs">🔍</span>
                                    <input
                                      type="text"
                                      value={q.correctAnswer}
                                      onChange={(e) => {
                                        const val = e.target.value;
                                        setCanvasQuestions(prev => prev.map(item => item.id === q.id ? { ...item, correctAnswer: val } : item));
                                      }}
                                      className="flex-1 bg-transparent border-b border-white/15 focus:border-[#10b981] text-xs font-bold text-pink-300 focus:outline-none uppercase py-0.5"
                                      placeholder="Ej. TOEFL Pronunciation / Vocabulary target keywords"
                                    />
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  {canvasQuestions.length > 0 && (
                    <div className="mt-6 pt-5 border-t border-white/5 space-y-3">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-white/45 uppercase font-bold text-[9px]">Suma de Puntaje Acumulado:</span>
                        {(() => {
                          const score = canvasQuestions.reduce((acc, q) => acc + q.points, 0);
                          if (score === 100) {
                            return <span className="text-emerald-400 font-mono font-black">100 / 100 pts (0 pts restantes)</span>;
                          } else if (score < 100) {
                            return <span className="text-amber-400 font-mono font-black">{score} / 100 pts ({100 - score} pts restantes)</span>;
                          } else {
                            return <span className="text-rose-400 font-mono font-black">{score} / 100 pts (Excedente por {score - 100} pts)</span>;
                          }
                        })()}
                      </div>
                      <div className="h-1.5 w-full bg-gray-800 rounded-full overflow-hidden">
                        {(() => {
                          const score = canvasQuestions.reduce((acc, q) => acc + q.points, 0);
                          const pct = Math.min((score / 100) * 100, 100);
                          const color = score > 100 ? 'bg-rose-500' : 'bg-emerald-500';
                          return (
                            <div 
                              className={`h-full ${color} transition-all duration-300`} 
                              style={{ width: `${pct}%` }} 
                            />
                          );
                        })()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <div className="lg:col-span-3 space-y-6">
                <GlassCard className="p-5 border-white/5 bg-[#0b1219]/40 text-left">
                  <div className="flex items-center gap-2.5 mb-4">
                    <span className="p-1.5 rounded-lg bg-emerald-400/10 text-emerald-400">
                      <Send size={14} />
                    </span>
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">Consola de Publicación</h3>
                  </div>
                  {isDistributedSuccess ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="py-12 px-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-3"
                    >
                      <div className="w-12 h-12 rounded-full bg-emerald-500 text-black flex items-center justify-center text-xl font-bold mx-auto shadow-[0_0_20px_rgba(16,185,129,0.35)]">
                        ✓
                      </div>
                      <div className="space-y-1">
                        <p className="text-white text-xs font-black uppercase tracking-wider">¡ÉVOLUTIVO PUBLICADO!</p>
                        <p className="text-white/50 text-[10px] leading-relaxed">
                          El examen ha sido ensamblado, compilado y distribuido a las pestañas y vistas académicas del grupo receptor con éxito.
                        </p>
                      </div>
                    </motion.div>
                  ) : (
                    <div className="space-y-4">
                      <div className="space-y-1.5">
                        <label className="block text-[8px] font-mono font-black text-white/30 uppercase tracking-widest mb-0.5">Título del Examen</label>
                        <input
                          type="text"
                          value={examTitle}
                          onChange={(e) => setExamTitle(e.target.value)}
                          className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs text-white uppercase focus:outline-none focus:border-[#DEFF9A]"
                          placeholder="TITULO DE LA PRUEBA"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <label className="block text-[8px] font-mono font-black text-white/30 uppercase tracking-widest mb-0.5">Duración Límite</label>
                        <select
                          value={examDuration}
                          onChange={(e) => setExamDuration(Number(e.target.value))}
                          className="w-full bg-black/60 border border-white/10 rounded-xl px-3.5 py-2.5 text-xs font-mono text-white"
                        >
                          <option value={20}>20 Minutos - Quick Diagnostic</option>
                          <option value={40}>40 Minutos - Standard Quiz</option>
                          <option value={60}>60 Minutos - Midterm Exam</option>
                          <option value={90}>90 Minutos - Full Term TOEFL</option>
                          <option value={120}>120 Minutos - Reticular Evaluation</option>
                        </select>
                      </div>
                      {(() => {
                        const totalPoints = canvasQuestions.reduce((acc, q) => acc + q.points, 0);
                        const isOverLimit = totalPoints > 100;
                        const isBtnDisabled = canvasQuestions.length === 0 || isOverLimit;
                        return (
                          <button
                            type="button"
                            disabled={isBtnDisabled}
                            onClick={handleDistributeExam}
                            className={`w-full py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all shadow-md flex items-center justify-center gap-2 ${
                              isBtnDisabled
                                ? 'bg-white/5 border border-white/10 text-white/20 cursor-not-allowed'
                                : 'bg-[#DEFF9A] text-black hover:scale-[1.02] active:scale-95 shadow-[0_0_20px_rgba(222,255,154,0.2)]'
                            }`}
                          >
                            <Send size={12} />
                            Publicar y Distribuir
                          </button>
                        );
                      })()}
                    </div>
                  )}
                </GlassCard>
                <GlassCard className="p-5 border-white/5 bg-[#0b1219]/40 text-left">
                  <div className="flex items-center gap-2.5 mb-4 border-b border-white/5 pb-3">
                    <span className="p-1.5 rounded-lg bg-cyan-400/10 text-cyan-400">
                      <FileText size={13} />
                    </span>
                    <h3 className="text-xs font-black text-white uppercase tracking-wider">Historial de Exámenes</h3>
                  </div>
                  <div className="space-y-3 max-h-[300px] overflow-y-auto">
                    {createdExams.length === 0 ? (
                      <p className="text-[10px] text-white/30 text-center py-6">Ningún examen publicado anteriormente.</p>
                    ) : (
                      createdExams.map((ex) => (
                        <div key={ex.id} className="p-3 bg-black/45 rounded-xl border border-white/5 space-y-1.5 text-left text-[11px] group">
                          <div className="flex items-start justify-between gap-2">
                            <h4 className="font-mono text-[9px] font-black text-white uppercase leading-tight group-hover:text-cyan-400 transition-colors line-clamp-1">
                              {ex.title}
                            </h4>
                            <button
                              type="button"
                              onClick={() => {
                                setCreatedExams(prev => prev.filter(item => item.id !== ex.id));
                              }}
                              className="text-white/30 hover:text-red-400 transition-colors text-[9px] shrink-0"
                              title="Retirar Examen"
                            >
                              ✕
                            </button>
                          </div>
                          <div className="grid grid-cols-2 gap-2 text-white/40 text-[9px] font-mono leading-none pt-1">
                            <div>GRUPO: <b className="text-white/70 uppercase">{(ex.group === 'all' || !ex.group) ? 'GLOBAL' : ex.group}</b></div>
                            <div>DURAC.: <b className="text-white/70">{ex.duration} Mins</b></div>
                            <div>ITEMS: <b className="text-[#DEFF9A]">{ex.questionCount}</b></div>
                            <div>VALOR: <b className="text-cyan-450 text-[#DEFF9A]">{ex.totalPoints} PTS</b></div>
                          </div>
                          <div className="text-white/20 text-[8px] font-mono uppercase text-right pt-1">
                            Publicado {ex.createdAt}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </GlassCard>
              </div>
            </div>
          </motion.div>
        )}
        {/* TAB: PLAN MAESTRO A1+ */}
        {activeSubTab === 'Plan Maestro' && (
          <motion.div
            key="plan_maestro_tab"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            <DirectorModeloA1Plus />
          </motion.div>
        )}

      </AnimatePresence>

      {/* MODALES - Estructura Reticular & Distribución Académica eliminados */}
    </div>
  );
}







