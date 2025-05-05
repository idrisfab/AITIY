import { Router, Request, Response } from 'express';
import { prisma } from '../index';
import { authenticateJWT } from '../middleware/auth.middleware';
import { body } from 'express-validator';
import { validateRequest } from '../middleware/validation.middleware';

const router = Router();

// Get all embeds for a team
router.get('/teams/:teamId/embeds', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;
    const embeds = await prisma.embedConfiguration.findMany({
      where: { teamId },
      orderBy: { createdAt: 'desc' },
    });
    res.json(embeds);
  } catch (error) {
    console.error('Error fetching team embeds:', error);
    res.status(500).json({ error: 'Failed to fetch team embeds' });
  }
});

// Create a new embed for a team
router.post(
  '/teams/:teamId/embeds',
  authenticateJWT,
  [
    body('name').isString().notEmpty(),
    body('apiKeyId').isString().notEmpty(),
    body('modelVendor').isString().notEmpty(),
    body('modelName').isString().notEmpty(),
    // Add more validations as needed
    validateRequest,
  ],
  async (req: Request, res: Response) => {
    try {
      const { teamId } = req.params;
      const { name, apiKeyId, modelVendor, modelName, systemPrompt, theme, primaryColor } = req.body;
      // Optionally: check if user is a member/owner of the team
      const embed = await prisma.embedConfiguration.create({
        data: {
          teamId,
          name,
          apiKeyId,
          modelVendor,
          modelName,
          systemPrompt,
          theme,
          primaryColor,
        },
      });
      res.status(201).json(embed);
    } catch (error) {
      console.error('Error creating team embed:', error);
      res.status(500).json({ error: 'Failed to create team embed' });
    }
  }
);

// Get a single embed for a team
router.get('/teams/:teamId/embeds/:embedId', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { teamId, embedId } = req.params;
    const embed = await prisma.embedConfiguration.findFirst({
      where: { id: embedId, teamId },
    });
    if (!embed) return res.status(404).json({ error: 'Embed not found' });
    res.json(embed);
  } catch (error) {
    console.error('Error fetching embed:', error);
    res.status(500).json({ error: 'Failed to fetch embed' });
  }
});

// Update an embed for a team
router.patch('/teams/:teamId/embeds/:embedId', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { teamId, embedId } = req.params;
    // TODO: Check if user is team member/owner
    const embed = await prisma.embedConfiguration.update({
      where: { id: embedId },
      data: req.body,
    });
    res.json(embed);
  } catch (error) {
    console.error('Error updating embed:', error);
    res.status(500).json({ error: 'Failed to update embed' });
  }
});

// Delete an embed for a team
router.delete('/teams/:teamId/embeds/:embedId', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { teamId, embedId } = req.params;
    // TODO: Check if user is team member/owner
    await prisma.embedConfiguration.delete({ where: { id: embedId } });
    res.json({ message: 'Embed deleted' });
  } catch (error) {
    console.error('Error deleting embed:', error);
    res.status(500).json({ error: 'Failed to delete embed' });
  }
});

// Create a new team
router.post('/teams', authenticateJWT, [body('name').isString().notEmpty(), validateRequest], async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.userId;
    const { name, description } = req.body;
    const team = await prisma.team.create({
      data: {
        name,
        description,
        ownerId: userId,
        members: { connect: { id: userId } },
      },
    });
    res.status(201).json(team);
  } catch (error) {
    console.error('Error creating team:', error);
    res.status(500).json({ error: 'Failed to create team' });
  }
});

// Get team details
router.get('/teams/:teamId', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: { members: true, embeds: true },
    });
    if (!team) return res.status(404).json({ error: 'Team not found' });
    res.json(team);
  } catch (error) {
    console.error('Error fetching team:', error);
    res.status(500).json({ error: 'Failed to fetch team' });
  }
});

// Update team info
router.patch('/teams/:teamId', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;
    // TODO: Check if user is owner
    const team = await prisma.team.update({
      where: { id: teamId },
      data: req.body,
    });
    res.json(team);
  } catch (error) {
    console.error('Error updating team:', error);
    res.status(500).json({ error: 'Failed to update team' });
  }
});

// Delete a team
router.delete('/teams/:teamId', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;
    // TODO: Check if user is owner
    await prisma.team.delete({ where: { id: teamId } });
    res.json({ message: 'Team deleted' });
  } catch (error) {
    console.error('Error deleting team:', error);
    res.status(500).json({ error: 'Failed to delete team' });
  }
});

// Add a member to a team by email
router.post('/teams/:teamId/members', authenticateJWT, [body('email').isEmail(), validateRequest], async (req: Request, res: Response) => {
  try {
    const { teamId } = req.params;
    const { email } = req.body;
    // TODO: Check if user is owner
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return res.status(404).json({ error: 'User not found' });
    await prisma.team.update({
      where: { id: teamId },
      data: { members: { connect: { id: user.id } } },
    });
    res.json({ message: 'Member added' });
  } catch (error) {
    console.error('Error adding member:', error);
    res.status(500).json({ error: 'Failed to add member' });
  }
});

// Remove a member from a team
router.delete('/teams/:teamId/members/:userId', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { teamId, userId } = req.params;
    // TODO: Check if user is owner
    await prisma.team.update({
      where: { id: teamId },
      data: { members: { disconnect: { id: userId } } },
    });
    res.json({ message: 'Member removed' });
  } catch (error) {
    console.error('Error removing member:', error);
    res.status(500).json({ error: 'Failed to remove member' });
  }
});

export default router; 