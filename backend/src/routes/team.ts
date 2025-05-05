import express from 'express';
import { protect } from '../middleware/auth';
import { prisma } from '../db';

const router = express.Router();

// Protected routes
router.use(protect);

// Get user's teams
router.get('/', async (req: any, res) => {
  try {
    const teams = await prisma.team.findMany({
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
  } catch (error) {
    console.error('Error fetching teams:', error);
    res.status(500).json({ error: 'Failed to fetch teams' });
  }
});

router.get('/:teamId/embeds', async (req: any, res) => {
  try {
    const { teamId } = req.params;
    // Fetch embeds for the team, filtered by user/team membership as needed
    const embeds = await prisma.chatEmbed.findMany({
      where: { teamId },
      // ...add any necessary filters or includes
    });
    res.json(embeds);
  } catch (error) {
    console.error('Error fetching embeds:', error);
    res.status(500).json({ error: 'Failed to fetch embeds' });
  }
});

export default router; 