"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const auth_1 = require("../middleware/auth");
const user_controller_1 = require("../controllers/user.controller");
const validation_1 = require("../middleware/validation");
const zod_1 = require("zod");
const router = express_1.default.Router();
// Validation schema for profile update
const updateProfileSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1).optional(),
        email: zod_1.z.string().email().optional(),
    }).refine(data => data.name || data.email, {
        message: "Either name or email must be provided",
        path: ["body"], // Optional: specify the path for the error
    }),
});
// Protected routes - ensure user is logged in for all user routes
router.use(auth_1.protect);
// GET /api/users/profile - Get current user's profile
router.get('/profile', user_controller_1.getProfile);
// PUT /api/users/profile - Update current user's profile
router.put('/profile', (0, validation_1.validate)(updateProfileSchema), user_controller_1.updateProfile);
// TODO: Add user routes
// router.get('/me', (req, res) => {
//   res.json({ message: 'User profile route' });
// });
exports.default = router;
