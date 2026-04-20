-- ===========================================
-- REPARAR COLUMNAS PARA CONTABILIDAD GENERAL
-- ===========================================
-- Este script añade user_id y estado_pago a las tablas que faltan
-- para que la consolidación financiera funcione correctamente.

-- 1. POLLOS DE ENGORDE
-- -------------------
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='ingresos_pollos' AND COLUMN_NAME='user_id') THEN
        ALTER TABLE ingresos_pollos ADD COLUMN user_id UUID REFERENCES auth.users(id);
        UPDATE ingresos_pollos i SET user_id = p.user_id FROM producciones_pollos p WHERE i.produccion_id = p.id;
        ALTER TABLE ingresos_pollos ALTER COLUMN user_id SET NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='ingresos_pollos' AND COLUMN_NAME='estado_pago') THEN
        ALTER TABLE ingresos_pollos ADD COLUMN estado_pago VARCHAR(20) DEFAULT 'pagado';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='gastos_pollos' AND COLUMN_NAME='user_id') THEN
        ALTER TABLE gastos_pollos ADD COLUMN user_id UUID REFERENCES auth.users(id);
        UPDATE gastos_pollos g SET user_id = p.user_id FROM producciones_pollos p WHERE g.produccion_id = p.id;
        ALTER TABLE gastos_pollos ALTER COLUMN user_id SET NOT NULL;
    END IF;
END $$;

-- 2. GALLINAS DE POSTURA
-- -------------------
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='ventas_gallinas' AND COLUMN_NAME='user_id') THEN
        ALTER TABLE ventas_gallinas ADD COLUMN user_id UUID REFERENCES auth.users(id);
        UPDATE ventas_gallinas v SET user_id = l.user_id FROM lotes_gallinas l WHERE v.lote_id = l.id;
        ALTER TABLE ventas_gallinas ALTER COLUMN user_id SET NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='ventas_gallinas' AND COLUMN_NAME='estado_pago') THEN
        ALTER TABLE ventas_gallinas ADD COLUMN estado_pago VARCHAR(20) DEFAULT 'pagado';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='gastos_gallinas' AND COLUMN_NAME='user_id') THEN
        ALTER TABLE gastos_gallinas ADD COLUMN user_id UUID REFERENCES auth.users(id);
        UPDATE gastos_gallinas g SET user_id = l.user_id FROM lotes_gallinas l WHERE g.lote_id = l.id;
        ALTER TABLE gastos_gallinas ALTER COLUMN user_id SET NOT NULL;
    END IF;
END $$;

-- 3. VACAS LECHERAS
-- -------------------
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='produccion_leche' AND COLUMN_NAME='user_id') THEN
        ALTER TABLE produccion_leche ADD COLUMN user_id UUID REFERENCES auth.users(id);
        UPDATE produccion_leche p SET user_id = v.user_id FROM inventario_vacas v WHERE p.vaca_id = v.id;
        ALTER TABLE produccion_leche ALTER COLUMN user_id SET NOT NULL;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='produccion_leche' AND COLUMN_NAME='estado_pago') THEN
        ALTER TABLE produccion_leche ADD COLUMN estado_pago VARCHAR(20) DEFAULT 'pagado';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='gastos_vacas' AND COLUMN_NAME='user_id') THEN
        ALTER TABLE gastos_vacas ADD COLUMN user_id UUID REFERENCES auth.users(id);
        UPDATE gastos_vacas g SET user_id = v.user_id FROM inventario_vacas v WHERE g.vaca_id = v.id;
        ALTER TABLE gastos_vacas ALTER COLUMN user_id SET NOT NULL;
    END IF;
END $$;

-- ===========================================
-- ACTUALIZAR ÍNDICES
-- ===========================================
CREATE INDEX IF NOT EXISTS idx_ingresos_pollos_user ON ingresos_pollos(user_id);
CREATE INDEX IF NOT EXISTS idx_gastos_pollos_user ON gastos_pollos(user_id);
CREATE INDEX IF NOT EXISTS idx_ventas_gallinas_user ON ventas_gallinas(user_id);
CREATE INDEX IF NOT EXISTS idx_gastos_gallinas_user ON gastos_gallinas(user_id);
CREATE INDEX IF NOT EXISTS idx_produccion_leche_user ON produccion_leche(user_id);
CREATE INDEX IF NOT EXISTS idx_gastos_vacas_user ON gastos_vacas(user_id);

-- ===========================================
-- ACTUALIZAR RLS (Solo si es necesario)
-- ===========================================
-- Las políticas existentes por parent table siguen funcionando,
-- pero ahora podemos añadir políticas directas por user_id para mayor velocidad.

DROP POLICY IF EXISTS "Users can view own ingresos direct" ON ingresos_pollos;
CREATE POLICY "Users can view own ingresos direct" ON ingresos_pollos FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own gastos direct" ON gastos_pollos;
CREATE POLICY "Users can view own gastos direct" ON gastos_pollos FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own ventas gallinas direct" ON ventas_gallinas;
CREATE POLICY "Users can view own ventas gallinas direct" ON ventas_gallinas FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own gastos gallinas direct" ON gastos_gallinas;
CREATE POLICY "Users can view own gastos gallinas direct" ON gastos_gallinas FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own produccion leche direct" ON produccion_leche;
CREATE POLICY "Users can view own produccion leche direct" ON produccion_leche FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own gastos vacas direct" ON gastos_vacas;
CREATE POLICY "Users can view own gastos vacas direct" ON gastos_vacas FOR SELECT USING (auth.uid() = user_id);
