/*
  Warnings:

  - Added the required column `name` to the `ChatEmbed` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "ChatEmbed" ADD COLUMN     "apiKeyId" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "height" INTEGER,
ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "modelName" TEXT,
ADD COLUMN     "modelVendor" TEXT,
ADD COLUMN     "name" TEXT NOT NULL,
ADD COLUMN     "position" TEXT,
ADD COLUMN     "primaryColor" TEXT,
ADD COLUMN     "responsive" BOOLEAN DEFAULT true,
ADD COLUMN     "theme" TEXT,
ADD COLUMN     "welcomeMessage" TEXT,
ADD COLUMN     "width" INTEGER;
