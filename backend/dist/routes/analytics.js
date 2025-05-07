"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const analyticsService_1 = require("../services/analyticsService");
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
const client_1 = require("@prisma/client");
const router = express_1.default.Router();
const prisma = new client_1.PrismaClient();
// Protect all routes
router.use(auth_1.protect);
/**
 * @route GET /api/analytics/embeds/:embedId
 * @desc Get analytics for a specific embed
 * @access Private
 */
router.get('/embeds/:embedId', async (req, res) => {
    try {
        const { embedId } = req.params;
        const { period = 'daily', startDate, endDate } = req.query;
        // Validate period
        if (!['daily', 'weekly', 'monthly'].includes(period)) {
            throw errors_1.AppError.badRequest('Invalid period. Must be daily, weekly, or monthly');
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
            throw errors_1.AppError.notFound('Embed not found or you do not have access');
        }
        // Parse dates if provided
        let parsedStartDate, parsedEndDate;
        if (startDate) {
            parsedStartDate = new Date(startDate);
            if (isNaN(parsedStartDate.getTime())) {
                throw errors_1.AppError.badRequest('Invalid startDate format');
            }
        }
        if (endDate) {
            parsedEndDate = new Date(endDate);
            if (isNaN(parsedEndDate.getTime())) {
                throw errors_1.AppError.badRequest('Invalid endDate format');
            }
        }
        // Get analytics data
        const analytics = await analyticsService_1.AnalyticsService.getEmbedAnalytics(embedId, period, parsedStartDate, parsedEndDate);
        res.json(analytics);
    }
    catch (error) {
        logger_1.logger.error('Error fetching embed analytics:', error);
        if (error instanceof errors_1.AppError) {
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
router.get('/teams/:teamId', async (req, res) => {
    try {
        const { teamId } = req.params;
        const { period = 'daily', startDate, endDate } = req.query;
        // Validate period
        if (!['daily', 'weekly', 'monthly'].includes(period)) {
            throw errors_1.AppError.badRequest('Invalid period. Must be daily, weekly, or monthly');
        }
        // Check if user is a member of this team
        const teamMember = await prisma.teamMember.findFirst({
            where: {
                teamId,
                userId: req.user.id
            }
        });
        if (!teamMember) {
            throw errors_1.AppError.notFound('Team not found or you are not a member');
        }
        // Parse dates if provided
        let parsedStartDate, parsedEndDate;
        if (startDate) {
            parsedStartDate = new Date(startDate);
            if (isNaN(parsedStartDate.getTime())) {
                throw errors_1.AppError.badRequest('Invalid startDate format');
            }
        }
        if (endDate) {
            parsedEndDate = new Date(endDate);
            if (isNaN(parsedEndDate.getTime())) {
                throw errors_1.AppError.badRequest('Invalid endDate format');
            }
        }
        // Get analytics data
        const analytics = await analyticsService_1.AnalyticsService.getTeamAnalytics(teamId, period, parsedStartDate, parsedEndDate);
        res.json(analytics);
    }
    catch (error) {
        logger_1.logger.error('Error fetching team analytics:', error);
        if (error instanceof errors_1.AppError) {
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
router.get('/sessions/:embedId', async (req, res) => {
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
            throw errors_1.AppError.notFound('Embed not found or you do not have access');
        }
        // Parse dates if provided
        let parsedStartDate, parsedEndDate;
        if (startDate) {
            parsedStartDate = new Date(startDate);
            if (isNaN(parsedStartDate.getTime())) {
                throw errors_1.AppError.badRequest('Invalid startDate format');
            }
        }
        if (endDate) {
            parsedEndDate = new Date(endDate);
            if (isNaN(parsedEndDate.getTime())) {
                throw errors_1.AppError.badRequest('Invalid endDate format');
            }
        }
        // Parse limit and offset
        const parsedLimit = parseInt(limit, 10);
        const parsedOffset = parseInt(offset, 10);
        if (isNaN(parsedLimit) || parsedLimit <= 0) {
            throw errors_1.AppError.badRequest('Invalid limit. Must be a positive number');
        }
        if (isNaN(parsedOffset) || parsedOffset < 0) {
            throw errors_1.AppError.badRequest('Invalid offset. Must be a non-negative number');
        }
        // Get session data
        const sessionData = await analyticsService_1.AnalyticsService.getSessionDetails(embedId, parsedStartDate, parsedEndDate, parsedLimit, parsedOffset);
        res.json(sessionData);
    }
    catch (error) {
        logger_1.logger.error('Error fetching session details:', error);
        if (error instanceof errors_1.AppError) {
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
router.post('/process/:embedId', async (req, res) => {
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
            throw errors_1.AppError.notFound('Embed not found or you do not have sufficient permissions');
        }
        // Process analytics
        await analyticsService_1.AnalyticsService.processSessionsForEmbed(embedId);
        res.json({ message: 'Analytics processing started successfully' });
    }
    catch (error) {
        logger_1.logger.error('Error processing analytics:', error);
        if (error instanceof errors_1.AppError) {
            return res.status(error.statusCode).json({ error: error.message });
        }
        res.status(500).json({ error: 'Failed to process analytics' });
    }
});
exports.default = router;
