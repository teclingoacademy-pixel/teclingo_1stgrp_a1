// Debe ir primero: los routers leen process.env (OLLAMA_*) al evaluarse.
import 'dotenv/config';
import express, { Request, Response } from "express";
import { PrismaClient, Prisma } from '@prisma/client';
import { Communicate } from 'edge-tts-universal';
import helmet from "helmet";
import cors from "cors";
import crypto from "crypto";
import contentRoutes from "./api/contentRoutes";
import aiRoutes from "./api/aiRoutes";
import toolRoutes from "./api/toolRoutes";
import presentationRoutes from "./api/presentationRoutes";
import pronunciationRoutes from "./api/pronunciationRoutes";
import analyticsRoutes from "./api/analyticsRoutes";
import notificationRoutes from "./api/notificationRoutes";

const prisma = new PrismaClient();
const app = express();

/**
 * Orígenes permitidos para CORS.
 *
 * Los locales siempre entran. Los de despliegue se declaran en CORS_ORIGINS
 * (lista separada por comas) porque el dominio de Vercel cambia con cada
 * preview y no conviene hardcodearlo. Sin esto, el navegador rechaza el
 * preflight y el login con Google falla con ERR_FAILED.
 *
 * Nunca se usa comodín junto a credentials:true: el navegador lo prohíbe.
 */
const CORS_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:3000",
  ...(process.env.CORS_ORIGINS || "")
    .split(",")
    .map((o) => o.trim().replace(/\/+$/, ""))
    .filter(Boolean),
];

// helmet() aplica COOP "same-origin" por defecto, que separa el contexto de
// navegacion que usa Google Identity Services y bloquea el postMessage con el
// que Google devuelve la credencial: el boton renderiza pero el login muere al
// hacer clic. "same-origin-allow-popups" mantiene el aislamiento y abre esa
// excepcion. No se relaja COEP ni el resto de headers.
app.use(helmet({
  crossOriginOpenerPolicy: { policy: "unsafe-none" },
}));
app.use(cors({
  origin: (origin, callback) => {
    // Sin Origin = llamadas same-origin, curl o server-to-server.
    if (!origin) return callback(null, true);
    if (CORS_ORIGINS.includes(origin)) return callback(null, true);
    // Se rechaza con 403 en vez de propagar el Error: callback(err) convierte
    // el fallo en un 500 con stack trace, que no distingue de un error real.
    console.warn(`[cors] Origin bloqueado: ${origin}`);
    callback(null, false);
  },
  credentials: true,
}));
// Límite elevado: las imágenes de la ID Card institucional se envían en base64
// (una foto de 5 MB pesa ~6.7 MB en base64). Default de Express era 100kb.
app.use(express.json({ limit: "25mb" }));

// Routers de contenido pedagogico (Prisma -> Postgres) y Teacher Virtual (Ollama).
app.use("/api", contentRoutes);
app.use("/api", aiRoutes);
// Herramientas de IA del alumno (AI Tutor, Grammar Fixer) con Ollama.
// /api/tts vive mas abajo en este archivo usando edge-tts.
app.use("/api", toolRoutes);
app.use("/api", presentationRoutes);
app.use("/api", pronunciationRoutes);
app.use("/api", analyticsRoutes);
app.use("/api", notificationRoutes);

function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

function generateInstitutionCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "DIR-";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

async function createUniqueInstitutionCode(): Promise<string> {
  let code: string;
  let exists = true;
  while (exists) {
    code = generateInstitutionCode();
    const existing = await prisma.directorProfile.findUnique({ where: { institutionCode: code } });
    exists = !!existing;
  }
  return code!;
}

// Resuelve el director (y su perfil institucional) a partir del código que se distribuye.
// Es la vía de vínculo real: el alumno/docente recibe el código, no el email del director.
async function resolveDirectorByCode(institutionCode?: string | null) {
  const code = String(institutionCode || "").trim().toUpperCase();
  if (!code) return null;
  const dir = await prisma.directorProfile.findUnique({ where: { institutionCode: code } });
  if (!dir) return null;
  const dirUser = await prisma.user.findUnique({ where: { id: dir.userId }, select: { email: true } });
  return { code, directorEmail: dirUser?.email || null, profile: dir };
}

async function generateIdEmpleado(): Promise<string> {
  const allProfiles = await prisma.teacherProfile.findMany({ select: { idEmpleado: true } });
  let maxNum = 0;
  for (const p of allProfiles) {
    if (p.idEmpleado) {
      const match = p.idEmpleado.match(/^DOC-(\d+)$/);
      if (match) {
        const num = parseInt(match[1]);
        if (num > maxNum) maxNum = num;
      }
    }
  }
  maxNum++;
  const padded = maxNum < 10 ? '00' + maxNum : maxNum < 100 ? '0' + maxNum : String(maxNum);
  return `DOC-${padded}`;
}

// 1. Obtener lecciones
app.get("/api/lessons", async (req: Request, res: Response) => {
  try {
    const { level } = req.query;
    const lessons = await prisma.lesson.findMany({
      where: level ? { level: String(level).toUpperCase() } : {},
      orderBy: { order: "asc" },
    });

    // Map al shape que ClassIndexScreen espera (compatible con SheetClaseRow)
    const mapped = lessons.map((l) => ({
      clase_id: l.id,
      clase_numero: l.order,
      semana: l.semana ?? 0,
      sesion: l.sesion ?? "A",
      titulo_clase: l.title,
      titulo_video: l.tituloVideo ?? "",
      video_url: l.videoUrl ?? "",
      tema_principal: l.temaPrincipal ?? "",
      tipo_contenido: l.tipoContenido ?? "original",
      duracion_min: l.duracionMin ?? 120,
      estado: l.isPublished ? "activo" : "inactivo",
      level: l.level,
      description: l.description,
      isPublished: l.isPublished,
    }));

    res.json({ success: true, data: mapped });
  } catch (error) {
    console.error("[lessons] error:", error);
    res.status(500).json({ success: false, error: "Error interno del servidor" });
  }
});

// 2. Obtener lección por ID — con TODO el contenido pedagógico
app.get("/api/lessons/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: {
        exercises: {
          where: { active: true },
          orderBy: [{ skill: "asc" }, { itemNumber: "asc" }],
        },
        vocabulary: { orderBy: { term: "asc" } },
        texts: { where: { active: true } },
        teacherScript: true,
        theorySections: { orderBy: { order: "asc" } },
        grammarTips: true,
        quickVocab: { orderBy: { order: "asc" } },
        curriculum: true,
        contract: true,
        knowledgeMap: true,
      },
    });

    if (!lesson) {
      return res.status(404).json({ success: false, error: "Lección no encontrada" });
    }

    const mapped = {
      clase_id: lesson.id,
      clase_numero: lesson.order,
      semana: lesson.semana ?? 0,
      sesion: lesson.sesion ?? "A",
      titulo_clase: lesson.title,
      titulo_video: lesson.tituloVideo ?? "",
      video_url: lesson.videoUrl ?? "",
      tema_principal: lesson.temaPrincipal ?? "",
      tipo_contenido: lesson.tipoContenido ?? "original",
      duracion_min: lesson.duracionMin ?? 120,
      estado: lesson.isPublished ? "activo" : "inactivo",
      level: lesson.level,
      description: lesson.description,
      isPublished: lesson.isPublished,
      exercises: lesson.exercises,
      vocabulary: (lesson.vocabulary ?? []).map((v: any) => ({
        vocab_id: v.id,
        clase_id: v.lessonId,
        palabra_ingles: v.term,
        palabra_espanol: v.translation,
        categoria: v.type,
        pronunciacion_af: v.pronunciationAf ?? "",
        audio_url: "",
        ejemplo_uso: v.exampleUse ?? "",
        dificultad: 1,
        tags: v.tags ?? [],
        tts_text: v.ttsText ?? "",
        lang: v.lang ?? "en",
      })),
      texts: lesson.texts ?? [],
      teacherScript: lesson.teacherScript
        ? {
            id: lesson.teacherScript.id,
            clase_id: lesson.teacherScript.lessonId,
            titulo: lesson.teacherScript.title,
            content: lesson.teacherScript.content,
            contentEn: lesson.teacherScript.contentEn,
            duration: lesson.teacherScript.duration,
            updated_at: lesson.teacherScript.updatedAt,
          }
        : null,
      theorySections: lesson.theorySections ?? [],
      grammarTips: lesson.grammarTips ?? [],
      quickVocab: lesson.quickVocab ?? [],
      curriculum: lesson.curriculum ?? null,
      contract: lesson.contract ?? null,
      knowledgeMap: lesson.knowledgeMap ?? null,
    };

    res.json({ success: true, data: mapped });
  } catch (error) {
    console.error("[lessons/:id] error:", error);
    res.status(500).json({ success: false, error: "Error interno del servidor" });
  }
});



// ===================================================================
// TEACHER SCRIPT — Guion narrado del Teacher Virtual por leccion
// ===================================================================
app.get("/api/lessons/:id/teacher-script", async (req: Request, res: Response) => {
  try {
    const script = await prisma.teacherScript.findUnique({
      where: { lessonId: req.params.id },
    });
    if (!script) {
      return res.status(404).json({ ok: false, error: "Guion no encontrado para " + req.params.id });
    }
    res.json({ ok: true, data: script });
  } catch (error) {
    console.error("[lessons/:id/teacher-script] error:", error);
    res.status(500).json({ ok: false, error: "Error interno del servidor" });
  }
});

// ===================================================================
// TEXTOS BASE// TEXTOS BASE — lectura por leccion
// ===================================================================
app.get("/api/v1/textos-base", async (req: Request, res: Response) => {
  try {
    const claseId = String(req.query.clase_id || '').trim();
    if (!claseId) return res.status(400).json({ success: false, error: "clase_id requerido" });

    const textBase = await prisma.textBase.findFirst({
      where: { lessonId: claseId, active: true },
      orderBy: { createdAt: 'desc' },
    });

    if (!textBase) {
      return res.status(404).json({ success: false, error: "Texto base no encontrado para " + claseId });
    }

    res.json({
      success: true,
      data: {
        clase_id: textBase.lessonId,
        titulo_texto: textBase.title,
        titulo: textBase.title,
        contenido_texto: textBase.content,
        contenido: textBase.content,
        translation: textBase.translation,
        perfil: textBase.perfil,
        fase: textBase.fase,
        parrafos: textBase.parrafos,
        word_count: textBase.wordCount,
        estimated_sec: textBase.timeAudioSec,
        difficulty: textBase.difficulty,
      },
    });
  } catch (error) {
    console.error("[textos-base] error:", error);
    res.status(500).json({ success: false, error: "Error interno del servidor" });
  }
});

// ===================================================================
// PLANEACIÓN ACADÉMICA (Study Plan)
// ===================================================================

app.get("/api/study-plan", async (_req: Request, res: Response) => {
  try {
    const levels = await prisma.studyLevel.findMany({
      orderBy: { order: "asc" },
      include: { weeks: { orderBy: { weekNumber: "asc" } } }
    });
    res.json({ success: true, data: levels });
  } catch (error) {
    console.error("[study-plan] error:", error);
    res.status(500).json({ success: false, error: "Error interno del servidor" });
  }
});

app.get("/api/study-plan/:code", async (req: Request, res: Response) => {
  try {
    const level = await prisma.studyLevel.findUnique({
      where: { code: req.params.code.toUpperCase() },
      include: { weeks: { orderBy: { weekNumber: "asc" } } }
    });
    if (!level) return res.status(404).json({ success: false, error: "Nivel no encontrado" });
    res.json({ success: true, data: level });
  } catch (error) {
    console.error("[study-plan/:code] error:", error);
    res.status(500).json({ success: false, error: "Error interno del servidor" });
  }
});

app.get("/api/study-plan/:code/weeks/:weekNumber", async (req: Request, res: Response) => {
  try {
    const level = await prisma.studyLevel.findUnique({ where: { code: req.params.code.toUpperCase() } });
    if (!level) return res.status(404).json({ success: false, error: "Nivel no encontrado" });
    const week = await prisma.studyWeek.findUnique({
      where: { levelId_weekNumber: { levelId: level.id, weekNumber: Number(req.params.weekNumber) } },
      include: { lessons: { orderBy: { order: "asc" } } }
    });
    if (!week) return res.status(404).json({ success: false, error: "Semana no encontrada" });
    res.json({ success: true, data: week });
  } catch (error) {
    console.error("[study-plan/:code/weeks] error:", error);
    res.status(500).json({ success: false, error: "Error interno del servidor" });
  }
});

// Actualiza la copia MAESTRA de una semana. El panel del docente es sólo lectura
// y siempre re-lee esta misma fuente.
app.put("/api/study-plan/:code/weeks/:weekNumber", async (req: Request, res: Response) => {
  try {
    const weekNumber = Number(req.params.weekNumber);
    if (!Number.isInteger(weekNumber) || weekNumber < 1) {
      return res.status(400).json({ success: false, error: "Semana inválida" });
    }
    const level = await prisma.studyLevel.findUnique({ where: { code: req.params.code.toUpperCase() } });
    if (!level) return res.status(404).json({ success: false, error: "Nivel no encontrado" });

    const { fechas, ejeTematico, unidadLibro, paginas, kpi, horasJson } = req.body || {};
    const data: Record<string, unknown> = {};
    if (fechas !== undefined) data.fechas = String(fechas);
    if (ejeTematico !== undefined) data.ejeTematico = String(ejeTematico);
    if (unidadLibro !== undefined) data.unidadLibro = String(unidadLibro);
    if (paginas !== undefined) data.paginas = String(paginas);
    if (kpi !== undefined) data.kpi = String(kpi);
    if (horasJson !== undefined) {
      const parsed = typeof horasJson === "string" ? JSON.parse(horasJson) : horasJson;
      if (!Array.isArray(parsed)) return res.status(400).json({ success: false, error: "horasJson inválido" });
      data.horasJson = parsed;
    }
    if (Object.keys(data).length === 0) {
      return res.status(400).json({ success: false, error: "No hay campos para actualizar" });
    }

    const week = await prisma.studyWeek.upsert({
      where: { levelId_weekNumber: { levelId: level.id, weekNumber } },
      create: {
        levelId: level.id,
        weekNumber,
        fechas: (data.fechas as string) || "",
        ejeTematico: (data.ejeTematico as string) || "",
        unidadLibro: (data.unidadLibro as string) || "",
        paginas: (data.paginas as string) || "",
        kpi: (data.kpi as string) || "",
        horasJson: (data.horasJson as Prisma.InputJsonValue) ?? []
      },
      update: data as Prisma.StudyWeekUpdateInput
    });
    res.json({ success: true, data: week });
  } catch (error) {
    console.error("[study-plan/:code/weeks PUT] error:", error);
    res.status(500).json({ success: false, error: "Error interno del servidor" });
  }
});

