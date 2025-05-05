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
router.post('/register', (0, validation_1.validate)(auth_schema_1.registerSchema), auth_controller_1.register);
router.post('/login', (0, validation_1.validate)(auth_schema_1.loginSchema), auth_controller_1.login);
router.post('/forgot-password', rateLimit_1.authLimiter, (0, validation_1.validate)(auth_schema_1.forgotPasswordSchema), auth_controller_1.forgotPassword);
router.post('/reset-password', rateLimit_1.authLimiter, (0, validation_1.validate)(auth_schema_1.resetPasswordSchema), auth_controller_1.resetPassword);
exports.default = router;
