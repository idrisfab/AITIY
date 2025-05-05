import { PrismaClient, ChatSession, ChatAnalytics, ChatMessage, ChatUsage } from '@prisma/client';
import { logger } from '../utils/logger';

const prisma = new PrismaClient();

/**
 * Service for processing chat data into analytics
 */
export class AnalyticsService {
  /**
   * Process chat sessions for a specific embed
   * This should be called periodically to update analytics
   */
  static async processSessionsForEmbed(embedId: string): Promise<void> {
    try {
      // Get all chat messages for this embed
      const messages = await prisma.chatMessage.findMany({
        where: { embedId },
        orderBy: { createdAt: 'asc' },
      });

      // Get all chat usage records for this embed
      const usageRecords = await prisma.chatUsage.findMany({
        where: { embedId },
      });

      // Group messages by session
      const sessionMessages: Record<string, ChatMessage[]> = {};
      messages.forEach(message => {
        if (!sessionMessages[message.sessionId]) {
          sessionMessages[message.sessionId] = [];
        }
        sessionMessages[message.sessionId].push(message);
      });

      // Process each session
      for (const [sessionId, msgs] of Object.entries(sessionMessages)) {
        // Check if session already exists
        const existingSession = await prisma.chatSession.findUnique({
          where: { sessionId },
        });

        if (!existingSession) {
          // Create new session record
          const firstMessage = msgs[0];
          const lastMessage = msgs[msgs.length - 1];
          
          const userMessages = msgs.filter(m => m.role === 'user');
          const assistantMessages = msgs.filter(m => m.role === 'assistant');

          await prisma.chatSession.create({
            data: {
              sessionId,
              embedId,
              startTime: firstMessage.createdAt,
              endTime: lastMessage.createdAt,
              messageCount: msgs.length,
              userMessageCount: userMessages.length,
              assistantMessageCount: assistantMessages.length,
              // Get IP address from usage records if available
              ipAddress: usageRecords.find(u => u.sessionId === sessionId)?.ipAddress,
            },
          });
        } else {
          // Update existing session
          const lastMessage = msgs[msgs.length - 1];
          const userMessages = msgs.filter(m => m.role === 'user');
          const assistantMessages = msgs.filter(m => m.role === 'assistant');

          await prisma.chatSession.update({
            where: { id: existingSession.id },
            data: {
              endTime: lastMessage.createdAt,
              messageCount: msgs.length,
              userMessageCount: userMessages.length,
              assistantMessageCount: assistantMessages.length,
            },
          });
        }
      }

      // Generate daily analytics
      await this.generateDailyAnalytics(embedId);
      
      // Generate weekly analytics
      await this.generateWeeklyAnalytics(embedId);
      
      // Generate monthly analytics
      await this.generateMonthlyAnalytics(embedId);

      logger.info(`Successfully processed analytics for embed ${embedId}`);
    } catch (error) {
      logger.error(`Error processing analytics for embed ${embedId}:`, error);
      throw error;
    }
  }

  /**
   * Generate daily analytics for an embed
   */
  private static async generateDailyAnalytics(embedId: string): Promise<void> {
    try {
      // Get embed details to get teamId
      const embed = await prisma.chatEmbed.findUnique({
        where: { id: embedId },
        select: { teamId: true },
      });

      if (!embed) {
        throw new Error(`Embed ${embedId} not found`);
      }

      // Get today's date (UTC)
      const today = new Date();
      today.setUTCHours(0, 0, 0, 0);

      // Get sessions for today
      const sessions = await prisma.chatSession.findMany({
        where: {
          embedId,
          startTime: {
            gte: today,
          },
        },
      });

      if (sessions.length === 0) {
        // No sessions for today, no need to generate analytics
        return;
      }

      // Get usage for today
      const usage = await prisma.chatUsage.findMany({
        where: {
          embedId,
          createdAt: {
            gte: today,
          },
        },
      });

      // Calculate metrics
      const totalConversations = sessions.length;
      const averageMessageCount = sessions.reduce((sum: number, session: ChatSession) => sum + session.messageCount, 0) / totalConversations;
      const averageUserMessages = sessions.reduce((sum: number, session: ChatSession) => sum + session.userMessageCount, 0) / totalConversations;
      const averageAssistantMessages = sessions.reduce((sum: number, session: ChatSession) => sum + session.assistantMessageCount, 0) / totalConversations;
      
      // Calculate average conversation length in seconds
      const averageConversationLength = sessions.reduce((sum: number, session: ChatSession) => {
        if (session.endTime && session.startTime) {
          return sum + (session.endTime.getTime() - session.startTime.getTime()) / 1000;
        }
        return sum;
      }, 0) / totalConversations;

      // Calculate token usage
      const totalTokens = usage.reduce((sum: number, record: ChatUsage) => sum + record.totalTokens, 0);
      const promptTokens = usage.reduce((sum: number, record: ChatUsage) => sum + record.promptTokens, 0);
      const completionTokens = usage.reduce((sum: number, record: ChatUsage) => sum + record.completionTokens, 0);

      // Calculate average response time (placeholder - would need timestamps between user and assistant messages)
      const averageResponseTime = 0;

      // Extract common topics (placeholder - would need NLP processing)
      const commonTopics: Array<{topic: string, count: number}> = [];

      // Upsert analytics record
      await prisma.chatAnalytics.upsert({
        where: {
          embedId_period_date: {
            embedId,
            period: 'daily',
            date: today,
          },
        },
        update: {
          totalConversations,
          averageMessageCount,
          averageUserMessages,
          averageAssistantMessages,
          averageConversationLength,
          totalTokens,
          promptTokens,
          completionTokens,
          averageResponseTime,
          commonTopics: commonTopics.length > 0 ? commonTopics : undefined,
        },
        create: {
          embedId,
          teamId: embed.teamId,
          period: 'daily',
          date: today,
          totalConversations,
          averageMessageCount,
          averageUserMessages,
          averageAssistantMessages,
          averageConversationLength,
          totalTokens,
          promptTokens,
          completionTokens,
          averageResponseTime,
          commonTopics: commonTopics.length > 0 ? commonTopics : undefined,
        },
      });
    } catch (error) {
      logger.error(`Error generating daily analytics for embed ${embedId}:`, error);
      throw error;
    }
  }

