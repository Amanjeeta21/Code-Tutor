import crypto from 'node:crypto';
import { Router, type Request, type Response } from 'express';

import { prisma } from '../../../database/prisma.js';

const router = Router();

const SESSION_COOKIE = 'code_tutor_session';
const SESSION_DAYS = 7;
const SESSION_MAX_AGE_MS = SESSION_DAYS * 24 * 60 * 60 * 1000;
const PASSWORD_KEY_LENGTH = 64;
const PASSWORD_SALT_LENGTH = 16;
const MAX_OPTIONAL_FIELD_LENGTH = 120;
const MAX_BIO_LENGTH = 280;
const MAX_IMAGE_LENGTH = 500_000;

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const usernamePattern = /^[a-zA-Z0-9_]+$/;
const dateOfBirthPattern = /^\d{2}-\d{2}-\d{4}$/;
const genders = new Set(['Male', 'Female', 'Does not want to disclose']);
const editorLanguages = new Set(['JavaScript', 'TypeScript', 'Java', 'Python', 'C++']);

const editableUserSelect = {
  bio: true,
  createdAt: true,
  dateOfBirth: true,
  editorLanguage: true,
  email: true,
  fullName: true,
  gender: true,
  id: true,
  image: true,
  language: true,
  role: true,
  username: true,
};

type PublicUser = {
  id: string;
  email: string;
  name: string;
  username: string;
  fullName?: string;
  bio?: string;
  role?: string;
  gender?: string;
  dateOfBirth?: string;
  language?: string;
  editorLanguage?: string;
  image?: string;
  createdAt: string;
};

function getCookie(req: Request, name: string) {
  const cookieHeader = req.headers.cookie;
  if (!cookieHeader) return undefined;

  return cookieHeader
    .split(';')
    .map((cookie) => cookie.trim())
    .find((cookie) => cookie.startsWith(`${name}=`))
    ?.slice(name.length + 1);
}

function toPublicUser(user: {
  id: string;
  email: string;
  username: string;
  fullName?: string | null;
  bio?: string | null;
  role?: string | null;
  gender?: string | null;
  dateOfBirth?: string | null;
  language?: string | null;
  editorLanguage?: string | null;
  image?: string | null;
  createdAt: Date;
}): PublicUser {
  const name = user.fullName || user.username;

  return {
    id: user.id,
    email: user.email,
    name,
    username: user.username,
    fullName: user.fullName ?? undefined,
    bio: user.bio ?? undefined,
    role: user.role ?? undefined,
    gender: user.gender ?? undefined,
    dateOfBirth: user.dateOfBirth ?? undefined,
    language: user.language ?? undefined,
    editorLanguage: user.editorLanguage ?? undefined,
    image: user.image ?? undefined,
    createdAt: user.createdAt.toISOString(),
  };
}

