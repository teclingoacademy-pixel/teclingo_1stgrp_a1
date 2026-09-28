import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const USERS_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1bEtNMBaQ6IIIKxbJx4WN7qBu1dkdWGKzXaes_WgQGLk/export?format=csv&gid=1862945794';

const roleMap: Record<string, 'STUDENT' | 'TEACHER' | 'ADMIN'> = {
  DIRECTOR: 'ADMIN',
  DOCENTE: 'TEACHER',
  ALUMNO: 'STUDENT',
  TEACHER: 'TEACHER',
  STUDENT: 'STUDENT',
  ADMIN: 'ADMIN',
};

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') { inQuotes = !inQuotes; }
    else if (char === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
    else { current += char; }
  }
  result.push(current.trim());
  return result;
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;
  try {
    const parts = dateStr.split(/[/ :]/);
    if (parts.length >= 6) {
      const [d, m, y, h, min, s] = parts;
      return new Date(parseInt(y), parseInt(m) - 1, parseInt(d), parseInt(h), parseInt(min), parseInt(s));
    }
    return new Date(dateStr);
  } catch { return null; }
}

async function main() {
  console.log('🌐 Descargando usuarios desde Google Sheet...');
  const response = await fetch(USERS_SHEET_URL);
  if (!response.ok) throw new Error(`Error: ${response.status}`);

  const csv = await response.text();
  const lines = csv.split('\n').filter(l => l.trim());
  const headers = parseCsvLine(lines[0]);

  console.log(`📋 Columnas: ${headers.join(', ')}`);
  console.log(`👥 ${lines.length - 1} usuarios encontrados\n`);

  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvLine(lines[i]);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = values[idx] || ''; });

    const email = row.email?.toLowerCase().trim();
    if (!email) continue;

    const role = roleMap[row.rol?.toUpperCase()] || 'STUDENT';
    const lastAccess = parseDate(row.ultimo_acceso);

    try {
      const existing = await prisma.user.findUnique({ where: { email } });

      if (existing) {
        await prisma.user.update({
          where: { email },
          data: {
            sheetId: row.id || null,
            metodo: row.metodo || null,
            nikName: row.nik_name || null,
            nivel: row.nivel || null,
            avatar: row.avatar || null,
            lastAccess,
            active: row.activo === 'TRUE' || row.activo === 'true',
          },
        });
        console.log(`🔄 Actualizado: ${email}`);
        continue;
      }

      const user = await prisma.user.create({
        data: {
          sheetId: row.id || null,
          email,
          name: row.nombre || row.nik_name || 'Usuario',
          password: row.password_hash || null,
          metodo: row.metodo || null,
          nikName: row.nik_name || null,
          nivel: row.nivel || null,
          role,
          avatar: row.avatar || null,
          lastAccess,
          active: row.activo === 'TRUE' || row.activo === 'true',
        },
      });
      console.log(`✅ Creado: ${user.email} | ${user.name} | ${user.role} | sheetId: ${user.sheetId}`);
    } catch (error: any) {
      console.error(`❌ Error con ${email}:`, error.message);
    }
  }

  const total = await prisma.user.count();
  console.log(`\n📊 Total usuarios en BD: ${total}`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
