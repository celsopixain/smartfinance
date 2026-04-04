-- ─────────────────────────────────────────────────────────
-- SmartFinance — Script SQL de Referência
-- Gerado a partir do schema.prisma
-- Use apenas como referência. As migrations são gerenciadas pelo Prisma.
-- ─────────────────────────────────────────────────────────

CREATE TYPE "AccountType" AS ENUM ('CHECKING', 'SAVINGS', 'CASH', 'CREDIT', 'INVESTMENT');
CREATE TYPE "TransactionType" AS ENUM ('INCOME', 'EXPENSE');

-- USUÁRIOS
CREATE TABLE "users" (
  "id"            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "name"          TEXT NOT NULL,
  "email"         TEXT NOT NULL UNIQUE,
  "password_hash" TEXT NOT NULL,
  "created_at"    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- CONTAS FINANCEIRAS
CREATE TABLE "accounts" (
  "id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"    UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name"       TEXT NOT NULL,
  "type"       "AccountType" NOT NULL,
  "balance"    NUMERIC(15,2) NOT NULL DEFAULT 0,
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "accounts_user_id_idx" ON "accounts"("user_id");

-- CATEGORIAS E SUBCATEGORIAS
CREATE TABLE "categories" (
  "id"         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"    UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "name"       TEXT NOT NULL,
  "icon"       TEXT,
  "color"      TEXT,
  "parent_id"  UUID REFERENCES "categories"("id"),
  "created_at" TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "categories_user_id_idx"   ON "categories"("user_id");
CREATE INDEX "categories_parent_id_idx" ON "categories"("parent_id");

-- TRANSAÇÕES
CREATE TABLE "transactions" (
  "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"     UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "account_id"  UUID NOT NULL REFERENCES "accounts"("id"),
  "category_id" UUID NOT NULL REFERENCES "categories"("id"),
  "type"        "TransactionType" NOT NULL,
  "amount"      NUMERIC(15,2) NOT NULL,
  "description" TEXT NOT NULL,
  "date"        TIMESTAMPTZ NOT NULL,
  "is_anomaly"  BOOLEAN NOT NULL DEFAULT FALSE,
  "created_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX "transactions_user_id_idx"        ON "transactions"("user_id");
CREATE INDEX "transactions_category_id_idx"    ON "transactions"("category_id");
CREATE INDEX "transactions_date_idx"           ON "transactions"("date");
CREATE INDEX "transactions_user_id_date_idx"   ON "transactions"("user_id", "date");

-- ORÇAMENTOS MENSAIS
CREATE TABLE "budgets" (
  "id"          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"     UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "category_id" UUID NOT NULL REFERENCES "categories"("id"),
  "amount"      NUMERIC(15,2) NOT NULL,
  "month"       SMALLINT NOT NULL CHECK ("month" BETWEEN 1 AND 12),
  "year"        SMALLINT NOT NULL,
  "created_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  "updated_at"  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("user_id", "category_id", "month", "year")
);
CREATE INDEX "budgets_user_year_month_idx" ON "budgets"("user_id", "year", "month");

-- LOGS HISTÓRICOS PARA IA
-- Armazena totais mensais agregados por categoria.
-- Separada de transactions para leitura rápida sem agregações em tempo real.
-- Atualizada sempre que uma transação é criada/editada/excluída (via NestJS).
CREATE TABLE "ai_spending_logs" (
  "id"                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  "user_id"           UUID NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
  "category_id"       UUID NOT NULL REFERENCES "categories"("id"),
  "month"             SMALLINT NOT NULL CHECK ("month" BETWEEN 1 AND 12),
  "year"              SMALLINT NOT NULL,
  "total_amount"      NUMERIC(15,2) NOT NULL,
  "transaction_count" INTEGER NOT NULL,
  "avg_amount"        NUMERIC(15,2) NOT NULL,
  "updated_at"        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE ("user_id", "category_id", "month", "year")
);
CREATE INDEX "ai_logs_user_year_month_idx" ON "ai_spending_logs"("user_id", "year", "month");
