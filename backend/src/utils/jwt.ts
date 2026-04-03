import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || '';
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || '';

export const generateToken = (userId: string, email?: string): string => {
  return jwt.sign({ userId, email }, JWT_SECRET, {
    expiresIn: (process.env.JWT_EXPIRES_IN as jwt.SignOptions['expiresIn']) || '7d',
  });
};

export const generateRefreshToken = (userId: string): string => {
  return jwt.sign({ userId }, JWT_REFRESH_SECRET, {
    expiresIn: (process.env.REFRESH_TOKEN_EXPIRES_IN as jwt.SignOptions['expiresIn']) || '30d',
  });
};

export const verifyToken = (token: string): { userId: string; email?: string } | null => {
  try {
    return jwt.verify(token, JWT_SECRET) as { userId: string; email?: string };
  } catch {
    return null;
  }
};

export const verifyRefreshToken = (token: string): { userId: string } | null => {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET) as { userId: string };
  } catch {
    return null;
  }
};

export const generate2FASecret = (): { secret: string; otpauthUrl: string } => {
  const secret = jwt.sign({ t: Date.now() }, JWT_SECRET, { expiresIn: '1m' });
  return {
    secret,
    otpauthUrl: `otpauth://totp/Chat%20US?secret=${secret}&issuer=Chat%20US`,
  };
};

export const verify2FAToken = (token: string, secret: string): boolean => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    return Date.now() - decoded.t < 60000;
  } catch {
    return false;
  }
};
