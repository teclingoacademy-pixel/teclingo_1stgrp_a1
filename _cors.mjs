// Comprueba si el bucket público de Supabase envía cabeceras CORS
// (necesario para poder rasterizar el avatar dentro de <canvas>).
const BASE = 'https://iubtijyepnrjtimdnpii.supabase.co';
const KEY = 'sb_publishable_BhoTVJ4XEdEbRH1X3bpzWg_cAikaip0';
const BUCKET = 'TECLINGO INGLES IMAGENES';
const enc = encodeURIComponent(BUCKET);
const H = { apikey: KEY, Authorization: `Bearer ${KEY}` };

const PNG_1x1 =
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==';
const objPath = `_cors_check/cors_${Date.now()}.png`;

const up = await fetch(`${BASE}/storage/v1/object/${enc}/${objPath}`, {
  method: 'POST',
  headers: { ...H, 'Content-Type': 'image/png', 'x-upsert': 'true' },
  body: Buffer.from(PNG_1x1, 'base64'),
});
console.log('SUBIDA ->', up.status);

const pubUrl = `${BASE}/storage/v1/object/public/${enc}/${objPath}`;
const r = await fetch(pubUrl, { headers: { Origin: 'http://localhost:5173' } });
console.log('GET publico ->', r.status);
for (const [k, v] of r.headers) {
  if (/access-control|cache-control|content-type|etag/i.test(k)) console.log(`   ${k}: ${v}`);
}

const del = await fetch(`${BASE}/storage/v1/object/${enc}/${objPath}`, { method: 'DELETE', headers: H });
console.log('LIMPIEZA ->', del.status);
