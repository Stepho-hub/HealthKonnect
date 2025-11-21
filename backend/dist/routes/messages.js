"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const models_1 = require("../models");
const router = (0, express_1.Router)();
// Send message
router.post('/', async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: { message: 'Unauthorized' } });
        }
        const { receiver, content } = req.body;
        if (!receiver || !content) {
            return res.status(400).json({ error: { message: 'Receiver and content are required' } });
        }
        const receiverUser = await models_1.UserModel.findById(receiver);
        if (!receiverUser) {
            return res.status(404).json({ error: { message: 'Receiver not found' } });
        }
        if (receiver === req.user._id.toString()) {
            return res.status(400).json({ error: { message: 'Cannot send message to yourself' } });
        }
        const message = new models_1.MessageModel({
            sender: req.user._id,
            receiver: receiver,
            content: content.trim()
        });
        await message.save();
        await message.populate('sender', 'name');
        await message.populate('receiver', 'name');
        res.status(201).json({ data: message });
    }
    catch (error) {
        console.error('Send message error:', error);
        res.status(500).json({ error: { message: 'Failed to send message' } });
    }
});
// Get user messages
router.get('/', async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: { message: 'Unauthorized' } });
        }
        const messages = await models_1.MessageModel.find({
            $or: [{ sender: req.user._id }, { receiver: req.user._id }]
        })
            .populate('sender', 'name')
            .populate('receiver', 'name')
            .sort({ createdAt: -1 })
            .limit(100);
        res.json({ data: messages });
    }
    catch (error) {
        console.error('Get messages error:', error);
        res.status(500).json({ error: { message: 'Failed to get messages' } });
    }
});
exports.default = router;
