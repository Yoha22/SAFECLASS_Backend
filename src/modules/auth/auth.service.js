import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes, createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import prisma from '../../config/database.js';
import { env } from '../../config/env.js';

function hashToken(token) {
  return createHash('sha256').update(token).digest('hex');
}

function signAccess(user) {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    env.jwt.secret,
    { expiresIn: env.jwt.expiresIn },
  );
}

function signRefresh(userId) {
  return jwt.sign({ sub: userId }, env.jwt.refreshSecret, {
    expiresIn: env.jwt.refreshExpiresIn,
  });
}

export async function login(email, password) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.active) throw { status: 401, message: 'Credenciales inválidas' };

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw { status: 401, message: 'Credenciales inválidas' };

  await prisma.user.update({
    where: { id: user.id },
    data: { lastSession: new Date() },
  });

  const accessToken = signAccess(user);
  const refreshToken = signRefresh(user.id);

  const refreshExpiresAt = new Date();
  refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 7);

  await prisma.refreshToken.create({
    data: {
      userId: user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: refreshExpiresAt,
    },
  });

  return {
    token: accessToken,
    refreshToken,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  };
}

export async function refreshAccessToken(refreshToken) {
  let payload;
  try {
    payload = jwt.verify(refreshToken, env.jwt.refreshSecret);
  } catch {
    throw { status: 401, message: 'Refresh token inválido' };
  }

  const stored = await prisma.refreshToken.findUnique({
    where: { tokenHash: hashToken(refreshToken) },
    include: { user: true },
  });

  if (!stored || stored.revokedAt || stored.expiresAt < new Date()) {
    throw { status: 401, message: 'Refresh token inválido o expirado' };
  }

  return { token: signAccess(stored.user) };
}

export async function logout(refreshToken) {
  if (!refreshToken) return;
  await prisma.refreshToken.updateMany({
    where: { tokenHash: hashToken(refreshToken) },
    data: { revokedAt: new Date() },
  });
}

export async function forgotPassword(email) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return; // nunca revelar si el email existe

  const rawToken = randomBytes(32).toString('hex');
  const expiresAt = new Date(
    Date.now() + env.resetTokenTtlMinutes * 60 * 1000,
  );

  await prisma.passwordResetToken.create({
    data: { userId: user.id, tokenHash: hashToken(rawToken), expiresAt },
  });

  // TODO: enviar email con el rawToken
  if (env.nodeEnv === 'development') {
    console.log(`[DEV] Password reset token for ${email}: ${rawToken}`);
  }
}

export async function resetPassword(rawToken, newPassword) {
  const tokenHash = hashToken(rawToken);
  const record = await prisma.passwordResetToken.findUnique({ where: { tokenHash } });

  if (!record || record.usedAt || record.expiresAt < new Date()) {
    throw { status: 400, message: 'Token inválido o expirado' };
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);

  await prisma.$transaction([
    prisma.user.update({ where: { id: record.userId }, data: { passwordHash } }),
    prisma.passwordResetToken.update({ where: { id: record.id }, data: { usedAt: new Date() } }),
  ]);
}
