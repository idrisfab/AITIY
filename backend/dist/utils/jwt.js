"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const errors_1 = require("./errors");
const generateToken = (userId) => {
    if (!process.env.JWT_SECRET) {
        throw new errors_1.AppError('JWT_SECRET is not defined', 500);
    }
    // Create a properly typed options object
    const options = {};
    // Set the expiresIn property with the correct type
    if (process.env.JWT_EXPIRES_IN) {
        // The expiresIn value can be a string like '1h', '2d', or a number in seconds
        // Use type assertion to tell TypeScript this string is compatible with the expected type
        options.expiresIn = process.env.JWT_EXPIRES_IN;
    }
    else {
        options.expiresIn = '30d';
    }
    return jsonwebtoken_1.default.sign({ userId }, process.env.JWT_SECRET, options);
};
exports.generateToken = generateToken;
const verifyToken = (token) => {
    if (!process.env.JWT_SECRET) {
        throw new errors_1.AppError('JWT_SECRET is not defined', 500);
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        return decoded;
    }
    catch (error) {
        throw new errors_1.AppError('Invalid or expired token', 401);
    }
};
exports.verifyToken = verifyToken;
