import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { randomUUID } from 'crypto';
import pool from './db';

export interface Admin {
  id: string;
  username: string;
  lastLogin?: Date;
}

const JWT_SECRET = (process.env.JWT_SECRET || '').trim();

export function generateToken(adminId: string): string {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return jwt.sign({ adminId }, JWT_SECRET, { expiresIn: '7d' });
}

export async function verifyToken(token: string): Promise<{ adminId: string }> {
  if (!JWT_SECRET) {
    throw new Error('JWT_SECRET is not defined in environment variables');
  }
  return jwt.verify(token, JWT_SECRET) as { adminId: string };
}

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcrypt.genSalt(12);
  return bcrypt.hash(password, salt);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function findAdminByUsername(username: string): Promise<Admin | null> {
  const [rows] = await pool.execute(
    'SELECT id, username, lastLogin FROM admins WHERE username = ?',
    [username.toLowerCase()]
  ) as any[];

  if (rows.length === 0) {
    return null;
  }

  return {
    id: rows[0].id,
    username: rows[0].username,
    lastLogin: rows[0].lastLogin,
  };
}

export async function findAdminById(id: string): Promise<Admin | null> {
  const [rows] = await pool.execute(
    'SELECT id, username, lastLogin FROM admins WHERE id = ?',
    [id]
  ) as any[];

  if (rows.length === 0) {
    return null;
  }

  return {
    id: rows[0].id,
    username: rows[0].username,
    lastLogin: rows[0].lastLogin,
  };
}

export async function getAdminPasswordHash(username: string): Promise<string | null> {
  const [rows] = await pool.execute(
    'SELECT password FROM admins WHERE username = ?',
    [username.toLowerCase()]
  ) as any[];

  if (rows.length === 0) {
    return null;
  }

  return rows[0].password;
}

export async function createAdmin(username: string, password: string): Promise<Admin> {
  const id = randomUUID();
  const hashedPassword = await hashPassword(password);

  await pool.execute(
    'INSERT INTO admins (id, username, password) VALUES (?, ?, ?)',
    [id, username.toLowerCase(), hashedPassword]
  );

  return {
    id,
    username: username.toLowerCase(),
  };
}

export async function updateLastLogin(adminId: string): Promise<void> {
  await pool.execute(
    'UPDATE admins SET lastLogin = NOW() WHERE id = ?',
    [adminId]
  );
}

export async function updateAdminPassword(username: string, newPassword: string): Promise<void> {
  const hashedPassword = await hashPassword(newPassword);
  await pool.execute(
    'UPDATE admins SET password = ? WHERE username = ?',
    [hashedPassword, username.toLowerCase()]
  );
}

export async function deleteAdmin(username: string): Promise<void> {
  await pool.execute(
    'DELETE FROM admins WHERE username = ?',
    [username.toLowerCase()]
  );
}

