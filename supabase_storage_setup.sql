-- ============================================================================
-- TECLINGO — Configuración del bucket de imágenes (ID Card institucional)
-- Bucket: "TECLINGO INGLES IMAGENES"
-- Proyecto Supabase: iubtijyepnrjtimdnpii
--
-- CÓMO USARLO:
--   1. Supabase Dashboard > SQL Editor > New query
--   2. Pegar TODO este archivo y pulsar "Run"
--
-- ¿POR QUÉ? El backend ya sube las imágenes a este bucket, pero Supabase las
-- rechaza con "new row violates row-level security policy" porque el bucket no
-- tiene políticas. Con estas políticas, la clave publishable que ya está en tu
-- .env funciona sin necesidad de la secret key.
--
-- NOTA: la Opción A del proyecto (poner SUPABASE_SERVICE_ROLE_KEY en .env) hace
-- innecesario este archivo, porque la secret key ignora RLS. Usa UNA de las dos.
-- ============================================================================

-- 1) Bucket público: imprescindible para que la foto se renderice dentro de la
--    ID Card con una simple etiqueta <img src="...">.
--    Idempotente: lo crea si no existe y siempre lo deja público con límite de 5 MB
--    (el mismo límite que valida el backend en /api/supabase-upload).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'TECLINGO INGLES IMAGENES',
  'TECLINGO INGLES IMAGENES',
  true,
  5242880,
  array['image/png','image/jpeg','image/jpg','image/webp','image/gif']
)
on conflict (id) do update
  set public = true,
      file_size_limit = 5242880,
      allowed_mime_types = array['image/png','image/jpeg','image/jpg','image/webp','image/gif'];

-- 2) Permitir SUBIR archivos al bucket (el backend usa la clave publishable).
drop policy if exists "teclingo_imagenes_insert" on storage.objects;
create policy "teclingo_imagenes_insert"
  on storage.objects
  for insert
  to anon, authenticated
  with check (bucket_id = 'TECLINGO INGLES IMAGENES');

-- 3) Permitir ACTUALIZAR (re-subir la foto de un mismo usuario, x-upsert).
drop policy if exists "teclingo_imagenes_update" on storage.objects;
create policy "teclingo_imagenes_update"
  on storage.objects
  for update
  to anon, authenticated
  using (bucket_id = 'TECLINGO INGLES IMAGENES')
  with check (bucket_id = 'TECLINGO INGLES IMAGENES');

-- 4) Permitir LEER / LISTAR los objetos del bucket.
drop policy if exists "teclingo_imagenes_select" on storage.objects;
create policy "teclingo_imagenes_select"
  on storage.objects
  for select
  to anon, authenticated
  using (bucket_id = 'TECLINGO INGLES IMAGENES');

-- 5) Permitir BORRAR (limpieza de imágenes huérfanas desde el backend).
drop policy if exists "teclingo_imagenes_delete" on storage.objects;
create policy "teclingo_imagenes_delete"
  on storage.objects
  for delete
  to anon, authenticated
  using (bucket_id = 'TECLINGO INGLES IMAGENES');

-- 6) VERIFICACIÓN — la columna public debe salir en true y policies en 4
select id, name, public, file_size_limit
  from storage.buckets
 where id = 'TECLINGO INGLES IMAGENES';

select policyname, cmd, roles
  from pg_policies
 where schemaname = 'storage'
   and tablename = 'objects'
   and policyname like 'teclingo_imagenes_%'
 order by policyname;
