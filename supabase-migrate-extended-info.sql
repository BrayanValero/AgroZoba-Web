-- ========================================================
-- AGREGAR CAMPOS DETALLADOS A INVENTARIO DE VACAS
-- ========================================================

ALTER TABLE inventario_vacas 
ADD COLUMN IF NOT EXISTS raza VARCHAR(100),
ADD COLUMN IF NOT EXISTS partos INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS vacunas TEXT;

-- Comentario para el usuario: Ejecuta este script en el SQL Editor de Supabase.