// 3. Registrar nuevo usuario
app.post("/api/users", async (req: Request, res: Response) => {
  try {
    const { name, email, password, role } = req.body;
    if (!email) return res.status(400).json({ success: false, error: "El email es obligatorio" });

    const roleMap: Record<string, "STUDENT" | "TEACHER" | "ADMIN"> = {
      ALUMNO: "STUDENT",
      DOCENTE: "TEACHER",
      DIRECTOR: "ADMIN",
      STUDENT: "STUDENT",
      TEACHER: "TEACHER",
      ADMIN: "ADMIN",
    };

    const mappedRole = roleMap[(role || "STUDENT").toUpperCase()] || "STUDENT";
    const user = await prisma.user.create({
      data: {
        name: name || "Nuevo Estudiante",
        email: email.toLowerCase().trim(),
        password: password ? hashPassword(password) : null,
        role: mappedRole,
      },
    });

    let institutionCode: string | null = null;
    let idEmpleado: string | null = null;
    let directorEmail: string | null = null;
    if (mappedRole === "ADMIN") {
      institutionCode = await createUniqueInstitutionCode();
      await prisma.directorProfile.create({
        data: { userId: user.id, institutionCode },
      });
    } else if (mappedRole === "TEACHER") {
      idEmpleado = await generateIdEmpleado();
      // Resolver el director desde el código distribuido, igual que el login Google.
      const inst = await resolveDirectorByCode(req.body.institution_code);
      institutionCode = inst?.code || null;
      directorEmail = inst?.directorEmail || null;
      await prisma.teacherProfile.create({
        data: { userId: user.id, idEmpleado, institutionCode, directorEmail },
      });
    } else if (mappedRole === "STUDENT") {
      const inst = await resolveDirectorByCode(req.body.institution_code);
      institutionCode = inst?.code || null;
      directorEmail = inst?.directorEmail || null;
      await prisma.studentProfile.create({
        data: { userId: user.id, institutionCode, directorEmail },
      });
    }

    res.status(201).json({
      ok: true,
      code: "registro_ok",
      perfil: { id: user.id, email: user.email, name: user.name, rol: user.role, institution_code: institutionCode, director_email: directorEmail, id_empleado: idEmpleado },
    });
  } catch (error: any) {
    if (error.code === "P2002") {
      return res.status(400).json({ ok: false, error: "El correo electrónico ya existe" });
    }
    console.error("Error al registrar usuario:", error);
    res.status(500).json({ ok: false, error: "Error interno del servidor" });
  }
});

// 4. Verificar si un email existe
app.post("/api/users/verify", async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ ok: false, error: "El email es obligatorio" });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    res.json({ ok: true, exists: !!user });
  } catch (error) {
    res.status(500).json({ ok: false, error: "Error interno del servidor" });
  }
});

// 5. Login con email y password
app.post("/api/users/login", async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ ok: false, error: "Email y password son obligatorios" });
    }

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) {
      return res.status(401).json({ ok: false, error: "Usuario no encontrado" });
    }

    if (user.password && user.password !== hashPassword(password)) {
      return res.status(401).json({ ok: false, error: "Contraseña incorrecta" });
    }

    res.json({
      ok: true,
      code: "login_ok",
      perfil: { id: user.id, email: user.email, name: user.name, rol: user.role },
    });
  } catch (error) {
    console.error("Error en login:", error);
    res.status(500).json({ ok: false, error: "Error interno del servidor" });
  }
});

// 6. Login/Registro con Google (upsert)
app.post("/api/users/google-login", async (req: Request, res: Response) => {
  try {
    const { email, name, rol, institution_code } = req.body;
    if (!email) return res.status(400).json({ ok: false, error: "El email es obligatorio" });

    const roleMap: Record<string, "STUDENT" | "TEACHER" | "ADMIN"> = {
      ALUMNO: "STUDENT", DOCENTE: "TEACHER", DIRECTOR: "ADMIN",
      STUDENT: "STUDENT", TEACHER: "TEACHER", ADMIN: "ADMIN",
    };
    const normalizedEmail = email.toLowerCase().trim();
    const requestedRole = roleMap[(rol || "").toUpperCase()];

    // Resolver institution_code → directorEmail (si viene) para vincular
    let institutionCode: string | null = String(institution_code || '').trim().toUpperCase() || null;
    let directorEmail: string | null = null;
    if (institutionCode && requestedRole && requestedRole !== "ADMIN") {
      const dir = await prisma.directorProfile.findUnique({ where: { institutionCode } });
      if (dir) {
        const dirUser = await prisma.user.findUnique({ where: { id: dir.userId }, select: { email: true } });
        directorEmail = dirUser?.email || null;
      } else {
        institutionCode = null; // código inválido → ignorar
      }
    }

    const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });

    if (existing) {
      // Preservar rol si no se solicita explícitamente uno distinto de STUDENT
      const newRole = (requestedRole && requestedRole !== "STUDENT")
        ? requestedRole
        : existing.role;

      const updated = await prisma.user.update({
        where: { email: normalizedEmail },
        data: {
          name: name || existing.name,
          role: newRole,
          metodo: existing.metodo || "google",
        },
      });

      let directorCode: string | null = null;
      let idEmpleado: string | null = null;

      if (newRole === "ADMIN") {
        // Un director genera su propio código: nunca envía institution_code, así
        // que antes caía en el `if (institutionCode)` de abajo y el DirectorProfile
        // quedaba sin crear. El panel terminaba mostrando "sin asignar" y, peor,
        // sus alumnos no tenían un código válido con el que vincularse.
        // El código es inmutable una vez emitido, por eso solo se genera si falta.
        const existingDP = await prisma.directorProfile.findUnique({ where: { userId: updated.id } });
        if (existingDP?.institutionCode) {
          directorCode = existingDP.institutionCode;
        } else {
          directorCode = await createUniqueInstitutionCode();
          await prisma.directorProfile.upsert({
            where: { userId: updated.id },
            update: { institutionCode: directorCode },
            create: { userId: updated.id, institutionCode: directorCode },
          });
        }
      } else if (institutionCode) {
        // Alumnos y docentes sí se vinculan con el código que envía el cliente.
        if (newRole === "STUDENT") {
          await prisma.studentProfile.upsert({
            where: { userId: updated.id },
            update: { institutionCode, directorEmail },
            create: { userId: updated.id, institutionCode, directorEmail },
          });
        } else if (newRole === "TEACHER") {
          const existingTP = await prisma.teacherProfile.findUnique({ where: { userId: updated.id } });
          idEmpleado = existingTP?.idEmpleado || await generateIdEmpleado();
          await prisma.teacherProfile.upsert({
            where: { userId: updated.id },
            update: { institutionCode, directorEmail },
            create: { userId: updated.id, idEmpleado, institutionCode, directorEmail },
          });
        }
      }

      return res.json({
        ok: true, code: "login_ok",
        perfil: {
          id: updated.id, email: updated.email, name: updated.name, rol: updated.role,
          // Para el director se devuelve el código persistido. Antes se devolvía el
          // que envía el cliente, que en su caso es null.
          institution_code: newRole === "ADMIN" ? directorCode : institutionCode,
          director_email: directorEmail,
          id_empleado: idEmpleado,
        },
      });
    }

    // Usuario nuevo
    const userRole = requestedRole || "STUDENT";
    const created = await prisma.user.create({
      data: { name: name || "Usuario Google", email: normalizedEmail, role: userRole },
    });

    let generatedCode: string | null = null;
    let idEmpleado: string | null = null;
    if (userRole === "ADMIN") {
      generatedCode = await createUniqueInstitutionCode();
      await prisma.directorProfile.create({
        data: { userId: created.id, institutionCode: generatedCode },
      });
    } else if (userRole === "TEACHER") {
      idEmpleado = await generateIdEmpleado();
      await prisma.teacherProfile.create({
        data: { userId: created.id, idEmpleado, institutionCode, directorEmail },
      });
    } else if (userRole === "STUDENT") {
      await prisma.studentProfile.create({
        data: { userId: created.id, institutionCode, directorEmail },
      });
    }

    res.status(201).json({
      ok: true, code: "registro_google",
      perfil: {
        id: created.id, email: created.email, name: created.name, rol: created.role,
        institution_code: generatedCode || institutionCode, id_empleado: idEmpleado,
        director_email: directorEmail,
      },
    });
  } catch (error: any) {
    console.error("Error en google-login:", error);
    res.status(500).json({ ok: false, error: "Error interno del servidor" });
  }
});

// 6b. Obtener usuario por email
app.get("/api/user/:email", async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      select: {
        id: true, email: true, name: true, role: true, avatar: true,
        nivel: true, nikName: true, metodo: true, active: true,
        streakDays: true, totalXp: true, createdAt: true,
      },
    });
    if (!user) return res.status(404).json({ ok: false, error: "Usuario no encontrado" });
    res.json({ ok: true, user });
  } catch (error) {
    console.error("Error al obtener usuario:", error);
    res.status(500).json({ ok: false, error: "Error interno del servidor" });
  }
});

// 7. Registrar respuesta del usuario (Guarda en PostgreSQL)
app.post("/api/submissions", async (req: Request, res: Response) => {
  try {
    const { userId, exerciseId, userResponse, timeSpentSec } = req.body;
    if (!userId || !exerciseId || userResponse === undefined) {
      return res.status(400).json({ success: false, error: "Faltan campos obligatorios" });
    }

    // Crear usuario demo si no existe para evitar error de Llave Foránea (FK)
    await prisma.user.upsert({
      where: { id: userId },
      update: {},
      create: { id: userId, email: `${userId}@teclingo.com`, name: "Usuario Demo" }
    });

    const exercise = await prisma.exercise.findUnique({ where: { id: exerciseId } });
    if (!exercise) return res.status(404).json({ success: false, error: "Ejercicio no encontrado" });

    const isCorrect = String(userResponse).trim().toLowerCase() === exercise.correctAnswer.trim().toLowerCase();

    const submission = await prisma.submission.create({
      data: {
        userId,
        exerciseId,
        userAnswer: String(userResponse),
        isCorrect,
        timeSpentSec: timeSpentSec || 0
      }
    });

    res.status(201).json({
      success: true,
      data: {
        submissionId: submission.id,
        isCorrect,
        explanation: exercise.explanation
      }
    });
  } catch (error) {
    console.error("Error al guardar respuesta:", error);
    res.status(500).json({ success: false, error: "Error interno al procesar respuesta" });
  }
});

// 8. Obtener datos del DINER (Credencial Digital) por email
app.get("/api/credential/:email", async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    if (!email) return res.status(400).json({ ok: false, error: "Email es obligatorio" });

    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: {
        directorProfile: true,
        teacherProfile: true,
        studentProfile: true,
      },
    });

    if (!user) return res.status(404).json({ ok: false, error: "Usuario no encontrado" });

    const roleMap: Record<string, string> = {
      ADMIN: "Director Académico",
      TEACHER: "Docente",
      STUDENT: "Alumno",
    };

    const profile = user.directorProfile || user.teacherProfile || user.studentProfile;

    // REGLA UNIVERSAL: datos reales del usuario para TODOS los tipos de usuario.
    // Número de Control: ID institucional según el rol (Director=código inst., Docente=idEmpleado, Alumno=número de control).
    const controlNumber =
      user.role === "ADMIN"
        ? (user.directorProfile?.institutionCode || null)
        : user.role === "TEACHER"
          ? (user.teacherProfile?.idEmpleado || user.teacherProfile?.institutionCode || null)
          : (user.studentProfile?.numeroControl || user.studentProfile?.studentId || null);

    const curp =
      user.directorProfile?.curp || user.teacherProfile?.curp || user.studentProfile?.curp || null;

    const nivel =
      user.studentProfile?.nivelIngles || user.studentProfile?.moduloTec || user.nivel || null;

    // Grupo del alumno (primer grupo activo) — para la credencial
    let grupo: { nombre: string; grupo: string; nivel: string } | null = null;
    if (user.role === "STUDENT") {
      const membership = await prisma.groupMember.findFirst({
        where: { userId: user.id, activo: true },
        include: { group: true },
        orderBy: { fechaAsignacion: "desc" },
      });
      if (membership) {
        grupo = {
          nombre: membership.group.nombre,
          grupo: membership.group.grupo,
          nivel: membership.group.nivel,
        };
      }
    }

    // Alumnos y docentes no tienen DirectorProfile propio: se resuelve la institución
    // del director vinculado (por email del director o, en su defecto, por el código
    // institucional) para que su credencial salga con el logo y el nombre reales.
    let dirInstitution = user.directorProfile || null;
    if (!dirInstitution) {
      const dirEmail = user.teacherProfile?.directorEmail || user.studentProfile?.directorEmail || null;
      if (dirEmail) {
        const dirUser = await prisma.user.findUnique({
          where: { email: dirEmail.toLowerCase().trim() },
          include: { directorProfile: true },
        });
        dirInstitution = dirUser?.directorProfile || null;
      }
      if (!dirInstitution) {
        const found = await resolveDirectorByCode(
          user.teacherProfile?.institutionCode || user.studentProfile?.institutionCode,
        );
        dirInstitution = found?.profile || null;
      }
    }

    res.json({
      ok: true,
      credential: {
        name: user.name || "Sin nombre",
        email: user.email,
        role: user.role,
        roleLabel: roleMap[user.role] || user.role,
        avatar: user.avatar || null,
        institutionCode: dirInstitution?.institutionCode || user.teacherProfile?.institutionCode || user.studentProfile?.institutionCode || null,
        institutionName: dirInstitution?.institutionName || null,
        institutionLogo: dirInstitution?.institutionLogo || null,
        slogan: dirInstitution?.slogan || null,
        verified: user.role === "ADMIN" || user.role === "TEACHER",
        curp,
        controlNumber,
        numeroControl: user.studentProfile?.numeroControl || null,
        nivel,
        grupo,
      },
    });
  } catch (error) {
    console.error("Error al obtener credencial:", error);
    res.status(500).json({ ok: false, error: "Error interno del servidor" });
  }
});

