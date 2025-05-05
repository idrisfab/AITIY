"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireResourcePermission = exports.checkResourcePermission = exports.PermissionLevel = exports.ResourceType = void 0;
const db_1 = require("../db");
const logger_1 = require("../utils/logger");
const errors_1 = require("../utils/errors");
const logger = logger_1.Logger.getLogger('access-control');
// Define resource types
var ResourceType;
(function (ResourceType) {
    ResourceType["API_KEY"] = "api_key";
    ResourceType["TEAM"] = "team";
    ResourceType["CHAT_EMBED"] = "chat_embed";
})(ResourceType || (exports.ResourceType = ResourceType = {}));
// Define permission levels (in ascending order of privilege)
var PermissionLevel;
(function (PermissionLevel) {
    PermissionLevel["READ"] = "read";
    PermissionLevel["WRITE"] = "write";
    PermissionLevel["ADMIN"] = "admin";
    PermissionLevel["OWNER"] = "owner";
})(PermissionLevel || (exports.PermissionLevel = PermissionLevel = {}));
/**
 * Check if a user has permissions for a specific resource
 * This centralizes access control logic to prevent unauthorized access
 */
const checkResourcePermission = async (userId, resourceType, resourceId, requiredPermission) => {
    try {
        switch (resourceType) {
            case ResourceType.API_KEY:
                // For API keys, user must be the owner
                const apiKey = await db_1.prisma.apiKey.findFirst({
                    where: {
                        id: resourceId,
                        userId: userId,
                    },
                });
                return !!apiKey; // User is owner if the key exists and belongs to them
            case ResourceType.TEAM:
                // For teams, check the user's role
                const teamMember = await db_1.prisma.teamMember.findFirst({
                    where: {
                        teamId: resourceId,
                        userId: userId,
                    },
                });
                if (!teamMember)
                    return false;
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
                const embed = await db_1.prisma.chatEmbed.findUnique({
                    where: { id: resourceId },
                    select: { teamId: true },
                });
                if (!embed)
                    return false;
                // Get user's team role
                const embedTeamMember = await db_1.prisma.teamMember.findFirst({
                    where: {
                        teamId: embed.teamId,
                        userId: userId,
                    },
                });
                if (!embedTeamMember)
                    return false;
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
    }
    catch (error) {
        logger.error(`Error checking permissions for ${resourceType}:${resourceId}`, error);
        return false;
    }
};
exports.checkResourcePermission = checkResourcePermission;
/**
 * Check if a permission level meets the required permission level
 */
function hasPermission(userPermission, requiredPermission) {
    const permissionLevels = Object.values(PermissionLevel);
    return permissionLevels.indexOf(userPermission) >= permissionLevels.indexOf(requiredPermission);
}
/**
 * Middleware to check if a user has permission to access a resource
 */
const requireResourcePermission = (resourceType, getResourceId, requiredPermission) => {
    return async (req, res, next) => {
        try {
            // Make sure user is authenticated
            if (!req.user?.id) {
                logger.warn('Unauthenticated access attempt', {
                    path: req.path,
                    ip: req.ip,
                });
                return next(errors_1.AppError.unauthorized());
            }
            const resourceId = getResourceId(req);
            if (!resourceId) {
                logger.warn('Missing resource ID', {
                    path: req.path,
                    resourceType,
                    userId: req.user.id,
                });
                return next(errors_1.AppError.badRequest('Resource ID is required'));
            }
            const hasPermission = await (0, exports.checkResourcePermission)(req.user.id, resourceType, resourceId, requiredPermission);
            if (!hasPermission) {
                logger.warn('Unauthorized access attempt', {
                    userId: req.user.id,
                    resourceType,
                    resourceId,
                    requiredPermission,
                });
                return next(errors_1.AppError.forbidden('You do not have permission to perform this action'));
            }
            next();
        }
        catch (error) {
            logger.error('Error in permission middleware', error);
            next(errors_1.AppError.internal('Failed to verify permissions'));
        }
    };
};
exports.requireResourcePermission = requireResourcePermission;
