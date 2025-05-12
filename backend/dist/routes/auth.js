"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const validation_1 = require("../middleware/validation");
const auth_schema_1 = require("../schemas/auth.schema");
const auth_controller_1 = require("../controllers/auth.controller");
const rateLimit_1 = require("../middleware/rateLimit");
const router = express_1.default.Router();
// POST routes for actual authentication
router.post('/register', (0, validation_1.validate)(auth_schema_1.registerSchema), auth_controller_1.register);
router.post('/login', (0, validation_1.validate)(auth_schema_1.loginSchema), auth_controller_1.login);
// GET routes to serve the login/register pages (for Next.js frontend)
// These routes are needed because the frontend is making GET requests to these endpoints
// They should return a success response to avoid 404 errors
router.get('/login', (req, res) => {
    console.log('GET /auth/login route hit');
    res.status(200).json({ message: 'Login page endpoint', success: true });
});
router.get('/login/', (req, res) => {
    console.log('GET /auth/login/ route hit');
    res.status(200).json({ message: 'Login page endpoint', success: true });
});
router.get('/register', (req, res) => {
    console.log('GET /auth/register route hit');
    res.status(200).json({ message: 'Register page endpoint', success: true });
});
router.get('/register/', (req, res) => {
    console.log('GET /auth/register/ route hit');
    res.status(200).json({ message: 'Register page endpoint', success: true });
});
// Add routes for forgot-password and reset-password
router.get('/forgot-password', (req, res) => {
    console.log('GET /auth/forgot-password route hit');
    res.status(200).json({ message: 'Forgot password endpoint', success: true });
});
router.get('/forgot-password/', (req, res) => {
    console.log('GET /auth/forgot-password/ route hit');
    res.status(200).json({ message: 'Forgot password endpoint', success: true });
});
router.get('/reset-password', (req, res) => {
    console.log('GET /auth/reset-password route hit');
    res.status(200).json({ message: 'Reset password endpoint', success: true });
});
router.get('/reset-password/', (req, res) => {
    console.log('GET /auth/reset-password/ route hit');
    res.status(200).json({ message: 'Reset password endpoint', success: true });
});
router.post('/forgot-password', rateLimit_1.authLimiter, (0, validation_1.validate)(auth_schema_1.forgotPasswordSchema), auth_controller_1.forgotPassword);
router.post('/reset-password', rateLimit_1.authLimiter, (0, validation_1.validate)(auth_schema_1.resetPasswordSchema), auth_controller_1.resetPassword);
exports.default = router;
