/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useEffect } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  Lock, 
  ShieldCheck, 
  Zap,
  Globe,
  Building,
  Camera,
  Signature,
  Award,
  FileText,
  Calendar,
  Twitter,
  Facebook,
  Instagram,
  Linkedin,
  Save,
  AlertTriangle,
  Fingerprint,
  QrCode,
  Download,
  Share2,
  Paperclip,
  CheckCircle2,
  Trash2,
  Plus,
  Monitor,
  X,
  Sliders,
  Loader2,
  Copy,
  Check,
  Upload
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { QRCodeSVG } from 'qrcode.react';
import { GlassCard } from './GlassCard';
import { useAppContext, UserRole } from '../context/AppContext';
import { ModuleManagement } from './ModuleManagement';
import { guardarPerfil, obtenerPerfilCompleto, uploadAvatar, uploadCertificationDocument, misGruposIngles, listarHorariosDisponiblesDocente, guardarDirectorProfile, guardarTeacherProfile, guardarStudentProfile } from '../services/identityService';
import { CredentialPreviewCard } from './CredentialPreviewCard';
import { downloadCredentialCardPdf, shareCredentialCardPdf, CredentialCardData } from '../services/credentialPdfService';
import { WhatsAppButton, WHATSAPP_SALES_MESSAGE } from './WhatsAppButton';