  /**
   * Generate weekly analytics for an embed
   */
  private static async generateWeeklyAnalytics(embedId: string): Promise<void> {
    try {
      // Get embed details to get teamId
      const embed = await prisma.chatEmbed.findUnique({
        where: { id: embedId },
        select: { teamId: true },
      });

      if (!embed) {
        throw new Error(`Embed ${embedId} not found`);
      }

      // Get start of week (UTC)
      const startOfWeek = new Date();
      startOfWeek.setUTCHours(0, 0, 0, 0);
      const day = startOfWeek.getUTCDay();
      startOfWeek.setUTCDate(startOfWeek.getUTCDate() - day + (day === 0 ? -6 : 1)); // Adjust to Monday

      // Get sessions for this week
      const sessions = await prisma.chatSession.findMany({
        where: {
          embedId,
          startTime: {
            gte: startOfWeek,
          },
        },
      });

      if (sessions.length === 0) {
        // No sessions for this week, no need to generate analytics
        return;
      }

      // Get usage for this week
      const usage = await prisma.chatUsage.findMany({
        where: {
          embedId,
          createdAt: {
            gte: startOfWeek,
          },
        },
      });

      // Calculate metrics (similar to daily analytics)
      const totalConversations = sessions.length;
      const averageMessageCount = sessions.reduce((sum, session) => sum + session.messageCount, 0) / totalConversations;
      const averageUserMessages = sessions.reduce((sum, session) => sum + session.userMessageCount, 0) / totalConversations;
      const averageAssistantMessages = sessions.reduce((sum, session) => sum + session.assistantMessageCount, 0) / totalConversations;
      
      const averageConversationLength = sessions.reduce((sum, session) => {
        if (session.endTime && session.startTime) {
          return sum + (session.endTime.getTime() - session.startTime.getTime()) / 1000;
        }
        return sum;
      }, 0) / totalConversations;

      const totalTokens = usage.reduce((sum, record) => sum + record.totalTokens, 0);
      const promptTokens = usage.reduce((sum, record) => sum + record.promptTokens, 0);
      const completionTokens = usage.reduce((sum, record) => sum + record.completionTokens, 0);

      const averageResponseTime = 0;
      const commonTopics = [];

      // Upsert analytics record
      await prisma.chatAnalytics.upsert({
        where: {
          embedId_period_date: {
            embedId,
            period: 'weekly',
            date: startOfWeek,
          },
        },
        update: {
          totalConversations,
          averageMessageCount,
          averageUserMessages,
          averageAssistantMessages,
          averageConversationLength,
          totalTokens,
          promptTokens,
          completionTokens,
          averageResponseTime,
          commonTopics: commonTopics.length > 0 ? commonTopics : undefined,
        },
        create: {
          embedId,
          teamId: embed.teamId,
          period: 'weekly',
          date: startOfWeek,
          totalConversations,
          averageMessageCount,
          averageUserMessages,
          averageAssistantMessages,
          averageConversationLength,
          totalTokens,
          promptTokens,
          completionTokens,
          averageResponseTime,
          commonTopics: commonTopics.length > 0 ? commonTopics : undefined,
        },
      });
    } catch (error) {
      logger.error(`Error generating weekly analytics for embed ${embedId}:`, error);
      throw error;
    }
  }