// 9. Guardar perfil de Director en PostgreSQL (merge, no reemplazo)
app.put("/api/director-profile/:email", async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    const data = req.body;

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) return res.status(404).json({ ok: false, error: "Usuario no encontrado" });

    const existing = await prisma.directorProfile.findUnique({ where: { userId: user.id } });

    // Merge: preservar existentes, solo actualizar los enviados
    const base = existing || {};

    // Actualizar User.avatar si viene en el body
    if (data.avatar !== undefined) {
      await prisma.user.update({
        where: { id: user.id },
        data: { avatar: data.avatar || null },
      });
    }

    const profileData = {
      phone: data.phone !== undefined ? (data.phone || null) : (existing?.phone || null),
      bio: data.bio !== undefined ? (data.bio || null) : (existing?.bio || null),
      curp: data.curp !== undefined ? (data.curp || null) : (existing?.curp || null),
      birthDate: data.birthDate !== undefined ? (data.birthDate ? new Date(data.birthDate) : null) : (existing?.birthDate || null),
      degree: data.degree !== undefined ? (data.degree || null) : (existing?.degree || null),
      experienceYears: data.experienceYears !== undefined ? (parseInt(data.experienceYears) || 0) : (existing?.experienceYears || 0),
      institutionName: data.institutionName !== undefined ? (data.institutionName || null) : (existing?.institutionName || null),
      institutionLogo: data.institutionLogo !== undefined ? (data.institutionLogo || null) : (existing?.institutionLogo || null),
      slogan: data.slogan !== undefined ? (data.slogan || null) : (existing?.slogan || null),
      instPhone: data.instPhone !== undefined ? (data.instPhone || null) : (existing?.instPhone || null),
      address: data.address !== undefined ? (data.address || null) : (existing?.address || null),
      instEmail: data.instEmail !== undefined ? (data.instEmail || null) : (existing?.instEmail || null),
      facebook: data.facebook !== undefined ? (data.facebook || null) : (existing?.facebook || null),
      instagram: data.instagram !== undefined ? (data.instagram || null) : (existing?.instagram || null),
      linkedin: data.linkedin !== undefined ? (data.linkedin || null) : (existing?.linkedin || null),
      institutionCode: data.institutionCode !== undefined ? (data.institutionCode || null) : (existing?.institutionCode || null),
      institutionType: data.institutionType !== undefined ? (data.institutionType || null) : (existing?.institutionType || null),
      carrera1: data.carrera1 !== undefined ? (data.carrera1 || null) : (existing?.carrera1 || null),
      carrera2: data.carrera2 !== undefined ? (data.carrera2 || null) : (existing?.carrera2 || null),
      carrera3: data.carrera3 !== undefined ? (data.carrera3 || null) : (existing?.carrera3 || null),
      carrera4: data.carrera4 !== undefined ? (data.carrera4 || null) : (existing?.carrera4 || null),
      carrera5: data.carrera5 !== undefined ? (data.carrera5 || null) : (existing?.carrera5 || null),
      carrera6: data.carrera6 !== undefined ? (data.carrera6 || null) : (existing?.carrera6 || null),
      carrera7: data.carrera7 !== undefined ? (data.carrera7 || null) : (existing?.carrera7 || null),
      turnoMatutino: data.turnoMatutino !== undefined ? (data.turnoMatutino === true || data.turnoMatutino === 'TRUE') : (existing?.turnoMatutino || false),
      turnoVespertino: data.turnoVespertino !== undefined ? (data.turnoVespertino === true || data.turnoVespertino === 'TRUE') : (existing?.turnoVespertino || false),
      turnoSemiEscolarizado: data.turnoSemiEscolarizado !== undefined ? (data.turnoSemiEscolarizado === true || data.turnoSemiEscolarizado === 'TRUE') : (existing?.turnoSemiEscolarizado || false),
      turnoSabatino: data.turnoSabatino !== undefined ? (data.turnoSabatino === true || data.turnoSabatino === 'TRUE') : (existing?.turnoSabatino || false),
      turnoDistancia: data.turnoDistancia !== undefined ? (data.turnoDistancia === true || data.turnoDistancia === 'TRUE') : (existing?.turnoDistancia || false),
      modalidad: data.modalidad !== undefined ? (data.modalidad || null) : (existing?.modalidad || null),
      semestres: data.semestres !== undefined ? (data.semestres || null) : (existing?.semestres || null),
    };

    let profile;
    if (existing) {
      profile = await prisma.directorProfile.update({ where: { userId: user.id }, data: profileData });
    } else {
      profile = await prisma.directorProfile.create({ data: { userId: user.id, ...profileData } });
    }

    res.json({ ok: true, profile });
  } catch (error) {
    console.error("Error al guardar perfil director:", error);
    res.status(500).json({ ok: false, error: "Error interno del servidor" });
  }
});

// 10. Guardar perfil de Docente en PostgreSQL (merge, no reemplazo)
app.put("/api/teacher-profile/:email", async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    const data = req.body;

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) return res.status(404).json({ ok: false, error: "Usuario no encontrado" });

    const existing = await prisma.teacherProfile.findUnique({ where: { userId: user.id } });

    // Actualizar User.avatar si viene en el body
    if (data.avatar !== undefined) {
      await prisma.user.update({
        where: { id: user.id },
        data: { avatar: data.avatar || null },
      });
    }

    const profileData = {
      idEmpleado: data.idEmpleado !== undefined ? (data.idEmpleado || null) : (existing?.idEmpleado || null),
      phone: data.phone !== undefined ? (data.phone || null) : (existing?.phone || null),
      bio: data.bio !== undefined ? (data.bio || null) : (existing?.bio || null),
      curp: data.curp !== undefined ? (data.curp || null) : (existing?.curp || null),
      birthDate: data.birthDate !== undefined ? (data.birthDate ? new Date(data.birthDate) : null) : (existing?.birthDate || null),
      degree: data.degree !== undefined ? (data.degree || null) : (existing?.degree || null),
      experienceYears: data.experienceYears !== undefined ? (parseInt(data.experienceYears) || 0) : (existing?.experienceYears || 0),
      specialties: data.specialties !== undefined ? (data.specialties || null) : (existing?.specialties || null),
      certifications: data.certifications !== undefined ? (data.certifications || null) : (existing?.certifications || null),
      institutionCode: data.institutionCode !== undefined ? (data.institutionCode || null) : (existing?.institutionCode || null),
      directorEmail: data.directorEmail !== undefined ? (data.directorEmail || null) : (existing?.directorEmail || null),
    };

    let profile;
    if (existing) {
      profile = await prisma.teacherProfile.update({ where: { userId: user.id }, data: profileData });
    } else {
      profile = await prisma.teacherProfile.create({ data: { userId: user.id, ...profileData } });
    }

    res.json({ ok: true, profile });
  } catch (error) {
    console.error("Error al guardar perfil docente:", error);
    res.status(500).json({ ok: false, error: "Error interno del servidor" });
  }
});

// 11. Obtener perfil de Director desde PostgreSQL
app.get("/api/director-profile/:email", async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { directorProfile: true },
    });
    if (!user) return res.status(404).json({ ok: false, error: "Usuario no encontrado" });
    res.json({ ok: true, profile: user.directorProfile || null });
  } catch (error) {
    console.error("Error al obtener perfil director:", error);
    res.status(500).json({ ok: false, error: "Error interno del servidor" });
  }
});

// 11b. Obtener el perfil de Director (institución) a partir del código distribuido
app.get("/api/director-by-code/:code", async (req: Request, res: Response) => {
  try {
    const found = await resolveDirectorByCode(req.params.code);
    if (!found) return res.status(404).json({ ok: false, error: "Institución no encontrada" });
    res.json({ ok: true, directorEmail: found.directorEmail, profile: found.profile });
  } catch (error) {
    console.error("Error al obtener director por código:", error);
    res.status(500).json({ ok: false, error: "Error interno del servidor" });
  }
});

// 12. Obtener perfil de Docente desde PostgreSQL
app.get("/api/teacher-profile/:email", async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { teacherProfile: true },
    });
    if (!user) return res.status(404).json({ ok: false, error: "Usuario no encontrado" });
    res.json({ ok: true, profile: user.teacherProfile || null });
  } catch (error) {
    console.error("Error al obtener perfil docente:", error);
    res.status(500).json({ ok: false, error: "Error interno del servidor" });
  }
});

// 13. Guardar perfil de Estudiante en PostgreSQL
app.put("/api/student-profile/:email", async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    const data = req.body;

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) return res.status(404).json({ ok: false, error: "Usuario no encontrado" });

    const existing = await prisma.studentProfile.findUnique({ where: { userId: user.id } });

    // Actualizar User.avatar si viene en el body
    if (data.avatar !== undefined) {
      await prisma.user.update({
        where: { id: user.id },
        data: { avatar: data.avatar || null },
      });
    }

    const profileData = {
      studentId: data.studentId !== undefined ? (data.studentId || null) : (existing?.studentId || null),
      phone: data.phone !== undefined ? (data.phone || null) : (existing?.phone || null),
      bio: data.bio !== undefined ? (data.bio || null) : (existing?.bio || null),
      curp: data.curp !== undefined ? (data.curp || null) : (existing?.curp || null),
      birthDate: data.birthDate !== undefined ? (data.birthDate ? new Date(data.birthDate) : null) : (existing?.birthDate || null),
      experienceYears: data.experienceYears !== undefined ? (parseInt(data.experienceYears) || 0) : (existing?.experienceYears || 0),
      numeroControl: data.numeroControl !== undefined ? (data.numeroControl || null) : (existing?.numeroControl || null),
      carrera: data.carrera !== undefined ? (data.carrera || null) : (existing?.carrera || null),
      turno: data.turno !== undefined ? (data.turno || null) : (existing?.turno || null),
      semestre: data.semestre !== undefined ? (data.semestre || null) : (existing?.semestre || null),
      moduloTec: data.moduloTec !== undefined ? (data.moduloTec || null) : (existing?.moduloTec || null),
      nivelIngles: data.nivelIngles !== undefined ? (data.nivelIngles || null) : (existing?.nivelIngles || null),
      institutionCode: data.institutionCode !== undefined ? (data.institutionCode || null) : (existing?.institutionCode || null),
      directorEmail: data.directorEmail !== undefined ? (data.directorEmail || null) : (existing?.directorEmail || null),
    };

    let profile;
    if (existing) {
      profile = await prisma.studentProfile.update({ where: { userId: user.id }, data: profileData });
    } else {
      profile = await prisma.studentProfile.create({ data: { userId: user.id, ...profileData } });
    }

    res.json({ ok: true, profile });
  } catch (error) {
    console.error("Error al guardar perfil estudiante:", error);
    res.status(500).json({ ok: false, error: "Error interno del servidor" });
  }
});

// 14. Obtener perfil de Estudiante desde PostgreSQL
app.get("/api/student-profile/:email", async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    const user = await prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
      include: { studentProfile: true },
    });
    if (!user) return res.status(404).json({ ok: false, error: "Usuario no encontrado" });
    res.json({ ok: true, profile: user.studentProfile || null });
  } catch (error) {
    console.error("Error al obtener perfil estudiante:", error);
    res.status(500).json({ ok: false, error: "Error interno del servidor" });
  }
});

// ============================================================
// LISTAR USUARIOS — PostgreSQL (Comunidad Tecnolingo)
// ============================================================

