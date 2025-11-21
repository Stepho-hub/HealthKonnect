import { Router, Request, Response } from 'express';
import { MessageModel, UserModel } from '../models';

const router = Router();

// Send message
router.post('/', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: { message: 'Unauthorized' } });
    }

    const { receiver, content } = req.body;

    if (!receiver || !content) {
      return res.status(400).json({ error: { message: 'Receiver and content are required' } });
    }

    const receiverUser = await UserModel.findById(receiver);
    if (!receiverUser) {
      return res.status(404).json({ error: { message: 'Receiver not found' } });
    }

    if (receiver === req.user._id.toString()) {
      return res.status(400).json({ error: { message: 'Cannot send message to yourself' } });
    }

    const message = new MessageModel({
      sender: req.user._id,
      receiver: receiver,
      content: content.trim()
    });

    await message.save();
    await message.populate('sender', 'name');
    await message.populate('receiver', 'name');

    res.status(201).json({ data: message });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: { message: 'Failed to send message' } });
  }
});

// Get user messages
router.get('/', async (req: Request, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ error: { message: 'Unauthorized' } });
    }

    const messages = await MessageModel.find({
      $or: [{ sender: req.user._id }, { receiver: req.user._id }]
    })
    .populate('sender', 'name')
    .populate('receiver', 'name')
    .sort({ createdAt: -1 })
    .limit(100);

    res.json({ data: messages });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: { message: 'Failed to get messages' } });
  }
});

export default router;