export function UserSettings({ 
  role, 
  onContactTeacher 
}: { 
  role?: UserRole; 
  onContactTeacher?: (teacherId: string, greeting: string) => void;
}) {
  const { 
    institutionName, 
    setInstitutionName, 
    institutionLogo, 
    setInstitutionLogo,
    maintenanceMode,
    setMaintenanceMode,
    identityEnabled,
    currentRole: contextRole,
    userEmail,
    groups,
    teachers,
  } = useAppContext();
  
  const effectiveRole = role || contextRole;
  
  const [activeTab, setActiveTab] = useState<'IDENTITY' | 'PERSONAL' | 'PROFESSIONAL' | 'SECURITY' | 'DIGITAL_CARD' | 'MODULES' | 'INSTITUTION'>(effectiveRole === 'ALUMNO' ? 'PERSONAL' : 'PERSONAL');
  const [isDirty, setIsDirty] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Side panel colapsable para los botones de Guardar/Descartar
  const [isSavePanelCollapsed, setIsSavePanelCollapsed] = useState(false);
  // Modal de advertencia cuando se intenta cambiar de tab/página con cambios sin guardar
  const [pendingTab, setPendingTab] = useState<typeof activeTab | null>(null);
  const [showUnsavedModal, setShowUnsavedModal] = useState(false);

  // States for Advisor booking and Toast status
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [codeCopied, setCodeCopied] = useState(false);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);

  // Modal para agregar certificación
  const [showCertModal, setShowCertModal] = useState(false);
  const [newCertName, setNewCertName] = useState('');
  const [newCertDate, setNewCertDate] = useState('');
  const [newCertUrl, setNewCertUrl] = useState('');
  const [certFile, setCertFile] = useState<File | null>(null);
  const [isUploadingCert, setIsUploadingCert] = useState(false);
  const certFileInputRef = useRef<HTMLInputElement>(null);

  // Copiar código institucional al portapapeles
  const copiarCodigo = async () => {
    const code = instData.institution_code || '';
    if (!code) return;
    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(code);
      } else {
        // Fallback para contextos no seguros
        const ta = document.createElement('textarea');
        ta.value = code;
        ta.style.position = 'fixed';
        ta.style.left = '-9999px';
        document.body.appendChild(ta);
        ta.focus();
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
      }
      setCodeCopied(true);
      setToastMessage('✅ Código copiado al portapapeles');
      setShowToast(true);
      setTimeout(() => setCodeCopied(false), 2000);
    } catch (err) {
      console.error('[Copiar código]', err);
      setToastMessage('❌ No se pudo copiar. Cópialo manualmente.');
      setShowToast(true);
    }
  };

  // Agregar nueva certificación (con soporte de subida de archivo)
  const handleAddCertification = async () => {
    if (!newCertName.trim()) return;

    const effectiveRole = role || contextRole || 'DOCENTE';

    // Si hay archivo seleccionado, subirlo a Google Drive primero
    let fileUrl = newCertUrl.trim() || undefined;
    let fileId: string | undefined;
    let fileType: string | undefined;

    if (certFile) {
      if (!userEmail) {
        setToastMessage('Sin email de sesión — vuelve a iniciar sesión');
        setShowToast(true);
        return;
      }

      // Validar tamaño (10MB)
      if (certFile.size > 10 * 1024 * 1024) {
        setToastMessage('El archivo no debe exceder 10MB');
        setShowToast(true);
        return;
      }

      setIsUploadingCert(true);
      try {
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(certFile);
        });

        const result = await uploadCertificationDocument(
          userEmail,
          base64,
          certFile.name,
          certFile.type,
          effectiveRole
        );

        if (result.ok && result.fileUrl) {
          fileUrl = result.fileUrl;
          fileId = result.fileId;
          fileType = certFile.type;
          setToastMessage('Archivo subido a Google Drive');
          setShowToast(true);
        } else {
          setToastMessage('Error al subir archivo: ' + (result.error || 'desconocido'));
          setShowToast(true);
          setIsUploadingCert(false);
          return;
        }
      } catch (err) {
        console.error('[CertUpload]', err);
        setToastMessage('Error al procesar el archivo');
        setShowToast(true);
        setIsUploadingCert(false);
        return;
      }
      setIsUploadingCert(false);
    }

    const newCert = {
      id: `CERT-${Date.now()}`,
      name: newCertName.trim().toUpperCase(),
      date: newCertDate || new Date().toISOString().slice(0, 10),
      url: fileUrl,
      fileId: fileId,
      fileType: fileType,
    };
    setTeacherData(prev => ({
      ...prev,
      certifications: [...prev.certifications, newCert],
    }));
    setIsDirty(true);
    setShowCertModal(false);
    setNewCertName('');
    setNewCertDate('');
    setNewCertUrl('');
    setCertFile(null);
    if (certFileInputRef.current) certFileInputRef.current.value = '';
    setToastMessage('Certificación agregada. Guarda para sincronizar.');
    setShowToast(true);
  };

  // Eliminar certificación
  const handleDeleteCertification = (certId: string) => {
    setTeacherData(prev => ({
      ...prev,
      certifications: prev.certifications.filter(c => c.id !== certId),
    }));
    setIsDirty(true);
    setToastMessage('Certificación eliminada. Guarda para sincronizar.');
    setShowToast(true);
  };

  // Descargar certificación
  const handleDownloadCertification = (cert: { name: string; url?: string }) => {
    if (cert.url) {
      window.open(cert.url, '_blank');
    } else {
      setToastMessage('Esta certificación no tiene enlace adjunto.');
      setShowToast(true);
    }
  };

  // Calcular porcentaje de completitud del perfil
  const calculateProfileCompletion = (): number => {
    let filled = 0;
    let total = 6;
    if (teacherData.name) filled++;
    if (teacherData.degree) filled++;
    if (teacherData.phone) filled++;
    if (teacherData.bio) filled++;
    if (teacherData.years_of_experience > 0) filled++;
    if (teacherData.certifications.length > 0) filled++;
    return Math.round((filled / total) * 100);
  };

  useEffect(() => {
    if (showToast) {
      const timer = setTimeout(() => setShowToast(false), 4000);
      return () => clearTimeout(timer);
    }
  }, [showToast]);

  // Cargar perfil desde el Data Lake al montar
  const cargarPerfilDesdeLake = async () => {
    if (!userEmail) return;
    try {
    // Enviamos `rol` para que el backend consulte la hoja específica
    // (ALUMNOS / DOCENTES / DIRECTORES) además de USUARIOS.
    const perfil = await obtenerPerfilCompleto({ email: userEmail, rol: effectiveRole as 'ALUMNO' | 'DOCENTE' | 'DIRECTOR' });
    if (!perfil) return;

    // FIX: Normalizar birth_date al formato YYYY-MM-DD que requiere input[type="date"].
    // Si el backend devuelve ISO con hora (YYYY-MM-DDTHH:mm:ss.sssZ), el input muestra mm/dd/yyyy vacío.
    const normDate = (v: unknown): string => {
      if (!v) return '';
      const s = String(v);
      const tIdx = s.indexOf('T');
      return tIdx > 0 ? s.split('T')[0] : s;
    };

    // Email siempre viene del lake (autoridad única).
    const lakeEmail = (perfil.email as string) || userEmail;
    if (effectiveRole === 'ALUMNO') {
      // NOTA: perfil.id viene de USUARIOS.id (PK). perfil.user_id viene de ALUMNOS.user_id (FK).
      // Ambos son el mismo valor ('usr_xxx'), pero usamos perfil.id como fuente canónica.
      setStudentData(prev => ({
        ...prev,
        email: lakeEmail,
        userId: (perfil.id as string) ?? prev.userId,    // usr_xxx — ID del sistema (fuente: USUARIOS.id)
        name: (perfil.nombre as string) ?? prev.name,
        avatar: (perfil.avatar as string) ?? prev.avatar,
        phone: String(perfil.phone ?? prev.phone ?? ''),
        bio: String(perfil.bio ?? prev.bio ?? ''),
        curp: (perfil.curp as string) ?? prev.curp,
        studentId: (perfil.student_id as string) ?? prev.studentId,
        birthDate: normDate(perfil.birth_date) || prev.birthDate,
        studentNumber: String(perfil.numero_control ?? prev.studentNumber ?? ''),
        career: (perfil.carrera as string) ?? prev.career,
        shift: (perfil.turno as string) ?? prev.shift,
        level: (perfil.nivel as string) ?? prev.level,
        semestre: (perfil.semestre as string) ?? prev.semestre,
        moduloTec: (perfil.modulo_tec as string) ?? prev.moduloTec,
        institution_code: (perfil.institution_code as string) ?? prev.institution_code,
        director_email: (perfil.director_email as string) ?? prev.director_email,
        // Datos del director hidratados desde el Lake (solo lectura)
        dir_institution_name: (perfil.dir_institution_name as string) ?? prev.dir_institution_name,
        dir_institution_type: (perfil.dir_institution_type as string) ?? prev.dir_institution_type,
        dir_institution_logo: (perfil.dir_institution_logo as string) ?? prev.dir_institution_logo,
        dir_slogan: (perfil.dir_slogan as string) ?? prev.dir_slogan,
        dir_inst_phone: (perfil.dir_inst_phone as string) ?? prev.dir_inst_phone,
        dir_inst_email: (perfil.dir_inst_email as string) ?? prev.dir_inst_email,
        dir_address: (perfil.dir_address as string) ?? prev.dir_address,
        dir_institution_code: (perfil.dir_institution_code as string) ?? prev.dir_institution_code,
        dir_carreras: (perfil.dir_carreras as string[]) ?? prev.dir_carreras,
        dir_turnos: (perfil.dir_turnos as string[]) ?? prev.dir_turnos,
        dir_modalidad: (perfil.dir_modalidad as string) ?? prev.dir_modalidad,
      }));
    } else if (effectiveRole === 'DOCENTE') {
      setTeacherData(prev => ({
        ...prev,
        email: lakeEmail,
        name: (perfil.nombre as string) ?? prev.name,
        avatar: (perfil.avatar as string) ?? prev.avatar,
        phone: String(perfil.phone ?? prev.phone ?? ''),
        bio: String(perfil.bio ?? prev.bio ?? ''),
        curp: (perfil.curp as string) ?? prev.curp,
        employeeId: (perfil.id_empleado as string) ?? prev.employeeId,
        id_empleado: (perfil.id_empleado as string) ?? prev.id_empleado,
        birthDate: normDate(perfil.birth_date) || prev.birthDate,
        degree: (perfil.degree as string) ?? prev.degree,
        institution_code: (perfil.institution_code as string) ?? prev.institution_code,
        director_email: (perfil.director_email as string) ?? prev.director_email,
        // Datos del director hidratados desde el Lake (solo lectura)
        dir_institution_name: (perfil.dir_institution_name as string) ?? prev.dir_institution_name,
        dir_institution_type: (perfil.dir_institution_type as string) ?? prev.dir_institution_type,
        dir_institution_logo: (perfil.dir_institution_logo as string) ?? prev.dir_institution_logo,
        dir_slogan: (perfil.dir_slogan as string) ?? prev.dir_slogan,
        dir_inst_phone: (perfil.dir_inst_phone as string) ?? prev.dir_inst_phone,
        dir_inst_email: (perfil.dir_inst_email as string) ?? prev.dir_inst_email,
        dir_address: (perfil.dir_address as string) ?? prev.dir_address,
        dir_institution_code: (perfil.dir_institution_code as string) ?? prev.dir_institution_code,
        dir_carreras: (perfil.dir_carreras as string[]) ?? prev.dir_carreras,
        dir_turnos: (perfil.dir_turnos as string[]) ?? prev.dir_turnos,
        dir_modalidad: (perfil.dir_modalidad as string) ?? prev.dir_modalidad,
        specialties: (() => { try { const v = perfil.specialties; if (Array.isArray(v)) return v; if (typeof v === 'string' && v) return JSON.parse(v); return prev.specialties; } catch { return prev.specialties; } })(),
        certifications: (() => { try { const v = perfil.certifications; if (Array.isArray(v)) return v; if (typeof v === 'string' && v) return JSON.parse(v); return prev.certifications; } catch { return prev.certifications; } })(),
        years_of_experience: (perfil.years_of_experience as number) ?? prev.years_of_experience,
      }));
    } else if (effectiveRole === 'DIRECTOR') {
      setDirData(prev => ({
        ...prev,
        email: lakeEmail,
        name: (perfil.nombre as string) ?? prev.name,
        avatar: (perfil.avatar as string) ?? prev.avatar,
        phone: String(perfil.phone ?? prev.phone ?? ''),
        bio: String(perfil.bio ?? prev.bio ?? ''),
        curp: (perfil.curp as string) ?? prev.curp,
        birthDate: normDate(perfil.birth_date) || prev.birthDate,
        degree: (perfil.degree as string) ?? prev.degree,
        experienceYears: (perfil.experience_years as number) ?? prev.experienceYears,
      }));
      setInstData(prev => ({
        ...prev,
        name: (perfil.institution_name as string) ?? prev.name,
        institution_type: (perfil.institution_type as string) ?? prev.institution_type,
        institution_code: (perfil.institution_code as string) ?? prev.institution_code,
        slogan: (perfil.slogan as string) ?? prev.slogan,
        phone: (perfil.inst_phone as string) ?? prev.phone,
        address: (perfil.address as string) ?? prev.address,
        email: (perfil.inst_email as string) ?? prev.email,
        facebook: (perfil.facebook as string) ?? prev.facebook,
        instagram: (perfil.instagram as string) ?? prev.instagram,
        linkedin: (perfil.linkedin as string) ?? prev.linkedin,
        modalidad: (perfil.modalidad as string) ?? prev.modalidad,
        semestres: (perfil.semestres as string) ?? prev.semestres,
        // Leer carreras de columnas carrera_1..carrera_7 (columnas separadas)
        carreras: [
          perfil.carrera_1, perfil.carrera_2, perfil.carrera_3,
          perfil.carrera_4, perfil.carrera_5, perfil.carrera_6, perfil.carrera_7,
        ].filter((c): c is string => typeof c === 'string' && c.length > 0) as string[],
// Leer turnos activos desde columnas booleanas (case-insensitive + soporta true/1/TRUE/SI)
         turnos: [
           String(perfil.turno_matutino || '').toUpperCase() === 'TRUE' ? 'MATUTINO' : null,
           String(perfil.turno_vespertino || '').toUpperCase() === 'TRUE' ? 'VESPERTINO' : null,
           String(perfil.turno_semi_escolarizado || '').toUpperCase() === 'TRUE' ? 'SEMI-ESCOLARIZADO' : null,
           String(perfil.turno_sabatino || '').toUpperCase() === 'TRUE' ? 'SABATINO' : null,
           String(perfil.turno_distancia || '').toUpperCase() === 'TRUE' ? 'DISTANCIA / EN LÍNEA' : null,
         ].filter((t): t is string => typeof t === 'string') as string[],
      }));
      if (perfil.institution_logo) setInstitutionLogo(perfil.institution_logo as string);
    }
    } catch (err) {
      console.warn('[UserSettings] Error loading profile from Lake:', err);
    }
  };

  useEffect(() => {
    cargarPerfilDesdeLake();
  }, [userEmail, effectiveRole]);

  // Aviso al cerrar la pestaña / recargar con cambios sin guardar
  useEffect(() => {
    if (!isDirty) return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [isDirty]);

  // Interceptar cambios de tab cuando hay cambios sin guardar
  const requestTabChange = (newTab: typeof activeTab) => {
    if (isDirty && newTab !== activeTab) {
      setPendingTab(newTab);
      setShowUnsavedModal(true);
    } else {
      setActiveTab(newTab);
    }
  };

  const handleSaveAndSwitch = async () => {
    await handleSave();
    if (pendingTab) {
      setActiveTab(pendingTab);
      setPendingTab(null);
    }
    setShowUnsavedModal(false);
  };

  const handleDiscardAndSwitch = async () => {
    await handleDiscard();
    if (pendingTab) {
      setActiveTab(pendingTab);
      setPendingTab(null);
    }
    setShowUnsavedModal(false);
  };
  
  // Docente Data — vacío por defecto; se hidrata desde el Data Lake.
  const [teacherData, setTeacherData] = useState({
    name: '',
    degree: '',
    specialties: [] as string[],
    bio: '',
    avatar: '',
    email: '',
    employeeId: '',
    id_empleado: '',
    curp: '',
    phone: '',
    birthDate: '',
    institution_code: '',
    director_email: '',
    // Datos del director hidratados (solo lectura)
    dir_institution_name: '',
    dir_institution_type: '',
    dir_institution_logo: '',
    dir_slogan: '',
    dir_inst_phone: '',
    dir_inst_email: '',
    dir_address: '',
    dir_institution_code: '',
    dir_carreras: [] as string[],
    dir_turnos: [] as string[],
    dir_modalidad: '',
    certifications: [] as { id: string; name: string; date: string; url?: string; fileId?: string; fileType?: string }[],
    years_of_experience: 0,
  });

  // Student Data — vacío por defecto; se hidrata desde el Data Lake.
  const [studentData, setStudentData] = useState<{
    name: string;
    level: string;
    bio: string;
    avatar: string;
    email: string;
    userId: string;
    studentId: string;
    curp: string;
    phone: string;
    birthDate: string;
    studentNumber: string;
    career: string;
    shift: string;
    semestre: string;
    moduloTec: string;
    institution_code: string;
    director_email: string;
    // Datos del director hidratados desde el Lake (solo lectura)
    dir_institution_name?: string;
    dir_institution_type?: string;
    dir_institution_logo?: string;
    dir_slogan?: string;
    dir_inst_phone?: string;
    dir_inst_email?: string;
    dir_address?: string;
    dir_institution_code?: string;
    dir_carreras?: string[];
    dir_turnos?: string[];
    dir_modalidad?: string;
  }>({
    name: '',
    level: '',
    bio: '',
    avatar: '',
    email: '',
    userId: '',        // usr_xxx — ID generado por la APP (solo lectura)
    studentId: '',     // ID institucional que la escuela asigna (ej: INGIND-002)
    curp: '',
    phone: '',
    birthDate: '',
    studentNumber: '', // Número de control (ej: INGIND-001)
    career: '',
    shift: '',
    semestre: '',
    moduloTec: '',
    institution_code: '',
    director_email: '',
  });

  const [dirData, setDirData] = useState({
    name: '',
    curp: '',
    phone: '',
    birthDate: '',
    bio: '',
    email: '',
    avatar: '',
    degree: '',
    experienceYears: 0
  });

  // Docente asignado al grupo del alumno (cargado desde Google Sheets CLE)
  const [assignedTeacherFromSheet, setAssignedTeacherFromSheet] = useState<{
    name: string;
    email: string;
    id: string;
    phone: string;
    degree: string;
    status: string;
  } | null>(null);
  const [isLoadingTeacher, setIsLoadingTeacher] = useState(false);

  // REGLA UNIVERSAL — Grupo del alumno (primer grupo activo) para la credencial institucional
  const [studentGrupo, setStudentGrupo] = useState<{
    nombre: string;
    grupo: string;
    nivel: string;
    grupoId: string;
  } | null>(null);

  // Cargar docente del grupo del alumno desde Google Sheets
  useEffect(() => {
    if (effectiveRole !== 'ALUMNO' || !userEmail) return;

    const fetchAssignedTeacher = async () => {
      try {
        setIsLoadingTeacher(true);
        const misGrupos = await misGruposIngles(userEmail);
        if (misGrupos.length > 0) {
          const primerGrupo = misGrupos[0];
          // REGLA UNIVERSAL: guardar el grupo del alumno (credencial institucional)
          setStudentGrupo({
            nombre: primerGrupo.nombre || '',
            grupo: primerGrupo.grupo || '',
            nivel: primerGrupo.nivel || '',
            grupoId: primerGrupo.grupo_id || '',
          });
          const docenteEmail = primerGrupo.docente_email;
          const docenteId = primerGrupo.docente_id;
          if (docenteEmail) {
            const perfilDocente = await obtenerPerfilCompleto({ email: docenteEmail, rol: 'DOCENTE' });
            if (perfilDocente) {
              setAssignedTeacherFromSheet({
                name: (perfilDocente.nombre as string) || 'Docente',
                email: docenteEmail,
                id: docenteId || '—',
                phone: String(perfilDocente.phone ?? ''),
                degree: (perfilDocente.degree as string) || 'DOCENTE',
                status: 'ACTIVE',
              });
            }
          }
        }
      } catch (err) {
        console.error('Error cargando docente asignado:', err);
      } finally {
        setIsLoadingTeacher(false);
      }
    };
    fetchAssignedTeacher();
  }, [effectiveRole, userEmail]);

  // Docente final: priorizar Google Sheets, fallback a AppContext
  const assignedTeacher = assignedTeacherFromSheet || (() => {
    if (effectiveRole !== 'ALUMNO') return null;
    const studentUserId = studentData.userId;
    if (!studentUserId) return null;
    const studentGroup = groups.find(g => g.studentIds.includes(studentUserId));
    if (!studentGroup) return null;
    const teacher = teachers.find(t => t.id === studentGroup.teacherId);
    return teacher || null;
  })();

  // Horarios disponibles del docente (cargados desde Google Sheets)
  const [availableSlots, setAvailableSlots] = useState<Array<{
    asesoria_id: string;
    dia: string;
    hora: string;
    plataforma: string;
    lugar: string;
    duracion_minutos: number;
  }>>([]);
  const [isLoadingSlots, setIsLoadingSlots] = useState(false);

  // Cargar horarios disponibles cuando se abre el modal
  useEffect(() => {
    if (!isCalendarOpen || !assignedTeacher?.email) return;

    const fetchSlots = async () => {
      try {
        setIsLoadingSlots(true);
        const slots = await listarHorariosDisponiblesDocente(assignedTeacher.email);
        setAvailableSlots(slots);
      } catch (err) {
        console.error('Error cargando horarios:', err);
        setAvailableSlots([]);
      } finally {
        setIsLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [isCalendarOpen, assignedTeacher?.email]);

  // Catálogo de opciones — fuente única de verdad.
  // Coincide EXACTAMENTE con los menús desplegables de la hoja ALUMNOS
  // en el Data Lake (valores en MAYÚSCULAS, sin acentos).
  // Cualquier valor fuera de estos catálogos es rechazado por el backend.
  const CARRERAS = [
    'ING INDUSTRIAL',
    'ING SISTEMAS',
    'ING CIVIL',
    'ING MECATRONICA',
    'LIC. ADMINISTRACION',
    'CONTADURIA',
    'ARQUITECTURA',
  ];
  const TURNOS = ['MATUTINO', 'VESPERTINO', 'SEMI-ESCOLARIZADO'];
  const SEMESTRES = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '10'];
  // Mapeo canónico modulo_tec -> nivel_ingles. El backend sincroniza
  // USUARIOS.nivel automáticamente desde modulo_tec.
  const MODULOS_TEC: { value: string; nivel: string; label: string }[] = [
    { value: 'I',   nivel: 'A1',  label: 'I (A1)' },
    { value: 'II',  nivel: 'A1+', label: 'II (A1+)' },
    { value: 'III', nivel: 'A2',  label: 'III (A2)' },
    { value: 'IV',  nivel: 'A2+', label: 'IV (A2+)' },
    { value: 'V',   nivel: 'B1',  label: 'V (B1)' },
    { value: 'VI',  nivel: 'B2',  label: 'VI (B2)' },
  ];
  // nivel_ingles se deriva de modulo_tec en el backend; no se expone al usuario.

  // Formato automático de teléfono México: +52-XXX-XXX-XXXX
  const formatPhoneMX = (raw: string): string => {
    const digits = raw.replace(/\D/g, '').replace(/^52/, ''); // quitar todo lo que no sea dígito, quitar 52 inicial si lo tiene
    const d = digits.slice(0, 10); // max 10 dígitos
    if (d.length <= 3) return d;
    if (d.length <= 6) return `${d.slice(0,3)}-${d.slice(3)}`;
    return `+52-${d.slice(0,3)}-${d.slice(3,6)}-${d.slice(6)}`;
  };

  const getProfileData = () => {
    // Email es identidad y SIEMPRE viene del Lake (no del estado local hardcoded).
    const emailReal = userEmail || (
      effectiveRole === 'ALUMNO' ? studentData.email :
      effectiveRole === 'DIRECTOR' ? dirData.email :
      teacherData.email
    );
    if (effectiveRole === 'ALUMNO') {
      return {
        name: studentData.name,
        email: emailReal,
        userId: studentData.userId,       // usr_xxx — solo lectura
        curp: studentData.curp,
        phone: studentData.phone,
        avatar: studentData.avatar,
        bio: studentData.bio,
        birthDate: studentData.birthDate,
        studentId: studentData.studentId, // ID institucional (ej: INGIND-002)
        studentNumber: studentData.studentNumber, // Número de control
        career: studentData.career,
        shift: studentData.shift,
        level: studentData.level,
        semestre: studentData.semestre,
        moduloTec: studentData.moduloTec,
        setName: (name: string) => setStudentData(prev => ({ ...prev, name })),
        setPhone: (phone: string) => setStudentData(prev => ({ ...prev, phone: formatPhoneMX(phone) })),
        setBio: (bio: string) => setStudentData(prev => ({ ...prev, bio })),
        setAvatar: (avatar: string) => setStudentData(prev => ({ ...prev, avatar })),
        setCurp: (curp: string) => setStudentData(prev => ({ ...prev, curp })),
        setBirthDate: (d: string) => setStudentData(prev => ({ ...prev, birthDate: d })),
        setStudentId: (id: string) => setStudentData(prev => ({ ...prev, studentId: id })),
        setStudentNumber: (n: string) => setStudentData(prev => ({ ...prev, studentNumber: n })),
        setCareer: (c: string) => setStudentData(prev => ({ ...prev, career: c })),
        setShift: (s: string) => setStudentData(prev => ({ ...prev, shift: s })),
        setLevel: (l: string) => setStudentData(prev => ({ ...prev, level: l })),
        setSemestre: (v: string) => setStudentData(prev => ({ ...prev, semestre: v })),
        setModuloTec: (v: string) => setStudentData(prev => ({ ...prev, moduloTec: v })),
      };
    } else if (effectiveRole === 'DIRECTOR') {
      return {
        name: dirData.name,
        email: emailReal,
        curp: dirData.curp,
        phone: dirData.phone,
        avatar: dirData.avatar,
        bio: dirData.bio,
        birthDate: dirData.birthDate,
        setName: (name: string) => setDirData(prev => ({ ...prev, name })),
        setPhone: (phone: string) => setDirData(prev => ({ ...prev, phone: formatPhoneMX(phone) })),
        setBio: (bio: string) => setDirData(prev => ({ ...prev, bio })),
        setAvatar: (avatar: string) => setDirData(prev => ({ ...prev, avatar })),
        setCurp: (curp: string) => setDirData(prev => ({ ...prev, curp })),
        setBirthDate: (d: string) => setDirData(prev => ({ ...prev, birthDate: d })),
      };
    } else {
      return {
        name: teacherData.name,
        email: emailReal,
        curp: teacherData.curp,
        phone: teacherData.phone,
        avatar: teacherData.avatar,
        bio: teacherData.bio,
        birthDate: teacherData.birthDate,
        degree: teacherData.degree,
        specialties: teacherData.specialties,
        id_empleado: teacherData.id_empleado,
        setName: (name: string) => setTeacherData(prev => ({ ...prev, name })),
        setPhone: (phone: string) => setTeacherData(prev => ({ ...prev, phone: formatPhoneMX(phone) })),
        setBio: (bio: string) => setTeacherData(prev => ({ ...prev, bio })),
        setAvatar: (avatar: string) => setTeacherData(prev => ({ ...prev, avatar })),
        setCurp: (curp: string) => setTeacherData(prev => ({ ...prev, curp })),
        setBirthDate: (d: string) => setTeacherData(prev => ({ ...prev, birthDate: d })),
        setDegree: (deg: string) => setTeacherData(prev => ({ ...prev, degree: deg })),
      };
    }
  };

  const profile = getProfileData();

  // Catálogos académicos por defecto — Tec de Pánuco.
  // Cualquier valor fuera de estos puede ser agregado con el botón "+".
  const TIPOS_INSTITUCION = [
    'TECNOLÓGICO / INSTITUTO TECNOLÓGICO',
    'UNIVERSIDAD PÚBLICA',
    'UNIVERSIDAD PRIVADA',
    'PREPARATORIA / BACHILLERATO',
    'ESCUELA SECUNDARIA',
    'PRIMARIA',
    'CENTRO DE IDIOMAS',
    'ACADEMIA / CAPACITACIÓN',
  ];

  const CARRERAS_DEFAULT_TEC_PANUCO = [
    'INGENIERÍA EN SISTEMAS COMPUTACIONALES',
    'INGENIERÍA INDUSTRIAL',
    'INGENIERÍA MECATRÓNICA',
    'INGENIERÍA ELECTRÓNICA',
    'INGENIERÍA EN GESTIÓN EMPRESARIAL',
    'LICENCIATURA EN CONTADURÍA PÚBLICA',
    'ARQUITECTURA',
  ];

  const TURNOS_INSTITUCION = [
    'MATUTINO',
    'VESPERTINO',
    'SEMI-ESCOLARIZADO',
    'SABATINO',
    'DISTANCIA / EN LÍNEA',
  ];

  const MODALIDADES = [
    'PRESENCIAL',
    'EN LÍNEA',
    'MIXTA / HÍBRIDA',
  ];

  const [instData, setInstData] = useState<{
    name: string;
    institution_type: string;
    institution_code: string;
    slogan: string;
    phone: string;
    address: string;
    email: string;
    facebook: string;
    instagram: string;
    linkedin: string;
    carreras: string[];
    turnos: string[];
    modalidad: string;
    semestres: string;
  }>({
    name: institutionName,
    institution_type: 'TECNOLÓGICO / INSTITUTO TECNOLÓGICO',
    institution_code: '',
    slogan: '',
    phone: '',
    address: '',
    email: '',
    facebook: '',
    instagram: '',
    linkedin: '',
    carreras: [],
    turnos: [],
    modalidad: 'PRESENCIAL',
    semestres: '',
  });

  const handleSave = async () => {
    if (isSaving) return;
    if (!userEmail) {
      setToastMessage('Sin email de sesión — vuelve a iniciar sesión');
      setShowToast(true);
      return;
    }
    setIsSaving(true);
    let campos: Record<string, string> = {};
    if (effectiveRole === 'ALUMNO') {
      campos = {
        nombre: studentData.name, avatar: studentData.avatar,
        phone: studentData.phone, bio: studentData.bio,
        curp: studentData.curp, student_id: studentData.studentId,
        birth_date: studentData.birthDate,
        // nivel se sincroniza automáticamente desde modulo_tec en el backend.
        numero_control: studentData.studentNumber,
        carrera: studentData.career, turno: studentData.shift,
        semestre: studentData.semestre,
        modulo_tec: studentData.moduloTec,
        // nivel_ingles lo calcula y persiste el backend a partir de modulo_tec.
        // Vínculo con director (solo lectura — se mantiene del registro)
        institution_code: studentData.institution_code || '',
        director_email: studentData.director_email || '',
      };
    } else if (effectiveRole === 'DOCENTE') {
      campos = {
        nombre: teacherData.name, avatar: teacherData.avatar,
        phone: teacherData.phone, bio: teacherData.bio,
        curp: teacherData.curp,
        birth_date: teacherData.birthDate, degree: teacherData.degree,
        specialties: JSON.stringify(teacherData.specialties),
        certifications: JSON.stringify(teacherData.certifications),
        years_of_experience: String(teacherData.years_of_experience),
        // Vínculo con director (solo lectura — se mantiene del registro)
        institution_code: teacherData.institution_code || '',
        director_email: teacherData.director_email || '',
      };
    } else if (effectiveRole === 'DIRECTOR') {
      campos = {
        nombre: dirData.name || '', avatar: dirData.avatar || '',
        phone: dirData.phone || '', bio: dirData.bio || '',
        curp: dirData.curp || '', birth_date: dirData.birthDate || '',
        institution_name: instData.name || '', institution_logo: institutionLogo || '',
        institution_type: instData.institution_type || '',
        institution_code: instData.institution_code || '',
        slogan: instData.slogan || '', inst_phone: instData.phone || '',
        address: instData.address || '', inst_email: instData.email || '',
        facebook: instData.facebook || '', instagram: instData.instagram || '',
        linkedin: instData.linkedin || '',
        // Académico — columnas separadas (no JSON)
        carrera_1: instData.carreras[0] || '',
        carrera_2: instData.carreras[1] || '',
        carrera_3: instData.carreras[2] || '',
        carrera_4: instData.carreras[3] || '',
        carrera_5: instData.carreras[4] || '',
        carrera_6: instData.carreras[5] || '',
        carrera_7: instData.carreras[6] || '',
        turno_matutino: instData.turnos.includes('MATUTINO') ? 'TRUE' : '',
        turno_vespertino: instData.turnos.includes('VESPERTINO') ? 'TRUE' : '',
        turno_semi_escolarizado: instData.turnos.includes('SEMI-ESCOLARIZADO') ? 'TRUE' : '',
        turno_sabatino: instData.turnos.includes('SABATINO') ? 'TRUE' : '',
        turno_distancia: instData.turnos.includes('DISTANCIA / EN LÍNEA') ? 'TRUE' : '',
        modalidad: instData.modalidad || 'PRESENCIAL',
      };
      setInstitutionName(instData.name);
    }
    try {
      const res = await guardarPerfil({ email: userEmail, rol: effectiveRole as 'ALUMNO' | 'DOCENTE' | 'DIRECTOR', campos });

      // Guardar en PostgreSQL SIEMPRE (independiente de Google Sheets)
      try {
        if (effectiveRole === 'DIRECTOR') {
          await guardarDirectorProfile(userEmail, {
            avatar: dirData.avatar || '',
            phone: dirData.phone, bio: dirData.bio, curp: dirData.curp,
            birthDate: dirData.birthDate, degree: dirData.degree,
            experienceYears: String((dirData as any).experienceYears || 0),
            institutionName: instData.name, institutionLogo: institutionLogo,
            slogan: instData.slogan, instPhone: instData.phone,
            address: instData.address, instEmail: instData.email,
            facebook: instData.facebook, instagram: instData.instagram,
            linkedin: instData.linkedin, institutionCode: instData.institution_code,
            institutionType: instData.institution_type,
            carrera1: instData.carreras[0], carrera2: instData.carreras[1],
            carrera3: instData.carreras[2], carrera4: instData.carreras[3],
            carrera5: instData.carreras[4], carrera6: instData.carreras[5],
            carrera7: instData.carreras[6],
            turnoMatutino: instData.turnos.includes('MATUTINO'),
            turnoVespertino: instData.turnos.includes('VESPERTINO'),
            turnoSemiEscolarizado: instData.turnos.includes('SEMI-ESCOLARIZADO'),
            turnoSabatino: instData.turnos.includes('SABATINO'),
            turnoDistancia: instData.turnos.includes('DISTANCIA / EN LÍNEA'),
            modalidad: instData.modalidad,
            semestres: instData.semestres,
          });
        } else if (effectiveRole === 'DOCENTE') {
          await guardarTeacherProfile(userEmail, {
            avatar: teacherData.avatar || '',
            phone: teacherData.phone, bio: teacherData.bio, curp: teacherData.curp,
            birthDate: teacherData.birthDate, degree: teacherData.degree,
            experienceYears: String(teacherData.years_of_experience || 0),
            specialties: JSON.stringify(teacherData.specialties),
            certifications: JSON.stringify(teacherData.certifications),
            institutionCode: teacherData.institution_code,
            directorEmail: teacherData.director_email,
          });
        } else if (effectiveRole === 'ALUMNO') {
          await guardarStudentProfile(userEmail, {
            avatar: studentData.avatar || '',
            phone: studentData.phone, bio: studentData.bio, curp: studentData.curp,
            birthDate: studentData.birthDate,
            experienceYears: String((studentData as any).experienceYears || 0),
            numeroControl: studentData.studentNumber,
            carrera: studentData.career, turno: studentData.shift,
            semestre: studentData.semestre, moduloTec: studentData.moduloTec,
            nivelIngles: studentData.level,
            institutionCode: studentData.institution_code,
            directorEmail: studentData.director_email,
          });
        }
      } catch (pgErr) {
        console.error('Error guardando en PostgreSQL:', pgErr);
      }

      const hoja = res.hoja ? ` en ${res.hoja}` : '';
      setToastMessage(`Perfil guardado${hoja}`);
      setShowToast(true);
      setIsDirty(false);
      // Re-leer el perfil desde el Lake para que la UI refleje EXACTAMENTE
      // lo persistido (autoridad única = el Data Lake, no el estado local).
      await cargarPerfilDesdeLake();
      setToastMessage(res.ok ? 'Perfil guardado' : 'Perfil guardado (PostgreSQL)');
      setShowToast(true);
      setIsDirty(false);
    } catch (err) {
      setToastMessage('Error de conexion al guardar perfil');
      setShowToast(true);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDiscard = async () => {
    if (isSaving) return;
    try {
    // Descartar = volver al estado que dicta el Lake (descarta cambios locales)
    await cargarPerfilDesdeLake();
    setIsDirty(false);
    setToastMessage('Cambios descartados');
    setShowToast(true);
    } catch (err) {
      setToastMessage('Error al descartar cambios');
      setShowToast(true);
    }
  };

  // Handle avatar file selection and upload to Google Drive
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    // No file selected (e.g. user cancelled or value was reset) — silent return
    if (!file) return;

    if (!userEmail) {
      setToastMessage('Sin email de sesión — vuelve a iniciar sesión');
      setShowToast(true);
      // Limpiar el input para no re-disparar
      if (avatarFileInputRef.current) avatarFileInputRef.current.value = '';
      return;
    }

    // Validar tipo
    if (!file.type.startsWith('image/')) {
      setToastMessage('Solo se permiten archivos de imagen');
      setShowToast(true);
      if (avatarFileInputRef.current) avatarFileInputRef.current.value = '';
      return;
    }

    // Validar tamaño (5MB)
    if (file.size > 5 * 1024 * 1024) {
      setToastMessage('La imagen no debe exceder 5MB');
      setShowToast(true);
      if (avatarFileInputRef.current) avatarFileInputRef.current.value = '';
      return;
    }

    setIsUploadingAvatar(true);
    try {
      // Leer como base64
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      const result = await uploadAvatar(userEmail, base64, file.name, file.type);
      if (result.ok && result.fileUrl) {
        const newAvatarUrl = result.fileUrl;

        // 1) Actualizar el estado local
        if (effectiveRole === 'ALUMNO') {
          setStudentData(prev => ({ ...prev, avatar: newAvatarUrl }));
        } else if (effectiveRole === 'DOCENTE') {
          setTeacherData(prev => ({ ...prev, avatar: newAvatarUrl }));
        } else {
          setDirData(prev => ({ ...prev, avatar: newAvatarUrl }));
        }

        // 2) AUTO-GUARDAR en el backend (independiente del botón Confirmar)
        try {
          if (effectiveRole === 'ALUMNO') {
            await guardarStudentProfile(userEmail, { avatar: newAvatarUrl });
          } else if (effectiveRole === 'DOCENTE') {
            await guardarTeacherProfile(userEmail, { avatar: newAvatarUrl });
          } else {
            await guardarDirectorProfile(userEmail, { avatar: newAvatarUrl });
          }
        } catch (persistErr) {
          console.warn('[Avatar] No se pudo persistir al backend:', persistErr);
        }

        setIsDirty(false); // Ya está guardado en backend
        setToastMessage('✅ Avatar guardado');
        setShowToast(true);
      } else {
        setToastMessage('❌ Error al subir: ' + (result.error || 'desconocido'));
        setShowToast(true);
      }
    } catch (err) {
      console.error('[Avatar Upload]', err);
      setToastMessage('❌ Error de conexión al subir avatar');
      setShowToast(true);
    } finally {
      setIsUploadingAvatar(false);
      // Limpiar el input para permitir re-seleccionar el mismo archivo
      // (NO re-dispara onChange porque React solo dispara si hay file seleccionado)
      if (avatarFileInputRef.current) avatarFileInputRef.current.value = '';
    }
  };

  const TabButton = ({ id, label, icon: Icon }: any) => (
    <button
      onClick={() => requestTabChange(id)}
      className={`flex items-center gap-2 sm:gap-3 px-4 sm:px-6 py-2.5 sm:py-4 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest transition-all shrink-0 snap-center ${
        activeTab === id ? 'bg-[#38BDF8] text-white shadow-[0_0_20px_#38BDF840]' : 'text-white/40 hover:text-white hover:bg-white/5'
      }`}
    >
      <Icon size={14} className="shrink-0" />
      <span>{label}</span>
    </button>
  );

  return (
    <div className="pb-16 lg:pb-32 px-2 sm:px-0">
{/* Header */}
   <header className="mb-3 sm:mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
         <h2 className="text-[#38BDF8] text-[9px] sm:text-[10px] font-black uppercase tracking-[0.3em] sm:tracking-[0.4em] mb-1 sm:mb-2">Academic Profile</h2>
         <h1 className="text-xl sm:text-3xl font-black text-white uppercase tracking-tight">Configuración</h1>
      </div>
      <WhatsAppButton
        label="Ventas y Servicios"
        sublabel="WhatsApp 8461108789"
        message={WHATSAPP_SALES_MESSAGE}
        iconSize={18}
        className="px-5 py-3.5 w-full sm:w-auto"
      />
   </header>

       {/* Sidebar de Navegación — horizontal scroll en mobile */}
<div className="mb-4 lg:mb-6 -mx-2 px-2 overflow-x-auto no-scrollbar">
          <div className="flex lg:flex-col gap-1.5 min-w-max lg:min-w-0">
              {effectiveRole === 'DIRECTOR' && identityEnabled && <TabButton id="IDENTITY" label="Identidad Institucional" icon={Globe} />}
              {effectiveRole === 'DIRECTOR' && <TabButton id="MODULES" label="Gestión de Módulos" icon={Sliders} />}
              <TabButton id="DIGITAL_CARD" label="Digital Card" icon={ShieldCheck} />
              <TabButton id="PERSONAL" label="Identidad & Datos" icon={User} />
              {effectiveRole !== 'ALUMNO' && <TabButton id="PROFESSIONAL" label="Trayectoria & CV" icon={Award} />}
              {/* Mi Institución — visible para ALUMNO/DOCENTE con director vinculado */}
              {(effectiveRole === 'ALUMNO' || effectiveRole === 'DOCENTE') && (studentData.institution_code || teacherData.institution_code) && (
                <TabButton id="INSTITUTION" label="Mi Institución" icon={Building} />
              )}
              <TabButton id="SECURITY" label="Seguridad" icon={Fingerprint} />
          </div>
        </div>

       {/* Estatus — oculto en mobile, visible en desktop */}
       <div className="hidden lg:block mb-6 p-6 rounded-3xl bg-black/40 border border-white/10 group overflow-hidden relative">
          <div className="absolute inset-0 bg-gradient-to-br from-[#38BDF8]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-3 mb-4">
             <Award className="text-[#38BDF8]" size={18} />
             <span className="text-[10px] font-black uppercase tracking-widest text-white/60">Estatus Académico</span>
          </div>
          <p className="text-[20px] font-black text-white mb-1 uppercase tracking-tighter italic">
            {effectiveRole === 'ALUMNO' ? 'ALUMNO INMERSIVO' : effectiveRole === 'DIRECTOR' ? 'DIRECTOR GENERAL' : 'DOCENTE ELITE'}
          </p>
          <p className="text-[8px] text-white/30 font-bold uppercase tracking-widest leading-relaxed">
            {effectiveRole === 'ALUMNO' 
              ? `Nivel ${studentData.level || 'A1'} validado por TECLINGO AI Dallas Campus.` 
              : 'Nivel de autoridad académica validado por la institución.'}
          </p>
       </div>

       {/* Área de Edición */}
       <div className="space-y-4 sm:space-y-8">
           <AnimatePresence mode="wait">
              {activeTab === 'IDENTITY' && (
                <motion.div 
                  key="identity"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                   className="space-y-4 sm:space-y-8"
                >
                   <GlassCard title="Identidad Institucional" icon={Globe} accent="cyan">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                         {/* Logo */}
<div className="md:col-span-2 flex items-center gap-4 sm:gap-8 p-3 sm:p-6 bg-white/5 rounded-2xl sm:rounded-3xl border border-white/5 relative">
                             {/* Overlay de progreso durante upload */}
                             {isUploadingAvatar && (
                               <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#061a1a]/80 backdrop-blur-sm rounded-2xl sm:rounded-3xl">
                                  <div className="flex flex-col items-center gap-3">
                                     <div className="relative">
                                        <Loader2 size={48} className="text-[#38BDF8] animate-spin" />
                                        <CheckCircle2 size={16} className="text-[#38BDF8] absolute -bottom-1 -right-1 opacity-0 animate-pulse" />
                                     </div>
                                     <p className="text-[#38BDF8] text-[10px] font-black uppercase tracking-[0.3em]">
                                        Subiendo logo...
                                     </p>
                                  </div>
                               </div>
                             )}
                             <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-xl sm:rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden shrink-0 relative">
                                {institutionLogo ? <img src={institutionLogo} className="w-full h-full object-contain p-1 sm:p-2" alt="Logo Institucional" /> : <span className="text-white/20 text-[8px] uppercase">Sin Logo</span>}
                                {isUploadingAvatar && (
                                  <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                     <Loader2 size={28} className="text-[#38BDF8] animate-spin" />
                                  </div>
                                )}
                             </div>
                             <div className="flex-1 min-w-0">
                                <h4 className="text-[10px] sm:text-[11px] font-black text-white uppercase tracking-widest mb-0.5 sm:mb-1">Logo Institucional</h4>
                                <p className="text-[8px] sm:text-[9px] text-white/30 font-bold mb-2 sm:mb-4 uppercase tracking-widest">SVG/PNG, max 2MB</p>
                                <button
                                  onClick={() => {
                                    if (isUploadingAvatar) return; // Prevenir doble click
                                    const input = document.createElement('input');
                                    input.type = 'file';
                                    input.accept = 'image/*';
                                    input.onchange = async (e) => {
                                      const file = (e.target as HTMLInputElement).files?.[0];
                                      if (!file) return;
                                      if (!userEmail) {
                                        setToastMessage('Sin email de sesión — vuelve a iniciar sesión');
                                        setShowToast(true);
                                        return;
                                      }
                                      if (!file.type.startsWith('image/')) {
                                        setToastMessage('Solo se permiten imágenes');
                                        setShowToast(true);
                                        return;
                                      }
                                      if (file.size > 2 * 1024 * 1024) {
                                        setToastMessage('El logo no debe exceder 2MB');
                                        setShowToast(true);
                                        return;
                                      }
                                      setIsUploadingAvatar(true);
                                      try {
                                        const base64 = await new Promise<string>((resolve, reject) => {
                                          const reader = new FileReader();
                                          reader.onload = () => resolve(reader.result as string);
                                          reader.onerror = reject;
                                          reader.readAsDataURL(file);
                                        });
                                        const result = await uploadAvatar(userEmail, base64, file.name, file.type, 'logos');
                                        if (result.ok && result.fileUrl) {
                                          const newLogoUrl = result.fileUrl;
                                          setInstitutionLogo(newLogoUrl);
                                          try {
                                            await guardarDirectorProfile(userEmail, { institutionLogo: newLogoUrl });
                                          } catch (persistErr) {
                                            console.warn('[Logo] No se pudo persistir al backend:', persistErr);
                                          }
                                          setIsDirty(false);
                                          setToastMessage('✅ Logo guardado');
                                          setShowToast(true);
                                        } else {
                                          setToastMessage('❌ Error al subir logo: ' + (result.error || 'desconocido'));
                                          setShowToast(true);
                                        }
                                      } catch (err) {
                                        console.error('[Logo Upload]', err);
                                        setToastMessage('❌ Error de conexión al subir logo');
                                        setShowToast(true);
                                      } finally {
                                        setIsUploadingAvatar(false);
                                      }
                                    };
                                   input.click();
                                 }}
className={`px-3 sm:px-4 py-1.5 sm:py-2 border rounded-lg sm:rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-widest transition-all font-bold flex items-center gap-1.5 ${
                                    isUploadingAvatar
                                      ? 'bg-[#38BDF8]/30 border-[#38BDF8]/40 text-[#38BDF8] cursor-wait'
                                      : 'bg-[#38BDF8]/10 border-[#38BDF8]/20 text-[#38BDF8] hover:bg-[#38BDF8]/20'
                                  }`}
                                >
                                  {isUploadingAvatar ? (
                                    <>
                                      <Loader2 size={12} className="animate-spin" />
                                      <span>Subiendo...</span>
                                    </>
                                  ) : (
                                    <span>Subir Logo</span>
                                  )}
                                </button>
                            </div>
                         </div>

                         {/* Nombre de la institución */}
                         <div className="space-y-1.5 sm:space-y-2">
                            <label className="text-[8px] sm:text-[9px] font-black text-white/20 uppercase tracking-widest ml-1">Nombre de la Institución</label>
                            <input 
                             type="text" 
                             value={instData.name} 
                             onChange={(e) => { setInstData({...instData, name: e.target.value}); setIsDirty(true); }}
                             placeholder="Ej: TECNOLINGO AI"
                             className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl py-2.5 sm:py-4 px-3 sm:px-6 text-white text-xs font-black outline-none focus:border-[#38BDF8]/40 transition-all uppercase"
                            />
                         </div>

                         {/* Slogan */}
                         <div className="space-y-1.5 sm:space-y-2">
                            <label className="text-[8px] sm:text-[9px] font-black text-white/20 uppercase tracking-widest ml-1">Slogan Institucional</label>
                            <input 
                             type="text" 
                             value={instData.slogan} 
                             onChange={(e) => { setInstData({...instData, slogan: e.target.value}); setIsDirty(true); }}
                             placeholder="Tu lema o frase motivacional"
                             className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl py-2.5 sm:py-4 px-3 sm:px-6 text-white text-xs font-bold outline-none focus:border-[#38BDF8]/40 transition-all italic"
                            />
                         </div>

                         {/* Teléfono institucional */}
                         <div className="space-y-1.5 sm:space-y-2">
                            <label className="text-[8px] sm:text-[9px] font-black text-white/20 uppercase tracking-widest ml-1">Teléfono Institucional</label>
                            <input 
                             type="text" 
                             value={instData.phone} 
                             onChange={(e) => { setInstData({...instData, phone: formatPhoneMX(e.target.value)}); setIsDirty(true); }}
                             placeholder="800-000-0000"
                             maxLength={16}
                             className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl py-2.5 sm:py-4 px-3 sm:px-6 text-white text-xs font-bold outline-none focus:border-[#38BDF8]/40 transition-all font-mono"
                            />
                         </div>

                         {/* Email institucional */}
                         <div className="space-y-1.5 sm:space-y-2">
                            <label className="text-[8px] sm:text-[9px] font-black text-white/20 uppercase tracking-widest ml-1">Email Institucional</label>
                            <input 
                             type="email" 
                             value={instData.email} 
                             onChange={(e) => { setInstData({...instData, email: e.target.value}); setIsDirty(true); }}
                             placeholder="contacto@institucion.edu"
                             className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl py-2.5 sm:py-4 px-3 sm:px-6 text-white text-xs font-bold outline-none focus:border-[#38BDF8]/40 transition-all font-mono"
                            />
                         </div>

                         {/* Dirección */}
                         <div className="md:col-span-2 space-y-1.5 sm:space-y-2">
                            <label className="text-[8px] sm:text-[9px] font-black text-white/20 uppercase tracking-widest ml-1">Dirección</label>
                            <input 
                             type="text" 
                             value={instData.address} 
                             onChange={(e) => { setInstData({...instData, address: e.target.value}); setIsDirty(true); }}
                             placeholder="Calle, Número, Colonia, Ciudad, Estado"
                             className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl py-2.5 sm:py-4 px-3 sm:px-6 text-white text-xs font-bold outline-none focus:border-[#38BDF8]/40 transition-all"
                            />
                         </div>

                         {/* Redes sociales */}
                         <div className="md:col-span-2 pt-3 sm:pt-4 border-t border-white/5">
                            <h4 className="text-[9px] sm:text-[10px] font-black text-white/40 uppercase tracking-widest mb-3 sm:mb-6">Redes Sociales</h4>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-6">
                               <div className="space-y-1.5 sm:space-y-2">
                                  <label className="flex items-center gap-1.5 text-[8px] sm:text-[9px] font-black text-white/20 uppercase tracking-widest ml-1">
                                     <Facebook size={10} /> Facebook
                                  </label>
                                  <input 
                                   type="text" 
                                   value={instData.facebook} 
                                   onChange={(e) => { setInstData({...instData, facebook: e.target.value}); setIsDirty(true); }}
                                   placeholder="facebook.com/tuinstitucion"
                                   className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl py-2.5 sm:py-4 px-3 sm:px-6 text-white text-xs font-bold outline-none focus:border-[#38BDF8]/40 transition-all"
                                  />
                               </div>
                               <div className="space-y-1.5 sm:space-y-2">
                                  <label className="flex items-center gap-1.5 text-[8px] sm:text-[9px] font-black text-white/20 uppercase tracking-widest ml-1">
                                     <Instagram size={10} /> Instagram
                                  </label>
                                  <input 
                                   type="text" 
                                   value={instData.instagram} 
                                   onChange={(e) => { setInstData({...instData, instagram: e.target.value}); setIsDirty(true); }}
                                   placeholder="instagram.com/tuinstitucion"
                                   className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl py-2.5 sm:py-4 px-3 sm:px-6 text-white text-xs font-bold outline-none focus:border-[#38BDF8]/40 transition-all"
                                  />
                               </div>
<div className="space-y-1.5 sm:space-y-2">
                                   <label className="flex items-center gap-1.5 text-[8px] sm:text-[9px] font-black text-white/20 uppercase tracking-widest ml-1">
                                      <Linkedin size={10} /> LinkedIn
                                   </label>
                                   <input 
                                    type="text" 
                                    value={instData.linkedin} 
                                    onChange={(e) => { setInstData({...instData, linkedin: e.target.value}); setIsDirty(true); }}
                                    placeholder="linkedin.com/company/tuinstitucion"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl py-2.5 sm:py-4 px-3 sm:px-6 text-white text-xs font-bold outline-none focus:border-[#38BDF8]/40 transition-all"
                                   />
                                </div>
                             </div>
                          </div>

                          {/* Configuración Académica */}
                          <div className="md:col-span-2 pt-3 sm:pt-4 border-t border-white/5">
                             <div className="flex items-center justify-between mb-3 sm:mb-6">
                                <h4 className="text-[9px] sm:text-[10px] font-black text-[#38BDF8] uppercase tracking-widest">
                                   Configuración Académica
                                </h4>
                                <span className="text-[8px] sm:text-[9px] text-white/30 font-bold uppercase tracking-widest">
                                   {instData.carreras.length} carreras · {instData.turnos.length} turnos
                                </span>
                             </div>

                             {/* Tipo de Institución */}
                             <div className="space-y-1.5 sm:space-y-2 mb-4 sm:mb-6">
                                <label className="text-[8px] sm:text-[9px] font-black text-white/20 uppercase tracking-widest ml-1">
                                   Tipo de Institución
                                </label>
                                <select
                                 value={instData.institution_type}
                                 onChange={(e) => { setInstData({...instData, institution_type: e.target.value}); setIsDirty(true); }}
                                 className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl py-2.5 sm:py-4 px-3 sm:px-6 text-white text-xs font-black outline-none focus:border-[#38BDF8]/40 transition-all appearance-none cursor-pointer uppercase"
                                >
                                 {TIPOS_INSTITUCION.map((t) => (
                                   <option key={t} value={t} className="bg-[#0b0f19]">{t}</option>
                                 ))}
                                </select>
                             </div>

                             {/* Código Institucional — READ-ONLY con botón copiar */}
                             <div className="space-y-1.5 sm:space-y-2 mb-4 sm:mb-6">
                                <label className="text-[8px] sm:text-[9px] font-black text-white/20 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                  <Lock size={9} />
                                  Código Institucional <span className="text-[#DEFF9A]/60">(generado, no editable)</span>
                                </label>
                                <div className="flex items-stretch gap-2">
                                  <div className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl sm:rounded-2xl py-2.5 sm:py-4 px-3 sm:px-6 text-[#DEFF9A] text-xs font-black font-mono uppercase tracking-[0.15em] select-all cursor-default flex items-center">
                                    {instData.institution_code || '— sin asignar —'}
                                  </div>
                                  <button
                                    type="button"
                                    onClick={copiarCodigo}
                                    disabled={!instData.institution_code}
                                    className={`flex items-center gap-1.5 px-3 sm:px-4 rounded-xl sm:rounded-2xl border transition-all font-black uppercase text-[8px] sm:text-[9px] tracking-widest ${
                                      codeCopied
                                        ? 'bg-[#DEFF9A]/25 border-[#DEFF9A]/40 text-[#DEFF9A]'
                                        : instData.institution_code
                                          ? 'bg-[#38BDF8]/10 border-[#38BDF8]/30 text-[#38BDF8] hover:bg-[#38BDF8]/20 hover:scale-105 cursor-pointer'
                                          : 'bg-white/[0.02] border-white/5 text-white/15 cursor-not-allowed opacity-50'
                                    }`}
                                    title={instData.institution_code ? 'Copiar al portapapeles' : 'Sin código aún'}
                                  >
                                    {codeCopied ? (
                                      <>
                                        <Check size={12} />
                                        <span>Copiado</span>
                                      </>
                                    ) : (
                                      <>
                                        <Copy size={12} />
                                        <span>Copiar</span>
                                      </>
                                    )}
                                  </button>
                                </div>
                                <p className="text-[8px] text-white/20 ml-1 leading-tight">
                                  🔒 Este código es único e inmutable. Compártelo con tus alumnos y docentes
                                  para que se vinculen a tu institución al registrarse.
                                </p>
                             </div>

                             {/* Modalidad */}
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-6 mb-4 sm:mb-6">
                                <div className="space-y-1.5 sm:space-y-2">
                                   <label className="text-[8px] sm:text-[9px] font-black text-white/20 uppercase tracking-widest ml-1">
                                      Modalidad
                                   </label>
                                   <select
                                    value={instData.modalidad}
                                    onChange={(e) => { setInstData({...instData, modalidad: e.target.value}); setIsDirty(true); }}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl py-2.5 sm:py-4 px-3 sm:px-6 text-white text-xs font-bold outline-none focus:border-[#38BDF8]/40 transition-all appearance-none cursor-pointer"
                                   >
                                    {MODALIDADES.map((m) => (
                                      <option key={m} value={m} className="bg-[#0b0f19]">{m}</option>
                                    ))}
                                   </select>
                                </div>

                                <div className="space-y-1.5 sm:space-y-2">
                                   <label className="text-[8px] sm:text-[9px] font-black text-white/20 uppercase tracking-widest ml-1">
                                      Rango de Semestres
                                   </label>
                                   <input 
                                    type="text" 
                                    value={instData.semestres} 
                                    onChange={(e) => { setInstData({...instData, semestres: e.target.value}); setIsDirty(true); }}
                                    placeholder="Ej: 1-10"
                                    className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl py-2.5 sm:py-4 px-3 sm:px-6 text-white text-xs font-bold outline-none focus:border-[#38BDF8]/40 transition-all font-mono"
                                   />
                                </div>
                             </div>

                             {/* Carreras — Lista editable con botón (+) */}
                             <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
<div className="flex items-center justify-between gap-2">
                                    <label className="text-[8px] sm:text-[9px] font-black text-white/20 uppercase tracking-widest ml-1">
                                       Carreras Ofrecidas
                                    </label>
                                    <div className="flex items-center gap-1">
                                       <select
                                        value=""
                                        onChange={(e) => {
                                          const val = e.target.value;
                                          if (!val) return;
                                          if (val === '__custom__') {
                                            // Modal nativo para escribir carrera personalizada
                                            const personalizada = prompt('Nombre de la carrera personalizada (se guardará en MAYÚSCULAS):');
                                            if (personalizada && personalizada.trim()) {
                                              const normalized = personalizada.trim().toUpperCase();
                                              if (!instData.carreras.includes(normalized)) {
                                                setInstData({...instData, carreras: [...instData.carreras, normalized]});
                                                setIsDirty(true);
                                              }
                                            }
                                          } else {
                                            const normalized = val.trim().toUpperCase();
                                            if (!instData.carreras.includes(normalized)) {
                                              setInstData({...instData, carreras: [...instData.carreras, normalized]});
                                              setIsDirty(true);
                                            }
                                          }
                                          e.target.value = '';
                                        }}
                                        className="bg-[#DEFF9A]/10 border border-[#DEFF9A]/20 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-[#DEFF9A] hover:bg-[#DEFF9A]/20 transition-all px-2 py-1 sm:px-3 sm:py-1.5 cursor-pointer"
                                       >
                                          <option value="">+ Catálogo base</option>
                                          {/* Catálogo por defecto del Tec de Pánuco */}
                                          {CARRERAS_DEFAULT_TEC_PANUCO.filter(c => !instData.carreras.includes(c.toUpperCase())).map(c => (
                                            <option key={`base-${c}`} value={c}>{c}</option>
                                          ))}
                                          <option disabled className="bg-[#061a1a] text-white/30">── personalizadas ──</option>
                                          <option value="__custom__">+ Agregar personalizada…</option>
                                       </select>
                                       {/* Input oculto que aparece solo si elige "personalizada" */}
                                    </div>
                                 </div>
                                <div className="flex flex-wrap gap-2 p-3 bg-white/5 rounded-xl border border-white/10">
                                   {instData.carreras.length === 0 && (
                                     <span className="text-white/30 text-[9px] font-bold uppercase tracking-widest">Sin carreras registradas</span>
                                   )}
                                   {instData.carreras.map((c, idx) => (
                                     <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 bg-[#38BDF8]/10 border border-[#38BDF8]/20 rounded-lg">
                                        <span className="text-[8px] sm:text-[9px] font-black text-[#38BDF8] uppercase tracking-widest">{c}</span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setInstData({...instData, carreras: instData.carreras.filter((_, i) => i !== idx)});
                                            setIsDirty(true);
                                          }}
                                          className="text-red-400 hover:text-red-300 text-xs leading-none"
                                          title="Eliminar carrera"
                                        >
                                          ✕
                                        </button>
                                     </div>
                                   ))}
                                </div>
                             </div>

                             {/* Turnos — Lista editable con botón (+) */}
                             <div className="space-y-2 sm:space-y-3">
<div className="flex items-center justify-between">
                                    <label className="text-[8px] sm:text-[9px] font-black text-white/20 uppercase tracking-widest ml-1">
                                      Turnos Disponibles
                                    </label>
                                    <select
                                     value=""
                                     onChange={(e) => {
                                       const nuevo = e.target.value;
                                       if (!nuevo) return;
                                       const normalized = nuevo.trim().toUpperCase();
                                       if (!instData.turnos.includes(normalized)) {
                                         setInstData({...instData, turnos: [...instData.turnos, normalized]});
                                         setIsDirty(true);
                                       }
                                       // Resetear el select
                                       e.target.value = '';
                                     }}
                                     className="bg-[#DEFF9A]/10 border border-[#DEFF9A]/20 rounded-lg text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-[#DEFF9A] hover:bg-[#DEFF9A]/20 transition-all px-2 py-1 sm:px-3 sm:py-1.5 cursor-pointer"
                                    >
                                      <option value="">+ Agregar turno</option>
                                      {TURNOS_INSTITUCION.filter(t => !instData.turnos.includes(t.toUpperCase())).map(t => (
                                        <option key={t} value={t.toUpperCase()}>{t}</option>
                                      ))}
                                    </select>
                                 </div>
                                <div className="flex flex-wrap gap-2 p-3 bg-white/5 rounded-xl border border-white/10">
                                   {instData.turnos.length === 0 && (
                                     <span className="text-white/30 text-[9px] font-bold uppercase tracking-widest">Sin turnos registrados</span>
                                   )}
                                   {instData.turnos.map((t, idx) => (
                                     <div key={idx} className="flex items-center gap-1.5 px-2.5 py-1 bg-[#DEFF9A]/10 border border-[#DEFF9A]/20 rounded-lg">
                                        <span className="text-[8px] sm:text-[9px] font-black text-[#DEFF9A] uppercase tracking-widest">{t}</span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            setInstData({...instData, turnos: instData.turnos.filter((_, i) => i !== idx)});
                                            setIsDirty(true);
                                          }}
                                          className="text-red-400 hover:text-red-300 text-xs leading-none"
                                          title="Eliminar turno"
                                        >
                                          ✕
                                        </button>
                                     </div>
                                   ))}
                                </div>
                             </div>
                          </div>
                      </div>
                   </GlassCard>
                </motion.div>
              )}

              {activeTab === 'DIGITAL_CARD' && (
  <motion.div
    key="card-preview"
    initial={{ opacity: 0, scale: 0.95 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.95 }}
    className="space-y-4 sm:space-y-8"
  >
    <GlassCard title="Credential Preview" icon={ShieldCheck} accent="cyan">
      <div className="flex flex-col items-center gap-4 sm:gap-12 py-4 sm:py-12">
        {(() => {
          const role: 'ALUMNO' | 'DOCENTE' | 'DIRECTOR' =
            effectiveRole === 'ALUMNO' ? 'ALUMNO' :
            effectiveRole === 'DIRECTOR' ? 'DIRECTOR' : 'DOCENTE';

          const roleLabel = role === 'ALUMNO'
            ? `ALUMNO ${studentData.level || studentData.moduloTec || ''}`.trim()
            : role === 'DIRECTOR'
              ? 'DIRECTOR ACADÉMICO'
              : (teacherData.degree || 'DOCENTE');

          const controlLabel = role === 'ALUMNO' ? 'CTL' : role === 'DIRECTOR' ? 'DIR' : 'DOC';

          const controlValue = role === 'ALUMNO'
            ? (studentData.studentNumber || studentData.studentId || (studentData as any).userId || profile.userId || '')
            : role === 'DIRECTOR'
              ? ((instData as any).institution_code || '')
              : ((teacherData as any).id_empleado || '');

          const institutionCode = role === 'ALUMNO'
            ? (studentData as any).institution_code
            : role === 'DIRECTOR'
              ? (instData as any).institution_code
              : (teacherData as any).institution_code;

          const institutionName = (instData as any).institution_name
            || (studentData as any).dir_institution_name
            || (teacherData as any).dir_institution_name
            || '';

          const nivel    = role === 'ALUMNO' ? studentData.level : role === 'DOCENTE' ? teacherData.degree : undefined;
          const carrera  = role === 'ALUMNO' ? studentData.career : undefined;
          const semestre = role === 'ALUMNO' ? studentData.semestre : undefined;
          const modulo   = role === 'ALUMNO' ? studentData.moduloTec : undefined;

          const previewData = {
            name: profile.name,
            role,
            roleLabel,
            institutionName,
            institutionLogo,
            institutionCode,
            controlLabel,
            controlValue,
            nivel,
            grupo: role === 'ALUMNO' ? studentGrupo : undefined,
            modalidad: (instData as any).modalidad,
            career: carrera,
            semestre,
            modulo,
            avatar: profile.avatar,
            verified: true,
            userId: profile.userId || profile.email,
          };

          const buildPdfData = (): CredentialCardData => ({
            name: profile.name || '',
            role,
            roleLabel,
            email: profile.email,
            curp: profile.curp,
            controlLabel,
            controlValue,
            nivel,
            grupo: (studentGrupo && (studentGrupo.grupo || studentGrupo.nombre)) || undefined,
            career: carrera,
            semestre: semestre ? String(semestre) : undefined,
            modalidad: (instData as any).modalidad,
            institutionName,
            institutionCode,
            institutionLogoUrl: institutionLogo,
            avatarUrl: profile.avatar,
            userId: profile.userId || profile.email,
          });

          return (
            <>
              <CredentialPreviewCard data={previewData as any} />

              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 w-full max-w-sm">
                <button
                  onClick={() => downloadCredentialCardPdf(buildPdfData())}
                  className="flex-1 flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3.5 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white hover:bg-white/10 transition-all"
                >
                  <Download size={14} /> Descargar PDF
                </button>
                <button
                  onClick={() => shareCredentialCardPdf(buildPdfData())}
                  className="flex-1 flex items-center justify-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3.5 bg-[#DEFF9A] rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#061a1a] shadow-[0_10px_30px_rgba(222,255,154,0.4)] hover:scale-105 transition-all"
                >
                  <Share2 size={14} /> Compartir
                </button>
              </div>

              <p className="text-center text-white/30 text-[9px] sm:text-[10px] font-medium italic max-w-sm leading-relaxed px-4">
                Esta tarjeta sirve como tu identificación oficial ante alumnos de nuevo ingreso y pares académicos.
              </p>
            </>
          );
        })()}
      </div>
    </GlassCard>
  </motion.div>
)}

             {activeTab === 'PERSONAL' && (
               <motion.div 
                 key="personal"
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -20 }}
                  className="space-y-4 sm:space-y-8"
                >
                   <GlassCard title="Identidad del Profesional" icon={User} accent="cyan">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                          {/* Avatar Upload */}
                          <div className="md:col-span-2 flex items-center gap-4 sm:gap-8 p-3 sm:p-6 bg-white/5 rounded-2xl sm:rounded-3xl border border-white/5">
                            <input
                              ref={avatarFileInputRef}
                              type="file"
                              accept="image/*"
                              onChange={handleAvatarUpload}
                              className="hidden"
                            />
                            <div 
                              className="w-16 h-16 sm:w-24 sm:h-24 rounded-xl sm:rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center relative group overflow-hidden cursor-pointer shrink-0"
                              onClick={() => avatarFileInputRef.current?.click()}
                            >
                               {isUploadingAvatar ? (
                                  <div className="w-5 h-5 sm:w-6 sm:h-6 border-2 border-[#38BDF8] border-t-transparent rounded-full animate-spin" />
                               ) : (
                               <>
                                     {profile.avatar ? (
                                       <img src={profile.avatar} className="w-full h-full object-cover" alt="Avatar" />
                                     ) : (
                                       <User size={20} className="text-white/20" />
                                     )}
                                     <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all">
                                        <Camera size={18} className="text-white" />
                                     </div>
                                   </>
                               )}
                            </div>
                            <div className="flex-1 min-w-0">
                               <h4 className="text-[10px] sm:text-[11px] font-black text-white uppercase tracking-widest mb-0.5 sm:mb-1">Avatar Profesional</h4>
                               <p className="text-[8px] sm:text-[9px] text-white/30 font-bold mb-2 sm:mb-4 uppercase tracking-widest">Máx. 5MB</p>
                               <button 
                                 onClick={() => avatarFileInputRef.current?.click()}
                                 disabled={isUploadingAvatar}
                                 className="px-3 sm:px-4 py-1.5 sm:py-2 bg-[#38BDF8]/10 border border-[#38BDF8]/20 rounded-lg sm:rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-widest text-[#38BDF8] hover:bg-[#38BDF8]/20 transition-all font-bold disabled:opacity-50 disabled:cursor-not-allowed"
                               >
                                 {isUploadingAvatar ? 'Subiendo...' : 'Subir Foto'}
                               </button>
                            </div>
                          </div>
 
                        <div className="space-y-1.5 sm:space-y-2">
                           <label className="text-[8px] sm:text-[9px] font-black text-white/20 uppercase tracking-widest ml-1">Nombre Completo</label>
                           <input 
                            type="text" 
                            value={profile.name} 
                            onChange={(e) => { profile.setName(e.target.value); setIsDirty(true); }}
                            className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl py-2.5 sm:py-4 px-3 sm:px-6 text-white text-xs font-black outline-none focus:border-[#38BDF8]/40 transition-all italic"
                           />
                        </div>
                         <div className="space-y-1.5 sm:space-y-2">
                            <label className="flex items-center gap-1.5 text-[8px] sm:text-[9px] font-black text-white/20 uppercase tracking-widest ml-1">
                               Email de Cuenta <Lock size={10} />
                            </label>
                            <input
                             type="text"
                             value={profile.email || ''}
                             readOnly
                             className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl py-2.5 sm:py-4 px-3 sm:px-6 text-white/60 text-xs font-bold outline-none cursor-not-allowed"
                            />
                            <p className="text-white/15 text-[7px] ml-1 hidden sm:block">Identidad del QR. No se puede modificar.</p>
                         </div>
                         <div className="space-y-1.5 sm:space-y-2 relative">
                            <label className="text-[8px] sm:text-[9px] font-black text-white/20 uppercase tracking-widest ml-1">
                               CURP
                            </label>
                            <input
                             type="text"
                             value={profile.curp || ''}
                             onChange={(e) => { profile.setCurp?.(e.target.value.toUpperCase().slice(0, 18)); setIsDirty(true); }}
                             placeholder="CLAVE ÚNICA DE 18 CARACTERES"
                             maxLength={18}
                             className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl py-2.5 sm:py-4 px-3 sm:px-6 text-white text-xs font-bold outline-none focus:border-[#38BDF8]/40 transition-all font-mono uppercase"
                            />
                            <p className="text-white/15 text-[7px] ml-1 hidden sm:block">Tu Clave Única de Registro de Población.</p>
                         </div>
                         <div className="space-y-1.5 sm:space-y-2">
                            <label className="text-[8px] sm:text-[9px] font-black text-white/20 uppercase tracking-widest ml-1">Fecha de Nacimiento</label>
                            <input 
                             type="date" 
                             value={profile.birthDate || ''} 
                             onChange={(e) => { profile.setBirthDate?.(e.target.value); setIsDirty(true); }}
                             className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl py-2.5 sm:py-4 px-3 sm:px-6 text-white text-xs font-bold outline-none focus:border-[#38BDF8]/40 transition-all font-mono"
                            />
                         </div>
                         {effectiveRole === 'ALUMNO' && (
                           <>
                               {/* ID Usuario — solo lectura, generado por la APP */}
                               <div className="space-y-1.5 sm:space-y-2">
                                  <label className="text-[8px] sm:text-[9px] font-black text-white/20 uppercase tracking-widest ml-1">ID Usuario (solo lectura)</label>
                                  <input 
                                   type="text" 
                                   value={profile.userId || ''} 
                                   readOnly
                                   className="w-full bg-white/[0.02] border border-white/5 rounded-xl sm:rounded-2xl py-2.5 sm:py-4 px-3 sm:px-6 text-white/40 text-xs font-bold outline-none cursor-not-allowed font-mono"
                                  />
                                  <p className="text-[7px] sm:text-[8px] text-white/15 ml-1 hidden sm:block">ID único generado por la app. Aparece en tu QR code.</p>
                               </div>
                               {/* Número de Control — ID que la institución asigna */}
                               <div className="space-y-1.5 sm:space-y-2">
                                  <label className="text-[8px] sm:text-[9px] font-black text-white/20 uppercase tracking-widest ml-1">Número de Control</label>
                                  <input 
                                   type="text" 
                                   value={profile.studentNumber || ''} 
                                   onChange={(e) => { profile.setStudentNumber?.(e.target.value); setIsDirty(true); }}
                                   placeholder="Ej: 2024001234"
                                   className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl py-2.5 sm:py-4 px-3 sm:px-6 text-white text-xs font-bold outline-none focus:border-[#38BDF8]/40 transition-all font-mono"
                                  />
                               </div>
{/* OCULTO: Campo Carrera — eliminado para versión exclusiva de inglés
<div className="space-y-1.5 sm:space-y-2">
  <label>Carrera</label>
  <select>...</select>
</div>
*/}

{/* OCULTO: Campo Turno — eliminado para versión exclusiva de inglés
<div className="space-y-1.5 sm:space-y-2">
  <label>Turno</label>
  <select>...</select>
</div>
*/}

{/* OCULTO: Campo Modalidad — eliminado para versión exclusiva de inglés
<div className="space-y-1.5 sm:space-y-2">
  <label>Modalidad</label>
  ...
</div>
*/}

{/* OCULTO: Campo Semestre — eliminado para versión exclusiva de inglés
<div className="space-y-1.5 sm:space-y-2">
  <label>Semestre</label>
  <select>...</select>
</div>
*/}

                              <div className="space-y-1.5 sm:space-y-2">
                                <label className="text-[8px] sm:text-[9px] font-black text-white/20 uppercase tracking-widest ml-1">Módulo TEC</label>
                                <select
                                 value={profile.moduloTec || ''}
                                 onChange={(e) => {
                                   profile.setModuloTec?.(e.target.value);
                                   setIsDirty(true);
                                 }}
                                 className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl py-2.5 sm:py-4 px-3 sm:px-6 text-white text-xs font-bold outline-none focus:border-[#38BDF8]/40 transition-all appearance-none cursor-pointer"
                                >
                                 <option value="" className="bg-[#0b0f19]">Selecciona módulo…</option>
                                 {MODULOS_TEC.map(m => (
                                   <option key={m.value} value={m.value} className="bg-[#0b0f19]">{m.label}</option>
                                 ))}
                                </select>
                             </div>
                            </>
                          )}
{effectiveRole === 'DOCENTE' && (
                            <div className="space-y-1.5 sm:space-y-2">
                               <label className="text-[8px] sm:text-[9px] font-black text-white/20 uppercase tracking-widest ml-1">Grado Académico</label>
                               <select
                                value={profile.degree || ''}
                                onChange={(e) => { profile.setDegree?.(e.target.value); setIsDirty(true); }}
                                className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl py-2.5 sm:py-4 px-3 sm:px-6 text-[#DEFF9A] text-xs font-black outline-none focus:border-[#38BDF8]/40 transition-all appearance-none cursor-pointer uppercase"
                               >
                                <option value="" className="bg-[#0b0f19]">Selecciona grado…</option>
                                <option value="LICENCIATURA" className="bg-[#061a1a] text-[#DEFF9A]">LICENCIATURA</option>
                                <option value="INGENIERÍA" className="bg-[#061a1a] text-[#DEFF9A]">INGENIERÍA</option>
                                <option value="MAESTRÍA" className="bg-[#061a1a] text-[#DEFF9A]">MAESTRÍA</option>
                                <option value="DOCTORADO" className="bg-[#061a1a] text-[#DEFF9A]">DOCTORADO</option>
                                <option value="DOCENTE" className="bg-[#061a1a] text-[#DEFF9A]">DOCENTE</option>
                                <option value="ADMINISTRATIVO" className="bg-[#061a1a] text-[#DEFF9A]">ADMINISTRATIVO</option>
                                <option value="TÉCNICO" className="bg-[#061a1a] text-[#DEFF9A]">TÉCNICO</option>
                               </select>
                            </div>
                          )}
                           {effectiveRole === 'DIRECTOR' && (
                            <div className="space-y-1.5 sm:space-y-2">
                               <label className="text-[8px] sm:text-[9px] font-black text-white/20 uppercase tracking-widest ml-1">Grado Académico</label>
                               <select
                                value={dirData.degree}
                                onChange={(e) => { setDirData({...dirData, degree: e.target.value}); setIsDirty(true); }}
                                className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl py-2.5 sm:py-4 px-3 sm:px-6 text-[#DEFF9A] text-xs font-black outline-none focus:border-[#38BDF8]/40 transition-all appearance-none cursor-pointer uppercase"
                               >
                                <option value="" className="bg-[#0b0f19]">Selecciona grado…</option>
                                <option value="LICENCIATURA" className="bg-[#061a1a] text-[#DEFF9A]">LICENCIATURA</option>
                                <option value="INGENIERÍA" className="bg-[#061a1a] text-[#DEFF9A]">INGENIERÍA</option>
                                <option value="MAESTRÍA" className="bg-[#061a1a] text-[#DEFF9A]">MAESTRÍA</option>
                                <option value="DOCTORADO" className="bg-[#061a1a] text-[#DEFF9A]">DOCTORADO</option>
                                <option value="DOCENTE" className="bg-[#061a1a] text-[#DEFF9A]">DOCENTE</option>
                                <option value="ADMINISTRATIVO" className="bg-[#061a1a] text-[#DEFF9A]">ADMINISTRATIVO</option>
                                <option value="TÉCNICO" className="bg-[#061a1a] text-[#DEFF9A]">TÉCNICO</option>
                               </select>
                            </div>
                           )}
                           {effectiveRole === 'DIRECTOR' && (
                            <div className="space-y-1.5 sm:space-y-2">
                               <label className="text-[8px] sm:text-[9px] font-black text-white/20 uppercase tracking-widest ml-1">Años de Experiencia</label>
                               <input
                                type="number"
                                min="0"
                                max="60"
                                value={dirData.experienceYears}
                                onChange={(e) => { setDirData({...dirData, experienceYears: parseInt(e.target.value) || 0}); setIsDirty(true); }}
                                className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl py-2.5 sm:py-4 px-3 sm:px-6 text-[#DEFF9A] text-xs font-black outline-none focus:border-[#38BDF8]/40 transition-all"
                               />
                            </div>
                           )}

                          {effectiveRole === 'DOCENTE' && (
                            <div className="space-y-1.5 sm:space-y-2">
                               <label className="text-[8px] sm:text-[9px] font-black text-white/20 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                 <Lock size={9} />
                                 ID Empleado <span className="text-[#DEFF9A]/60">(auto-generado, solo lectura)</span>
                               </label>
                               <div className="flex items-stretch gap-2">
                                 <div className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl sm:rounded-2xl py-2.5 sm:py-4 px-3 sm:px-6 text-[#DEFF9A] text-xs font-black font-mono uppercase tracking-[0.15em] select-all cursor-default flex items-center">
                                   {teacherData.id_empleado || '— sin asignar —'}
                                 </div>
                                 {teacherData.id_empleado && (
                                   <button
                                     type="button"
                                     onClick={async () => {
                                       try {
                                         if (navigator.clipboard && window.isSecureContext) {
                                           await navigator.clipboard.writeText(teacherData.id_empleado);
                                         } else {
                                           const ta = document.createElement('textarea');
                                           ta.value = teacherData.id_empleado;
                                           ta.style.position = 'fixed';
                                           ta.style.left = '-9999px';
                                           document.body.appendChild(ta);
                                           ta.focus(); ta.select();
                                           document.execCommand('copy');
                                           document.body.removeChild(ta);
                                         }
                                         setToastMessage('✅ ID copiado');
                                         setShowToast(true);
                                       } catch {
                                         setToastMessage('❌ No se pudo copiar');
                                         setShowToast(true);
                                       }
                                     }}
                                     className="px-3 sm:px-4 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl text-white/40 hover:text-[#DEFF9A] hover:border-[#DEFF9A]/30 transition-all flex items-center gap-1 text-[9px] font-bold uppercase shrink-0"
                                   >
                                     <Copy size={10} /> Copiar
                                   </button>
                                 )}
                               </div>
                               <p className="text-[8px] text-white/20 ml-1">ID único asignado automáticamente por el sistema</p>
                            </div>
                          )}

                          {/* Vínculo con Director — visible para ALUMNO y DOCENTE */}
                          {(effectiveRole === 'ALUMNO' || effectiveRole === 'DOCENTE') && (
                            <div className="space-y-1.5 sm:space-y-2 md:col-span-2">
                              <label className="text-[8px] sm:text-[9px] font-black text-white/20 uppercase tracking-widest ml-1 flex items-center gap-1.5">
                                <Lock size={9} />
                                Código Institucional <span className="text-[#DEFF9A]/60">(de tu director, no editable)</span>
                              </label>
                              <div className="flex items-stretch gap-2">
                                <div className="flex-1 bg-white/[0.03] border border-white/10 rounded-xl sm:rounded-2xl py-2.5 sm:py-4 px-3 sm:px-6 text-[#DEFF9A] text-xs font-black font-mono uppercase tracking-[0.15em] select-all cursor-default flex items-center">
                                  {(effectiveRole === 'ALUMNO' ? studentData.institution_code : teacherData.institution_code) || '— sin asignar —'}
                                </div>
                                {(effectiveRole === 'ALUMNO' ? studentData.institution_code : teacherData.institution_code) && (
                                  <button
                                    type="button"
                                    onClick={async () => {
                                      const code = effectiveRole === 'ALUMNO' ? studentData.institution_code : teacherData.institution_code;
                                      if (!code) return;
                                      try {
                                        if (navigator.clipboard && window.isSecureContext) {
                                          await navigator.clipboard.writeText(code);
                                        } else {
                                          const ta = document.createElement('textarea');
                                          ta.value = code;
                                          ta.style.position = 'fixed';
                                          ta.style.left = '-9999px';
                                          document.body.appendChild(ta);
                                          ta.focus(); ta.select();
                                          document.execCommand('copy');
                                          document.body.removeChild(ta);
                                        }
                                        setToastMessage('✅ Código copiado');
                                        setShowToast(true);
                                      } catch {
                                        setToastMessage('❌ No se pudo copiar');
                                        setShowToast(true);
                                      }
                                    }}
                                    className="flex items-center gap-1.5 px-3 sm:px-4 rounded-xl sm:rounded-2xl border bg-[#38BDF8]/10 border-[#38BDF8]/30 text-[#38BDF8] hover:bg-[#38BDF8]/20 hover:scale-105 transition-all font-black uppercase text-[8px] sm:text-[9px] tracking-widest cursor-pointer"
                                    title="Copiar código al portapapeles"
                                  >
                                    <Copy size={12} />
                                    <span>Copiar</span>
                                  </button>
                                )}
                              </div>
                              <p className="text-[8px] text-white/20 ml-1 leading-tight">
                                🔒 Este código se asignó al registrarte. Para cambiarlo, contacta a tu director.
                              </p>
                            </div>
                          )}
                         <div className="space-y-1.5 sm:space-y-2">
                            <label className="text-[8px] sm:text-[9px] font-black text-white/20 uppercase tracking-widest ml-1">Teléfono Personal</label>
                            <input 
                             type="text" 
                             value={profile.phone || ''} 
                             onChange={(e) => { profile.setPhone(e.target.value); setIsDirty(true); }}
                             placeholder="846-123-4567"
                             maxLength={16}
                             className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl py-2.5 sm:py-4 px-3 sm:px-6 text-white text-xs font-bold outline-none focus:border-[#38BDF8]/40 transition-all font-mono"
                            />
                         </div>
                        <div className="md:col-span-2 space-y-1.5 sm:space-y-2">
                           <label className="text-[8px] sm:text-[9px] font-black text-white/20 uppercase tracking-widest ml-1">Abstract Académico / Bio</label>
                           <textarea 
                            value={profile.bio} 
                            onChange={(e) => { 
                              profile.setBio(e.target.value); 
                              setIsDirty(true); 
                            }}
                            rows={2}
                            placeholder="Resume tu carrera académica..."
                            className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl py-2.5 sm:py-4 px-3 sm:px-6 text-white/60 text-xs font-medium outline-none focus:border-[#38BDF8]/40 transition-all resize-none italic"
                           />
                        </div>

                        {effectiveRole === 'ALUMNO' && (
                          <div className="md:col-span-2 mt-4 sm:mt-8 p-4 sm:p-8 rounded-2xl sm:rounded-[3rem] bg-gradient-to-br from-[#DEFF9A]/10 to-transparent border border-[#DEFF9A]/20">
                             <div className="flex items-center justify-between mb-4 sm:mb-8">
                                <div>
                                   <h4 className="text-xs sm:text-[14px] font-black text-white uppercase tracking-tight italic">Docente Asignado</h4>
                                   <p className="text-[8px] sm:text-[9px] text-[#DEFF9A] font-black uppercase tracking-[0.2em] mt-1">Líder de Red de Apoyo</p>
                                </div>
                                <div className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1 sm:py-2 bg-[#DEFF9A] rounded-lg sm:rounded-xl text-[#061a1a] text-[8px] sm:text-[9px] font-black uppercase tracking-widest shadow-[0_0_20px_#DEFF9A40]">
                                   <Award size={12} /> DOCENTE
                                </div>
                             </div>
                             
                             {isLoadingTeacher ? (
                               <div className="text-center py-8 bg-black/20 rounded-2xl border border-white/5">
                                 <Loader2 size={32} className="text-[#DEFF9A] mx-auto mb-3 animate-spin" />
                                 <p className="text-white/40 text-xs font-bold uppercase tracking-wider">Cargando docente asignado...</p>
                               </div>
                             ) : assignedTeacher ? (
                               <>
                                 <div className="flex items-center gap-4 sm:gap-8 bg-black/40 p-3 sm:p-6 rounded-xl sm:rounded-[2rem] border border-white/5 relative overflow-hidden group">
                                     <div className="w-14 h-14 sm:w-20 sm:h-20 rounded-xl sm:rounded-2xl border border-white/10 overflow-hidden shrink-0 flex items-center justify-center bg-white/5">
                                       <User size={20} className="text-white/20" />
                                     </div>
                                    <div className="flex-1 min-w-0">
                                       <h5 className="text-white text-sm sm:text-xl font-black uppercase tracking-tighter mb-0.5 sm:mb-1 truncate">{assignedTeacher.name}</h5>
                                       <div className="flex flex-wrap items-center gap-1.5 sm:gap-3">
                                           <span className="text-white/40 text-[8px] sm:text-[10px] font-mono tracking-widest uppercase">ID: {assignedTeacher.id}</span>
                                          <span className="text-[#DEFF9A] text-[8px] sm:text-[9px] font-black uppercase tracking-widest">{assignedTeacher.status === 'ACTIVE' ? 'ACTIVO' : 'INACTIVO'}</span>
                                       </div>
                                    </div>
                                    <div className="flex flex-col items-center gap-1 sm:gap-2 shrink-0">
                                       <div className="flex gap-0.5">
                                          {[1,2,3,4,5].map(i => (
                                            <Zap key={i} size={12} fill={i <= 5 ? "#DEFF9A" : "transparent"} className={i <= 5 ? "text-[#DEFF9A]" : "text-white/10"} />
                                          ))}
                                       </div>
                                       <p className="text-[8px] sm:text-[10px] font-black text-white/40 uppercase tracking-widest">DOCENTE</p>
                                    </div>
                                    
                                    <div className="absolute inset-0 bg-gradient-to-r from-[#DEFF9A]/05 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                                 </div>
                                 
                                 <div className="mt-3 sm:mt-6 flex flex-col sm:flex-row gap-2 sm:gap-4">
                                     <button 
                                       onClick={() => {
                                         if (onContactTeacher) {
                                           onContactTeacher(
                                             assignedTeacher.email,
                                             "Hello Teacher, I would like some support please."
                                           );
                                         }
                                       }}
                                      className="flex-1 py-2.5 sm:py-4 px-4 sm:px-6 bg-white/5 border border-white/10 hover:border-[#DEFF9A]/45 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white/60 hover:text-white hover:bg-[#DEFF9A]/5 transition-all flex items-center justify-center gap-2"
                                    >
                                       <Mail size={14} /> Contactar
                                     </button>
                                     <button 
                                       onClick={() => setIsCalendarOpen(true)}
                                       className="flex-1 py-2.5 sm:py-4 px-4 sm:px-6 bg-gradient-to-r from-[#38BDF8] to-[#0284c7] border border-[#38BDF8]/20 rounded-xl sm:rounded-2xl text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-white hover:shadow-[0_0_30px_rgba(56,189,248,0.35)] hover:scale-[1.02] hover:bg-opacity-95 transition-all flex items-center justify-center gap-2"
                                     >
                                       <Calendar size={14} /> Agendar
                                     </button>
                                 </div>
                               </>
                             ) : (
                               <div className="text-center py-8 bg-black/20 rounded-2xl border border-white/5">
                                 <User size={32} className="text-white/10 mx-auto mb-3" />
                                 <p className="text-white/40 text-xs font-bold uppercase tracking-wider">Sin docente asignado</p>
                                 <p className="text-white/20 text-[10px] mt-1">Aún no estás vinculado a un grupo con docente</p>
                               </div>
                              )}
                           </div>
                         )}

                      </div>
                   </GlassCard>
               </motion.div>
             )}

             {activeTab === 'PROFESSIONAL' && (
               <motion.div 
                 key="professional"
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -20 }}
                  className="space-y-4 sm:space-y-8"
                >
                   <GlassCard title="Trayectoria & Certificaciones" icon={Award} accent="cyan">
                      <div className="space-y-6 sm:space-y-12">
                         <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                             <div className="space-y-1.5 sm:space-y-2">
                               <label className="text-[8px] sm:text-[9px] font-black text-white/20 uppercase tracking-widest ml-1">Grado Académico Principal</label>
                               <select
                                value={teacherData.degree}
                                onChange={(e) => { setTeacherData({...teacherData, degree: e.target.value}); setIsDirty(true); }}
                                className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl py-2.5 sm:py-4 px-3 sm:px-6 text-[#DEFF9A] text-xs font-black outline-none focus:border-[#38BDF8]/40 transition-all appearance-none cursor-pointer uppercase"
                               >
                                <option value="" className="bg-[#0b0f19]">Selecciona grado…</option>
                                <option value="LICENCIATURA" className="bg-[#061a1a] text-[#DEFF9A]">LICENCIATURA</option>
                                <option value="INGENIERÍA" className="bg-[#061a1a] text-[#DEFF9A]">INGENIERÍA</option>
                                <option value="MAESTRÍA" className="bg-[#061a1a] text-[#DEFF9A]">MAESTRÍA</option>
                                <option value="DOCTORADO" className="bg-[#061a1a] text-[#DEFF9A]">DOCTORADO</option>
                                <option value="DOCENTE" className="bg-[#061a1a] text-[#DEFF9A]">DOCENTE</option>
                                <option value="ADMINISTRATIVO" className="bg-[#061a1a] text-[#DEFF9A]">ADMINISTRATIVO</option>
                                <option value="TÉCNICO" className="bg-[#061a1a] text-[#DEFF9A]">TÉCNICO</option>
                               </select>
                             </div>
                             <div className="space-y-1.5 sm:space-y-2">
                                <label className="text-[8px] sm:text-[9px] font-black text-white/20 uppercase tracking-widest ml-1">Años de Experiencia</label>
                                <div className="flex items-center gap-3 sm:gap-4">
                                   <input 
                                    type="number" 
                                    min="0" max="50"
                                    value={teacherData.years_of_experience}
                                    onChange={(e) => { setTeacherData({...teacherData, years_of_experience: parseInt(e.target.value) || 0}); setIsDirty(true); }}
                                    className="w-20 sm:w-24 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl py-2.5 sm:py-4 px-3 sm:px-6 text-white text-xs font-black outline-none focus:border-[#38BDF8]/40 transition-all"
                                   />
                                   <span className="text-[9px] sm:text-[10px] font-black text-white/20 uppercase tracking-widest">Años</span>
                                </div>
                             </div>
                         </div>

                         {/* Repository of Certifications */}
                         <div className="space-y-3 sm:space-y-6">
                            <div className="flex justify-between items-end">
                               <div>
                                  <h4 className="text-[10px] sm:text-[12px] font-black text-white uppercase tracking-tight">Certificaciones</h4>
                                  <p className="text-[8px] sm:text-[9px] text-white/30 font-bold uppercase tracking-widest">Respaldo de tu formación.</p>
                               </div>
                               <button 
                                 onClick={() => setShowCertModal(true)}
                                 className="flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-4 py-1.5 sm:py-2 bg-[#DEFF9A]/10 text-[#DEFF9A] border border-[#DEFF9A]/20 rounded-lg sm:rounded-xl text-[8px] sm:text-[9px] font-black uppercase tracking-widest hover:bg-[#DEFF9A]/20 transition-all"
                               >
                                 <Plus size={14} /> Añadir Documento
                              </button>
                           </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 sm:gap-4">
                               <AnimatePresence>
                                  {teacherData.certifications.map(cert => (
                                     <motion.div 
                                       key={cert.id}
                                       initial={{ opacity: 0, y: 10 }}
                                       animate={{ opacity: 1, y: 0 }}
                                       className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-black/40 border border-white/5 flex items-center justify-between group"
                                     >
                                        <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
                                           <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center shrink-0 ${
                                             cert.fileId ? 'bg-[#DEFF9A]/10 text-[#DEFF9A]' : 'bg-white/5 text-white/40'
                                           }`}>
                                              <FileText size={16} />
                                           </div>
                                           <div className="min-w-0">
                                              <div className="flex items-center gap-1.5">
                                                <p className="text-white text-[9px] sm:text-[10px] font-black uppercase truncate">{cert.name}</p>
                                                {cert.fileId && (
                                                  <span className="text-[6px] font-black text-[#DEFF9A] bg-[#DEFF9A]/10 border border-[#DEFF9A]/20 px-1 py-0.5 rounded uppercase tracking-widest shrink-0">
                                                    DRIVE
                                                  </span>
                                                )}
                                              </div>
                                              <p className="text-white/20 text-[7px] sm:text-[8px] font-bold uppercase tracking-widest">DESDE: {cert.date}</p>
                                           </div>
                                        </div>
                                         <div className="flex gap-1.5 sm:gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                            <button 
                                              onClick={() => handleDownloadCertification(cert)}
                                              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-all"
                                              title={cert.url ? 'Ver documento' : 'Sin documento adjunto'}
                                            >
                                               <Download size={12} />
                                            </button>
                                            <button 
                                              onClick={() => handleDeleteCertification(cert.id)}
                                              className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg bg-red-500/10 flex items-center justify-center text-red-500/40 hover:text-red-500 transition-all"
                                            >
                                               <Trash2 size={12} />
                                            </button>
                                         </div>
                                     </motion.div>
                                  ))}
                               </AnimatePresence>
                            </div>
                         </div>

                         <div className="p-4 sm:p-8 bg-[#38BDF8]/5 border border-[#38BDF8]/20 rounded-2xl sm:rounded-[2.5rem] relative overflow-hidden group">
                            <div className="absolute top-0 right-0 w-24 sm:w-32 h-full bg-[#38BDF8]/5 -skew-x-12 translate-x-12 sm:translate-x-16" />
                            <div className="flex items-center gap-3 sm:gap-6 relative z-10">
                               <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl bg-[#38BDF8]/10 border border-[#38BDF8]/20 flex items-center justify-center text-[#38BDF8] shadow-[0_0_20px_rgba(56,189,248,0.2)] shrink-0">
                                  <Award size={20} />
                               </div>
                               <div className="flex-1 min-w-0">
                                  <h4 className="text-[10px] sm:text-[13px] font-black text-white uppercase tracking-tight italic">Excelencia Académica</h4>
                                  <p className="text-[8px] sm:text-[10px] text-white/40 font-bold uppercase tracking-widest leading-relaxed">Perfil visible para la Red de Apoyo.</p>
                               </div>
                                <div className="text-right shrink-0">
                                   <p className="text-lg sm:text-2xl font-black text-[#DEFF9A]">{calculateProfileCompletion()}%</p>
                                   <p className="text-[7px] sm:text-[8px] font-black text-white/20 uppercase tracking-widest">{calculateProfileCompletion() === 100 ? 'Validado' : 'Incompleto'}</p>
                                </div>
                            </div>
                         </div>
                     </div>
                  </GlassCard>
               </motion.div>
             )}

             {/* Mi Institución — vista para ALUMNO/DOCENTE con director vinculado */}
             {activeTab === 'INSTITUTION' && (
                <motion.div
                  key="institution"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4 sm:space-y-6"
                >
                  {(() => {
                    // Tomar datos del director hidratados (vienen prefijados con dir_)
                    const dirData = (effectiveRole === 'ALUMNO' ? studentData : teacherData) as any;
                    const dirCode = dirData.institution_code || '';
                    // Si NO hay datos hidratados del director (perfil.dir_*), usamos placeholders mínimos
                    const institutionName = dirData.dir_institution_name || 'Tu institución';
                    const institutionType = dirData.dir_institution_type || '';
                    const institutionLogo = dirData.dir_institution_logo || '';
                    const slogan = dirData.dir_slogan || '';
                    const instPhone = dirData.dir_inst_phone || '';
                    const instEmail = dirData.dir_inst_email || '';
                    const address = dirData.dir_address || '';
                    const carreras = dirData.dir_carreras || [];
                    const turnos = dirData.dir_turnos || [];
                    const modalidad = dirData.dir_modalidad || '';
                    const directorEmailVal = dirData.director_email || '';
                    const hasData = !!(dirData.dir_institution_name || dirData.dir_institution_type);

                    return (
                      <div className="space-y-4 sm:space-y-6">
                        {/* Header card con logo + nombre */}
                        <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-[#DEFF9A]/10 to-transparent border border-[#DEFF9A]/20 relative overflow-hidden">
                          <div className="flex items-start gap-4 sm:gap-6 relative z-10">
                            <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-xl sm:rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center overflow-hidden shrink-0">
                              {institutionLogo ? (
                                <img src={institutionLogo} className="w-full h-full object-contain p-1 sm:p-2" alt="Logo" />
                              ) : (
                                <Building size={32} className="text-white/20" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="text-lg sm:text-2xl font-black text-white uppercase tracking-tighter italic leading-tight">
                                {institutionName}
                              </h3>
                              {institutionType && (
                                <p className="text-[#DEFF9A] text-[8px] sm:text-[10px] font-black uppercase tracking-widest mt-1">
                                  {institutionType}
                                </p>
                              )}
                              {slogan && (
                                <p className="text-white/40 text-[10px] sm:text-xs italic mt-1 sm:mt-2">"{slogan}"</p>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Aviso si no hay datos hidratados */}
                        {!hasData && (
                          <div className="p-4 sm:p-6 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                            <p className="text-amber-300 text-[10px] sm:text-xs font-bold uppercase tracking-widest leading-tight">
                              ⚠️ El director de tu institución aún no ha completado la configuración institucional.
                              Solo se muestra el código de vínculo ({dirCode || '—'}). Pídele al director que complete su perfil.
                            </p>
                          </div>
                        )}

                        {/* Datos de contacto institucional */}
                        {(instPhone || instEmail || address) && (
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 sm:gap-4">
                            {instPhone && (
                              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10">
                                <p className="text-white/30 text-[8px] sm:text-[9px] font-black uppercase tracking-widest mb-1">Teléfono Institucional</p>
                                <p className="text-white text-xs sm:text-sm font-bold">{instPhone}</p>
                              </div>
                            )}
                            {instEmail && (
                              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10">
                                <p className="text-white/30 text-[8px] sm:text-[9px] font-black uppercase tracking-widest mb-1">Email Institucional</p>
                                <p className="text-white text-xs sm:text-sm font-bold">{instEmail}</p>
                              </div>
                            )}
                            {address && (
                              <div className="p-3 sm:p-4 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 md:col-span-2">
                                <p className="text-white/30 text-[8px] sm:text-[9px] font-black uppercase tracking-widest mb-1">Dirección</p>
                                <p className="text-white text-xs sm:text-sm font-bold">{address}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Académico: carreras y turnos */}
                        {(carreras.length > 0 || turnos.length > 0 || modalidad) && (
                          <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/5 border border-white/10 space-y-4">
                            <h4 className="text-[10px] sm:text-[11px] font-black text-[#DEFF9A] uppercase tracking-widest">
                              Configuración Académica
                            </h4>

                            {carreras.length > 0 && (
                              <div>
                                <p className="text-white/30 text-[8px] sm:text-[9px] font-black uppercase tracking-widest mb-2">
                                  Carreras ({carreras.length})
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {carreras.map((c: string, idx: number) => (
                                    <span key={idx} className="px-2.5 py-1 bg-[#38BDF8]/10 border border-[#38BDF8]/20 rounded-lg text-[8px] sm:text-[10px] font-black text-[#38BDF8] uppercase tracking-widest">
                                      {c}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {turnos.length > 0 && (
                              <div>
                                <p className="text-white/30 text-[8px] sm:text-[9px] font-black uppercase tracking-widest mb-2">
                                  Turnos ({turnos.length})
                                </p>
                                <div className="flex flex-wrap gap-2">
                                  {turnos.map((t: string, idx: number) => (
                                    <span key={idx} className="px-2.5 py-1 bg-[#DEFF9A]/10 border border-[#DEFF9A]/20 rounded-lg text-[8px] sm:text-[10px] font-black text-[#DEFF9A] uppercase tracking-widest">
                                      {t}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            )}

                            {modalidad && (
                              <div>
                                <p className="text-white/30 text-[8px] sm:text-[9px] font-black uppercase tracking-widest mb-1">Modalidad</p>
                                <p className="text-white text-xs sm:text-sm font-bold uppercase">{modalidad}</p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Código y director */}
                        <div className="p-4 sm:p-6 rounded-2xl sm:rounded-3xl bg-white/5 border border-white/10 space-y-3">
                          <h4 className="text-[10px] sm:text-[11px] font-black text-white/30 uppercase tracking-widest">
                            Vínculo Institucional
                          </h4>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <div>
                              <p className="text-white/30 text-[8px] sm:text-[9px] font-black uppercase tracking-widest mb-1">Código</p>
                              <p className="text-[#DEFF9A] text-xs sm:text-sm font-black font-mono uppercase">{dirCode || '—'}</p>
                            </div>
                            <div>
                              <p className="text-white/30 text-[8px] sm:text-[9px] font-black uppercase tracking-widest mb-1">Director</p>
                              <p className="text-white text-xs sm:text-sm font-bold">{directorEmailVal || '—'}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </motion.div>
             )}

             {activeTab === 'SECURITY' && (
               <motion.div
                 key="security"
                 initial={{ opacity: 0, x: 20 }}
                 animate={{ opacity: 1, x: 0 }}
                 exit={{ opacity: 0, x: -20 }}
                  className="space-y-4 sm:space-y-8"
                >
                   <GlassCard title="Protección de Acceso" icon={Lock} accent="orange">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-8">
                         <div className="space-y-1.5 sm:space-y-2">
                            <label className="text-[8px] sm:text-[9px] font-black text-white/20 uppercase tracking-widest ml-1">Contraseña Actual</label>
                            <input type="password" value="********" readOnly className="w-full bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl py-2.5 sm:py-4 px-3 sm:px-6 text-white/40 text-xs font-bold outline-none" />
                         </div>
                         <div className="flex items-end">
                            <button className="w-full py-2.5 sm:py-4 rounded-xl sm:rounded-2xl bg-[#DEFF9A]/5 border border-[#DEFF9A]/20 text-[9px] sm:text-[10px] font-black uppercase tracking-widest text-[#DEFF9A] hover:bg-[#DEFF9A]/10 transition-all">Cambiar Password</button>
                         </div>
                        
                         {effectiveRole === 'ALUMNO' && (
                           <div className="md:col-span-2 space-y-1.5 sm:space-y-2">
                              <label className="text-[8px] sm:text-[9px] font-black text-white/20 uppercase tracking-widest ml-1">Token de Acceso Unificado</label>
                              <div className="flex items-center gap-3 sm:gap-4">
                                 <input 
                                   value="ALU-DALLAS-2026-X812-PROTO" 
                                   readOnly 
                                   className="flex-1 bg-white/5 border border-white/10 rounded-xl sm:rounded-2xl py-2.5 sm:py-4 px-3 sm:px-6 text-[#38BDF8] text-xs font-mono font-black outline-none"
                                 />
                                 <button className="p-2.5 sm:p-4 bg-white/5 border border-white/10 rounded-xl sm:rounded-[1.5rem] text-white/40 hover:text-white transition-all">
                                    <Zap size={16} />
                                 </button>
                              </div>
                              <p className="text-[7px] sm:text-[8px] text-white/20 font-bold uppercase tracking-widest mt-1 ml-1 hidden sm:block">Utiliza este token para vincular dispositivos de inmersión AR externos.</p>
                           </div>
                         )}

                         <div className="md:col-span-2 p-4 sm:p-8 bg-black/40 rounded-2xl sm:rounded-[2.5rem] border border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 sm:gap-6 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-gradient-to-r from-orange-500/05 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="flex items-center gap-3 sm:gap-6 relative z-10">
                               <div className="w-10 h-10 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 shadow-[0_0_20px_rgba(249,115,22,0.1)] shrink-0">
                                  <Fingerprint size={20} />
                               </div>
                               <div>
                                  <h4 className="text-[10px] sm:text-[13px] font-black text-white uppercase tracking-tight">Acceso Biométrico / 2FA</h4>
                                  <p className="text-[8px] sm:text-[10px] text-white/40 font-bold uppercase tracking-widest leading-relaxed">
                                    {effectiveRole === 'ALUMNO' 
                                      ? 'Protege tu identidad inmersiva con FaceID o TouchID.' 
                                      : 'Capa extra de protección para tu firma institucional.'}
                                  </p>
                               </div>
                            </div>
                            <button className="w-full sm:w-auto px-6 sm:px-8 py-2.5 sm:py-3 rounded-xl bg-orange-500 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:shadow-[0_0_20px_#F9731680] transition-all relative z-10">Configurar</button>
                         </div>

                         {effectiveRole === 'ALUMNO' && (
                           <div className="md:col-span-2 p-4 sm:p-8 bg-black/20 rounded-2xl sm:rounded-[2.5rem] border border-white/5">
                              <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-6">
                                 <Monitor size={16} className="text-white/20" />
                                 <h4 className="text-[9px] sm:text-[11px] font-black text-white uppercase tracking-tight">Sesiones Activas</h4>
                              </div>
                              <div className="space-y-2 sm:space-y-4">
                                 <div className="flex items-center justify-between p-2.5 sm:p-4 bg-white/[0.02] border border-white/5 rounded-xl sm:rounded-2xl">
                                    <div className="flex items-center gap-2.5 sm:gap-4 min-w-0">
                                       <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[#38BDF8]/10 text-[#38BDF8] flex items-center justify-center shrink-0">
                                          <Monitor size={16} />
                                       </div>
                                       <div className="min-w-0">
                                          <p className="text-white text-[9px] sm:text-[10px] font-black uppercase truncate">Web Browser</p>
                                          <p className="text-white/20 text-[7px] sm:text-[8px] font-bold uppercase tracking-widest">ACTUAL • DALLAS, TX</p>
                                       </div>
                                    </div>
                                    <span className="px-2 sm:px-3 py-0.5 sm:py-1 rounded-full bg-[#4ADE80]/10 text-[#4ADE80] text-[7px] sm:text-[8px] font-black uppercase shrink-0">Online</span>
                                 </div>
                              </div>
                          </div>
                        )}
                     </div>
                  </GlassCard>
               </motion.div>
             )}

             {activeTab === 'MODULES' && (
                <motion.div 
                  key="modules"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-8"
                >
                   <ModuleManagement />
                </motion.div>
             )}
          </AnimatePresence>
       </div>

       {/* Save Panel — lateral colapsable. NO bloquea los campos del formulario. */}
       <AnimatePresence>
          {isDirty && (
            <motion.div
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 100, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 260, damping: 26 }}
              className="fixed right-3 sm:right-6 bottom-3 sm:bottom-6 z-[100] flex items-end gap-2"
            >
              {/* Botón colapsable (label) */}
              {isSavePanelCollapsed ? (
                <button
                  onClick={() => setIsSavePanelCollapsed(false)}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-[#38BDF8] text-white shadow-[0_10px_30px_rgba(56,189,248,0.4)] flex items-center justify-center animate-pulse hover:scale-110 transition-transform"
                  title="Tienes cambios sin guardar"
                  aria-label="Expandir panel de cambios"
                >
                  <Save size={18} className="sm:size-5" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-amber-400 border-2 border-[#061a1a]" />
                </button>
              ) : (
                <div className="bg-[#38BDF8] rounded-2xl sm:rounded-[2rem] p-3 sm:p-4 flex items-center gap-2 sm:gap-3 shadow-[0_20px_50px_rgba(56,189,248,0.3)] max-w-[calc(100vw-1.5rem)]">
                  <div className="flex items-center gap-2 sm:gap-3 text-white shrink-0">
                    <Save size={16} className="sm:size-5" />
                    <div className="hidden sm:block">
                      <p className="text-[10px] font-black uppercase tracking-widest">Cambios detectados</p>
                      <p className="text-[8px] font-bold opacity-80">Guarda para aplicar en tu perfil universitario</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
                    <button
                      onClick={() => setIsSavePanelCollapsed(true)}
                      className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-white/10 text-white/80 hover:bg-white/20 transition-all flex items-center justify-center"
                      title="Ocultar panel"
                      aria-label="Ocultar panel de cambios"
                    >
                      <X size={14} className="sm:size-4" />
                    </button>
                    <button
                      onClick={handleDiscard}
                      disabled={isSaving}
                      className="px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-white/20 text-white text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-white/30 transition-all font-bold disabled:opacity-60 disabled:cursor-wait"
                    >
                      Descartar
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={isSaving}
                      className="px-3 sm:px-5 py-2 sm:py-2.5 rounded-lg sm:rounded-xl bg-white text-[#38BDF8] text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:scale-105 transition-all shadow-xl font-bold disabled:opacity-60 disabled:cursor-wait disabled:hover:scale-100"
                    >
                      {isSaving ? 'Guardando…' : 'Confirmar'}
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
       </AnimatePresence>

       {/* Modal de aviso: cambios sin guardar al cambiar de tab */}
       <AnimatePresence>
           {showUnsavedModal && (
            <div className="fixed inset-0 z-[150] flex items-center justify-center p-3 sm:p-4">
               <motion.div
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 exit={{ opacity: 0 }}
                 onClick={() => setShowUnsavedModal(false)}
                 className="absolute inset-0 bg-[#020b18]/85 backdrop-blur-md"
               />
               <motion.div
                 initial={{ opacity: 0, scale: 0.95, y: 20 }}
                 animate={{ opacity: 1, scale: 1, y: 0 }}
                 exit={{ opacity: 0, scale: 0.95, y: 20 }}
                 className="relative z-10 w-full max-w-sm bg-[#0b0f19] border border-amber-500/30 rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)]"
               >
                 <div className="flex items-start gap-3 sm:gap-4 mb-4 sm:mb-6">
                   <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                     <AlertTriangle size={18} />
                   </div>
                   <div>
                     <h3 className="text-white text-sm sm:text-base font-black uppercase tracking-tight">Cambios sin guardar</h3>
                     <p className="text-white/50 text-[9px] sm:text-[10px] font-bold uppercase tracking-widest mt-1 leading-relaxed">
                       ¿Qué quieres hacer antes de cambiar de sección?
                     </p>
                   </div>
                 </div>

                 <div className="flex flex-col gap-2">
                   <button
                     onClick={handleSaveAndSwitch}
                     disabled={isSaving}
                     className="w-full py-2.5 sm:py-4 rounded-xl bg-[#DEFF9A] text-[#061a1a] text-[9px] sm:text-[10px] font-black uppercase tracking-widest shadow-[0_0_25px_rgba(222,255,154,0.3)] hover:scale-[1.02] active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-wait"
                   >
                     <Save size={14} /> {isSaving ? 'Guardando…' : 'Guardar y cambiar'}
                   </button>
                   <button
                     onClick={handleDiscardAndSwitch}
                     disabled={isSaving}
                     className="w-full py-2.5 sm:py-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all disabled:opacity-60 disabled:cursor-wait"
                   >
                     Descartar y cambiar
                   </button>
                   <button
                     onClick={() => { setShowUnsavedModal(false); setPendingTab(null); }}
                     disabled={isSaving}
                     className="w-full py-2.5 sm:py-4 rounded-xl bg-white/5 text-white/60 text-[9px] sm:text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition-all disabled:opacity-60"
                   >
                     Quedarme aquí
                   </button>
                 </div>
               </motion.div>
            </div>
           )}
       </AnimatePresence>

        <AnimatePresence>
           {isCalendarOpen && (
             <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4">
                {/* Backdrop */}
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => setIsCalendarOpen(false)}
                  className="absolute inset-0 bg-[#020b18]/80 backdrop-blur-md"
                />
                
                {/* Modal Container */}
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative z-10 w-full max-w-md bg-[#0b0f19] border border-gray-800 rounded-2xl sm:rounded-[3rem] p-4 sm:p-8 overflow-hidden shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)] max-h-[90vh] overflow-y-auto"
                >
                   {/* Header Decoration */}
                   <div className="absolute top-0 right-0 w-24 sm:w-32 h-24 sm:h-32 bg-[#DEFF9A]/5 blur-[40px] -translate-y-1/2 translate-x-1/2 pointer-events-none" />
                   
                    <div className="flex justify-between items-start mb-4 sm:mb-6">
                       <div>
                          <span className="text-[#DEFF9A] text-[7px] sm:text-[8px] font-black uppercase tracking-[0.3em]">Reserva de Red de Apoyo</span>
                          <h3 className="text-white text-base sm:text-xl font-black italic tracking-tight uppercase mt-1">Agenda de Asesoría</h3>
                          <p className="text-[8px] sm:text-[10px] text-white/40 font-bold uppercase tracking-widest mt-1">{assignedTeacher?.name || 'Docente'}</p>
                       </div>
                       <button 
                         onClick={() => setIsCalendarOpen(false)}
                         className="p-2 sm:p-3 bg-white/5 hover:bg-white/10 rounded-xl sm:rounded-2xl text-white/40 hover:text-white transition-all border border-white/5"
                       >
                          <X size={14} />
                       </button>
                    </div>
                    
                    {/* Calendar Slots */}
                    <div className="space-y-3 sm:space-y-4">
                       <div className="p-2.5 sm:p-4 bg-white/[0.02] border border-white/5 rounded-xl sm:rounded-2xl text-center">
                          <p className="text-[9px] sm:text-[11px] font-black text-white/60 uppercase tracking-widest">Horarios Disponibles</p>
                       </div>
                       
                       {isLoadingSlots ? (
                         <div className="py-12 text-center">
                           <Loader2 size={24} className="text-[#DEFF9A] mx-auto mb-3 animate-spin" />
                           <p className="text-white/40 text-[10px] font-mono uppercase tracking-wider">Cargando horarios...</p>
                         </div>
                       ) : availableSlots.length === 0 ? (
                         <div className="py-12 text-center border-2 border-dashed border-white/10 rounded-2xl">
                           <Calendar size={32} className="text-white/10 mx-auto mb-3" />
                           <p className="text-white/40 text-[10px] font-bold uppercase tracking-widest">Sin horarios disponibles</p>
                           <p className="text-white/20 text-[8px] mt-1">Tu docente aún no ha publicado horarios de asesoría</p>
                         </div>
                       ) : (
                         <div className="grid grid-cols-2 gap-2 sm:gap-3">
                           {availableSlots.map(slot => {
                             const slotLabel = `${slot.dia.substring(0, 3)} ${slot.hora}`;
                             const isSelected = selectedSlot === slot.asesoria_id;
                             return (
                                <button
                                  key={slot.asesoria_id}
                                  onClick={() => setSelectedSlot(slot.asesoria_id)}
                                  className={`p-2.5 sm:p-4 rounded-xl sm:rounded-2xl border text-left transition-all flex flex-col justify-between h-20 sm:h-28 group ${
                                    isSelected 
                                      ? 'bg-[#DEFF9A]/10 border-[#DEFF9A] text-[#DEFF9A] shadow-[0_0_20px_rgba(222,255,154,0.15)]'
                                      : 'bg-[#0f1424] hover:bg-[#141b30] border-gray-800 text-white/60 hover:text-white hover:border-gray-700'
                                  }`}
                                >
                                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider">{slotLabel}</span>
                                  <span className={`text-[7px] sm:text-[8px] font-bold uppercase tracking-widest leading-none ${isSelected ? 'text-[#DEFF9A]/60' : 'text-white/20'}`}>
                                     {slot.plataforma === 'GOOGLE_MEET' ? 'Meet' : 'Teams'} • {slot.duracion_minutos}min
                                  </span>
                                  <span className={`text-[6px] sm:text-[7px] font-bold uppercase tracking-widest leading-none truncate ${isSelected ? 'text-[#DEFF9A]/50' : 'text-white/15'}`}>
                                     📍 {slot.lugar || 'SIN ESPECIFICAR'}
                                  </span>
                                </button>
                             );
                           })}
                         </div>
                       )}
                    </div>

                    {/* Footer Controls */}
                    <div className="mt-4 sm:mt-8 pt-3 sm:pt-6 border-t border-gray-800 flex items-center justify-between gap-3 sm:gap-4">
                       <p className="text-[8px] sm:text-[9px] text-white/30 uppercase tracking-widest max-w-[150px] sm:max-w-[200px] hidden sm:block">
                          La confirmación sincroniza con tu Google Calendar y Teams.
                       </p>
                       <button
                          disabled={!selectedSlot || isLoadingSlots}
                          onClick={() => {
                            if (selectedSlot) {
                              const slot = availableSlots.find(s => s.asesoria_id === selectedSlot);
                              setToastMessage(`Sesión agendada: ${slot?.dia} ${slot?.hora}`);
                              setShowToast(true);
                              setIsCalendarOpen(false);
                              setSelectedSlot(null);
                            }
                          }}
                          className="px-6 sm:px-8 py-3 sm:py-4 bg-[#DEFF9A] text-[#061a1a] font-black text-[9px] sm:text-[10px] tracking-widest uppercase rounded-xl sm:rounded-[1.5rem] hover:scale-105 transition-all shadow-[0_10px_20px_rgba(222,255,154,0.25)] disabled:opacity-30 disabled:pointer-events-none"
                        >
                           Confirmar
                        </button>
                    </div>
                </motion.div>
             </div>
           )}
        </AnimatePresence>

        {/* Modal Agregar Certificación */}
        <AnimatePresence>
           {showCertModal && (
             <div className="fixed inset-0 z-[120] flex items-center justify-center p-3 sm:p-4">
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  onClick={() => { setShowCertModal(false); setCertFile(null); }}
                  className="absolute inset-0 bg-[#020b18]/80 backdrop-blur-md"
                />
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  className="relative z-10 w-full max-w-md bg-[#0b0f19] border border-gray-800 rounded-2xl sm:rounded-[2rem] p-4 sm:p-8 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.8)]"
                >
                   <div className="flex justify-between items-start mb-6">
                      <div>
                         <span className="text-[#DEFF9A] text-[7px] sm:text-[8px] font-black uppercase tracking-[0.3em]">Nueva Certificación</span>
                         <h3 className="text-white text-base sm:text-xl font-black italic tracking-tight uppercase mt-1">Agregar Documento</h3>
                      </div>
                      <button onClick={() => { setShowCertModal(false); setCertFile(null); }} className="p-2 bg-white/5 hover:bg-white/10 rounded-xl text-white/40 hover:text-white transition-all border border-white/5">
                         <X size={14} />
                      </button>
                   </div>
                   <div className="space-y-4">
                      <div>
                        <label className="text-[8px] sm:text-[9px] font-black text-white/30 uppercase tracking-widest block mb-1">Nombre de la Certificación *</label>
                        <input 
                          type="text" 
                          value={newCertName}
                          onChange={(e) => setNewCertName(e.target.value)}
                          placeholder="Ej: TOEFL iBT Score Report"
                          className="w-full bg-[#0d0e12] border border-white/10 p-3 rounded-xl text-white text-xs font-medium outline-none focus:border-[#DEFF9A] transition-all"
                          autoFocus
                        />
                      </div>
                      <div>
                        <label className="text-[8px] sm:text-[9px] font-black text-white/30 uppercase tracking-widest block mb-1">Fecha de Obtención</label>
                        <input 
                          type="date" 
                          value={newCertDate}
                          onChange={(e) => setNewCertDate(e.target.value)}
                          className="w-full bg-[#0d0e12] border border-white/10 p-3 rounded-xl text-white text-xs font-medium outline-none focus:border-[#DEFF9A] transition-all"
                        />
                      </div>

                      {/* Separador */}
                      <div className="flex items-center gap-3 py-1">
                        <div className="flex-1 h-px bg-white/10" />
                        <span className="text-[7px] font-black text-white/20 uppercase tracking-widest">Documento</span>
                        <div className="flex-1 h-px bg-white/10" />
                      </div>

                      {/* Zona de subida de archivo */}
                      <div>
                        <label className="text-[8px] sm:text-[9px] font-black text-white/30 uppercase tracking-widest block mb-1">
                          Archivo (PDF, imagen, documento)
                        </label>
                        <div 
                          onClick={() => !isUploadingCert && certFileInputRef.current?.click()}
                          className={`relative w-full border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-all ${
                            certFile 
                              ? 'border-[#DEFF9A]/40 bg-[#DEFF9A]/5' 
                              : 'border-white/10 bg-[#0d0e12] hover:border-white/20 hover:bg-white/[0.02]'
                          } ${isUploadingCert ? 'pointer-events-none opacity-60' : ''}`}
                        >
                          <input
                            ref={certFileInputRef}
                            type="file"
                            accept=".pdf,.jpg,.jpeg,.png,.doc,.docx,.xls,.xlsx"
                            className="hidden"
                            disabled={isUploadingCert}
                            onChange={(e) => {
                              const file = e.target.files?.[0];
                              if (file) {
                                if (file.size > 10 * 1024 * 1024) {
                                  setToastMessage('El archivo no debe exceder 10MB');
                                  setShowToast(true);
                                  e.target.value = '';
                                  return;
                                }
                                setCertFile(file);
                                // Auto-llenar nombre si está vacío
                                if (!newCertName.trim()) {
                                  setNewCertName(file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' '));
                                }
                              }
                            }}
                          />
                          {certFile ? (
                            <div className="space-y-2">
                              <div className="w-10 h-10 mx-auto rounded-xl bg-[#DEFF9A]/10 border border-[#DEFF9A]/20 flex items-center justify-center text-[#DEFF9A]">
                                <FileText size={18} />
                              </div>
                              <p className="text-white text-[10px] font-black uppercase truncate max-w-[200px] mx-auto">{certFile.name}</p>
                              <p className="text-white/30 text-[8px] font-bold">
                                {(certFile.size / 1024).toFixed(1)} KB
                              </p>
                              <button
                                onClick={(e) => { e.stopPropagation(); setCertFile(null); if (certFileInputRef.current) certFileInputRef.current.value = ''; }}
                                className="text-[8px] font-black text-red-400 hover:text-red-300 uppercase tracking-widest"
                              >
                                Quitar archivo
                              </button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <Upload size={20} className="text-white/20 mx-auto" />
                              <p className="text-white/30 text-[9px] font-black uppercase tracking-widest">
                                Click para seleccionar archivo
                              </p>
                              <p className="text-white/15 text-[8px]">
                                PDF, imagen, Word, Excel — Max 10MB
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* URL alternativa (opcional) */}
                      <div>
                        <label className="text-[8px] sm:text-[9px] font-black text-white/30 uppercase tracking-widest block mb-1">
                          O pegar enlace manual (opcional)
                        </label>
                        <input 
                          type="url" 
                          value={newCertUrl}
                          onChange={(e) => setNewCertUrl(e.target.value)}
                          placeholder="https://drive.google.com/file/..."
                          disabled={!!certFile}
                          className="w-full bg-[#0d0e12] border border-white/10 p-3 rounded-xl text-white text-xs font-medium outline-none focus:border-[#DEFF9A] transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                        />
                      </div>

                      <button 
                        onClick={handleAddCertification}
                        disabled={!newCertName.trim() || isUploadingCert}
                        className="w-full py-3 bg-[#DEFF9A] text-[#061a1a] font-black text-[10px] tracking-widest uppercase rounded-xl hover:scale-[1.02] transition-all disabled:opacity-30 disabled:pointer-events-none flex items-center justify-center gap-2"
                      >
                        {isUploadingCert ? (
                          <>
                            <Loader2 size={14} className="animate-spin" />
                            Subiendo a Google Drive...
                          </>
                        ) : (
                          'Agregar Certificación'
                        )}
                      </button>
                   </div>
                </motion.div>
             </div>
           )}
        </AnimatePresence>

        <AnimatePresence>
           {showToast && (
              <motion.div
                initial={{ opacity: 0, y: 50, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 50, scale: 0.9 }}
                className="fixed bottom-20 sm:bottom-8 left-2 right-2 sm:left-auto sm:right-8 z-[130] sm:max-w-md bg-[#0a0f1d] border border-[#DEFF9A]/30 rounded-2xl sm:rounded-[2rem] p-3 sm:p-6 shadow-[0_20px_50px_rgba(222,255,154,0.15)] flex items-start gap-2.5 sm:gap-4"
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl bg-[#DEFF9A]/10 border border-[#DEFF9A]/20 flex items-center justify-center text-[#DEFF9A] shrink-0">
                   {toastMessage.includes('Error') ? <AlertTriangle size={16} /> : <CheckCircle2 size={16} />}
                </div>
                <div className="flex-1 min-w-0">
                   <p className="text-[9px] sm:text-[10px] text-[#DEFF9A] font-bold uppercase tracking-wider">{toastMessage}</p>
                </div>
                <button onClick={() => setShowToast(false)} className="text-white/20 hover:text-white transition-all shrink-0">
                   <X size={14} />
                </button>
              </motion.div>
           )}
        </AnimatePresence>
    </div>
  );
}