app.get("/api/users-list", async (req: Request, res: Response) => {
  try {
    const { filtro, buscar } = req.query;
    const filtroStr = (filtro as string) || 'TODOS';
    const buscarStr = (buscar as string) || '';

    // Build role filter
    const roleFilter: any = {};
    if (filtroStr === 'DOCENTE') roleFilter.role = 'TEACHER';
    else if (filtroStr === 'ALUMNO') roleFilter.role = 'STUDENT';
    else if (filtroStr === 'DIRECTOR') roleFilter.role = 'ADMIN';

    // Build search filter
    const searchFilter: any = buscarStr ? {
      OR: [
        { name: { contains: buscarStr, mode: 'insensitive' } },
        { email: { contains: buscarStr, mode: 'insensitive' } },
      ]
    } : {};

    const where = { ...roleFilter, ...searchFilter };

    const users = await prisma.user.findMany({
      where,
      include: {
        directorProfile: true,
        teacherProfile: true,
        studentProfile: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const result = users.map(u => {
      const roleMap: Record<string, string> = { ADMIN: 'DIRECTOR', TEACHER: 'DOCENTE', STUDENT: 'ALUMNO' };
      const rol = roleMap[u.role] || u.role;

      let controlNumber = '';
      let id_empleado = '';
      let phone = '';
      let curp = '';
      let nivel = u.nivel || '';
      let joinDate = u.createdAt.toISOString().split('T')[0];

      if (u.role === 'ADMIN' && u.directorProfile) {
        controlNumber = u.directorProfile.institutionCode || '';
        phone = u.directorProfile.phone || '';
        curp = u.directorProfile.curp || '';
      } else if (u.role === 'TEACHER' && u.teacherProfile) {
        id_empleado = u.teacherProfile.idEmpleado || '';
        controlNumber = u.teacherProfile.institutionCode || '';
        phone = u.teacherProfile.phone || '';
        curp = u.teacherProfile.curp || '';
        nivel = u.teacherProfile.degree || '';
      } else if (u.role === 'STUDENT' && u.studentProfile) {
        controlNumber = u.studentProfile.numeroControl || u.studentProfile.institutionCode || '';
        phone = u.studentProfile.phone || '';
        curp = u.studentProfile.curp || '';
        nivel = u.studentProfile.nivelIngles || u.studentProfile.moduloTec || '';
      }

      return {
        id: u.id,
        email: u.email,
        nombre: u.name || '',
        rol,
        avatar: u.avatar || '',
        status: u.active ? 'ACTIVE' : 'SUSPENDED',
        phone,
        curp,
        controlNumber,
        id_empleado,
        location: '',
        nivel,
        joinDate,
        hoja: rol,
      };
    });

    res.json({ ok: true, usuarios: result });
  } catch (error) {
    console.error("Error al listar usuarios:", error);
    res.status(500).json({ ok: false, error: "Error interno del servidor" });
  }
});

// ============================================================
// ASISTENCIAS — PostgreSQL
// ============================================================

async function getUserRole(email: string) {
  if (!email) return null;
  const u = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: { id: true, email: true, role: true },
  });
  if (!u) return null;
  return {
    id: u.id,
    email: u.email,
    roleEs: u.role === 'ADMIN' ? 'DIRECTOR' : u.role === 'TEACHER' ? 'DOCENTE' : 'ALUMNO',
  };
}

// ── POST /api/attendance — SOLO DOCENTE, solo sus grupos
app.post("/api/attendance", async (req: Request, res: Response) => {
  try {
    const { email, grupo_id, registros, fecha, horaEntrada, metodo } = req.body;
    const ctx = await getUserRole(email);
    if (!ctx) return res.status(403).json({ ok: false, error: "email_requerido_o_invalido" });
    if (ctx.roleEs !== 'DOCENTE') {
      return res.status(403).json({ ok: false, error: "solo_docente_puede_registrar_asistencia" });
    }

    // Verificar que el grupo pertenece al docente (o al director de su institución)
    const group = await prisma.englishGroup.findUnique({ where: { id: grupo_id } });
    if (!group) return res.status(404).json({ ok: false, error: "grupo_no_encontrado" });
    if (group.docenteEmail !== ctx.email) {
      return res.status(403).json({ ok: false, error: "no_es_tu_grupo" });
    }

    const fechaDate = new Date(fecha || new Date().toISOString().slice(0, 10));
    let registrados = 0;
    for (const r of (registros || [])) {
      const user = await prisma.user.findFirst({ where: { email: r.email?.toLowerCase() } });
      if (!user) continue;

      await prisma.attendance.upsert({
        where: { groupId_userId_fecha: { groupId: grupo_id, userId: user.id, fecha: fechaDate } },
        update: {
          estado: r.estado, nombre: r.nombre, docenteEmail: ctx.email, email: r.email,
          horaEntrada: r.horaEntrada || horaEntrada || null,
          metodo: r.metodo || metodo || 'MANUAL',
          registradoPor: ctx.email,
        },
        create: {
          groupId: grupo_id,
          userId: user.id,
          email: r.email || '',
          nombre: r.nombre || '',
          fecha: fechaDate,
          estado: r.estado,
          docenteEmail: ctx.email,
          horaEntrada: r.horaEntrada || horaEntrada || null,
          metodo: r.metodo || metodo || 'MANUAL',
          registradoPor: ctx.email,
        },
      });
      registrados++;
    }

    res.json({ ok: true, registrados });
  } catch (error) {
    console.error("Error al registrar asistencia:", error);
    res.status(500).json({ ok: false, error: "Error interno del servidor" });
  }
});

// ── GET /api/attendance/:grupoId — DOCENTE (sus grupos) + DIRECTOR (institución)
app.get("/api/attendance/:grupoId", async (req: Request, res: Response) => {
  try {
    const { grupoId } = req.params;
    const email = String(req.query.email || '').toLowerCase().trim();
    const ctx = await getUserRole(email);
    if (!ctx) return res.status(403).json({ ok: false, error: "email_requerido" });

    const group = await prisma.englishGroup.findUnique({ where: { id: grupoId } });
    if (!group) return res.status(404).json({ ok: false, error: "grupo_no_encontrado" });

    // Docente: solo sus grupos. Director: grupos de su institución.
    if (ctx.roleEs === 'DOCENTE' && group.docenteEmail !== ctx.email) {
      return res.status(403).json({ ok: false, error: "no_es_tu_grupo" });
    }
    if (ctx.roleEs === 'DIRECTOR') {
      const dir = await prisma.directorProfile.findUnique({ where: { userId: ctx.id } });
      if (dir?.institutionCode && group.institutionCode && dir.institutionCode !== group.institutionCode) {
        return res.status(403).json({ ok: false, error: "no_es_tu_institucion" });
      }
    }

    const { fecha } = req.query;
    const fechaDate = fecha ? new Date(fecha as string) : new Date();
    const startOfDay = new Date(fechaDate); startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(fechaDate); endOfDay.setHours(23, 59, 59, 999);

    const records = await prisma.attendance.findMany({
      where: { groupId: grupoId, fecha: { gte: startOfDay, lte: endOfDay } },
      orderBy: { nombre: 'asc' },
    });

    const asistencias = records.map(a => ({
      id: a.id,
      grupo_id: a.groupId,
      user_id: a.userId,
      email: a.email,
      nombre: a.nombre,
      fecha: a.fecha.toISOString().slice(0, 10),
      estado: a.estado,
      hora_entrada: a.horaEntrada,
      metodo: a.metodo,
      docente_email: a.docenteEmail,
      created_at: a.createdAt.toISOString(),
    }));

    res.json({ ok: true, asistencias });
  } catch (error) {
    console.error("Error al obtener asistencia:", error);
    res.status(500).json({ ok: false, error: "Error interno del servidor" });
  }
});

// ── POST /api/attendance/qr-scan — Pase de lista por QR
// body: { teacherEmail, grupo_id, qrValue }
// Acepta QR con formato: "TECLINGO:usr_xxx" | "TECLINGO:email" | "usr_xxx" | "email" | uuid
app.post("/api/attendance/qr-scan", async (req: Request, res: Response) => {
  try {
    const { teacherEmail, grupo_id, qrValue } = req.body || {};
    if (!teacherEmail || !grupo_id || !qrValue) {
      return res.status(400).json({ ok: false, status: 'ERROR', mensaje: 'Faltan campos: teacherEmail, grupo_id, qrValue' });
    }

    const ctx = await getUserRole(teacherEmail);
    if (!ctx || ctx.roleEs !== 'DOCENTE') {
      return res.status(403).json({ ok: false, status: 'ERROR', mensaje: 'Solo DOCENTE puede usar el lector QR' });
    }

    const group = await prisma.englishGroup.findUnique({ where: { id: grupo_id } });
    if (!group) return res.status(404).json({ ok: false, status: 'ERROR', mensaje: 'Grupo no encontrado' });
    if (group.docenteEmail !== ctx.email) {
      return res.status(403).json({ ok: false, status: 'ERROR', mensaje: 'Este grupo no es tuyo' });
    }

    // Parsear qrValue: quitar prefijo TECLINGO: (case-insensitive)
    let raw = String(qrValue).trim();
    if (raw.toUpperCase().startsWith('TECLINGO:')) {
      raw = raw.substring(9).trim();
    }

    // Identificar al alumno: por email, por id, por sheetId
    let alumno: { id: string; email: string; name: string | null; avatar: string | null } | null = null;

    if (raw.includes('@')) {
      alumno = await prisma.user.findUnique({
        where: { email: raw.toLowerCase() },
        select: { id: true, email: true, name: true, avatar: true },
      });
    } else {
      // UUID o usr_xxx
      alumno = await prisma.user.findUnique({
        where: { id: raw },
        select: { id: true, email: true, name: true, avatar: true },
      });
      if (!alumno) {
        // Fallback: buscar por sheetId
        const bySheet = await prisma.user.findFirst({
          where: { sheetId: raw },
          select: { id: true, email: true, name: true, avatar: true },
        });
        if (bySheet) alumno = bySheet;
      }
    }

    if (!alumno) {
      return res.status(404).json({
        ok: false, status: 'ERROR',
        mensaje: 'Credencial no reconocida — alumno no existe en el sistema',
        qrValue: raw,
      });
    }

    // Verificar inscripción en el grupo
    const member = await prisma.groupMember.findUnique({
      where: { groupId_userId: { groupId: grupo_id, userId: alumno.id } },
    });
    if (!member || !member.activo) {
      return res.status(400).json({
        ok: false, status: 'ERROR',
        mensaje: `${alumno.name || alumno.email} no está inscrito en este grupo`,
        alumno: { id: alumno.id, name: alumno.name, email: alumno.email, avatar: alumno.avatar },
      });
    }

    // Hora de entrada
    const now = new Date();
    const hh = String(now.getHours()).padStart(2, '0');
    const mm = String(now.getMinutes()).padStart(2, '0');
    const horaEntrada = `${hh}:${mm}`;
    const fechaDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);

    // Buscar registro existente de hoy
    const existing = await prisma.attendance.findUnique({
      where: { groupId_userId_fecha: { groupId: grupo_id, userId: alumno.id, fecha: fechaDate } },
    });

    if (existing && (existing.estado === 'PRESENTE' || existing.estado === 'RETRASO')) {
      return res.json({
        ok: true,
        status: 'DUPLICATE',
        mensaje: `Ya registrado hoy (${existing.horaEntrada || existing.estado})`,
        alumno: {
          id: alumno.id, name: alumno.name, email: alumno.email, avatar: alumno.avatar,
          hora: existing.horaEntrada || horaEntrada,
        },
      });
    }

    // Upsert con estado PRESENTE
    const record = await prisma.attendance.upsert({
      where: { groupId_userId_fecha: { groupId: grupo_id, userId: alumno.id, fecha: fechaDate } },
      update: {
        estado: 'PRESENTE',
        horaEntrada,
        metodo: 'QR',
        tipoLectura: 'ENTRADA',
        registradoPor: ctx.email,
        docenteEmail: ctx.email,
        nombre: alumno.name || '',
        email: alumno.email || '',
      },
      create: {
        groupId: grupo_id,
        userId: alumno.id,
        email: alumno.email || '',
        nombre: alumno.name || '',
        fecha: fechaDate,
        estado: 'PRESENTE',
        horaEntrada,
        metodo: 'QR',
        tipoLectura: 'ENTRADA',
        registradoPor: ctx.email,
        docenteEmail: ctx.email,
      },
    });

    return res.json({
      ok: true,
      status: 'SUCCESS',
      mensaje: `Presente a las ${horaEntrada}`,
      alumno: {
        id: alumno.id, name: alumno.name, email: alumno.email, avatar: alumno.avatar,
        hora: horaEntrada,
      },
      attendanceId: record.id,
    });
  } catch (error) {
    console.error('[qr-scan] error:', error);
    res.status(500).json({ ok: false, status: 'ERROR', mensaje: 'Error interno del servidor' });
  }
});
// ── GET /api/attendance/stats/:grupoId — SOLO DIRECTOR
// KPIs auto-generados: % total, promedio entrada, alertas, tendencia semanal, heatmap, trend por alumno
app.get("/api/attendance/stats/:grupoId", async (req: Request, res: Response) => {
  try {
    const { grupoId } = req.params;
    const email = String(req.query.email || '').toLowerCase().trim();
    const days = Math.min(parseInt(String(req.query.days || '30')) || 30, 180);

    const ctx = await getUserRole(email);
    if (!ctx) {
      return res.status(403).json({ ok: false, error: "email_requerido" });
    }

    const group = await prisma.englishGroup.findUnique({
      where: { id: grupoId },
      include: { members: { where: { activo: true }, include: { user: { select: { id: true, name: true, avatar: true } } } } },
    });
    if (!group) return res.status(404).json({ ok: false, error: "grupo_no_encontrado" });

    // Autorización:
    // - DIRECTOR: sus grupos (por institución)
    // - DOCENTE: solo sus grupos
    // - ALUMNO: prohibido
    if (ctx.roleEs === 'DIRECTOR') {
      const dir = await prisma.directorProfile.findUnique({ where: { userId: ctx.id } });
      if (dir?.institutionCode && group.institutionCode && dir.institutionCode !== group.institutionCode) {
        return res.status(403).json({ ok: false, error: "no_es_tu_institucion" });
      }
    } else if (ctx.roleEs === 'DOCENTE') {
      if (group.docenteEmail !== ctx.email) {
        return res.status(403).json({ ok: false, error: "no_es_tu_grupo" });
      }
    } else {
      return res.status(403).json({ ok: false, error: "rol_no_autorizado" });
    }

    const now = new Date();
    const start = new Date(now); start.setDate(now.getDate() - days); start.setHours(0, 0, 0, 0);

    const records = await prisma.attendance.findMany({
      where: { groupId: grupoId, fecha: { gte: start } },
      orderBy: { fecha: 'asc' },
    });

    // ── KPI 1: Asistencia Total
    const totalRegs = records.length;
    const presentes = records.filter(r => r.estado === 'PRESENTE' || r.estado === 'RETRASO').length;
    const totalAsistencia = totalRegs > 0 ? Math.round((presentes / totalRegs) * 100) : 0;

    // ── KPI 2: Promedio hora de entrada (solo registros con horaEntrada)
    const horas = records.map(r => r.horaEntrada).filter(Boolean) as string[];
    let promedioEntrada = '—';
    if (horas.length > 0) {
      const mins = horas.map(h => { const [hh, mm] = h.split(':').map(Number); return hh * 60 + (mm || 0); });
      const avg = Math.round(mins.reduce((a, b) => a + b, 0) / mins.length);
      promedioEntrada = `${String(Math.floor(avg / 60)).padStart(2, '0')}:${String(avg % 60).padStart(2, '0')}`;
    }

    // ── KPI 3: Alumnos en riesgo (asistencia individual < 75%)
    const porAlumno = new Map<string, { total: number; presentes: number; nombre: string; email: string; trend: number[] }>();
    for (const r of records) {
      const k = r.userId;
      if (!porAlumno.has(k)) porAlumno.set(k, { total: 0, presentes: 0, nombre: r.nombre || '', email: r.email, trend: [] });
      const a = porAlumno.get(k)!;
      a.total++;
      const ok = r.estado === 'PRESENTE' || r.estado === 'RETRASO';
      if (ok) a.presentes++;
      a.trend.push(ok ? 1 : 0);
    }
    const alumnosStats = Array.from(porAlumno.entries()).map(([userId, v]) => ({
      userId,
      nombre: v.nombre,
      email: v.email,
      porcentaje: v.total > 0 ? Math.round((v.presentes / v.total) * 100) : 0,
      trend: v.trend.slice(-7),
      enRiesgo: v.total > 0 ? (v.presentes / v.total) < 0.75 : false,
    }));
    const enRiesgo = alumnosStats.filter(a => a.enRiesgo);

    // ── KPI 4: Tendencia semanal (Lun-Vie del grupo)
    const diasSemana = ['Dom','Lun','Mar','Mié','Jue','Vie','Sáb'];
    const porDiaSemana = new Map<string, { total: number; presentes: number }>();
    for (const r of records) {
      const d = diasSemana[new Date(r.fecha).getDay()];
      if (!porDiaSemana.has(d)) porDiaSemana.set(d, { total: 0, presentes: 0 });
      const a = porDiaSemana.get(d)!;
      a.total++;
      if (r.estado === 'PRESENTE' || r.estado === 'RETRASO') a.presentes++;
    }
    const tendenciaSemanal = ['Lun','Mar','Mié','Jue','Vie'].map(d => {
      const v = porDiaSemana.get(d) || { total: 0, presentes: 0 };
      return { dia: d, porcentaje: v.total > 0 ? Math.round((v.presentes / v.total) * 100) : 0 };
    });

    // ── KPI 5: Heatmap mensual (todos los días del mes actual)
    const year = now.getFullYear(), month = now.getMonth();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const heatmap = Array.from({ length: daysInMonth }, (_, i) => {
      const day = i + 1;
      const dayStart = new Date(year, month, day, 0, 0, 0);
      const dayEnd = new Date(year, month, day, 23, 59, 59, 999);
      const dayRecs = records.filter(r => r.fecha >= dayStart && r.fecha <= dayEnd);
      const totalD = dayRecs.length;
      const presD = dayRecs.filter(r => r.estado === 'PRESENTE' || r.estado === 'RETRASO').length;
      return { dia: day, porcentaje: totalD > 0 ? Math.round((presD / totalD) * 100) : null };
    });

    res.json({
      ok: true,
      grupo: { id: group.id, nombre: group.nombre, grupo: group.grupo, nivel: group.nivel },
      kpis: {
        totalAsistencia,
        promedioEntrada,
        totalRegistros: totalRegs,
        alumnosEnRiesgo: enRiesgo.length,
      },
      tendenciaSemanal,
      heatmap,
      alumnos: alumnosStats,
      alumnosEnRiesgo: enRiesgo,
    });
  } catch (error) {
    console.error("Error al calcular stats:", error);
    res.status(500).json({ ok: false, error: "Error interno del servidor" });
  }
});

// ============================================================
// CALENDAR EVENTS — PostgreSQL
// ============================================================

// ── Helper: obtener el director vinculado al email (para validar rol + institution_code)
async function getDirectorContext(email: string) {
  if (!email) return null;
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: { directorProfile: true },
  });
  if (!user) return null;
  const roleEs = user.role === 'ADMIN' ? 'DIRECTOR' : user.role === 'TEACHER' ? 'DOCENTE' : 'ALUMNO';
  return {
    userId: user.id,
    email: user.email,
    roleEs,
    institutionCode: user.directorProfile?.institutionCode || null,
  };
}

// ── Helper: rol efectivo desde email (para filtrar visibilidad en GET)
async function getUserContext(email: string) {
  if (!email) return null;
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    include: { directorProfile: true, teacherProfile: true, studentProfile: true },
  });
  if (!user) return null;
  const roleEs = user.role === 'ADMIN' ? 'DIRECTOR' : user.role === 'TEACHER' ? 'DOCENTE' : 'ALUMNO';
  const institutionCode =
    user.directorProfile?.institutionCode ||
    user.teacherProfile?.institutionCode ||
    user.studentProfile?.institutionCode ||
    null;
  return { userId: user.id, email: user.email, roleEs, institutionCode };
}

// ── GET /api/calendar-events?email=X
// Devuelve solo lo que el usuario puede ver: filtra por institución + visibilidad.
app.get("/api/calendar-events", async (req: Request, res: Response) => {
  try {
    const email = String(req.query.email || '').toLowerCase().trim();
    const ctx = email ? await getUserContext(email) : null;

    const events = await prisma.calendarEvent.findMany({ orderBy: [{ year: 'asc' }, { month: 'asc' }, { day: 'asc' }] });

    const filtered = events.filter(e => {
      // Sin contexto (anónimo o email no encontrado): solo eventos sin institución (legacy)
      if (!ctx) return !e.institutionCode;
      // DIRECTOR: ve todo lo de su institución + los legacy sin institución
      if (ctx.roleEs === 'DIRECTOR') {
        return !e.institutionCode || e.institutionCode === ctx.institutionCode;
      }
      // DOCENTE/ALUMNO: solo lo de su institución o legacy, Y que su rol esté en visibility
      if (e.institutionCode && e.institutionCode !== ctx.institutionCode) return false;
      const vis = String(e.visibility || 'GLOBAL').split(',').map(v => v.trim().toUpperCase());
      return vis.includes('GLOBAL') || vis.includes(ctx.roleEs);
    });

    const mapped = filtered.map(e => ({
      id: e.id,
      day: e.day,
      month: e.month,
      year: e.year,
      title: e.title,
      type: e.type,
      description: e.description,
      time: e.time,
      visibility: String(e.visibility || 'GLOBAL').split(',').map(v => v.trim()).filter(Boolean),
      created_by: e.createdBy,
      institution_code: e.institutionCode,
      created_at: e.createdAt.toISOString(),
      updated_at: e.updatedAt.toISOString(),
    }));
    res.json({ ok: true, events: mapped });
  } catch (error) {
    console.error("Error al listar eventos:", error);
    res.status(500).json({ ok: false, error: "Error interno del servidor" });
  }
});

