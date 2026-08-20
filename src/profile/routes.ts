import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { requireAuth, type AuthedRequest } from '../auth/middleware';

export const profileRouter = Router();

const preferencesSchema = z.object({ categories: z.array(z.string()) });

profileRouter.post('/preferences', requireAuth, async (req: AuthedRequest, res) => {
  const parsed = preferencesSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid preferences' });
  }

  const user = await db.user.update({
    where: { id: req.userId },
    data: { preferredCategories: parsed.data.categories },
  });

  res.json({ preferredCategories: user.preferredCategories });
});

profileRouter.get('/jobs', requireAuth, async (req: AuthedRequest, res) => {
  const acceptances = await db.taskAcceptance.findMany({
    where: { userId: req.userId },
    include: { task: true },
    orderBy: { createdAt: 'desc' },
  });

  res.json({
    jobs: acceptances.map((a) => ({
      id: a.task.id,
      title: a.task.title,
      address: a.task.address,
      date: a.task.date.toISOString(),
      category: a.task.category,
      icon: a.task.icon,
      hourlyRateCents: a.task.hourlyRateCents,
      acceptedAt: a.createdAt.toISOString(),
    })),
  });
});
