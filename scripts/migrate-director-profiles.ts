import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

const USERS_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1bEtNMBaQ6IIIKxbJx4WN7qBu1dkdWGKzXaes_WgQGLk/export?format=csv&gid=1862945794';
const DIRECTOR_SHEET_URL = 'https://docs.google.com/spreadsheets/d/1bEtNMBaQ6IIIKxbJx4WN7qBu1dkdWGKzXaes_WgQGLk/export?format=csv&gid=1959049523';

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
    const parts = dateStr.split(/[/ -]/);
    if (parts.length >= 3) { const [y, m, d] = parts; return new Date(parseInt(y), parseInt(m) - 1, parseInt(d)); }
    return new Date(dateStr);
  } catch { return null; }
}

function parseBool(val: string): boolean {
  return val === 'TRUE' || val === 'true' || val === '1';
}

async function fetchSheet(url: string): Promise<Record<string, string>[]> {
  const resp = await fetch(url);
  if (!resp.ok) throw new Error(`Error: ${resp.status}`);
  const csv = await resp.text();
  const lines = csv.split('\n').filter(l => l.trim());
  const headers = parseCsvLine(lines[0]);
  return lines.slice(1).map(line => {
    const values = parseCsvLine(line);
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => { row[h] = values[idx] || ''; });
    return row;
  });
}

async function main() {
  // 1. Sync sheetIds from Users sheet
  console.log('🔄 Sincronizando sheetIds de usuarios...\n');
  const userRows = await fetchSheet(USERS_SHEET_URL);
  for (const row of userRows) {
    const email = row.email?.toLowerCase().trim();
    const sheetId = row.id;
    if (!email || !sheetId) continue;

    const user = await p.user.findUnique({ where: { email } });
    if (user && !user.sheetId) {
      await p.user.update({ where: { email }, data: { sheetId } });
      console.log(`  ✅ ${email} → sheetId: ${sheetId}`);
    }
  }

  // 2. Migrate Director Profiles
  console.log('\n🌐 Migrando perfiles de Directores...\n');
  const directorRows = await fetchSheet(DIRECTOR_SHEET_URL);
  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of directorRows) {
    const sheetUserId = row.user_id;
    if (!sheetUserId) { skipped++; continue; }

    const user = await p.user.findUnique({ where: { sheetId: sheetUserId } });
    if (!user) { console.log(`⚠️  Usuario no encontrado: ${sheetUserId}`); skipped++; continue; }

    const data = {
      phone: row.phone || null,
      bio: row.bio || null,
      curp: row.curp || null,
      birthDate: parseDate(row.birth_date),
      institutionName: row.institution_name || null,
      institutionLogo: row.institution_logo || null,
      slogan: row.slogan || null,
      instPhone: row.inst_phone || null,
      address: row.address || null,
      instEmail: row.inst_email || null,
      facebook: row.facebook || null,
      instagram: row.instagram || null,
      linkedin: row.linkedin || null,
      institutionCode: row.institution_code || null,
      institutionType: row.institution_type || null,
      carrera1: row.carrera_1 || null,
      carrera2: row.carrera_2 || null,
      carrera3: row.carrera_3 || null,
      carrera4: row.carrera_4 || null,
      carrera5: row.carrera_5 || null,
      carrera6: row.carrera_6 || null,
      carrera7: row.carrera_7 || null,
      turnoMatutino: parseBool(row.turno_matutino),
      turnoVespertino: parseBool(row.turno_vespertino),
      turnoSemiEscolarizado: parseBool(row.turno_semi_escolarizado),
      turnoSabatino: parseBool(row.turno_sabatino),
      turnoDistancia: parseBool(row.turno_distancia),
      modalidad: row.modalidad || null,
    };

    try {
      const existing = await p.directorProfile.findUnique({ where: { userId: user.id } });
      if (existing) {
        await p.directorProfile.update({ where: { userId: user.id }, data });
        updated++;
        console.log(`🔄 ${user.email} actualizado`);
      } else {
        await p.directorProfile.create({ data: { userId: user.id, ...data } });
        created++;
        console.log(`✅ ${user.email} creado`);
      }
    } catch (error: any) {
      console.error(`❌ ${user.email}: ${error.message}`);
      skipped++;
    }
  }

  const total = await p.directorProfile.count();
  console.log(`\n${'='.repeat(40)}`);
  console.log(`📊 RESUMEN:`);
  console.log(`   Creados:  ${created}`);
  console.log(`   Actualizados: ${updated}`);
  console.log(`   Saltados: ${skipped}`);
  console.log(`   Total en BD: ${total}`);
  console.log(`${'='.repeat(40)}`);
}

main().catch(console.error).finally(() => p.$disconnect());
