-- ========================================================
-- TABLAS PARA APORTES DE CAPITAL (SOCIOS)
-- ========================================================

-- Aportes para Pollos de Engorde
CREATE TABLE IF NOT EXISTS aportes_pollos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  produccion_id UUID REFERENCES producciones_pollos(id) ON DELETE CASCADE,
  concepto TEXT NOT NULL,
  monto DECIMAL(12,2) NOT NULL CHECK (monto >= 0),
  socios TEXT, -- Campo para especificar los socios que aportan
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Aportes para Gallinas de Postura
CREATE TABLE IF NOT EXISTS aportes_gallinas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lote_id UUID REFERENCES lotes_gallinas(id) ON DELETE CASCADE,
  concepto TEXT NOT NULL,
  monto DECIMAL(12,2) NOT NULL CHECK (monto >= 0),
  socios TEXT, -- Campo para especificar los socios que aportan
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Aportes para Vacas Lecheras
CREATE TABLE IF NOT EXISTS aportes_vacas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vaca_id UUID REFERENCES inventario_vacas(id) ON DELETE CASCADE,
  concepto TEXT NOT NULL,
  monto DECIMAL(12,2) NOT NULL CHECK (monto >= 0),
  socios TEXT, -- Campo para especificar los socios que aportan
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indices para optimización
CREATE INDEX IF NOT EXISTS idx_aportes_pollos_user ON aportes_pollos(user_id);
CREATE INDEX IF NOT EXISTS idx_aportes_pollos_prod ON aportes_pollos(produccion_id);
CREATE INDEX IF NOT EXISTS idx_aportes_gallinas_user ON aportes_gallinas(user_id);
CREATE INDEX IF NOT EXISTS idx_aportes_gallinas_lote ON aportes_gallinas(lote_id);
CREATE INDEX IF NOT EXISTS idx_aportes_vacas_user ON aportes_vacas(user_id);
CREATE INDEX IF NOT EXISTS idx_aportes_vacas_vaca ON aportes_vacas(vaca_id);

-- Habilitar RLS
ALTER TABLE aportes_pollos ENABLE ROW LEVEL SECURITY;
ALTER TABLE aportes_gallinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE aportes_vacas ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own aportes_pollos') THEN
        CREATE POLICY "Users can view own aportes_pollos" ON aportes_pollos FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own aportes_pollos') THEN
        CREATE POLICY "Users can insert own aportes_pollos" ON aportes_pollos FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own aportes_gallinas') THEN
        CREATE POLICY "Users can view own aportes_gallinas" ON aportes_gallinas FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own aportes_gallinas') THEN
        CREATE POLICY "Users can insert own aportes_gallinas" ON aportes_gallinas FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can view own aportes_vacas') THEN
        CREATE POLICY "Users can view own aportes_vacas" ON aportes_vacas FOR SELECT USING (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own aportes_vacas') THEN
        CREATE POLICY "Users can insert own aportes_vacas" ON aportes_vacas FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
END $$;