// ── POST /api/calendar-events (solo DIRECTOR)
app.post("/api/calendar-events", async (req: Request, res: Response) => {
  try {
    const { email, day, month, year, title, type, description, time, visibility } = req.body;
    const ctx = await getDirectorContext(email);
    if (!ctx) return res.status(403).json({ ok: false, error: "email_requerido_o_invalido" });
    if (ctx.roleEs !== 'DIRECTOR') {
      return res.status(403).json({ ok: false, error: "solo_director_puede_crear_eventos" });
    }
    if (!title || !day || !month || !year) {
      return res.status(400).json({ ok: false, error: "campos_incompletos" });
    }
    const visStr = Array.isArray(visibility) ? visibility.join(',') : String(visibility || 'GLOBAL');
    const event = await prisma.calendarEvent.create({
      data: {
        day: parseInt(day), month: parseInt(month), year: parseInt(year),
        title: String(title), type: String(type || 'SCHOOL'),
        description: String(description || ''),
        time: String(time || ''),
        visibility: visStr,
        createdBy: ctx.email,
        institutionCode: ctx.institutionCode,
      },
    });
    res.json({ ok: true, event });
  } catch (error) {
    console.error("Error al crear evento:", error);
    res.status(500).json({ ok: false, error: "Error interno del servidor" });
  }
});

// ── PUT /api/calendar-events/:id (solo DIRECTOR, solo su institución)
app.put("/api/calendar-events/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { email, ...data } = req.body;
    const ctx = await getDirectorContext(email);
    if (!ctx || ctx.roleEs !== 'DIRECTOR') {
      return res.status(403).json({ ok: false, error: "solo_director" });
    }
    const existing = await prisma.calendarEvent.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ ok: false, error: "evento_no_encontrado" });
    if (existing.institutionCode && existing.institutionCode !== ctx.institutionCode) {
      return res.status(403).json({ ok: false, error: "no_es_tu_institucion" });
    }
    // Normalizar visibility a string
    const payload: any = { ...data };
    if (Array.isArray(payload.visibility)) payload.visibility = payload.visibility.join(',');
    // No permitir cambiar institución
    delete payload.institutionCode;
    delete payload.createdBy;
    const event = await prisma.calendarEvent.update({ where: { id }, data: payload });
    res.json({ ok: true, event });
  } catch (error) {
    console.error("Error al actualizar evento:", error);
    res.status(500).json({ ok: false, error: "Error interno del servidor" });
  }
});

// ── DELETE /api/calendar-events/:id (solo DIRECTOR, solo su institución)
app.delete("/api/calendar-events/:id", async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const email = String((req.body?.email || req.query?.email || '')).toLowerCase().trim();
    const ctx = await getDirectorContext(email);
    if (!ctx || ctx.roleEs !== 'DIRECTOR') {
      return res.status(403).json({ ok: false, error: "solo_director" });
    }
    const existing = await prisma.calendarEvent.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ ok: false, error: "evento_no_encontrado" });
    if (existing.institutionCode && existing.institutionCode !== ctx.institutionCode) {
      return res.status(403).json({ ok: false, error: "no_es_tu_institucion" });
    }
    await prisma.calendarEvent.delete({ where: { id } });
    res.json({ ok: true });
  } catch (error) {
    console.error("Error al eliminar evento:", error);
    res.status(500).json({ ok: false, error: "Error interno del servidor" });
  }
});

// ============================================================
// GRUPOS DE INGLÉS — CRUD en PostgreSQL
// ============================================================

function generateCodeId(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'CLE-';
  for (let i = 0; i < 6; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

// 15. Crear grupo de inglés (con múltiples sesiones)
app.post("/api/english-groups", async (req: Request, res: Response) => {
  try {
    const { email, nombre, grupo, nivel, carrera, turno, sesiones, capacidad } = req.body;
    if (!email || !nombre) return res.status(400).json({ ok: false, error: "Faltan campos obligatorios" });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) return res.status(404).json({ ok: false, error: "Usuario no encontrado" });

    const dirProfile = await prisma.directorProfile.findUnique({ where: { userId: user.id } });
    const institutionCode = dirProfile?.institutionCode || null;

    let codeId: string;
    let attempts = 0;
    do {
      codeId = generateCodeId();
      attempts++;
    } while (attempts < 10 && await prisma.englishGroup.findUnique({ where: { codeId } }));

    const group = await prisma.englishGroup.create({
      data: {
        codeId,
        nombre,
        grupo: grupo || 'A',
        nivel: nivel || 'A1',
        carrera: carrera || null,
        turno: turno || null,
        capacidad: capacidad || 30,
        directorEmail: email.toLowerCase().trim(),
        institutionCode,
      },
    });

    // Create schedule entries from sesiones
    if (Array.isArray(sesiones) && sesiones.length > 0) {
      for (let i = 0; i < sesiones.length; i++) {
        const s = sesiones[i];
        await prisma.englishGroupSchedule.create({
          data: {
            groupId: group.id,
            horaInicio: s.horaInicio,
            horaFin: s.horaFin,
            dias: s.dias,
            orden: i + 1,
          },
        });
      }
    }

    res.status(201).json({ ok: true, grupo_id: group.id, code_id: group.codeId });
  } catch (error) {
    console.error("Error al crear grupo de inglés:", error);
    res.status(500).json({ ok: false, error: "Error interno del servidor" });
  }
});

// ============================================================
// OPERATIONS CONTROL - Dashboard operativo del Director
// ============================================================

const DIA_MAP: Record<number, string> = {
  0: 'DO', 1: 'LU', 2: 'MA', 3: 'MI', 4: 'JU', 5: 'VI', 6: 'SA',
};

function getLocationFromTurno(turno: string | null | undefined): string {
  if (!turno) return 'Sin ubicacion';
  const t = String(turno).toUpperCase();
  if (t.includes('DISTANCIA') || t.includes('LINEA')) return 'Virtual';
  if (t.includes('MATUTINO')) return 'Panuco - Matutino';
  if (t.includes('VESPERTINO')) return 'Panuco - Vespertino';
  return String(turno);
}

async function getScheduleForDate(dateStr: string, directorEmail?: string) {
  const date = new Date(dateStr + 'T12:00:00-06:00');
  const dayCode = DIA_MAP[date.getDay()] || 'LU';

  const whereGroup: any = { status: 'ACTIVE' };
  if (directorEmail) whereGroup.directorEmail = String(directorEmail).toLowerCase().trim();

  const schedules = await prisma.englishGroupSchedule.findMany({
    where: {
      dias: dayCode,
      group: whereGroup,
    },
    include: {
      group: {
        select: {
          id: true, codeId: true, nombre: true, grupo: true, nivel: true,
          docenteEmail: true, turno: true, carrera: true, directorEmail: true,
        },
      },
    },
    orderBy: [{ horaInicio: 'asc' }, { orden: 'asc' }],
  });

  const teacherMap = new Map<string, Array<{ start: string; end: string }>>();
  schedules.forEach((s) => {
    const email = s.group.docenteEmail;
    if (!email) return;
    if (!teacherMap.has(email)) teacherMap.set(email, []);
    teacherMap.get(email)!.push({ start: s.horaInicio, end: s.horaFin });
  });

  const conflictTeachers = new Set<string>();
  teacherMap.forEach((blocks, email) => {
    for (let i = 0; i < blocks.length; i++) {
      for (let j = i + 1; j < blocks.length; j++) {
        if (blocks[i].start < blocks[j].end && blocks[i].end > blocks[j].start) {
          conflictTeachers.add(email);
        }
      }
    }
  });

  const docenteEmails = Array.from(new Set(schedules.map((s) => s.group.docenteEmail).filter(Boolean) as string[]));
  const teachers = docenteEmails.length > 0
    ? await prisma.user.findMany({
        where: { email: { in: docenteEmails } },
        select: { email: true, name: true },
      })
    : [];
  const teacherNameByEmail = new Map(teachers.map((t) => [t.email.toLowerCase(), t.name || t.email.split('@')[0]]));

  const items = schedules.map((s) => {
    const docenteEmail = s.group.docenteEmail || null;
    const teacherName = docenteEmail ? (teacherNameByEmail.get(docenteEmail.toLowerCase()) || null) : null;
    let status: 'ok' | 'alert' | 'conflict' = 'ok';
    let conflictReason: string | null = null;
    if (!docenteEmail) {
      status = 'alert';
      conflictReason = 'Sin docente asignado';
    } else if (conflictTeachers.has(docenteEmail)) {
      status = 'conflict';
      conflictReason = 'Conflicto de horario del docente';
    }
    const initials = teacherName
      ? teacherName.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
      : '??';
    return {
      scheduleId: s.id,
      groupId: s.group.id,
      groupCode: s.group.codeId,
      groupName: s.group.nombre,
      groupLetter: s.group.grupo,
      nivel: s.group.nivel,
      teacherName,
      teacherInitials: initials,
      startTime: s.horaInicio,
      endTime: s.horaFin,
      location: getLocationFromTurno(s.group.turno),
      status,
      conflictReason,
      dayCode,
    };
  });

  return { dayCode, items };
}

app.get('/api/operations/schedule', async (req: Request, res: Response) => {
  try {
    const directorEmail = req.query.directorEmail ? String(req.query.directorEmail) : undefined;
    const dateParam = req.query.date ? String(req.query.date) : null;
    const dateStr = dateParam || new Date().toLocaleDateString('en-CA', { timeZone: 'America/Mexico_City' });

    const { dayCode, items } = await getScheduleForDate(dateStr, directorEmail);

    res.json({
      ok: true,
      date: dateStr,
      dayCode,
      totalActiveClasses: items.length,
      schedule: items,
    });
  } catch (error) {
    console.error('[operations/schedule]', error);
    res.status(500).json({ ok: false, error: 'Error interno' });
  }
});

app.get('/api/operations/schedule-week', async (req: Request, res: Response) => {
  try {
    const directorEmail = req.query.directorEmail ? String(req.query.directorEmail) : undefined;

    const nowCDMX = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));
    const dayOfWeek = nowCDMX.getDay();
    const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
    const monday = new Date(nowCDMX);
    monday.setDate(nowCDMX.getDate() + diffToMonday);

    const days: Array<{ date: string; dayCode: string; totalClasses: number; schedule: any[] }> = [];
    for (let i = 0; i < 7; i++) {
      const dayDate = new Date(monday);
      dayDate.setDate(monday.getDate() + i);
      const dateStr = dayDate.toLocaleDateString('en-CA');
      const { dayCode, items } = await getScheduleForDate(dateStr, directorEmail);
      days.push({ date: dateStr, dayCode, totalClasses: items.length, schedule: items });
    }

    const totalWeek = days.reduce((acc, d) => acc + d.totalClasses, 0);
    res.json({ ok: true, weekStart: days[0]?.date, weekEnd: days[6]?.date, totalActiveClasses: totalWeek, days });
  } catch (error) {
    console.error('[operations/schedule-week]', error);
    res.status(500).json({ ok: false, error: 'Error interno' });
  }
});

// ============================================================
// STUDENT DASHBOARD — Próxima clase del alumno
// ============================================================

app.get('/api/student/next-class', async (req: Request, res: Response) => {
  try {
    const studentEmail = String(req.query.studentEmail || '').toLowerCase().trim();
    if (!studentEmail) return res.status(400).json({ ok: false, error: 'studentEmail requerido' });

    const student = await prisma.user.findUnique({ where: { email: studentEmail } });
    if (!student) return res.status(404).json({ ok: false, error: 'Alumno no encontrado' });

    // Buscar los grupos activos del alumno
    const memberships = await prisma.groupMember.findMany({
      where: { userId: student.id, activo: true },
      include: {
        group: {
          select: {
            id: true, codeId: true, nombre: true, grupo: true, nivel: true,
            docenteEmail: true, turno: true, status: true,
          },
        },
      },
    });

    const activeGroups = memberships.filter((m) => m.group && m.group.status === 'ACTIVE').map((m) => m.group);
    if (activeGroups.length === 0) {
      return res.json({ ok: true, hasGroup: false, hasSchedule: false, nextClass: null });
    }

    const groupIds = activeGroups.map((g) => g.id);
    const schedules = await prisma.englishGroupSchedule.findMany({
      where: { groupId: { in: groupIds } },
      orderBy: [{ horaInicio: 'asc' }, { orden: 'asc' }],
    });

    if (schedules.length === 0) {
      return res.json({ ok: true, hasGroup: true, hasSchedule: false, nextClass: null });
    }

    // Calcular el próximo schedule
    const DIA_MAP: Record<number, string> = {
      0: 'DO', 1: 'LU', 2: 'MA', 3: 'MI', 4: 'JU', 5: 'VI', 6: 'SA',
    };

    const nowCDMX = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Mexico_City' }));
    const nowHHMM = nowCDMX.getHours() * 60 + nowCDMX.getMinutes();

    // Buscar el próximo: iterar sobre los días 0 a 14 (hoy y siguientes 2 semanas)
    let best: { dateISO: string; dayCode: string; schedule: any; group: any } | null = null;
    let bestMinutes = Infinity;

    for (let offset = 0; offset < 14; offset++) {
      const day = new Date(nowCDMX);
      day.setDate(nowCDMX.getDate() + offset);
      const dayCode = DIA_MAP[day.getDay()];

      const daySchedules = schedules.filter((s) => s.dias === dayCode);
      for (const s of daySchedules) {
        const [h, m] = s.horaInicio.split(':').map((x) => parseInt(x, 10));
        const startMinutes = h * 60 + m;

        // Si es hoy, tiene que ser en el futuro
        if (offset === 0 && startMinutes <= nowHHMM) continue;

        const totalMinutes = offset * 24 * 60 + startMinutes - nowHHMM;
        if (totalMinutes < bestMinutes) {
          bestMinutes = totalMinutes;
          const group = activeGroups.find((g) => g.id === s.groupId);
          const dateISO = day.toLocaleDateString('en-CA');
          best = { dateISO, dayCode, schedule: s, group };
        }
      }
    }

    if (!best || !best.group) {
      return res.json({ ok: true, hasGroup: true, hasSchedule: true, nextClass: null });
    }

    // Formatear hora
    const [h, m] = best.schedule.horaInicio.split(':').map((x) => parseInt(x, 10));
    const ampm = h >= 12 ? 'PM' : 'AM';
    const h12 = h % 12 === 0 ? 12 : h % 12;
    const hhmm12 = `${String(h12).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;

    // Label relativo
    let relativeLabel = '';
    if (bestMinutes < 24 * 60 && best.dateISO === nowCDMX.toLocaleDateString('en-CA')) {
      relativeLabel = 'Hoy';
    } else if (bestMinutes < 48 * 60) {
      const tomorrow = new Date(nowCDMX);
      tomorrow.setDate(nowCDMX.getDate() + 1);
      if (best.dateISO === tomorrow.toLocaleDateString('en-CA')) relativeLabel = 'Mañana';
      else relativeLabel = ['Domingo','Lunes','Martes','Miércoles','Jueves','Viernes','Sábado'][new Date(best.dateISO + 'T12:00:00').getDay()];
    } else {
      const d = new Date(best.dateISO + 'T12:00:00');
      relativeLabel = d.toLocaleDateString('es-MX', { day: 'numeric', month: 'short' }).replace('.', '');
    }

    // Docente
    let teacherName: string | null = null;
    let teacherInitials = '??';
    if (best.group.docenteEmail) {
      const t = await prisma.user.findUnique({ where: { email: best.group.docenteEmail } });
      if (t && t.name) {
        teacherName = t.name;
        teacherInitials = t.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();
      }
    }

    // Ubicación
    const turno = String(best.group.turno || '').toUpperCase();
    let location = 'Sin ubicación';
    if (turno.includes('DISTANCIA') || turno.includes('LINEA')) location = 'Virtual';
    else if (turno.includes('MATUTINO')) location = 'Pánuco · Matutino';
    else if (turno.includes('VESPERTINO')) location = 'Pánuco · Vespertino';

    res.json({
      ok: true,
      hasGroup: true,
      hasSchedule: true,
      nextClass: {
        scheduleId: best.schedule.id,
        groupId: best.group.id,
        groupCode: best.group.codeId,
        groupName: best.group.nombre,
        nivel: best.group.nivel,
        teacherName,
        teacherInitials,
        startTime: best.schedule.horaInicio,
        endTime: best.schedule.horaFin,
        time12h: hhmm12,
        dayCode: best.dayCode,
        dateISO: best.dateISO,
        relativeLabel,
        location,
        minutesUntil: bestMinutes,
      },
    });
  } catch (error) {
    console.error('[student/next-class]', error);
    res.status(500).json({ ok: false, error: 'Error interno' });
  }
});


// ============================================================
// OLLAMA PROXY - Para Venus AI Tutor (y otras apps externas)
// ============================================================
// Reenvía peticiones a Ollama local (localhost:11434).
// Uso desde Venus: OLLAMA_BASE_URL=https://api.teclingoingles.com/ollama
app.all('/ollama/*', async (req: Request, res: Response) => {
  try {
    // Extraer el path después de /ollama
    const subPath = req.originalUrl.replace(/^\/ollama/, '');
    const targetUrl = `http://localhost:11434${subPath}`;

    const fetchOpts: RequestInit = {
      method: req.method,
      headers: { 'Content-Type': 'application/json' },
    };
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      fetchOpts.body = JSON.stringify(req.body);
    }

    const resp = await fetch(targetUrl, fetchOpts);
    const contentType = resp.headers.get('content-type') || '';

    if (contentType.includes('application/json')) {
      const data = await resp.json();
      res.status(resp.status).json(data);
    } else {
      const text = await resp.text();
      res.status(resp.status).send(text);
    }
  } catch (error) {
    console.error('[ollama-proxy]', error);
    res.status(502).json({ error: 'Ollama no disponible' });
  }
});

