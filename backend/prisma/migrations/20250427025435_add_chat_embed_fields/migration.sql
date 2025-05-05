-- AlterTable
ALTER TABLE "ChatEmbed" ADD COLUMN     "settings" JSONB,
ALTER COLUMN "modelName" SET DEFAULT 'gpt-4',
ALTER COLUMN "modelVendor" SET DEFAULT 'openai';
