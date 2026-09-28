import 'dotenv/config';

/**
 * Verifica de punta a punta el bucket de Supabase Storage que guarda las
 * imágenes de usuario para la ID Card institucional.
 *
 * Uso:  npx tsx scripts/verify-supabase-storage.ts
 *
 * Prueba: 1) el bucket existe y es público, 2) se puede SUBIR (RLS),
 *         3) la URL pública responde (lo que hace <img src> en la credencial)
 *         y 4) limpia el archivo de prueba.
 */

const URL_BASE = (process.env.SUPABASE_URL || '').replace(/\/+$/, '');
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_KEY || '';
const BUCKET = process.env.SUPABASE_BUCKET || 'TECLINGO INGLES IMAGENES';
const BUCKET_ENC = encodeURIComponent(BUCKET);

const AUTH = { apikey: KEY, Authorization: `Bearer ${KEY}` };
const ok = (v: boolean) => (v ? '✔' : '✖');

// PNG 1x1 transparente
const PNG_1X1 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';

async function main() {
  console.log('=== VERIFICACIÓN SUPABASE STORAGE (ID Card institucional) ===');
  console.log(`URL:    ${URL_BASE || '(no configurada)'}`);
  console.log(`Bucket: ${BUCKET}`);
  console.log(`Clave:  ${KEY ? (KEY.startsWith('sb_secret_') ? 'secret (ignora RLS)' : 'publishable (requiere políticas)') : '(no configurada)'}`);
  console.log('');

  if (!URL_BASE || !KEY) {
    console.log('✖ Falta SUPABASE_URL o SUPABASE_KEY en .env → el frontend usará Google Drive.');
    return;
  }

  try {
    await verificar();
  } catch (err) {
    const cause = (err as { cause?: { code?: string } }).cause;
    if (cause?.code === 'ENOTFOUND' || cause?.code === 'EAI_AGAIN' || cause?.code === 'ECONNREFUSED') {
      console.log(`✖ Sin conexión con Supabase (${cause.code}). Revisa tu internet/VPN y vuelve a ejecutarlo.`);
    } else {
      console.log(`✖ Error inesperado: ${String(err)}`);
    }
  }
}

async function verificar() {

  // 1) Bucket — con la clave publishable no se pueden leer los metadatos
  //    (devuelve 400), así que un fallo aquí NO es concluyente: la prueba
  //    real es la subida, que distingue 404 NoSuchBucket de 403 RLS.
  const bucketRes = await fetch(`${URL_BASE}/storage/v1/bucket/${BUCKET_ENC}`, { headers: AUTH });
  if (bucketRes.ok) {
    const bucket = (await bucketRes.json()) as { public?: boolean; file_size_limit?: number };
    console.log(`${ok(!!bucket.public)} Bucket existe | público: ${bucket.public} | límite: ${bucket.file_size_limit ?? 'sin límite'}`);
  } else if (bucketRes.status === 404) {
    console.log(`${ok(false)} El bucket "${BUCKET}" NO existe (HTTP 404). Créalo o corrige SUPABASE_BUCKET.`);
    return;
  } else {
    console.log(`• Metadatos del bucket no legibles con esta clave (HTTP ${bucketRes.status}) — normal con la publishable; se valida con la subida.`);
  }

  // 2) Subida real (aquí falla el RLS si faltan políticas)
  const objectPath = `avatars/_verificacion/test_${Date.now()}.png`;
  const uploadRes = await fetch(`${URL_BASE}/storage/v1/object/${BUCKET_ENC}/${objectPath}`, {
    method: 'POST',
    headers: { ...AUTH, 'Content-Type': 'image/png', 'x-upsert': 'true' },
    body: Buffer.from(PNG_1X1, 'base64'),
  });
  console.log(`${ok(uploadRes.ok)} Subida al bucket (HTTP ${uploadRes.status})`);
  if (!uploadRes.ok) {
    const detail = (await uploadRes.text()).slice(0, 300);
    console.log(`   Detalle: ${detail}`);
    if (/row-level security/i.test(detail)) {
      console.log('\n→ SOLUCIÓN: ejecuta supabase_storage_setup.sql en el SQL Editor de Supabase');
      console.log('  (https://supabase.com/dashboard/project/iubtijyepnrjtimdnpii/sql/new)');
      console.log('  o pon la "Secret key" (sb_secret_…) en SUPABASE_SERVICE_ROLE_KEY dentro de .env.');
    }
    return;
  }

  // 3) Lectura pública (lo que hace <img src="..."> dentro de la credencial)
  const publicUrl = `${URL_BASE}/storage/v1/object/public/${BUCKET_ENC}/${objectPath}`;
  const readRes = await fetch(publicUrl);
  console.log(`${ok(readRes.ok)} URL pública para <img> (HTTP ${readRes.status}${readRes.ok ? `, ${readRes.headers.get('content-type')}` : ''})`);
  console.log(`   ${publicUrl}`);
  if (!readRes.ok) {
    console.log('\n→ El bucket NO es público: ejecuta el paso 1 de supabase_storage_setup.sql.');
  }

  // 4) Limpieza
  const delRes = await fetch(`${URL_BASE}/storage/v1/object/${BUCKET_ENC}/${objectPath}`, {
    method: 'DELETE',
    headers: AUTH,
  });
  console.log(`${ok(delRes.ok)} Limpieza del archivo de prueba (HTTP ${delRes.status})`);

  console.log(
    `\n${uploadRes.ok && readRes.ok ? '✅ LISTO: las imágenes de usuario se guardan en Supabase y se ven en la ID Card.' : '⚠ Revisa los pasos marcados con ✖.'}`
  );
}

main().catch(err => console.error('Error inesperado:', err));
