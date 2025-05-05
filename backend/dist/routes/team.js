"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const db_1 = require("../db");
const router = express_1.default.Router();
// Protected routes
router.use(auth_1.protect);
// Get user's teams
router.get('/', async (req, res) => {
    try {
        const teams = await db_1.prisma.team.findMany({
            where: {
                members: {
                    some: {
                        userId: req.user.id
                    }
                }
            },
            include: {
                members: {
                    include: {
                        user: {
                            select: {
                                id: true,
                                name: true,
                                email: true
                            }
                        }
                    }
                }
            }
        });
        res.json(teams);
    }
    catch (error) {
        console.error('Error fetching teams:', error);
        res.status(500).json({ error: 'Failed to fetch teams' });
    }
});
router.get('/:teamId/embeds', async (req, res) => {
    try {
        const { teamId } = req.params;
        // Fetch embeds for the team, filtered by user/team membership as needed
        const embeds = await db_1.prisma.chatEmbed.findMany({
            where: { teamId },
            // ...add any necessary filters or includes
        });
        res.json(embeds);
    }
    catch (error) {
        console.error('Error fetching embeds:', error);
        res.status(500).json({ error: 'Failed to fetch embeds' });
    }
});
exports.default = router;
