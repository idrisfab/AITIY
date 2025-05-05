/*
  Warnings:

  - You are about to drop the `Embed` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Embed" DROP CONSTRAINT "Embed_teamId_fkey";

-- DropTable
DROP TABLE "Embed";

-- CreateTable
CREATE TABLE "ChatAnalytics" (
    "id" TEXT NOT NULL,
    "embedId" TEXT NOT NULL,
    "teamId" TEXT NOT NULL,
    "period" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "totalConversations" INTEGER NOT NULL,
    "averageMessageCount" DOUBLE PRECISION NOT NULL,
    "averageUserMessages" DOUBLE PRECISION NOT NULL,
    "averageAssistantMessages" DOUBLE PRECISION NOT NULL,
    "averageConversationLength" DOUBLE PRECISION NOT NULL,
    "totalTokens" INTEGER NOT NULL,
    "promptTokens" INTEGER NOT NULL,
    "completionTokens" INTEGER NOT NULL,
    "averageResponseTime" DOUBLE PRECISION NOT NULL,
    "commonTopics" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatAnalytics_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChatSession" (
    "id" TEXT NOT NULL,
    "sessionId" TEXT NOT NULL,
    "embedId" TEXT NOT NULL,
    "startTime" TIMESTAMP(3) NOT NULL,
    "endTime" TIMESTAMP(3),
    "messageCount" INTEGER NOT NULL DEFAULT 0,
    "userMessageCount" INTEGER NOT NULL DEFAULT 0,
    "assistantMessageCount" INTEGER NOT NULL DEFAULT 0,
    "userEmail" TEXT,
    "ipAddress" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChatSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ChatAnalytics_embedId_idx" ON "ChatAnalytics"("embedId");

-- CreateIndex
CREATE INDEX "ChatAnalytics_teamId_idx" ON "ChatAnalytics"("teamId");

-- CreateIndex
CREATE INDEX "ChatAnalytics_date_idx" ON "ChatAnalytics"("date");

-- CreateIndex
CREATE UNIQUE INDEX "ChatAnalytics_embedId_period_date_key" ON "ChatAnalytics"("embedId", "period", "date");

-- CreateIndex
CREATE UNIQUE INDEX "ChatSession_sessionId_key" ON "ChatSession"("sessionId");

-- CreateIndex
CREATE INDEX "ChatSession_embedId_idx" ON "ChatSession"("embedId");

-- CreateIndex
CREATE INDEX "ChatSession_sessionId_idx" ON "ChatSession"("sessionId");

-- CreateIndex
CREATE INDEX "ChatSession_startTime_idx" ON "ChatSession"("startTime");

-- AddForeignKey
ALTER TABLE "ChatAnalytics" ADD CONSTRAINT "ChatAnalytics_embedId_fkey" FOREIGN KEY ("embedId") REFERENCES "ChatEmbed"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChatSession" ADD CONSTRAINT "ChatSession_embedId_fkey" FOREIGN KEY ("embedId") REFERENCES "ChatEmbed"("id") ON DELETE CASCADE ON UPDATE CASCADE;
