import { Router } from 'express';
import { db } from '../db';
import { requireAuth, type AuthedRequest } from '../auth/middleware';
import { displayName } from '../displayName';

export const tasksRouter = Router();

async function serializeTask(task: {
  id: string;
  title: string;
  description: string;
  address: string;
  date: Date;
  category: string;
  icon: string;
  taskersNeeded: number;
  hourlyRateCents: number;
  requirements: string[];
  expiresAt: Date;
  postedById: string;
}) {
  const [acceptedCount, poster, reviews] = await Promise.all([
    db.taskAcceptance.count({ where: { taskId: task.id } }),
    db.user.findUniqueOrThrow({ where: { id: task.postedById } }),
    db.review.findMany({
      where: { targetId: task.postedById },
      include: { author: true },
      orderBy: { createdAt: 'desc' },
      take: 5,
    }),
  ]);

  return {
    id: task.id,
    title: task.title,
    description: task.description,
    address: task.address,
    date: task.date.toISOString(),
    category: task.category,
    icon: task.icon,
    taskersNeeded: task.taskersNeeded,
    taskersAccepted: acceptedCount,
    hourlyRateCents: task.hourlyRateCents,
    requirements: task.requirements,
    expiresAt: task.expiresAt.toISOString(),
    postedBy: {
      name: displayName(poster),
      rating: poster.rating,
      tasksPosted: poster.tasksPosted,
      memberSinceYear: poster.memberSinceYear,
      reviews: reviews.map((r) => ({
        author: displayName(r.author),
        rating: r.rating,
        text: r.text,
      })),
    },
  };
}

tasksRouter.get('/', async (_req, res) => {
  const tasks = await db.task.findMany({ orderBy: { createdAt: 'desc' } });
  res.json({ tasks: await Promise.all(tasks.map(serializeTask)) });
});

tasksRouter.get('/:id', async (req, res) => {
  const task = await db.task.findUnique({ where: { id: req.params.id } });
  if (!task) return res.status(404).json({ message: 'Task not found' });
  res.json({ task: await serializeTask(task) });
});

tasksRouter.post('/:id/accept', requireAuth, async (req: AuthedRequest, res) => {
  const task = await db.task.findUnique({ where: { id: req.params.id } });
  if (!task) return res.status(404).json({ message: 'Task not found' });

  const acceptedCount = await db.taskAcceptance.count({ where: { taskId: task.id } });
  if (acceptedCount >= task.taskersNeeded) {
    return res.status(400).json({ message: 'Task is already full' });
  }

  await db.taskAcceptance.upsert({
    where: { taskId_userId: { taskId: task.id, userId: req.userId! } },
    update: {},
    create: { taskId: task.id, userId: req.userId! },
  });

  res.json({ task: await serializeTask(task) });
});