  /**
   * Generate monthly analytics for an embed
   */
  private static async generateMonthlyAnalytics(embedId: string): Promise<void> {
    try {
      // Get embed details to get teamId
      const embed = await prisma.chatEmbed.findUnique({
        where: { id: embedId },
        select: { teamId: true },
      });

      if (!embed) {
        throw new Error(`Embed ${embedId} not found`);
      }

      // Get start of month (UTC)
      const startOfMonth = new Date();
      startOfMonth.setUTCHours(0, 0, 0, 0);
      startOfMonth.setUTCDate(1);

      // Get sessions for this month
      const sessions = await prisma.chatSession.findMany({
        where: {
          embedId,
          startTime: {
            gte: startOfMonth,
          },
        },
      });

      if (sessions.length === 0) {
        // No sessions for this month, no need to generate analytics
        return;
      }

      // Get usage for this month
      const usage = await prisma.chatUsage.findMany({
        where: {
          embedId,
          createdAt: {
            gte: startOfMonth,
          },
        },
      });

      // Calculate metrics (similar to daily analytics)
      const totalConversations = sessions.length;
      const averageMessageCount = sessions.reduce((sum, session) => sum + session.messageCount, 0) / totalConversations;
      const averageUserMessages = sessions.reduce((sum, session) => sum + session.userMessageCount, 0) / totalConversations;
      const averageAssistantMessages = sessions.reduce((sum, session) => sum + session.assistantMessageCount, 0) / totalConversations;
      
      const averageConversationLength = sessions.reduce((sum, session) => {
        if (session.endTime && session.startTime) {
          return sum + (session.endTime.getTime() - session.startTime.getTime()) / 1000;
        }
        return sum;
      }, 0) / totalConversations;

      const totalTokens = usage.reduce((sum, record) => sum + record.totalTokens, 0);
      const promptTokens = usage.reduce((sum, record) => sum + record.promptTokens, 0);
      const completionTokens = usage.reduce((sum, record) => sum + record.completionTokens, 0);

      const averageResponseTime = 0;
      const commonTopics = [];

      // Upsert analytics record
      await prisma.chatAnalytics.upsert({
        where: {
          embedId_period_date: {
            embedId,
            period: 'monthly',
            date: startOfMonth,
          },
        },
        update: {
          totalConversations,
          averageMessageCount,
          averageUserMessages,
          averageAssistantMessages,
          averageConversationLength,
          totalTokens,
          promptTokens,
          completionTokens,
          averageResponseTime,
          commonTopics: commonTopics.length > 0 ? commonTopics : undefined,
        },
        create: {
          embedId,
          teamId: embed.teamId,
          period: 'monthly',
          date: startOfMonth,
          totalConversations,
          averageMessageCount,
          averageUserMessages,
          averageAssistantMessages,
          averageConversationLength,
          totalTokens,
          promptTokens,
          completionTokens,
          averageResponseTime,
          commonTopics: commonTopics.length > 0 ? commonTopics : undefined,
        },
      });
    } catch (error) {
      logger.error(`Error generating monthly analytics for embed ${embedId}:`, error);
      throw error;
    }
  }

  /**
   * Get analytics for a specific embed
   */
  static async getEmbedAnalytics(embedId: string, period: string, startDate?: Date, endDate?: Date) {
    try {
      const whereClause: any = {
        embedId,
        period,
      };

      if (startDate || endDate) {
        whereClause.date = {};
        if (startDate) {
          whereClause.date.gte = startDate;
        }
        if (endDate) {
          whereClause.date.lte = endDate;
        }
      }

      const analytics = await prisma.chatAnalytics.findMany({
        where: whereClause,
        orderBy: {
          date: 'asc',
        },
      });

      return analytics;
    } catch (error) {
      logger.error(`Error fetching analytics for embed ${embedId}:`, error);
      throw error;
    }
  }

  /**
   * Get analytics for a specific team
   */
  static async getTeamAnalytics(teamId: string, period: string, startDate?: Date, endDate?: Date) {
    try {
      const whereClause: any = {
        teamId,
        period,
      };

      if (startDate || endDate) {
        whereClause.date = {};
        if (startDate) {
          whereClause.date.gte = startDate;
        }
        if (endDate) {
          whereClause.date.lte = endDate;
        }
      }

      const analytics = await prisma.chatAnalytics.findMany({
        where: whereClause,
        orderBy: {
          date: 'asc',
        },
      });

      return analytics;
    } catch (error) {
      logger.error(`Error fetching analytics for team ${teamId}:`, error);
      throw error;
    }
  }

  /**
   * Get detailed session data for an embed
   */
  static async getSessionDetails(embedId: string, startDate?: Date, endDate?: Date, limit = 100, offset = 0) {
    try {
      const whereClause: any = {
        embedId,
      };

      if (startDate || endDate) {
        whereClause.startTime = {};
        if (startDate) {
          whereClause.startTime.gte = startDate;
        }
        if (endDate) {
          whereClause.startTime.lte = endDate;
        }
      }

      const sessions = await prisma.chatSession.findMany({
        where: whereClause,
        orderBy: {
          startTime: 'desc',
        },
        take: limit,
        skip: offset,
      });

      const total = await prisma.chatSession.count({
        where: whereClause,
      });

      return {
        sessions,
        total,
      };
    } catch (error) {
      logger.error(`Error fetching session details for embed ${embedId}:`, error);
      throw error;
    }
  }
}
