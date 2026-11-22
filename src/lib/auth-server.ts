import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { NextRequest } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.ts';
import { users } from '../db/schema.ts';
import { adminAuth } from './firebase-admin.ts';

export type UserRole = 'CLINIC_OWNER' | 'DOCTOR' | 'RECEPTIONIST' | 'PATIENT';

export interface AuthUser {
  id: number;
  uid: string;
  email: string;
  fullNameAr: string;
  fullNameEn: string;
  phone: string | null;
  role: UserRole;
  clinicId: number | null;
  isDemo: boolean;
}

declare global {
  var _shifaflowSessionSecret: string | undefined;
}

function getSessionSecret(): string {
  if (process.env.SESSION_SECRET && process.env.SESSION_SECRET.length >= 16) {
    return process.env.SESSION_SECRET;
  }
  if (!global._shifaflowSessionSecret) {
    global._shifaflowSessionSecret = crypto.randomBytes(32).toString('hex');
  }
  return global._shifaflowSessionSecret;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

interface SessionPayload {
  uid: string;
  role: UserRole;
  exp: number;
}

export function createSessionToken(uid: string, role: UserRole): string {
  const payload: SessionPayload = {
    uid,
    role,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 7, // 7 days
  };
  const data = Buffer.from(JSON.stringify(payload)).toString('base64url');
  const sig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(data)
    .digest('base64url');
  return `sf.${data}.${sig}`;
}

export function verifySessionToken(token: string): SessionPayload | null {
  if (!token.startsWith('sf.')) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [, data, sig] = parts;
  const expectedSig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(data)
    .digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(data, 'base64url').toString('utf8')) as SessionPayload;
    if (!parsed.uid || !parsed.exp || parsed.exp < Date.now()) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function getUserByUid(uid: string): Promise<AuthUser | null> {
  try {
    const rows = await db
      .select({
        id: users.id,
        uid: users.uid,
        email: users.email,
        fullNameAr: users.fullNameAr,
        fullNameEn: users.fullNameEn,
        phone: users.phone,
        role: users.role,
        clinicId: users.clinicId,
        isDemo: users.isDemo,
      })
      .from(users)
      .where(eq(users.uid, uid))
      .limit(1);

    if (!rows[0]) return null;
    return {
      ...rows[0],
      role: rows[0].role as UserRole,
    };
  } catch (error) {
    console.error('Database query failed in getUserByUid:', error);
    throw new Error('Authentication lookup failed.', { cause: error });
  }
}

export async function upsertFirebaseUser(params: {
  uid: string;
  email: string;
  displayName?: string | null;
  preferredRole?: UserRole;
  defaultClinicId?: number | null;
}): Promise<AuthUser> {
  try {
    const existing = await getUserByUid(params.uid);
    if (existing) return existing;

    const existingByEmail = await db
      .select({
        id: users.id,
        uid: users.uid,
        email: users.email,
        fullNameAr: users.fullNameAr,
        fullNameEn: users.fullNameEn,
        phone: users.phone,
        role: users.role,
        clinicId: users.clinicId,
        isDemo: users.isDemo,
      })
      .from(users)
      .where(eq(users.email, params.email.toLowerCase()))
      .limit(1);

    if (existingByEmail[0]) {
      const updated = await db
        .update(users)
        .set({ uid: params.uid })
        .where(eq(users.id, existingByEmail[0].id))
        .returning({
          id: users.id,
          uid: users.uid,
          email: users.email,
          fullNameAr: users.fullNameAr,
          fullNameEn: users.fullNameEn,
          phone: users.phone,
          role: users.role,
          clinicId: users.clinicId,
          isDemo: users.isDemo,
        });
      return { ...updated[0], role: updated[0].role as UserRole };
    }

    const name = params.displayName?.trim() || params.email.split('@')[0];
    const assignedRole: UserRole = params.preferredRole || 'CLINIC_OWNER';

    const inserted = await db
      .insert(users)
      .values({
        uid: params.uid,
        email: params.email.toLowerCase(),
        fullNameAr: name,
        fullNameEn: name,
        role: assignedRole,
        clinicId: params.defaultClinicId ?? null,
        isDemo: false,
      })
      .onConflictDoUpdate({
        target: users.uid,
        set: { email: params.email.toLowerCase() },
      })
      .returning({
        id: users.id,
        uid: users.uid,
        email: users.email,
        fullNameAr: users.fullNameAr,
        fullNameEn: users.fullNameEn,
        phone: users.phone,
        role: users.role,
        clinicId: users.clinicId,
        isDemo: users.isDemo,
      });

    return {
      ...inserted[0],
      role: inserted[0].role as UserRole,
    };
  } catch (error) {
    console.error('Database query failed in upsertFirebaseUser:', error);
    throw new Error('Failed to sync user profile.', { cause: error });
  }
}

export async function authenticateRequest(req: NextRequest): Promise<AuthUser | null> {
  const authHeader = req.headers.get('authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.slice('Bearer '.length).trim();
  if (!token) return null;

  // 1. Check ShifaFlow HMAC session token
  if (token.startsWith('sf.')) {
    const payload = verifySessionToken(token);
    if (!payload) return null;
    return getUserByUid(payload.uid);
  }

  // 2. Verify Firebase ID token via Admin SDK
  try {
    const decoded = await adminAuth.verifyIdToken(token);
    if (!decoded.uid) return null;
    const existing = await getUserByUid(decoded.uid);
    if (existing) return existing;
    return upsertFirebaseUser({
      uid: decoded.uid,
      email: decoded.email || `${decoded.uid}@shifaflow.app`,
      displayName: decoded.name || null,
    });
  } catch {
    return null;
  }
}

export function hasRole(user: AuthUser | null, allowed: UserRole[]): boolean {
  if (!user) return false;
  return allowed.includes(user.role);
}
