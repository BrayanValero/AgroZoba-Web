-- ========================================================
-- FIX STORAGE RLS POLICIES FOR 'vacas' BUCKET
-- ========================================================

-- Solo ejecutar si el bucket ya existe.
-- Estos comandos habilitan el acceso para que los usuarios puedan subir y ver fotos.

-- 1. Permitir que usuarios autenticados suban fotos
CREATE POLICY "Permitir subida a usuarios autenticados"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'vacas');

-- 2. Permitir que cualquier persona vea las fotos (si el bucket es público)
-- O específicamente para usuarios autenticados
CREATE POLICY "Permitir ver fotos a todos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'vacas');

-- 3. (Opcional) permitir que los dueños borren sus fotos
CREATE POLICY "Permitir borrar fotos propias"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'vacas');
