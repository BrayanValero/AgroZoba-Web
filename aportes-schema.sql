-- ===========================================
-- TABLAS PARA APORTES DE SOCIOS
-- ===========================================

-- 1. Aportes de Pollos
CREATE TABLE IF NOT EXISTS aportes_pollos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  produccion_id UUID REFERENCES producciones_pollos(id) ON DELETE CASCADE NOT NULL,
  monto DECIMAL(12,2) NOT NULL CHECK (monto >= 0),
  concepto VARCHAR(255) NOT NULL,
  socios TEXT,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Aportes de Gallinas
CREATE TABLE IF NOT EXISTS aportes_gallinas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  lote_id UUID REFERENCES lotes_gallinas(id) ON DELETE CASCADE NOT NULL,
  monto DECIMAL(12,2) NOT NULL CHECK (monto >= 0),
  concepto VARCHAR(255) NOT NULL,
  socios TEXT,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Aportes de Vacas
CREATE TABLE IF NOT EXISTS aportes_vacas (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  vaca_id UUID REFERENCES inventario_vacas(id) ON DELETE SET NULL, -- Puede ser un aporte general no ligado a una vaca
  monto DECIMAL(12,2) NOT NULL CHECK (monto >= 0),
  concepto VARCHAR(255) NOT NULL,
  socios TEXT,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_aportes_pollos_user ON aportes_pollos(user_id);
CREATE INDEX IF NOT EXISTS idx_aportes_gallinas_user ON aportes_gallinas(user_id);
CREATE INDEX IF NOT EXISTS idx_aportes_vacas_user ON aportes_vacas(user_id);

-- RLS (Row Level Security)
ALTER TABLE aportes_pollos ENABLE ROW LEVEL SECURITY;
ALTER TABLE aportes_gallinas ENABLE ROW LEVEL SECURITY;
ALTER TABLE aportes_vacas ENABLE ROW LEVEL SECURITY;

-- Políticas
CREATE POLICY "Users can manage own aportes_pollos" ON aportes_pollos
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own aportes_gallinas" ON aportes_gallinas
  FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own aportes_vacas" ON aportes_vacas
  FOR ALL USING (auth.uid() = user_id);
