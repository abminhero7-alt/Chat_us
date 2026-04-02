import { Request, Response } from 'express';
import prisma from '../config/database.js';
import { generateToken, generateRefreshToken } from '../utils/jwt.js';

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID || '';
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET || '';
const FACEBOOK_APP_ID = process.env.FACEBOOK_APP_ID || '';
const FACEBOOK_APP_SECRET = process.env.FACEBOOK_APP_SECRET || '';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';
const API_URL = process.env.API_URL || 'http://localhost:3001';

interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture: string;
  verified_email: boolean;
}

interface FacebookUser {
  id: string;
  name: string;
  email: string;
  picture: { data: { url: string } };
}

export const googleAuthRedirect = (_req: Request, res: Response) => {
  if (!GOOGLE_CLIENT_ID) {
    return res.status(503).json({ success: false, error: 'Google OAuth not configured. Set GOOGLE_CLIENT_ID in .env' });
  }
  const redirectUri = `${API_URL}/api/auth/google/callback`;
  const googleUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=email%20profile&access_type=offline&prompt=select_account`;
  res.json({ success: true, url: googleUrl });
};

export const googleCallback = async (req: Request, res: Response) => {
  try {
    const code = req.query.code as string;
    if (!code) return res.redirect(`${FRONTEND_URL}/auth/login?error=google_failed`);

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: `${API_URL}/api/auth/google/callback`,
        grant_type: 'authorization_code',
      }),
    });

    const tokenData: any = await tokenRes.json();
    if (!tokenData.access_token) {
      return res.redirect(`${FRONTEND_URL}/auth/login?error=google_failed`);
    }

    const userRes = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    const googleUser: GoogleUser = await userRes.json();

    let user = await prisma.user.findUnique({ where: { email: googleUser.email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: googleUser.email,
          displayName: googleUser.name,
          avatarUrl: googleUser.picture,
          isVerified: true,
        },
      });
    }

    const token = generateToken(user.id, user.email || undefined);
    const refreshToken = generateRefreshToken(user.id);

    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    });

    const userData = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      onlineStatus: user.onlineStatus,
      isVerified: user.isVerified,
      isTwoFactorEnabled: user.isTwoFactorEnabled,
    };

    res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}&refreshToken=${refreshToken}&user=${encodeURIComponent(JSON.stringify(userData))}`);
  } catch (err) {
    console.error('Google OAuth error:', err);
    res.redirect(`${FRONTEND_URL}/auth/login?error=google_failed`);
  }
};

export const facebookAuthRedirect = (_req: Request, res: Response) => {
  if (!FACEBOOK_APP_ID) {
    return res.status(503).json({ success: false, error: 'Facebook OAuth not configured. Set FACEBOOK_APP_ID in .env' });
  }
  const redirectUri = `${API_URL}/api/auth/facebook/callback`;
  const fbUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=email,public_profile`;
  res.json({ success: true, url: fbUrl });
};

export const facebookCallback = async (req: Request, res: Response) => {
  try {
    const code = req.query.code as string;
    if (!code) return res.redirect(`${FRONTEND_URL}/auth/login?error=facebook_failed`);

    const tokenRes = await fetch(`https://graph.facebook.com/v18.0/oauth/access_token?client_id=${FACEBOOK_APP_ID}&redirect_uri=${encodeURIComponent(`${API_URL}/api/auth/facebook/callback`)}&client_secret=${FACEBOOK_APP_SECRET}&code=${code}`);
    const tokenData: any = await tokenRes.json();
    if (!tokenData.access_token) {
      return res.redirect(`${FRONTEND_URL}/auth/login?error=facebook_failed`);
    }

    const userRes = await fetch(`https://graph.facebook.com/me?fields=id,name,email,picture&access_token=${tokenData.access_token}`);
    const fbUser: FacebookUser = await userRes.json();

    let user = await prisma.user.findUnique({ where: { email: fbUser.email } });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email: fbUser.email,
          displayName: fbUser.name,
          avatarUrl: fbUser.picture?.data?.url,
          isVerified: true,
        },
      });
    }

    const token = generateToken(user.id, user.email || undefined);
    const refreshToken = generateRefreshToken(user.id);

    await prisma.refreshToken.create({
      data: { token: refreshToken, userId: user.id, expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
    });

    const userData = {
      id: user.id,
      email: user.email,
      displayName: user.displayName,
      avatarUrl: user.avatarUrl,
      onlineStatus: user.onlineStatus,
      isVerified: user.isVerified,
      isTwoFactorEnabled: user.isTwoFactorEnabled,
    };

    res.redirect(`${FRONTEND_URL}/auth/callback?token=${token}&refreshToken=${refreshToken}&user=${encodeURIComponent(JSON.stringify(userData))}`);
  } catch (err) {
    console.error('Facebook OAuth error:', err);
    res.redirect(`${FRONTEND_URL}/auth/login?error=facebook_failed`);
  }
};
