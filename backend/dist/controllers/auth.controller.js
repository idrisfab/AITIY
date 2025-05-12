"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.forgotPassword = exports.login = exports.register = void 0;
const db_1 = require("../db");
const errors_1 = require("../utils/errors");
const encryption_1 = require("../utils/encryption");
const jwt_1 = require("../utils/jwt");
const email_service_1 = require("../services/email.service");
const crypto_1 = __importDefault(require("crypto"));
const register = async (req, res, next) => {
    try {
        const { email, password, name } = req.body;
        // Check if user exists
        const existingUser = await db_1.prisma.user.findUnique({
            where: { email },
        });
        if (existingUser) {
            throw new errors_1.AppError('Email already in use', 409);
        }
        // Hash password
        const hashedPassword = await (0, encryption_1.hashPassword)(password);
        // Create user
        const user = await db_1.prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                name,
            },
            select: {
                id: true,
                email: true,
                name: true,
            },
        });
        // Create a default team for the user
        const defaultTeam = await db_1.prisma.team.create({
            data: {
                name: `${name || email.split('@')[0]}'s Team`,
                members: {
                    create: {
                        userId: user.id,
                        role: 'OWNER',
                    },
                },
            },
        });
        // Generate token
        const token = (0, jwt_1.generateToken)(user.id);
        res.status(201).json({
            status: 'success',
            data: {
                user,
                token,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.register = register;
const login = async (req, res, next) => {
    try {
        const { email, password } = req.body;
        // Find user
        const user = await db_1.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            throw new errors_1.AppError('Invalid credentials', 401);
        }
        // Check password
        const isPasswordValid = await (0, encryption_1.comparePasswords)(password, user.password);
        if (!isPasswordValid) {
            throw new errors_1.AppError('Invalid credentials', 401);
        }
        // Generate token
        const token = (0, jwt_1.generateToken)(user.id);
        // Remove password from response
        const { password: _, ...userWithoutPassword } = user;
        res.json({
            status: 'success',
            data: {
                user: userWithoutPassword,
                token,
            },
        });
    }
    catch (error) {
        next(error);
    }
};
exports.login = login;
const forgotPassword = async (req, res, next) => {
    try {
        const { email } = req.body;
        // Find user
        const user = await db_1.prisma.user.findUnique({
            where: { email },
        });
        if (!user) {
            // Don't reveal whether a user exists
            return res.json({
                status: 'success',
                message: 'If an account exists, a password reset email will be sent',
            });
        }
        // Generate reset token
        const resetToken = crypto_1.default.randomBytes(32).toString('hex');
        const resetTokenExpiry = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
        // Save reset token
        await db_1.prisma.user.update({
            where: { id: user.id },
            data: {
                resetToken,
                resetTokenExpiry,
            },
        });
        // Send reset email
        const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${resetToken}`;
        await (0, email_service_1.sendEmail)({
            to: user.email,
            subject: 'Password Reset Request',
            text: `To reset your password, click this link: ${resetUrl}`,
            html: `
        <p>To reset your password, click this link:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>This link will expire in 1 hour.</p>
      `,
        });
        res.json({
            status: 'success',
            message: 'If an account exists, a password reset email will be sent',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (req, res, next) => {
    try {
        const { token, password } = req.body;
        // Find user with valid reset token
        const user = await db_1.prisma.user.findFirst({
            where: {
                resetToken: token,
                resetTokenExpiry: {
                    gt: new Date(),
                },
            },
        });
        if (!user) {
            throw new errors_1.AppError('Invalid or expired reset token', 400);
        }
        // Hash new password
        const hashedPassword = await (0, encryption_1.hashPassword)(password);
        // Update user
        await db_1.prisma.user.update({
            where: { id: user.id },
            data: {
                password: hashedPassword,
                resetToken: null,
                resetTokenExpiry: null,
            },
        });
        res.json({
            status: 'success',
            message: 'Password has been reset successfully',
        });
    }
    catch (error) {
        next(error);
    }
};
exports.resetPassword = resetPassword;
