-- SCRIPT PARA ARREGLAR REGISTROS "HUERFANOS" (Sin animal vinculado)
-- Ejecuta esto en el SQL Editor de Supabase

-- 1. Intentar recuperar el user_id de cualquier registro de la misma tabla que sí tenga uno
-- (Esto asume que el usuario es el dueño de los datos actuales)

-- Para Producción de Leche
UPDATE produccion_leche 
SET user_id = (SELECT user_id FROM inventario_vacas LIMIT 1)
WHERE user_id IS NULL;

-- Para Gastos de Vacas
UPDATE gastos_vacas 
SET user_id = (SELECT user_id FROM inventario_vacas LIMIT 1)
WHERE user_id IS NULL;

-- Para Aportes de Vacas
UPDATE aportes_vacas 
SET user_id = (SELECT user_id FROM inventario_vacas LIMIT 1)
WHERE user_id IS NULL;

-- Repetir para otros módulos por si acaso quedaron huérfanos
UPDATE ingresos_pollos SET user_id = (SELECT user_id FROM producciones_pollos LIMIT 1) WHERE user_id IS NULL;
UPDATE gastos_pollos SET user_id = (SELECT user_id FROM producciones_pollos LIMIT 1) WHERE user_id IS NULL;
UPDATE ventas_gallinas SET user_id = (SELECT user_id FROM lotes_gallinas LIMIT 1) WHERE user_id IS NULL;
UPDATE gastos_gallinas SET user_id = (SELECT user_id FROM lotes_gallinas LIMIT 1) WHERE user_id IS NULL;