// 16. Listar grupos de inglés del usuario (director, docente asignado o miembro activo) con horarios
app.get("/api/english-groups/:email", async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    const normalizedEmail = email.toLowerCase().trim();

    // Detectar si es DIRECTOR para ampliar el where a su institución completa
    const userCtx = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { directorProfile: true },
    });
    const isDirector = userCtx?.role === 'ADMIN';
    const directorInstCode = userCtx?.directorProfile?.institutionCode || null;

    const orConditions: any[] = [
      { directorEmail: normalizedEmail },
      { docenteEmail: normalizedEmail },
      { members: { some: { email: normalizedEmail, activo: true } } },
    ];
    // Director: también todos los grupos de su institución
    if (isDirector && directorInstCode) {
      orConditions.push({ institutionCode: directorInstCode });
    }

    const groups = await prisma.englishGroup.findMany({
      where: {
        status: 'ACTIVE',
        OR: orConditions,
      },
      include: { schedules: { orderBy: { orden: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });

    const result = groups.map(g => ({
      grupo_id: g.id,
      code_id: g.codeId,
      nombre: g.nombre,
      grupo: g.grupo,
      nivel: g.nivel,
      carrera: g.carrera,
      turno: g.turno,
      docente_email: g.docenteEmail,
      director_email: g.directorEmail,
      capacidad: g.capacidad,
      alumnos_inscritos: g.alumnosInscritos,
      status: g.status,
      created_at: g.createdAt.toISOString(),
      updated_at: g.updatedAt.toISOString(),
      sesiones: g.schedules.map(s => ({
        id: s.id,
        horaInicio: s.horaInicio,
        horaFin: s.horaFin,
        dias: s.dias,
        orden: s.orden,
      })),
    }));

    res.json({ ok: true, grupos: result });
  } catch (error) {
    console.error("Error al listar grupos:", error);
    res.status(500).json({ ok: false, error: "Error interno del servidor" });
  }
});

// 17. Asignar docente a grupo
app.put("/api/english-groups/:groupId/assign-teacher", async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const { docente_email } = req.body;
    if (!docente_email) return res.status(400).json({ ok: false, error: "Email del docente requerido" });

    const group = await prisma.englishGroup.findUnique({ where: { id: groupId } });
    if (!group) return res.status(404).json({ ok: false, error: "Grupo no encontrado" });

    await prisma.englishGroup.update({
      where: { id: groupId },
      data: { docenteEmail: docente_email.toLowerCase().trim() },
    });

    res.json({ ok: true });
  } catch (error) {
    console.error("Error al asignar docente:", error);
    res.status(500).json({ ok: false, error: "Error interno del servidor" });
  }
});

// 18. Eliminar (desactivar) grupo de inglés
app.delete("/api/english-groups/:groupId", async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    await prisma.englishGroup.update({
      where: { id: groupId },
      data: { status: 'INACTIVE' },
    });
    res.json({ ok: true });
  } catch (error) {
    console.error("Error al eliminar grupo:", error);
    res.status(500).json({ ok: false, error: "Error interno del servidor" });
  }
});

// 19. Listar TODOS los grupos disponibles (para alumnos)
// NOTA: NO se expone code_id — es confidencial; el docente lo distribuye a sus alumnos asignados.
app.get("/api/english-groups-available", async (req: Request, res: Response) => {
  try {
    const groups = await prisma.englishGroup.findMany({
      where: { status: 'ACTIVE' },
      include: { schedules: { orderBy: { orden: 'asc' } } },
      orderBy: { createdAt: 'desc' },
    });

    const result = groups.map(g => ({
      grupo_id: g.id,
      nombre: g.nombre,
      grupo: g.grupo,
      nivel: g.nivel,
      carrera: g.carrera,
      turno: g.turno,
      docente_email: g.docenteEmail,
      capacidad: g.capacidad,
      alumnos_inscritos: g.alumnosInscritos,
      status: g.status,
      director_email: g.directorEmail,
      institution_code: g.institutionCode,
      created_at: g.createdAt.toISOString(),
      updated_at: g.updatedAt.toISOString(),
      sesiones: g.schedules.map(s => ({
        id: s.id,
        horaInicio: s.horaInicio,
        horaFin: s.horaFin,
        dias: s.dias,
        orden: s.orden,
      })),
    }));

    res.json({ ok: true, grupos: result });
  } catch (error) {
    console.error("Error al listar grupos disponibles:", error);
    res.status(500).json({ ok: false, error: "Error interno del servidor" });
  }
});

// 20. Unirse a grupo por codeId (alumno)
app.post("/api/english-groups/join", async (req: Request, res: Response) => {
  try {
    const { email, code_id } = req.body;
    if (!email || !code_id) return res.status(400).json({ ok: false, error: "Faltan campos" });

    const group = await prisma.englishGroup.findUnique({ where: { codeId: code_id.trim().toUpperCase() } });
    if (!group) return res.status(404).json({ ok: false, error: "Grupo no encontrado con ese código" });
    if (group.status !== 'ACTIVE') return res.status(400).json({ ok: false, error: "Grupo inactivo" });
    if (group.alumnosInscritos >= group.capacidad) return res.status(400).json({ ok: false, error: "Grupo lleno" });

    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) return res.status(404).json({ ok: false, error: "Usuario no encontrado" });

    const existing = await prisma.groupMember.findUnique({ where: { groupId_userId: { groupId: group.id, userId: user.id } } });
    if (existing) return res.status(400).json({ ok: false, error: "Ya estás inscrito en este grupo" });

    await prisma.groupMember.create({
      data: {
        groupId: group.id,
        userId: user.id,
        email: user.email,
        nombre: user.name,
        rolEnGrupo: 'ALUMNO',
      },
    });

    await prisma.englishGroup.update({
      where: { id: group.id },
      data: { alumnosInscritos: { increment: 1 } },
    });

    res.json({ ok: true, grupo_id: group.id, nombre: group.nombre });
  } catch (error) {
    console.error("Error al unirse a grupo:", error);
    res.status(500).json({ ok: false, error: "Error interno del servidor" });
  }
});

// ============================================================
// SUPABASE STORAGE — Imágenes de usuarios (ID Card institucional)
// Bucket: TECLINGO INGLES IMAGENES. Reemplaza Google Drive para
// avatares/logos. Si SUPABASE_SERVICE_ROLE_KEY no está configurada,
// responde 'supabase_not_configured' y el frontend cae a Drive.
// ============================================================
const SUPABASE_URL = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';
const SUPABASE_BUCKET = process.env.SUPABASE_BUCKET || 'TECLINGO INGLES IMAGENES';

app.post("/api/supabase-upload", async (req: Request, res: Response) => {
  try {
    const { email, imageBase64, fileName, mimeType, folder } = req.body;
    if (!email || !imageBase64) {
      return res.status(400).json({ ok: false, error: "email e imageBase64 son obligatorios" });
    }
    if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY || SUPABASE_SERVICE_KEY.includes('PEGAR_')) {
      return res.status(503).json({ ok: false, error: "supabase_not_configured" });
    }
    // Whitelist de MIME types: imágenes + PDF + documentos Office + texto plano
    const ALLOWED_MIME_PREFIXES = ['image/'];
    const ALLOWED_MIME_EXACT = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint',
      'application/vnd.openxmlformats-officedocument.presentationml.presentation',
      'text/plain',
      'text/csv',
    ];
    const mimeStr = String(mimeType || '');
    const mimeOk = ALLOWED_MIME_PREFIXES.some(p => mimeStr.startsWith(p))
      || ALLOWED_MIME_EXACT.includes(mimeStr)
      || !mimeType; // sin mime → permitir
    if (!mimeOk) {
      return res.status(400).json({ ok: false, error: "mime_no_permitido", detalle: mimeStr });
    }

    // Acepta base64 puro o dataURL (data:image/png;base64,....)
    const raw = String(imageBase64);
    const base64 = raw.includes('base64,') ? raw.split('base64,')[1] : raw;
    const buffer = Buffer.from(base64, 'base64');
    if (buffer.length === 0) return res.status(400).json({ ok: false, error: "imagen_vacia" });
    if (buffer.length > 10 * 1024 * 1024) {
      return res.status(413).json({ ok: false, error: "imagen_demasiado_grande_max_5mb" });
    }

    // Ruta en el bucket: {folder}/{email}/{timestamp}_{archivo}
    const safeEmail = String(email).toLowerCase().trim().replace(/[^a-z0-9._-]/g, '_');
    const safeName = String(fileName || 'imagen.jpg').replace(/[^a-zA-Z0-9._-]/g, '_');
    const dir = String(folder || 'imagenes').replace(/[^a-zA-Z0-9_-]/g, '');
    const objectPath = `${dir}/${safeEmail}/${Date.now()}_${safeName}`;

    const uploadRes = await fetch(
      `${SUPABASE_URL}/storage/v1/object/${encodeURIComponent(SUPABASE_BUCKET)}/${objectPath}`,
      {
        method: 'POST',
        headers: {
          // Las claves nuevas de Supabase (sb_secret_* / sb_publishable_*) exigen
          // el header `apikey`; las clásicas (service_role JWT) usan Bearer.
          'apikey': SUPABASE_SERVICE_KEY,
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'Content-Type': String(mimeType || 'image/jpeg'),
          'x-upsert': 'true',
          'cache-control': '3600',
        },
        body: buffer,
      }
    );

    if (!uploadRes.ok) {
      const detail = await uploadRes.text();
      console.error('[Supabase Upload] Error:', uploadRes.status, detail);
      // 403 AccessDenied => falta la secret key (o políticas RLS en el bucket)
      const hint = /row-level security|AccessDenied/i.test(detail)
        ? 'supabase_rls_denegado_falta_secret_key'
        : `supabase_error_${uploadRes.status}`;
      return res.status(502).json({ ok: false, error: hint, detail: detail.slice(0, 200) });
    }

    // URL para renderizar en <img>: pública si el bucket es público,
    // si no, URL firmada temporal (requiere la secret key).
    const bucketEnc = encodeURIComponent(SUPABASE_BUCKET);
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucketEnc}/${objectPath}`;
    let fileUrl = publicUrl;
    try {
      const probe = await fetch(publicUrl, { method: 'HEAD' });
      if (!probe.ok) {
        const signRes = await fetch(`${SUPABASE_URL}/storage/v1/object/sign/${bucketEnc}/${objectPath}`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_SERVICE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ expiresIn: 60 * 60 * 24 * 30 }), // 30 días
        });
        if (signRes.ok) {
          const signed = await signRes.json().catch(() => null);
          if (signed?.signedURL) fileUrl = `${SUPABASE_URL}/storage/v1${signed.signedURL}`;
        }
      }
    } catch { /* si falla el probe, se devuelve la URL pública */ }

    res.json({ ok: true, fileUrl, fileId: objectPath, path: objectPath, bucket: SUPABASE_BUCKET });
  } catch (error) {
    console.error("Error al subir a Supabase:", error);
    res.status(500).json({ ok: false, error: "Error interno del servidor" });
  }
});

// GET /api/supabase-status — Diagnóstico del almacenamiento de imágenes.
// Abrir en el navegador: http://localhost:3000/api/supabase-status
// Prueba de verdad la subida contra el bucket y explica cómo arreglarlo.
app.get("/api/supabase-status", async (_req: Request, res: Response) => {
  const status: Record<string, unknown> = {
    url: SUPABASE_URL || null,
    bucket: SUPABASE_BUCKET,
    credencial: !SUPABASE_SERVICE_KEY
      ? null
      : SUPABASE_SERVICE_KEY.startsWith('sb_secret_') || SUPABASE_SERVICE_KEY.split('.').length === 3
        ? 'secret (ignora RLS)'
        : 'publishable (requiere políticas RLS)',
    credencial_prefijo: SUPABASE_SERVICE_KEY ? `${SUPABASE_SERVICE_KEY.slice(0, 14)}…` : null,
  };

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return res.status(503).json({ ...status, ok: false, error: 'supabase_not_configured' });
  }

  const authHeaders = {
    'apikey': SUPABASE_SERVICE_KEY,
    'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
  };
  const bucketEnc = encodeURIComponent(SUPABASE_BUCKET);

  try {
    // 1) El bucket existe? Es público?
    const bucketRes = await fetch(`${SUPABASE_URL}/storage/v1/bucket/${bucketEnc}`, { headers: authHeaders });
    status.bucket_http = bucketRes.status;
    if (bucketRes.ok) {
      const b = await bucketRes.json().catch(() => null) as { public?: boolean; file_size_limit?: number } | null;
      status.bucket_publico = b?.public ?? null;
      status.limite_bytes = b?.file_size_limit ?? null;
    }

    // 2) Prueba real de ESCRITURA (aquí es donde falla el RLS).
    //    Se sube un PNG 1x1 porque el bucket solo acepta tipos image/*.
    const PNG_1X1 = Buffer.from(
      'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
      'base64'
    );
    const probePath = `_diagnostico/ping_${Date.now()}.png`;
    const uploadRes = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucketEnc}/${probePath}`, {
      method: 'POST',
      headers: { ...authHeaders, 'Content-Type': 'image/png', 'x-upsert': 'true' },
      body: PNG_1X1,
    });
    status.subida_http = uploadRes.status;
    status.subida_ok = uploadRes.ok;

    if (!uploadRes.ok) {
      const detail = (await uploadRes.text()).slice(0, 200);
      status.subida_detalle = detail;
      if (/row-level security/i.test(detail)) {
        status.como_arreglarlo = 'Ejecuta supabase_storage_setup.sql en el SQL Editor de Supabase, o pon SUPABASE_SERVICE_ROLE_KEY (sb_secret_…) en .env';
      } else if (/mime type|InvalidMimeType/i.test(detail)) {
        status.como_arreglarlo = 'El bucket restringe los tipos permitidos: ajusta allowed_mime_types en supabase_storage_setup.sql';
      } else {
        status.como_arreglarlo = 'Revisa SUPABASE_URL / SUPABASE_BUCKET / la clave en .env';
      }
      return res.status(502).json({ ...status, ok: false });
    }

    // 3) Prueba de LECTURA PÚBLICA (lo que hace <img src> en la ID Card)
    const publicUrl = `${SUPABASE_URL}/storage/v1/object/public/${bucketEnc}/${probePath}`;
    const readRes = await fetch(publicUrl);
    status.lectura_publica_http = readRes.status;
    status.lectura_publica_ok = readRes.ok;
    status.url_ejemplo = publicUrl;
    if (!readRes.ok) {
      status.como_arreglarlo = 'El bucket NO es público: ejecuta el paso 1 de supabase_storage_setup.sql';
    }

    // 4) Limpieza del archivo de prueba
    const delRes = await fetch(`${SUPABASE_URL}/storage/v1/object/${bucketEnc}/${probePath}`, {
      method: 'DELETE',
      headers: authHeaders,
    });
    status.limpieza_http = delRes.status;

    res.json({ ...status, ok: uploadRes.ok && readRes.ok });
  } catch (error) {
    res.status(500).json({ ...status, ok: false, error: String(error) });
  }
});

