-- CreateTable
CREATE TABLE "extraction_history" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "parameters" TEXT NOT NULL DEFAULT '{}',
    "documents_found" INTEGER NOT NULL DEFAULT 0,
    "documents_processed" INTEGER NOT NULL DEFAULT 0,
    "execution_time" REAL NOT NULL DEFAULT 0.0,
    "results" TEXT NOT NULL DEFAULT '{}',
    "error" TEXT,
    "started_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completed_at" DATETIME,
    "user_id" TEXT,
    CONSTRAINT "extraction_history_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_documents" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "summary" TEXT,
    "source" TEXT NOT NULL,
    "legal_area" TEXT NOT NULL,
    "document_type" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "priority" TEXT NOT NULL DEFAULT 'NORMAL',
    "publication_date" DATETIME NOT NULL,
    "internal_id" TEXT,
    "extraction_date" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "last_review_date" DATETIME,
    "confidence_score" REAL NOT NULL DEFAULT 0.0,
    "keywords" TEXT NOT NULL DEFAULT '',
    "relevance_tags" TEXT NOT NULL DEFAULT '',
    "external_id" TEXT,
    "metadata" TEXT NOT NULL DEFAULT '{}',
    "extracted_at" DATETIME,
    "user_id" TEXT,
    "curator_id" TEXT,
    "created_at" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" DATETIME NOT NULL,
    CONSTRAINT "documents_curator_id_fkey" FOREIGN KEY ("curator_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "documents_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_documents" ("confidence_score", "content", "created_at", "curator_id", "document_type", "extraction_date", "id", "internal_id", "keywords", "last_review_date", "legal_area", "priority", "publication_date", "relevance_tags", "source", "status", "summary", "title", "updated_at", "url") SELECT "confidence_score", "content", "created_at", "curator_id", "document_type", "extraction_date", "id", "internal_id", "keywords", "last_review_date", "legal_area", "priority", "publication_date", "relevance_tags", "source", "status", "summary", "title", "updated_at", "url" FROM "documents";
DROP TABLE "documents";
ALTER TABLE "new_documents" RENAME TO "documents";
CREATE UNIQUE INDEX "documents_url_key" ON "documents"("url");
CREATE UNIQUE INDEX "documents_external_id_key" ON "documents"("external_id");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
