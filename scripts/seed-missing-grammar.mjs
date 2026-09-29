/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 *
 * seed-missing-grammar.mjs
 * Cierra la brecha de catalogo entre ClassKnowledgeMap (que declara los temas que
 * enseña cada clase) y GrammarTopic (biblioteca de gramatica).
 *
 * Decisiones de diseno:
 *  - Los slugs SIEMPRE se normalizan a guiones medios. El mapa de la clase los
 *    guarda con guion bajo, asi que la API tambien normaliza al leer; sin eso,
 *    un tema sembrado como "present-simple" jamas seria encontrado por la
 *    consulta que busca "present_simple".
 *  - Se respetan las categorias que ya existen en la BD (Grammar | Structure |
 *    Syntax) para que el filtro ?category= de /api/content/grammar/topics
 *    siga funcionando.
 *  - NO se inventa contenido pedagogico. Cada tema nace con active:false y los
 *    textos descriptivos vacios, de modo que /api/content/grammar/for-lesson/:id
 *    lo reporte en `unresolved` y la UI degrade a la explicacion dinamica de
 *    Ollama (/api/ai/ask) en vez de mostrar texto de relleno a un alumno.
 *  - Es idempotente: se puede reejecutar sin duplicar ni pisar contenido real.
 *
 *   node scripts/seed-missing-grammar.mjs
 *   node scripts/seed-missing-grammar.mjs --dry-run
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes('--dry-run');

/** Vocabulario estricto de categorias ya presente en la base de datos. */
const CATEGORIES = new Set(['Grammar', 'Structure', 'Syntax']);

function getCategoryForSlug(slug) {
  if (slug.includes('structure') || slug.includes('order') || slug.includes('clause')) return 'Structure';
  if (slug.includes('syntax') || slug.includes('question') || slug.includes('inversion')) return 'Syntax';
  return 'Grammar';
}

/** "_" -> "-", sin distinguir mayusculas. Debe coincidir con el de la API. */
function normalizeSlug(slug) {
  return String(slug).trim().toLowerCase().replace(/_/g, '-');
}

function slugToTitle(slug) {
  return slug
    .replace(/[-_]/g, ' ')
    .trim()
    .replace(/\b\w/g, (l) => l.toUpperCase());
}

async function main() {
  console.log('Analizando ClassKnowledgeMap y GrammarTopic...\n');

  const [existing, maps] = await Promise.all([
    prisma.grammarTopic.findMany({ select: { id: true, order: true } }),
    prisma.classKnowledgeMap.findMany({ select: { lessonId: true, grammarTopics: true } }),
  ]);

  // El catalogo tambien se normaliza: si un tema existe como "passive-voice" y
  // el mapa lo referencia como "passive_voice", ya esta cubierto.
  const existingSlugs = new Set(existing.map((t) => normalizeSlug(t.id)));
  const maxOrder = existing.reduce((max, t) => Math.max(max, t.order ?? 0), 0);

  const referenced = new Set();
  for (const map of maps) {
    for (const raw of map.grammarTopics ?? []) {
      if (raw && String(raw).trim()) referenced.add(normalizeSlug(raw));
    }
  }

  const orphans = [...referenced].filter((s) => !existingSlugs.has(s)).sort();
  const covered = [...referenced].filter((s) => existingSlugs.has(s)).sort();

  console.log(`Clases con mapa        : ${maps.length}`);
  console.log(`Temas referenciados    : ${referenced.size}`);
  console.log(`  ya catalogados       : ${covered.length}${covered.length ? ` (${covered.join(', ')})` : ''}`);
  console.log(`  huerfanos            : ${orphans.length}`);
  if (orphans.length) console.log(`\n  ${orphans.join('\n  ')}\n`);

  if (!orphans.length) {
    console.log('Nada que hacer: el catalogo ya esta sincronizado.');
    return;
  }

  if (DRY_RUN) {
    console.log('DRY RUN: no se escribio nada.');
    return;
  }

  let order = maxOrder;
  let created = 0;

  for (const slug of orphans) {
    const title = slugToTitle(slug);
    const category = getCategoryForSlug(slug);
    if (!CATEGORIES.has(category)) throw new Error(`Categoria invalida: ${category}`);

    await prisma.grammarTopic.upsert({
      where: { id: slug },
      // Solo identidad editorial. No se tocan summary/explanation/structure/
      // active para no pisar contenido real si el tema ya fue redactado.
      update: { title, titleEn: title, category },
      create: {
        id: slug,
        title,
        titleEn: title,
        mcer: 'A1',
        category,
        summary: '',
        explanation: '',
        structure: '',
        keywords: [slug, 'pendiente-redaccion'],
        order: ++order,
        active: false,
      },
    });
    created++;
  }

  console.log(`\n${created} temas registrados con active:false.`);
  console.log('La UI los listara en `unresolved` y delegara a Ollama (/api/ai/ask).');
  console.log('Para publicarlos: redactar summary/explanation y poner active:true.');
}

main()
  .catch((e) => {
    console.error('Error ejecutando el script:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
