"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const models_1 = require("../models");
const router = (0, express_1.Router)();
// Get user profile
router.get('/profile', async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: { message: 'Unauthorized' } });
        }
        const profile = await models_1.ProfileModel.findOne({ user: req.user._id });
        res.json({ data: profile });
    }
    catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: { message: 'Failed to get profile' } });
    }
});
// Update user profile
router.put('/profile', async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: { message: 'Unauthorized' } });
        }
        const allowedFields = ['name', 'phone', 'role', 'location', 'age', 'gender', 'medicalConditions'];
        const updates = {};
        Object.keys(req.body).forEach(key => {
            if (allowedFields.includes(key)) {
                updates[key] = req.body[key];
            }
        });
        const profile = await models_1.ProfileModel.findOneAndUpdate({ user: req.user._id }, {
            ...updates,
            user: req.user._id, // Ensure user is set
            role: req.user.role // Ensure role matches user role
        }, { new: true, upsert: true, runValidators: true });
        res.json({ data: profile });
    }
    catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: { message: 'Failed to update profile' } });
    }
});
exports.default = router;
