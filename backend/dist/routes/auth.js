"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
// Placeholder for auth routes
router.get('/me', (req, res) => {
    res.json({ user: req.user });
});
exports.default = router;
