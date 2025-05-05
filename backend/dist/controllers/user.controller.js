"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getProfile = exports.updateProfile = void 0;
const db_1 = require("../db");
const errors_1 = require("../utils/errors");
const logger_1 = require("../utils/logger");
const logger = logger_1.Logger.getLogger('user-controller');
const updateProfile = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        const { name, email } = req.body;
        if (!userId) {
            // This should technically not happen if 'protect' middleware is used correctly
            return next(new errors_1.AppError('Authentication required', 401));
        }
        if (!name && !email) {
            return next(new errors_1.AppError('No update data provided (name or email)', 400));
        }
        // Basic validation (more robust validation can be added via schemas)
        if (email && !/\S+@\S+\.\S+/.test(email)) {
            return next(new errors_1.AppError('Invalid email format', 400));
        }
        if (name && typeof name !== 'string' || name.trim().length < 1) {
            return next(new errors_1.AppError('Invalid name provided', 400));
        }
        // Prepare update data
        const updateData = {};
        if (name)
            updateData.name = name.trim();
        if (email)
            updateData.email = email.trim(); // Consider email verification flow if changing email
        logger.info(`Updating profile for user ${userId}`, { updateData });
        // Update user in database
        const updatedUser = await db_1.prisma.user.update({
            where: { id: userId },
            data: updateData,
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true,
            },
        });
        logger.info(`Profile updated successfully for user ${userId}`);
        // Return the updated user data as expected by the frontend
        res.status(200).json({
            status: 'success',
            message: 'Profile updated successfully',
            user: updatedUser,
        });
    }
    catch (error) {
        // Handle potential errors like unique constraint violation (email already exists)
        if (error.code === 'P2002' && error.meta?.target?.includes('email')) {
            logger.warn(`Failed to update profile for user ${req.user?.id}: Email already exists`);
            return next(new errors_1.AppError('Email address is already in use by another account', 409));
        }
        logger.error(`Error updating profile for user ${req.user?.id}`, error);
        next(error); // Pass error to global error handler
    }
};
exports.updateProfile = updateProfile;
// Placeholder for getProfile if needed later
const getProfile = async (req, res, next) => {
    try {
        const userId = req.user?.id;
        if (!userId) {
            return next(new errors_1.AppError('Authentication required', 401));
        }
        const user = await db_1.prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                email: true,
                name: true,
                createdAt: true
            }
        });
        if (!user) {
            return next(errors_1.AppError.notFound('User'));
        }
        res.status(200).json({
            status: 'success',
            user: user
        });
    }
    catch (error) {
        logger.error(`Error fetching profile for user ${req.user?.id}`, error);
        next(error);
    }
};
exports.getProfile = getProfile;