// 20. Obtener miembros de un grupo
app.get("/api/english-groups/:groupId/members", async (req: Request, res: Response) => {
  try {
    const { groupId } = req.params;
    const members = await prisma.groupMember.findMany({
      where: { groupId, activo: true },
      orderBy: { fechaAsignacion: 'asc' },
      include: {
        user: {
          select: {
            avatar: true,
            studentProfile: {
              select: { numeroControl: true, nivelIngles: true, carrera: true, semestre: true },
            },
          },
        },
      },
    });

    const result = members.map(m => ({
      asignacion_id: m.id,
      grupo_id: m.groupId,
      user_id: m.userId,
      email: m.email,
      nombre: m.nombre,
      rol_en_grupo: m.rolEnGrupo,
      fecha_asignacion: m.fechaAsignacion.toISOString(),
      asignado_por: m.asignadoPor,
      activo: String(m.activo),
      // REGLA UNIVERSAL: imagen y datos académicos del usuario para ubicación visual
      avatar: m.user?.avatar || null,
      numero_control: m.user?.studentProfile?.numeroControl || null,
      nivel_ingles: m.user?.studentProfile?.nivelIngles || null,
      carrera: m.user?.studentProfile?.carrera || null,
      semestre: m.user?.studentProfile?.semestre || null,
    }));

    res.json({ ok: true, miembros: result });
  } catch (error) {
    console.error("Error al obtener miembros:", error);
    res.status(500).json({ ok: false, error: "Error interno del servidor" });
  }
});

// 21. Mis grupos de inglés (alumno ve sus grupos)
app.get("/api/my-english-groups/:email", async (req: Request, res: Response) => {
  try {
    const { email } = req.params;
    const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
    if (!user) return res.status(404).json({ ok: false, error: "Usuario no encontrado" });

    const memberships = await prisma.groupMember.findMany({
      where: { userId: user.id, activo: true },
      include: { group: { include: { schedules: { orderBy: { orden: 'asc' } } } } },
    });

    const result = memberships.map(m => ({
      grupo_id: m.group.id,
      nombre: m.group.nombre,
      grupo: m.group.grupo,
      nivel: m.group.nivel,
      carrera: m.group.carrera,
      turno: m.group.turno,
      docente_email: m.group.docenteEmail,
      capacidad: m.group.capacidad,
      alumnos_inscritos: m.group.alumnosInscritos,
      status: m.group.status,
      created_at: m.group.createdAt.toISOString(),
      updated_at: m.group.updatedAt.toISOString(),
      sesiones: m.group.schedules.map(s => ({
        id: s.id,
        horaInicio: s.horaInicio,
        horaFin: s.horaFin,
        dias: s.dias,
        orden: s.orden,
      })),
    }));

    res.json({ ok: true, grupos: result });
  } catch (error) {
    console.error("Error al obtener mis grupos:", error);
    res.status(500).json({ ok: false, error: "Error interno del servidor" });
  }
});

// ══════════════════════════════════════════════════════════════
// MENSAJERÍA — PostgreSQL (reemplaza CHATS + MENSAJES de Apps Script)
// IDs se conservan del front: CHAT-GLOBAL, DIRECT-a_b, GROUP-*
// ══════════════════════════════════════════════════════════════

async function getUserByEmail(email: string) {
  if (!email) return null;
  return prisma.user.findUnique({
    where: { email: email.toLowerCase().trim() },
    select: { id: true, email: true, name: true, role: true, avatar: true },
  });
}

function roleEsToRole(role: string): 'ALUMNO' | 'DOCENTE' | 'DIRECTOR' {
  if (role === 'ADMIN') return 'DIRECTOR';
  if (role === 'TEACHER') return 'DOCENTE';
  return 'ALUMNO';
}

// GET /api/messaging/conversations?email=X
app.get('/api/messaging/conversations', async (req: Request, res: Response) => {
  try {
    const email = String(req.query.email || '').toLowerCase().trim();
    if (!email) return res.status(400).json({ ok: false, error: 'email_requerido' });

    const user = await getUserByEmail(email);
    if (!user) return res.status(404).json({ ok: false, error: 'usuario_no_encontrado' });

    const convs = await prisma.conversation.findMany({
      where: {
        OR: [
          { type: 'GLOBAL' },
          { members: { some: { userId: user.id } } },
        ],
      },
      include: {
        members: {
          select: { userId: true, email: true, name: true, role: true, lastReadAt: true },
        },
      },
      orderBy: [{ lastMessageAt: 'desc' }, { createdAt: 'desc' }],
    });

    const chats = await Promise.all(convs.map(async (conv) => {
      const messages = await prisma.message.findMany({
        where: {
          conversationId: conv.id,
          deletedAt: null,
          OR: [
            { visibleTo: { isEmpty: true } },
            { visibleTo: { has: user.id } },
          ],
        },
        orderBy: { createdAt: 'asc' },
        take: 100,
      });

      const participantEmails = conv.members.map((m) => m.email);
      const participantNames: Record<string, string> = {};
      const participantRoles: Record<string, string> = {};
      conv.members.forEach((m) => {
        participantNames[m.email] = m.name || m.email.split('@')[0];
        participantRoles[m.email] = m.role || 'ALUMNO';
      });

      const mapped = messages.map((msg) => ({
        id: msg.id,
        senderId: (msg.senderId === user.id || (msg.senderEmail && msg.senderEmail.toLowerCase() === user.email.toLowerCase())) ? 'ME' : msg.senderId,
        senderEmail: msg.senderEmail,
        senderName: msg.senderName || 'Usuario',
        senderRole: msg.senderRole || 'ALUMNO',
        content: msg.content,
        timestamp: new Date(msg.createdAt).toLocaleTimeString('es-MX', {
          hour: '2-digit', minute: '2-digit',
        }),
        isDirector: msg.isDirector,
      }));

      const me = conv.members.find((m) => m.userId === user.id);
      // Los mensajes que YO envié nunca cuentan como no leídos.
      const otherMessages = messages.filter((m) => m.senderId !== user.id);
      const unreadCount = me?.lastReadAt
        ? otherMessages.filter((m) => new Date(m.createdAt) > new Date(me.lastReadAt!)).length
        : 0;

      return {
        id: conv.id,
        name: conv.name || 'Chat',
        type: conv.type,
        participants: participantEmails,
        participantNames,
        participantRoles,
        messages: mapped,
        lastMessage: conv.lastMessage || '',
        unreadCount,
      };
    }));

    res.json({ ok: true, chats });
  } catch (error) {
    console.error('[messaging/conversations GET]', error);
    res.status(500).json({ ok: false, error: 'Error interno del servidor' });
  }
});

// POST /api/messaging/conversations
app.post('/api/messaging/conversations', async (req: Request, res: Response) => {
  try {
    const { email, chatId, name, type, participants } = req.body || {};
    if (!email || !chatId) return res.status(400).json({ ok: false, error: 'email_y_chatId_requeridos' });

    const creator = await getUserByEmail(email);
    if (!creator) return res.status(404).json({ ok: false, error: 'usuario_no_encontrado' });

    const emails: string[] = Array.isArray(participants) && participants.length > 0
      ? Array.from(new Set([email, ...participants].map((e) => String(e).toLowerCase().trim())))
      : [email.toLowerCase().trim()];

    const users = await prisma.user.findMany({
      where: { email: { in: emails } },
      select: { id: true, email: true, name: true, role: true },
    });

    const convType = type === 'DIRECT' ? 'DIRECT' : type === 'GROUP' ? 'GROUP' : 'GLOBAL';

    // Normalizar chatId DIRECT: ordenar los emails alfabéticamente para que
    // el mismo par de usuarios siempre genere el mismo ID sin importar quién inició.
    let normalizedChatId = chatId;
    if (convType === 'DIRECT' && chatId.startsWith('DIRECT-')) {
      const ids = chatId.replace('DIRECT-', '').split('_').map((e: string) => e.toLowerCase().trim()).filter(Boolean).sort();
      if (ids.length >= 2) normalizedChatId = `DIRECT-${ids.join('_')}`;
    }

    const conv = await prisma.conversation.upsert({
      where: { id: normalizedChatId },
      create: {
        id: normalizedChatId,
        type: convType as any,
        name: name || 'Chat',
        createdById: creator.id,
        createdByEmail: creator.email,
      },
      update: { name: name || undefined },
    });

    for (const u of users) {
      await prisma.conversationMember.upsert({
        where: { conversationId_userId: { conversationId: conv.id, userId: u.id } },
        create: {
          conversationId: conv.id,
          userId: u.id,
          email: u.email,
          name: u.name,
          role: roleEsToRole(u.role),
        },
        update: { name: u.name },
      });
    }

    res.json({ ok: true, chatId: conv.id });
  } catch (error) {
    console.error('[messaging/conversations POST]', error);
    res.status(500).json({ ok: false, error: 'Error interno del servidor' });
  }
});

// GET /api/messaging/conversations/:id/messages?email=X&limit=100
app.get('/api/messaging/conversations/:id/messages', async (req: Request, res: Response) => {
  try {
    const email = String(req.query.email || '').toLowerCase().trim();
    const limit = Math.min(parseInt(String(req.query.limit || '100')) || 100, 500);
    if (!email) return res.status(400).json({ ok: false, error: 'email_requerido' });

    const user = await getUserByEmail(email);
    if (!user) return res.status(404).json({ ok: false, error: 'usuario_no_encontrado' });

    const messages = await prisma.message.findMany({
      where: {
        conversationId: req.params.id,
        deletedAt: null,
        OR: [
          { visibleTo: { isEmpty: true } },
          { visibleTo: { has: user.id } },
        ],
      },
      orderBy: { createdAt: 'asc' },
      take: limit,
    });

    const mapped = messages.map((msg) => ({
      id: msg.id,
      senderId: (msg.senderId === user.id || (msg.senderEmail && msg.senderEmail.toLowerCase() === user.email.toLowerCase())) ? 'ME' : msg.senderId,
      senderEmail: msg.senderEmail,
        senderName: msg.senderName || 'Usuario',
      senderRole: msg.senderRole || 'ALUMNO',
      content: msg.content,
      timestamp: new Date(msg.createdAt).toLocaleTimeString('es-MX', {
        hour: '2-digit', minute: '2-digit',
      }),
      isDirector: msg.isDirector,
    }));

    res.json({ ok: true, messages: mapped });
  } catch (error) {
    console.error('[messaging/messages GET]', error);
    res.status(500).json({ ok: false, error: 'Error interno del servidor' });
  }
});

// POST /api/messaging/conversations/:id/messages
app.post('/api/messaging/conversations/:id/messages', async (req: Request, res: Response) => {
  try {
    const { email, content, senderName, senderRole, isDirector } = req.body || {};
    if (!email || !content) return res.status(400).json({ ok: false, error: 'email_y_content_requeridos' });

    const sender = await getUserByEmail(email);
    if (!sender) return res.status(404).json({ ok: false, error: 'usuario_no_encontrado' });

    const conv = await prisma.conversation.findUnique({ where: { id: req.params.id } });
    if (!conv) return res.status(404).json({ ok: false, error: 'conversacion_no_encontrada' });

    const msg = await prisma.message.create({
      data: {
        conversationId: conv.id,
        senderId: sender.id,
        senderEmail: sender.email,
        senderName: senderName || sender.name || sender.email.split('@')[0],
        senderRole: senderRole || roleEsToRole(sender.role),
        content: String(content).trim(),
        isDirector: Boolean(isDirector),
      },
    });

    await prisma.conversation.update({
      where: { id: conv.id },
      data: {
        lastMessage: String(content).substring(0, 100),
        lastMessageAt: msg.createdAt,
      },
    });

    res.json({
      ok: true,
      message: {
        id: msg.id,
        senderId: 'ME',
        senderName: msg.senderName,
        senderRole: msg.senderRole,
        content: msg.content,
        timestamp: new Date(msg.createdAt).toLocaleTimeString('es-MX', {
          hour: '2-digit', minute: '2-digit',
        }),
        isDirector: msg.isDirector,
      },
    });
  } catch (error) {
    console.error('[messaging/messages POST]', error);
    res.status(500).json({ ok: false, error: 'Error interno del servidor' });
  }
});

// POST /api/messaging/conversations/:id/read
app.post('/api/messaging/conversations/:id/read', async (req: Request, res: Response) => {
  try {
    const { email } = req.body || {};
    if (!email) return res.status(400).json({ ok: false, error: 'email_requerido' });

    const user = await getUserByEmail(email);
    if (!user) return res.status(404).json({ ok: false, error: 'usuario_no_encontrado' });

    await prisma.conversationMember.updateMany({
      where: { conversationId: req.params.id, userId: user.id },
      data: { lastReadAt: new Date() },
    });

    res.json({ ok: true });
  } catch (error) {
    console.error('[messaging/read POST]', error);
    res.status(500).json({ ok: false, error: 'Error interno del servidor' });
  }
});
// ===================================================================
// TTS (Edge TTS via edge-tts-universal)
// ===================================================================

const VOICE_MAP: Record<string, Record<string, string>> = {
  en: { male: 'en-US-GuyNeural', female: 'en-US-JennyNeural' },
  es: { male: 'es-MX-JorgeNeural', female: 'es-MX-DaliaNeural' },
};

