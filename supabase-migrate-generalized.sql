-- Migración para generalizar gastos y producción de leche

-- 1. Añadir user_id a gastos_vacas y produccion_leche
ALTER TABLE gastos_vacas ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE produccion_leche ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;

-- 2. Llenar user_id basado en el vaca_id actual para preservar datos
UPDATE gastos_vacas g
SET user_id = v.user_id
FROM inventario_vacas v
WHERE g.vaca_id = v.id;

UPDATE produccion_leche p
SET user_id = v.user_id
FROM inventario_vacas v
WHERE p.vaca_id = v.id;

-- 3. Hacer que vaca_id sea opcional
ALTER TABLE gastos_vacas ALTER COLUMN vaca_id DROP NOT NULL;
ALTER TABLE produccion_leche ALTER COLUMN vaca_id DROP NOT NULL;

-- 4. Asegurar que user_id no sea nulo de ahora en adelante
-- Asegurate que todos los registros antiguos se actualizaron primero.
ALTER TABLE gastos_vacas ALTER COLUMN user_id SET NOT NULL;
ALTER TABLE produccion_leche ALTER COLUMN user_id SET NOT NULL;

-- 5. Actualizar Políticas RLS

-- GASTOS_VACAS
DROP POLICY IF EXISTS "Users can view gastos of own vacas" ON gastos_vacas;
CREATE POLICY "Users can view own gastos_vacas"
  ON gastos_vacas FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert gastos to own vacas" ON gastos_vacas;
CREATE POLICY "Users can insert own gastos_vacas"
  ON gastos_vacas FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete gastos from own vacas" ON gastos_vacas;
CREATE POLICY "Users can delete own gastos_vacas"
  ON gastos_vacas FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update gastos from own vacas" ON gastos_vacas;
CREATE POLICY "Users can update own gastos_vacas"
  ON gastos_vacas FOR UPDATE
  USING (auth.uid() = user_id);

-- PRODUCCION_LECHE
DROP POLICY IF EXISTS "Users can view produccion of own vacas" ON produccion_leche;
CREATE POLICY "Users can view own produccion_leche"
  ON produccion_leche FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert produccion to own vacas" ON produccion_leche;
CREATE POLICY "Users can insert own produccion_leche"
  ON produccion_leche FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete produccion from own vacas" ON produccion_leche;
CREATE POLICY "Users can delete own produccion_leche"
  ON produccion_leche FOR DELETE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update produccion from own vacas" ON produccion_leche;
CREATE POLICY "Users can update own produccion_leche"
  ON produccion_leche FOR UPDATE
  USING (auth.uid() = user_id);
