-- ═══════════════════════════════════════════════════════════════════
-- Políticas de seguridad Supabase — Glamping Culumpulos
-- Ejecutar en: Supabase Dashboard → SQL Editor
-- ═══════════════════════════════════════════════════════════════════
--
-- IMPORTANTE: Sin estas políticas RLS, cualquiera con la clave anon
-- puede leer, modificar o eliminar todas las reservas vía API REST.

-- 1. Habilitar Row Level Security
ALTER TABLE reservas ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas permisivas previas (si existen)
DROP POLICY IF EXISTS "anon_select_reservas" ON reservas;
DROP POLICY IF EXISTS "anon_insert_reservas" ON reservas;
DROP POLICY IF EXISTS "anon_update_reservas" ON reservas;
DROP POLICY IF EXISTS "anon_delete_reservas" ON reservas;
DROP POLICY IF EXISTS "public_read_dates" ON reservas;
DROP POLICY IF EXISTS "public_insert_pending" ON reservas;

-- 3. Vista pública: calendario sin datos personales
CREATE OR REPLACE VIEW reservas_calendario AS
  SELECT hospedaje, fecha_llegada, fecha_salida
  FROM reservas
  WHERE estado IN ('pendiente', 'pagado');

GRANT SELECT ON reservas_calendario TO anon, authenticated;

-- 4. Políticas RLS (descomenta cuando quieras activar protección en servidor)
--    Mientras tanto, las restricciones CHECK ya bloquean datos inválidos.

/*
CREATE POLICY "public_read_calendar"
  ON reservas FOR SELECT TO anon
  USING (estado IN ('pendiente', 'pagado'));

CREATE POLICY "public_insert_pending"
  ON reservas FOR INSERT TO anon
  WITH CHECK (
    estado = 'pendiente'
    AND hospedaje IN ('Domo Glamping', 'Zona Camping', 'Plan Romántico')
    AND personas IN ('1', '2', '3', '4', '5+')
    AND char_length(nombre_cliente) BETWEEN 2 AND 100
    AND char_length(telefono_cliente) BETWEEN 10 AND 15
    AND fecha_llegada < fecha_salida
    AND fecha_llegada >= CURRENT_DATE
  );

-- Admin: crear usuario en Supabase Auth y usar rol authenticated
CREATE POLICY "admin_full_access"
  ON reservas FOR ALL TO authenticated
  USING (auth.jwt() ->> 'email' = 'tu-email-admin@ejemplo.com')
  WITH CHECK (auth.jwt() ->> 'email' = 'tu-email-admin@ejemplo.com');
*/

-- 7. Restricciones a nivel de tabla (defensa en profundidad)
ALTER TABLE reservas DROP CONSTRAINT IF EXISTS chk_hospedaje_valido;
ALTER TABLE reservas ADD CONSTRAINT chk_hospedaje_valido
  CHECK (hospedaje IN ('Domo Glamping', 'Zona Camping', 'Plan Romántico'));

ALTER TABLE reservas DROP CONSTRAINT IF EXISTS chk_estado_valido;
ALTER TABLE reservas ADD CONSTRAINT chk_estado_valido
  CHECK (estado IN ('pendiente', 'pagado', 'cancelado'));

ALTER TABLE reservas DROP CONSTRAINT IF EXISTS chk_personas_valido;
ALTER TABLE reservas ADD CONSTRAINT chk_personas_valido
  CHECK (personas IN ('1', '2', '3', '4', '5+'));

ALTER TABLE reservas DROP CONSTRAINT IF EXISTS chk_nombre_longitud;
ALTER TABLE reservas ADD CONSTRAINT chk_nombre_longitud
  CHECK (char_length(nombre_cliente) BETWEEN 2 AND 100);

ALTER TABLE reservas DROP CONSTRAINT IF EXISTS chk_telefono_longitud;
ALTER TABLE reservas ADD CONSTRAINT chk_telefono_longitud
  CHECK (char_length(telefono_cliente) BETWEEN 10 AND 15);

-- 8. Índice para consultas de disponibilidad (rendimiento + evita scans completos)
CREATE INDEX IF NOT EXISTS idx_reservas_disponibilidad
  ON reservas (hospedaje, estado, fecha_llegada, fecha_salida);

-- ═══════════════════════════════════════════════════════════════════
-- NOTA PARA EL PANEL ADMIN:
-- Con estas políticas, admin.html con clave anon NO podrá
-- actualizar/eliminar. Opciones recomendadas:
--   A) Supabase Auth + política para rol 'admin'
--   B) Edge Function con service_role key (nunca en el frontend)
--   C) Migrar admin a un backend propio (Node/Python)
-- ═══════════════════════════════════════════════════════════════════