function setSessionCookie(res: Response, token: string) {
  res.cookie(SESSION_COOKIE, token, {
    httpOnly: true,
    maxAge: SESSION_MAX_AGE_MS,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
}

function clearSessionCookie(res: Response) {
  res.clearCookie(SESSION_COOKIE, {
    httpOnly: true,
    path: '/',
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  });
}

function hashPassword(password: string) {
  const salt = crypto.randomBytes(PASSWORD_SALT_LENGTH).toString('hex');
  const hash = crypto.scryptSync(password, salt, PASSWORD_KEY_LENGTH).toString('hex');
  return `scrypt:${salt}:${hash}`;
}

function verifyPassword(password: string, storedPassword: string) {
  const [scheme, salt, hash] = storedPassword.split(':');
  if (scheme !== 'scrypt' || !salt || !hash) return false;

  const candidate = crypto.scryptSync(password, salt, PASSWORD_KEY_LENGTH);
  const expected = Buffer.from(hash, 'hex');

  return candidate.length === expected.length && crypto.timingSafeEqual(candidate, expected);
}

function optionalText(value: unknown, maxLength = MAX_OPTIONAL_FIELD_LENGTH) {
  if (value === undefined) return undefined;

  const trimmed = String(value || '').trim();
  return trimmed ? trimmed.slice(0, maxLength) : null;
}

function isValidDateOfBirth(value: string) {
  if (!dateOfBirthPattern.test(value)) return false;

  const [day, month, year] = value.split('-').map(Number);
  const parsed = new Date(year, month - 1, day);

  return parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day;
}

async function createSession(req: Request, res: Response, userId: string) {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + SESSION_MAX_AGE_MS);

  await prisma.session.create({
    data: {
      expiresAt,
      ipAddress: req.ip,
      token,
      userAgent: req.headers['user-agent'],
      userId,
    },
  });

  setSessionCookie(res, token);
}

async function getSessionUser(req: Request) {
  const token = getCookie(req, SESSION_COOKIE);
  if (!token) return null;

  const session = await prisma.session.findUnique({
    include: { user: true },
    where: { token },
  });

  if (!session) return null;

  if (session.expiresAt.getTime() <= Date.now()) {
    await prisma.session.delete({ where: { token } }).catch(() => undefined);
    return null;
  }

  return { session, user: session.user };
}

router.post('/signup', async (req, res, next) => {
  try {
    const email = String(req.body?.email || '').trim().toLowerCase();
    const username = String(req.body?.username || '').trim();
    const password = String(req.body?.password || '');

    if (!email || !username || !password) {
      return res.status(400).json({ error: 'Username, email, and password are required.' });
    }

    if (!emailPattern.test(email)) {
      return res.status(400).json({ error: 'Enter a valid email address.' });
    }

    if (!usernamePattern.test(username)) {
      return res.status(400).json({ error: 'Username can only use letters, numbers, and underscores.' });
    }

    if (password.length < 8) {
      return res.status(400).json({ error: 'Password must be at least 8 characters.' });
    }

    const existingUser = await prisma.user.findFirst({
      select: { email: true, username: true },
      where: { OR: [{ email }, { username }] },
    });

    if (existingUser?.email === email) {
      return res.status(409).json({ error: 'An account with this email already exists.' });
    }

    if (existingUser?.username === username) {
      return res.status(409).json({ error: 'This username is already taken.' });
    }

    const user = await prisma.user.create({
      data: {
        email,
        password: hashPassword(password),
        username,
        fullName: username,
        editorLanguage: 'JavaScript',
      },
      select: editableUserSelect,
    });

    await createSession(req, res, user.id);
    return res.status(201).json({ user: toPublicUser(user) });
  } catch (error) {
    next(error);
  }
});

router.post('/login', async (req, res, next) => {
  try {
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : undefined;
    const username = typeof req.body?.username === 'string' ? req.body.username.trim() : undefined;
    const password = String(req.body?.password || '');

    if ((!email && !username) || !password) {
      return res.status(400).json({ error: 'Username/email and password are required.' });
    }

    const user = await prisma.user.findFirst({
      where: email ? { email } : { username },
    });

    if (!user || !verifyPassword(password, user.password)) {
      return res.status(401).json({ error: 'Invalid username/email or password.' });
    }

    await createSession(req, res, user.id);
    return res.status(200).json({ user: toPublicUser(user) });
  } catch (error) {
    next(error);
  }
});

router.get('/session', async (req, res, next) => {
  try {
    const sessionUser = await getSessionUser(req);
    return res.status(200).json({ user: sessionUser ? toPublicUser(sessionUser.user) : null });
  } catch (error) {
    next(error);
  }
});

router.patch('/profile', async (req, res, next) => {
  try {
    const sessionUser = await getSessionUser(req);
    if (!sessionUser) {
      return res.status(401).json({ error: 'Sign in to edit your profile.' });
    }

    const email = req.body?.email === undefined ? undefined : String(req.body.email || '').trim().toLowerCase();
    const username = req.body?.username === undefined ? undefined : String(req.body.username || '').trim();
    const fullName = optionalText(req.body?.fullName);
    const bio = optionalText(req.body?.bio, MAX_BIO_LENGTH);
    const role = optionalText(req.body?.role);
    const gender = optionalText(req.body?.gender);
    const dateOfBirth = optionalText(req.body?.dateOfBirth, 10);
    const language = optionalText(req.body?.language);
    const editorLanguage = optionalText(req.body?.editorLanguage);
    const image = optionalText(req.body?.image, MAX_IMAGE_LENGTH);

    if (email !== undefined && !emailPattern.test(email)) {
      return res.status(400).json({ error: 'Enter a valid email address.' });
    }

    if (username !== undefined && !usernamePattern.test(username)) {
      return res.status(400).json({ error: 'Username can only use letters, numbers, and underscores.' });
    }

    if (username !== undefined && username.length < 2) {
      return res.status(400).json({ error: 'Username must be at least 2 characters.' });
    }

    if (gender !== undefined && gender !== null && !genders.has(gender)) {
      return res.status(400).json({ error: 'Select a valid gender option.' });
    }

    if (editorLanguage !== undefined && editorLanguage !== null && !editorLanguages.has(editorLanguage)) {
      return res.status(400).json({ error: 'Select a valid editor language.' });
    }

    if (dateOfBirth !== undefined && dateOfBirth !== null && !isValidDateOfBirth(dateOfBirth)) {
      return res.status(400).json({ error: 'Date of birth must use dd-mm-yyyy format.' });
    }

    if (email !== undefined || username !== undefined) {
      const existingUser = await prisma.user.findFirst({
        select: { id: true, email: true, username: true },
        where: {
          OR: [
            ...(email !== undefined ? [{ email }] : []),
            ...(username !== undefined ? [{ username }] : []),
          ],
          NOT: { id: sessionUser.user.id },
        },
      });

      if (existingUser?.email === email) {
        return res.status(409).json({ error: 'An account with this email already exists.' });
      }

      if (existingUser?.username === username) {
        return res.status(409).json({ error: 'This username is already taken.' });
      }
    }

    const user = await prisma.user.update({
      data: {
        ...(email !== undefined ? { email } : {}),
        ...(username !== undefined ? { username } : {}),
        ...(fullName !== undefined ? { fullName } : {}),
        ...(bio !== undefined ? { bio } : {}),
        ...(role !== undefined ? { role } : {}),
        ...(gender !== undefined ? { gender } : {}),
        ...(dateOfBirth !== undefined ? { dateOfBirth } : {}),
        ...(language !== undefined ? { language } : {}),
        ...(editorLanguage !== undefined ? { editorLanguage } : {}),
        ...(image !== undefined ? { image } : {}),
      },
      select: editableUserSelect,
      where: { id: sessionUser.user.id },
    });

    return res.status(200).json({ user: toPublicUser(user) });
  } catch (error) {
    next(error);
  }
});

router.post('/logout', async (req, res, next) => {
  try {
    const token = getCookie(req, SESSION_COOKIE);
    if (token) {
      await prisma.session.delete({ where: { token } }).catch(() => undefined);
    }

    clearSessionCookie(res);
    return res.status(200).json({ ok: true });
  } catch (error) {
    next(error);
  }
});

export default router;