app.post('/api/tts', async (req: Request, res: Response) => {
  const { text, gender = 'female', lang = 'en-US' } = req.body || {};

  if (!text || typeof text !== 'string' || !text.trim()) {
    return res.status(400).json({ error: 'text requerido' });
  }

  const langPrefix = String(lang).toLowerCase().startsWith('es') ? 'es' : 'en';
  const genderKey = gender === 'male' ? 'male' : 'female';
  const voice = VOICE_MAP[langPrefix][genderKey] || VOICE_MAP[langPrefix].female;

  try {
    const communicate = new Communicate(text.trim(), { voice });
    const chunks: Buffer[] = [];

    for await (const chunk of communicate.stream()) {
      if (chunk.type === 'audio' && chunk.data) {
        chunks.push(Buffer.from(chunk.data));
      }
    }

    if (chunks.length === 0) {
      return res.status(500).json({ error: 'TTS synthesis returned no audio' });
    }

    const audio = Buffer.concat(chunks);
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Length', String(audio.length));
    res.setHeader('Cache-Control', 'no-store');
    res.send(audio);
  } catch (error) {
    console.error('[TTS] Error sintetizando:', error);
    res.status(500).json({ error: 'TTS synthesis failed' });
  }
});

// ===================================================================
// PROGRESO: guardar submission y consultar agregado
// ===================================================================

app.post('/api/progress/submission', async (req: Request, res: Response) => {
  try {
    const { email, lessonId, exerciseId, userAnswer, isCorrect, timeSpentSec, puntos } = req.body || {};
    if (!email || !exerciseId) return res.status(400).json({ ok: false, error: 'email y exerciseId requeridos' });

    const user = await prisma.user.findUnique({ where: { email: String(email).toLowerCase().trim() } });
    if (!user) return res.status(404).json({ ok: false, error: 'Usuario no encontrado' });

    const exercise = await prisma.exercise.findUnique({ where: { id: String(exerciseId) } });
    if (!exercise) return res.status(404).json({ ok: false, error: 'Ejercicio no encontrado' });

    const submission = await prisma.submission.create({
      data: {
        userId: user.id,
        exerciseId: exercise.id,
        userAnswer: String(userAnswer || ''),
        isCorrect: Boolean(isCorrect),
        timeSpentSec: Number(timeSpentSec) || 0,
      },
    });

    // Actualizar UserProgress (una fila por user+lesson) — upsert
    if (lessonId) {
      try {
        await prisma.userProgress.upsert({
          where: { userId_lessonId: { userId: user.id, lessonId: String(lessonId) } },
          update: { score: { increment: Number(puntos) || 0 }, completedAt: new Date() },
          create: { userId: user.id, lessonId: String(lessonId), completed: false, score: Number(puntos) || 0 },
        });
      } catch (e) {
        console.warn('[progress] UserProgress upsert falló:', e);
      }
    }

    res.json({ ok: true, id: submission.id });
  } catch (error) {
    console.error('[progress/submission]', error);
    res.status(500).json({ ok: false, error: 'Error interno del servidor' });
  }
});

// ===================================================================
// /api/progress/summary — resumen por leccion desde Prisma
// Debe ir ANTES de /api/progress/:email o el catch-all lo atrapa
// ===================================================================
app.get("/api/progress/summary", async (req: Request, res: Response) => {
  try {
    const rawUserId = String(req.query.userId || '').trim();
    const email = String(req.query.email || '').trim();
    if (!rawUserId && !email) {
      return res.status(400).json({ success: false, error: "userId o email requerido" });
    }

    // FIX 2026-09-26: resolver userId real. El frontend a veces manda
    // email-sanitizado (ej: "user_at_domain_com"). La BD usa UUIDs.
    // Estrategia: probar 3 fuentes en orden hasta encontrar submissions.

    const candidates: string[] = [];
    if (rawUserId) candidates.push(rawUserId);

    if (email) {
      // 1. Buscar User por email → su id real (UUID)
      const user = await prisma.user.findUnique({ where: { email } });
      if (user && user.id && !candidates.includes(user.id)) {
        candidates.push(user.id);
      }

      // 2. Reconstruir email sanitizado desde email real
      const sanitized = email.toLowerCase().replace(/[^a-z0-9]/g, '_');
      if (!candidates.includes(sanitized)) candidates.push(sanitized);
    }

    // 3. Buscar cualquier Submission cuyo userId parezca coincidir
    // (el primero que devuelva submissions gana)
    let effectiveUserId = candidates[0] || rawUserId;
    for (const candidate of candidates) {
      const count = await prisma.submission.count({ where: { userId: candidate } });
      if (count > 0) { effectiveUserId = candidate; break; }
    }

    const subs = await prisma.submission.findMany({
      where: { userId: effectiveUserId },
      include: { exercise: { select: { id: true, lessonId: true, skill: true, points: true } } },
    });

    const progressRows = await prisma.userProgress.findMany({ where: { userId: effectiveUserId } });
    const progressMap = new Map(progressRows.map((p) => [p.lessonId, p]));

    const lessons = await prisma.lesson.findMany({
      select: { id: true, _count: { select: { exercises: true } } },
    });
    const lessonTotals = new Map(lessons.map((l) => [l.id, l._count.exercises]));

    const byLesson: Record<string, { correctUnique: Set<string>; skillsCorrect: Set<string>; score: number }> = {};
    for (const s of subs) {
      const lid = s.exercise.lessonId;
      if (!byLesson[lid]) byLesson[lid] = { correctUnique: new Set(), skillsCorrect: new Set(), score: 0 };
      if (s.isCorrect) {
        const isNew = !byLesson[lid].correctUnique.has(s.exercise.id);
        byLesson[lid].correctUnique.add(s.exercise.id);
        byLesson[lid].skillsCorrect.add(s.exercise.skill);
        if (isNew) byLesson[lid].score += s.exercise.points || 10;
      }
    }

    const data: Record<string, any> = {};
    const lessonIds = new Set([...Object.keys(byLesson), ...progressRows.map((p) => p.lessonId)]);
    for (const lessonId of lessonIds) {
      const d = byLesson[lessonId] || { correctUnique: new Set<string>(), skillsCorrect: new Set<string>(), score: 0 };
      const up = progressMap.get(lessonId);
      const totalEx = lessonTotals.get(lessonId) || 25;
      const correct = d.correctUnique.size;
      const pct = totalEx > 0 ? Math.min(100, Math.round((correct / totalEx) * 100)) : 0;
      const skillsDone = d.skillsCorrect.size;
      const completed = up?.completed === true || skillsDone >= 5 || pct >= 100;

      data[lessonId] = {
        completed,
        score: up?.score ?? d.score,
        porcentaje_avance: completed ? 100 : pct,
        reactivos_correctos: completed ? totalEx : correct,
        reactivos_totales: totalEx,
        habilidades_completadas: skillsDone,
      };
    }

    console.log("[progress/summary] rawUserId=" + rawUserId + " email=" + email + " effective=" + effectiveUserId + " lessons=" + Object.keys(data).length);
// FIX 2026-09-28: bySkill + totalSubmissions para el PDP
    const skillMap: Record<string, { correctUnique: Set<string>; total: number; correct: number }> = {};
    for (const s of subs) {
      const skill = String(s.exercise.skill || 'UNKNOWN');
      if (!skillMap[skill]) skillMap[skill] = { correctUnique: new Set(), total: 0, correct: 0 };
      skillMap[skill].total++;
      if (s.isCorrect) {
        skillMap[skill].correctUnique.add(s.exercise.id);
        skillMap[skill].correct++;
      }
    }
    const bySkill: Record<string, { correct: number; total: number; percent: number; started: boolean }> = {};
    for (const [skill, d] of Object.entries(skillMap)) {
      bySkill[skill] = {
        correct: d.correctUnique.size,
        total: d.total,
        percent: d.total > 0 ? Math.round((d.correctUnique.size / d.total) * 100) : 0,
        started: d.total > 0,
      };
    }
    res.json({ success: true, data, bySkill, totalSubmissions: subs.length, _debug: { effectiveUserId, candidates } });
  } catch (error) {
    console.error("[progress/summary] error:", error);
    res.status(500).json({ success: false, error: "Error interno del servidor" });
  }
});

app.get('/api/progress/:email', async (req: Request, res: Response) => {
  try {
    const email = String(req.params.email || '').toLowerCase().trim();
    if (!email) return res.status(400).json({ ok: false, error: 'email requerido' });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.json({ ok: true, data: { byLesson: {}, bySkill: {} } });

    // Agrupar submissions por lesson (via exercise.lessonId) y por skill
    const subs = await prisma.submission.findMany({
      where: { userId: user.id },
      include: { exercise: { select: { lessonId: true, skill: true } } },
    });

    const byLesson: Record<string, { correct: number; total: number; skills: Record<string, number>; points: number }> = {};
    const bySkill: Record<string, { correct: number; total: number }> = {};

    for (const s of subs) {
      const lessonId = s.exercise?.lessonId || 'unknown';
      const skill = String(s.exercise?.skill || 'unknown');
      if (!byLesson[lessonId]) byLesson[lessonId] = { correct: 0, total: 0, skills: {}, points: 0 };
      byLesson[lessonId].total += 1;
      if (s.isCorrect) { byLesson[lessonId].correct += 1; byLesson[lessonId].points += 10; }
      byLesson[lessonId].skills[skill] = (byLesson[lessonId].skills[skill] || 0) + (s.isCorrect ? 1 : 0);

      if (!bySkill[skill]) bySkill[skill] = { correct: 0, total: 0 };
      bySkill[skill].total += 1;
      if (s.isCorrect) bySkill[skill].correct += 1;
    }

    // Construir array compatible con SheetResumenProgresoRow[]
    const resumen: any[] = [];
    for (const [lessonId, data] of Object.entries(byLesson)) {
      const pct = Math.min(100, Math.round((data.correct / 25) * 100));
      const habilidadesCompletadas = Object.values(data.skills).filter(v => v >= 5).length;
      const estado = pct >= 100 ? 'completada' : pct > 0 ? 'en_progreso' : 'pendiente';
      resumen.push({
        resumen_id: `RES_${user.id}_${lessonId}`,
        user_id: email,
        clase_id: lessonId,
        habilidades_completadas: habilidadesCompletadas,
        reactivos_totales_clase: 25,
        reactivos_correctos: data.correct,
        puntaje_obtenido: data.points,
        puntaje_maximo_posible: 250,
        porcentaje_avance: pct,
        xp_ganado: data.points,
        estado_clase: estado,
        ultima_actualizacion: new Date().toISOString(),
      });
    }

    res.json({ ok: true, data: { byLesson, bySkill, resumen, totalSubmissions: subs.length } });
  } catch (error) {
    console.error('[progress/:email]', error);
    res.status(500).json({ ok: false, error: 'Error interno del servidor' });
  }
});

const PORT = process.env.PORT || 3000;
// ===================================================================
// EXÁMENES — Ubicación, Intermedios, Final
// ===================================================================
// GET /api/exams/:id/questions — Devuelve N preguntas aleatorias del pool
app.get("/api/exams/:id/questions", async (req: Request, res: Response) => {
  try {
    const exam = await prisma.exam.findFirst({
      where: { OR: [{ id: req.params.id }, { code: req.params.id }] },
    });
    if (!exam) return res.status(404).json({ success: false, error: "Examen no encontrado" });

    // Preguntas por skill: 10 para 50 preguntas, 20 para 100
    const perSkill = Math.floor(exam.totalQuestions / 5);
    const skills = ['GRAMMAR', 'READING', 'LISTENING', 'WRITING', 'SPEAKING'];

    const selectedIds: string[] = [];
    for (const skill of skills) {
      const pool = await prisma.examQuestion.findMany({
        where: { examId: exam.id, skill: skill as any, isActive: true },
        select: { exerciseId: true },
      });
      // Shuffle + take
      const shuffled = pool.map(p => p.exerciseId).sort(() => Math.random() - 0.5);
      selectedIds.push(...shuffled.slice(0, perSkill));
    }

    // Traer los ejercicios completos
    const exercises = await prisma.exercise.findMany({
      where: { id: { in: selectedIds } },
    });

    // Mapear al shape que el frontend espera
    const mapped = exercises.map(e => ({
      id: e.id,
      skill: e.skill,
      itemNumber: e.itemNumber,
      questionType: e.questionType,
      instruction: e.instruction,
      questionText: e.questionText,
      translationSentence: e.translationSentence,
      optionsJson: e.optionsJson,
      correctAnswer: e.correctAnswer,
      explanation: e.explanation,
      vocabularyHint: e.vocabularyHint,
      points: e.points,
      timeLimitSec: e.timeLimitSec,
      difficulty: e.difficulty,
      audioTTS: e.audioTTS,
      audioUI: e.audioUI,
      uiDisplay: e.uiDisplay,
      voz: e.voz,
      acceptedAnswers: e.acceptedAnswers,
    }));

    res.json({
      success: true,
      data: {
        exam: {
          id: exam.id,
          code: exam.code,
          title: exam.title,
          type: exam.type,
          durationMinutes: exam.durationMinutes,
          totalQuestions: exam.totalQuestions,
          passingScore: exam.passingScore,
        },
        questions: mapped,
        totalQuestions: mapped.length,
        perSkill,
      },
    });
  } catch (error) {
    console.error("[exams/:id/questions] error:", error);
    res.status(500).json({ success: false, error: "Error interno" });
  }
});

app.get("/api/exams", async (_req: Request, res: Response) => {
  try {
    const exams = await prisma.exam.findMany({
      where: { isPublished: true },
      orderBy: [{ weekNumber: 'asc' }, { code: 'asc' }],
    });
    res.json({ success: true, data: exams });
  } catch (error) {
    console.error("[exams] error:", error);
    res.status(500).json({ success: false, error: "Error interno" });
  }
});

app.get("/api/exams/:id", async (req: Request, res: Response) => {
  try {
    const exam = await prisma.exam.findFirst({
      where: { OR: [{ id: req.params.id }, { code: req.params.id }] },
    });
    if (!exam) return res.status(404).json({ success: false, error: "Examen no encontrado" });
    res.json({ success: true, data: exam });
  } catch (error) {
    console.error("[exams/:id] error:", error);
    res.status(500).json({ success: false, error: "Error interno" });
  }
});

app.get("/api/exams/:id/results", async (req: Request, res: Response) => {
  try {
    const exam = await prisma.exam.findFirst({
      where: { OR: [{ id: req.params.id }, { code: req.params.id }] },
    });
    if (!exam) return res.status(404).json({ success: false, error: "Examen no encontrado" });
    const results = await prisma.examResult.findMany({
      where: { examId: exam.id },
      orderBy: { completedAt: 'desc' },
    });
    res.json({ success: true, data: { exam, results } });
  } catch (error) {
    console.error("[exams/:id/results] error:", error);
    res.status(500).json({ success: false, error: "Error interno" });
  }
});

app.post("/api/exams/:id/submit", async (req: Request, res: Response) => {
  try {
    const { userId, score } = req.body || {};
    if (!userId || typeof score !== 'number') {
      return res.status(400).json({ success: false, error: "userId y score requeridos" });
    }
    const exam = await prisma.exam.findFirst({
      where: { OR: [{ id: req.params.id }, { code: req.params.id }] },
    });
    if (!exam) return res.status(404).json({ success: false, error: "Examen no encontrado" });
    const passed = score >= exam.passingScore;
    const result = await prisma.examResult.upsert({
      where: { userId_examId: { userId, examId: exam.id } },
      update: { score, percentage: score, passed, completedAt: new Date() },
      create: { userId, examId: exam.id, score, percentage: score, passed },
    });
    res.json({ success: true, data: { result, exam: { code: exam.code, title: exam.title, passingScore: exam.passingScore } } });
  } catch (error) {
    console.error("[exams/submit] error:", error);
    res.status(500).json({ success: false, error: "Error interno" });
  }
});

app.listen(PORT, () => {
  console.log(`🚀 Servidor Teclingo ejecutándose en http://localhost:${PORT}`);
});
