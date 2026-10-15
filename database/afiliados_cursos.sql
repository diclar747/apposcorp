-- Afiliados de cursos (Ingenio Millonario): paso MANUAL, correr UNA vez en producción, con respaldo (pg_dump) antes.
-- Una comisión de curso no tiene pedido, así que orderId y orderItemId pasan a ser opcionales.
-- Solo relaja la obligatoriedad: no cambia ni borra ningún dato existente.
-- Las columnas nuevas (courses.affiliate*, courseId, userCourseId) las crea solo el servidor al arrancar.
ALTER TABLE "affiliate_commissions" ALTER COLUMN "orderId" DROP NOT NULL;
ALTER TABLE "affiliate_commissions" ALTER COLUMN "orderItemId" DROP NOT NULL;
