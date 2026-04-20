-- ===========================================
-- FIX: MISSING COLUMNS IN INGRESOS_POLLOS
-- ===========================================
-- Este script asegura que la tabla ingresos_pollos tenga todas las columnas
-- que el frontend está intentando registrar o editar.

DO $$ 
BEGIN
    -- 1. Cliente
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='ingresos_pollos' AND COLUMN_NAME='cliente') THEN
        ALTER TABLE ingresos_pollos ADD COLUMN cliente VARCHAR(255) DEFAULT 'Consumidor Final';
    END IF;

    -- 2. Concepto
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='ingresos_pollos' AND COLUMN_NAME='concepto') THEN
        ALTER TABLE ingresos_pollos ADD COLUMN concepto VARCHAR(255);
        UPDATE ingresos_pollos SET concepto = 'Venta de pollos' WHERE concepto IS NULL;
    END IF;

    -- 3. Cantidad Vendida (Aves)
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='ingresos_pollos' AND COLUMN_NAME='cantidad_vendida') THEN
        ALTER TABLE ingresos_pollos ADD COLUMN cantidad_vendida INTEGER DEFAULT 0;
    END IF;

    -- 4. Alias de Peso (peso_total)
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='ingresos_pollos' AND COLUMN_NAME='peso_total') THEN
        ALTER TABLE ingresos_pollos ADD COLUMN peso_total DECIMAL(10,2);
        UPDATE ingresos_pollos SET peso_total = kilos_vendidos WHERE peso_total IS NULL;
    END IF;

    -- 5. Alias de Precio (precio_kilo)
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='ingresos_pollos' AND COLUMN_NAME='precio_kilo') THEN
        ALTER TABLE ingresos_pollos ADD COLUMN precio_kilo DECIMAL(10,2);
        UPDATE ingresos_pollos SET precio_kilo = precio_por_kilo WHERE precio_kilo IS NULL;
    END IF;

    -- 6. Estado de Pago (Por si el otro script no se ejecutó)
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='ingresos_pollos' AND COLUMN_NAME='estado_pago') THEN
        ALTER TABLE ingresos_pollos ADD COLUMN estado_pago VARCHAR(20) DEFAULT 'pagado';
    END IF;

    -- 7. User ID (Por si el otro script no se ejecutó)
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME='ingresos_pollos' AND COLUMN_NAME='user_id') THEN
        ALTER TABLE ingresos_pollos ADD COLUMN user_id UUID REFERENCES auth.users(id);
        UPDATE ingresos_pollos i SET user_id = p.user_id FROM producciones_pollos p WHERE i.produccion_id = p.id;
    END IF;

END $$;
