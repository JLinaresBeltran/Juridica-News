-- AlterTable
ALTER TABLE "documents" ADD COLUMN "ai_analysis_date" DATETIME;
ALTER TABLE "documents" ADD COLUMN "ai_analysis_status" TEXT DEFAULT 'PENDING';
ALTER TABLE "documents" ADD COLUMN "ai_model" TEXT;
ALTER TABLE "documents" ADD COLUMN "decision" TEXT;
ALTER TABLE "documents" ADD COLUMN "fragmentos_analisis" TEXT DEFAULT '';
ALTER TABLE "documents" ADD COLUMN "magistrado_ponente" TEXT;
ALTER TABLE "documents" ADD COLUMN "numero_sentencia" TEXT;
ALTER TABLE "documents" ADD COLUMN "resumen_ia" TEXT;
ALTER TABLE "documents" ADD COLUMN "sala_revision" TEXT;
ALTER TABLE "documents" ADD COLUMN "tema_principal" TEXT;
