import { Request, Response, NextFunction } from 'express';
import { prisma } from '../db';
import { Logger } from '../utils/logger';
import { AppError } from '../utils/errors';

const logger = Logger.getLogger('access-control');

// Define resource types
export enum ResourceType {
  API_KEY = 'api_key',
  TEAM = 'team',
  CHAT_EMBED = 'chat_embed',
}

// Define permission levels (in ascending order of privilege)
export enum PermissionLevel {
  READ = 'read',
  WRITE = 'write',
  ADMIN = 'admin',
  OWNER = 'owner',
}

/**
 * Check if a user has permissions for a specific resource
 * This centralizes access control logic to prevent unauthorized access
 */
export const checkResourcePermission = async (
  userId: string,
  resourceType: ResourceType,
  resourceId: string,
  requiredPermission: PermissionLevel
): Promise<boolean> => {
  try {
    switch (resourceType) {
      case ResourceType.API_KEY:
        // For API keys, user must be the owner
        const apiKey = await prisma.apiKey.findFirst({
          where: {
            id: resourceId,
            userId: userId,
          },
        });
        return !!apiKey; // User is owner if the key exists and belongs to them

      case ResourceType.TEAM:
        // For teams, check the user's role
        const teamMember = await prisma.teamMember.findFirst({
          where: {
            teamId: resourceId,
            userId: userId,
          },
        });
        
        if (!teamMember) return false;
        
        // Map role to permission level
        const teamPermission = teamMember.role === 'OWNER' 
          ? PermissionLevel.OWNER 
          : teamMember.role === 'ADMIN' 
            ? PermissionLevel.ADMIN 
            : PermissionLevel.READ;
            
        // Check if their permission level is sufficient
        return hasPermission(teamPermission, requiredPermission);

      case ResourceType.CHAT_EMBED:
        // For chat embeds, check team membership and permission level
        const embed = await prisma.chatEmbed.findUnique({
          where: { id: resourceId },
          select: { teamId: true },
        });
        
        if (!embed) return false;
        
        // Get user's team role
        const embedTeamMember = await prisma.teamMember.findFirst({
          where: {
            teamId: embed.teamId,
            userId: userId,
          },
        });
        
        if (!embedTeamMember) return false;
        
        // Map role to permission level
        const embedPermission = embedTeamMember.role === 'OWNER' 
          ? PermissionLevel.OWNER 
          : embedTeamMember.role === 'ADMIN' 
            ? PermissionLevel.ADMIN 
            : PermissionLevel.READ;
            
        // Check if their permission level is sufficient
        return hasPermission(embedPermission, requiredPermission);

      default:
        logger.warn(`Unknown resource type: ${resourceType}`);
        return false;
    }
  } catch (error) {
    logger.error(`Error checking permissions for ${resourceType}:${resourceId}`, error);
    return false;
  }
};

/**
 * Check if a permission level meets the required permission level
 */
function hasPermission(userPermission: PermissionLevel, requiredPermission: PermissionLevel): boolean {
  const permissionLevels = Object.values(PermissionLevel);
  return permissionLevels.indexOf(userPermission) >= permissionLevels.indexOf(requiredPermission);
}

/**
 * Middleware to check if a user has permission to access a resource
 */
export const requireResourcePermission = (
  resourceType: ResourceType,
  getResourceId: (req: Request) => string,
  requiredPermission: PermissionLevel
) => {
  return async (req: any, res: Response, next: NextFunction) => {
    try {
      // Make sure user is authenticated
      if (!req.user?.id) {
        logger.warn('Unauthenticated access attempt', {
          path: req.path,
          ip: req.ip,
        });
        return next(AppError.unauthorized());
      }

      const resourceId = getResourceId(req);
      
      if (!resourceId) {
        logger.warn('Missing resource ID', {
          path: req.path,
          resourceType,
          userId: req.user.id,
        });
        return next(AppError.badRequest('Resource ID is required'));
      }

      const hasPermission = await checkResourcePermission(
        req.user.id,
        resourceType,
        resourceId,
        requiredPermission
      );

      if (!hasPermission) {
        logger.warn('Unauthorized access attempt', {
          userId: req.user.id,
          resourceType,
          resourceId,
          requiredPermission,
        });
        return next(AppError.forbidden('You do not have permission to perform this action'));
      }

      next();
    } catch (error) {
      logger.error('Error in permission middleware', error);
      next(AppError.internal('Failed to verify permissions'));
    }
  };
}; 