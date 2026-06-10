-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'VIEWER');

-- CreateEnum
CREATE TYPE "BotType" AS ENUM ('GOLD', 'FUEL', 'ALERT', 'MANUAL', 'OTHER');

-- CreateEnum
CREATE TYPE "TriggerType" AS ENUM ('CRON', 'COMMAND', 'MANUAL');

-- CreateEnum
CREATE TYPE "LogStatus" AS ENUM ('SUCCESS', 'FAILED');

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'ADMIN',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_login_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "gold_prices" (
    "id" BIGSERIAL NOT NULL,
    "type" TEXT NOT NULL,
    "buy_price" DECIMAL(15,2) NOT NULL,
    "sell_price" DECIMAL(15,2) NOT NULL,
    "source" TEXT NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "gold_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "fuel_prices" (
    "id" BIGSERIAL NOT NULL,
    "fuel_type" TEXT NOT NULL,
    "price" DECIMAL(10,2) NOT NULL,
    "source" TEXT NOT NULL,
    "recorded_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "fuel_prices_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "telegram_logs" (
    "id" BIGSERIAL NOT NULL,
    "bot_type" "BotType" NOT NULL,
    "trigger" "TriggerType" NOT NULL,
    "chat_id" TEXT,
    "message" TEXT NOT NULL,
    "status" "LogStatus" NOT NULL,
    "error_message" TEXT,
    "sent_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "telegram_logs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "bot_settings" (
    "id" SERIAL NOT NULL,
    "bot_name" TEXT NOT NULL,
    "bot_type" "BotType" NOT NULL,
    "chat_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "cron_expression" TEXT,
    "alert_condition" JSONB,
    "message_template" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "bot_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "gold_prices_type_recorded_at_idx" ON "gold_prices"("type", "recorded_at" DESC);

-- CreateIndex
CREATE INDEX "gold_prices_recorded_at_idx" ON "gold_prices"("recorded_at" DESC);

-- CreateIndex
CREATE INDEX "fuel_prices_fuel_type_recorded_at_idx" ON "fuel_prices"("fuel_type", "recorded_at" DESC);

-- CreateIndex
CREATE INDEX "fuel_prices_recorded_at_idx" ON "fuel_prices"("recorded_at" DESC);

-- CreateIndex
CREATE INDEX "telegram_logs_sent_at_idx" ON "telegram_logs"("sent_at" DESC);

-- CreateIndex
CREATE INDEX "telegram_logs_bot_type_sent_at_idx" ON "telegram_logs"("bot_type", "sent_at" DESC);
