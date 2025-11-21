import { Router } from 'express';
import { Request, Response } from 'express';

const router = Router();

// Placeholder for auth routes
router.get('/me', (req: Request, res: Response) => {
  res.json({ user: req.user });
});

export default router;