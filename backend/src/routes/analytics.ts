import express from 'express';
import { protect } from '../middleware/auth';
import { AnalyticsService } from '../services/analyticsService';
import { AppError } from '../utils/errors';
import { logger } from '../utils/logger';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// Protect all routes
router.use(protect);

/**
 * @route GET /api/analytics/embeds/:embedId
 * @desc Get analytics for a specific embed
 * @access Private
 */
router.get('/embeds/:embedId', async (req: any, res) => {
  try {
    const { embedId } = req.params;
    const { period = 'daily', startDate, endDate } = req.query;

    // Validate period
    if (!['daily', 'weekly', 'monthly'].includes(period)) {
      throw AppError.badRequest('Invalid period. Must be daily, weekly, or monthly');
    }

    // Check if user has access to this embed
    const embed = await prisma.chatEmbed.findFirst({
      where: {
        id: embedId,
        team: {
          members: {
            some: {
              userId: req.user.id
            }
          }
        }
      }
    });

    if (!embed) {
      throw AppError.notFound('Embed not found or you do not have access');
    }

    // Parse dates if provided
    let parsedStartDate, parsedEndDate;
    if (startDate) {
      parsedStartDate = new Date(startDate as string);
      if (isNaN(parsedStartDate.getTime())) {
        throw AppError.badRequest('Invalid startDate format');
      }
    }
    if (endDate) {
      parsedEndDate = new Date(endDate as string);
      if (isNaN(parsedEndDate.getTime())) {
        throw AppError.badRequest('Invalid endDate format');
      }
    }

    // Get analytics data
    const analytics = await AnalyticsService.getEmbedAnalytics(
      embedId,
      period as string,
      parsedStartDate,
      parsedEndDate
    );

    res.json(analytics);
  } catch (error) {
    logger.error('Error fetching embed analytics:', error);
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

/**
 * @route GET /api/analytics/teams/:teamId
 * @desc Get analytics for a specific team
 * @access Private
 */
router.get('/teams/:teamId', async (req: any, res) => {
  try {
    const { teamId } = req.params;
    const { period = 'daily', startDate, endDate } = req.query;

    // Validate period
    if (!['daily', 'weekly', 'monthly'].includes(period)) {
      throw AppError.badRequest('Invalid period. Must be daily, weekly, or monthly');
    }

    // Check if user is a member of this team
    const teamMember = await prisma.teamMember.findFirst({
      where: {
        teamId,
        userId: req.user.id
      }
    });

    if (!teamMember) {
      throw AppError.notFound('Team not found or you are not a member');
    }

    // Parse dates if provided
    let parsedStartDate, parsedEndDate;
    if (startDate) {
      parsedStartDate = new Date(startDate as string);
      if (isNaN(parsedStartDate.getTime())) {
        throw AppError.badRequest('Invalid startDate format');
      }
    }
    if (endDate) {
      parsedEndDate = new Date(endDate as string);
      if (isNaN(parsedEndDate.getTime())) {
        throw AppError.badRequest('Invalid endDate format');
      }
    }

    // Get analytics data
    const analytics = await AnalyticsService.getTeamAnalytics(
      teamId,
      period as string,
      parsedStartDate,
      parsedEndDate
    );

    res.json(analytics);
  } catch (error) {
    logger.error('Error fetching team analytics:', error);
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to fetch analytics' });
  }
});

/**
 * @route GET /api/analytics/sessions/:embedId
 * @desc Get detailed session data for an embed
 * @access Private
 */
router.get('/sessions/:embedId', async (req: any, res) => {
  try {
    const { embedId } = req.params;
    const { startDate, endDate, limit = '100', offset = '0' } = req.query;

    // Check if user has access to this embed
    const embed = await prisma.chatEmbed.findFirst({
      where: {
        id: embedId,
        team: {
          members: {
            some: {
              userId: req.user.id
            }
          }
        }
      }
    });

    if (!embed) {
      throw AppError.notFound('Embed not found or you do not have access');
    }

    // Parse dates if provided
    let parsedStartDate, parsedEndDate;
    if (startDate) {
      parsedStartDate = new Date(startDate as string);
      if (isNaN(parsedStartDate.getTime())) {
        throw AppError.badRequest('Invalid startDate format');
      }
    }
    if (endDate) {
      parsedEndDate = new Date(endDate as string);
      if (isNaN(parsedEndDate.getTime())) {
        throw AppError.badRequest('Invalid endDate format');
      }
    }

    // Parse limit and offset
    const parsedLimit = parseInt(limit as string, 10);
    const parsedOffset = parseInt(offset as string, 10);

    if (isNaN(parsedLimit) || parsedLimit <= 0) {
      throw AppError.badRequest('Invalid limit. Must be a positive number');
    }
    if (isNaN(parsedOffset) || parsedOffset < 0) {
      throw AppError.badRequest('Invalid offset. Must be a non-negative number');
    }

    // Get session data
    const sessionData = await AnalyticsService.getSessionDetails(
      embedId,
      parsedStartDate,
      parsedEndDate,
      parsedLimit,
      parsedOffset
    );

    res.json(sessionData);
  } catch (error) {
    logger.error('Error fetching session details:', error);
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to fetch session details' });
  }
});

/**
 * @route POST /api/analytics/process/:embedId
 * @desc Process analytics for a specific embed (manual trigger)
 * @access Private
 */
router.post('/process/:embedId', async (req: any, res) => {
  try {
    const { embedId } = req.params;

    // Check if user has access to this embed
    const embed = await prisma.chatEmbed.findFirst({
      where: {
        id: embedId,
        team: {
          members: {
            some: {
              userId: req.user.id,
              role: { in: ['OWNER', 'ADMIN'] } // Only admins and owners can trigger processing
            }
          }
        }
      }
    });

    if (!embed) {
      throw AppError.notFound('Embed not found or you do not have sufficient permissions');
    }

    // Process analytics
    await AnalyticsService.processSessionsForEmbed(embedId);

    res.json({ message: 'Analytics processing started successfully' });
  } catch (error) {
    logger.error('Error processing analytics:', error);
    if (error instanceof AppError) {
      return res.status(error.statusCode).json({ error: error.message });
    }
    res.status(500).json({ error: 'Failed to process analytics' });
  }
});

export default router;
