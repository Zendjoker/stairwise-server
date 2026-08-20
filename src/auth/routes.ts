import { Router } from 'express';
import { z } from 'zod';
import { db } from '../db';
import { sendOtp, checkOtp } from '../twilio';
import { signToken, requireAuth, type AuthedRequest } from './middleware';

export const authRouter = Router();

const requestOtpSchema = z.object({ phone: z.string().min(7) });

authRouter.post('/otp/request', async (req, res) => {
  const parsed = requestOtpSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid phone number' });
  }

  await sendOtp(parsed.data.phone);
  res.json({ success: true });
});

const verifyOtpSchema = z.object({ phone: z.string().min(7), code: z.string().length(6) });

authRouter.post('/otp/verify', async (req, res) => {
  const parsed = verifyOtpSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid request' });
  }

  const approved = await checkOtp(parsed.data.phone, parsed.data.code);
  if (!approved) {
    return res.status(400).json({ message: 'Invalid code' });
  }

  const user = await db.user.upsert({
    where: { phone: parsed.data.phone },
    update: {},
    create: { phone: parsed.data.phone },
  });

  const token = signToken(user.id);
  res.json({
    token,
    user: { id: user.id, phone: user.phone, role: user.role },
  });
});

const setRoleSchema = z.object({ role: z.enum(['client', 'tasker']) });

authRouter.post('/role', requireAuth, async (req: AuthedRequest, res) => {
  const parsed = setRoleSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ message: 'Invalid role' });
  }

  const user = await db.user.update({
    where: { id: req.userId },
    data: { role: parsed.data.role },
  });

  res.json({ user: { id: user.id, phone: user.phone, role: user.role } });
});
