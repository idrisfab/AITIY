"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.protect = void 0;
const errors_1 = require("../utils/errors");
const jwt_1 = require("../utils/jwt");
const db_1 = require("../db");
const protect = async (req, res, next) => {
    try {
        // Get token from header
        const authHeader = req.headers.authorization;
        if (!authHeader?.startsWith('Bearer ')) {
            throw new errors_1.AppError('No token provided', 401);
        }
        const token = authHeader.split(' ')[1];
        if (!token) {
            throw new errors_1.AppError('No token provided', 401);
        }
        // Verify token
        const decoded = (0, jwt_1.verifyToken)(token);
        // Check if user exists
        const user = await db_1.prisma.user.findUnique({
            where: { id: decoded.userId },
            select: { id: true },
        });
        if (!user) {
            throw new errors_1.AppError('User not found', 401);
        }
        // Add user to request
        req.user = user;
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.protect = protect;
