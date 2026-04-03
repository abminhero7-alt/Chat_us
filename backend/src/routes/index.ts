import { Router } from 'express';
import multer from 'multer';
import * as authController from '../controllers/authController.js';
import * as oauthController from '../controllers/oauthController.js';
import * as userController from '../controllers/userController.js';
import * as chatController from '../controllers/chatController.js';
import * as messageController from '../controllers/messageController.js';
import * as statusController from '../controllers/statusController.js';
import * as uploadController from '../controllers/uploadController.js';
import * as callController from '../controllers/callController.js';
import { authenticate } from '../middleware/auth.js';
import { authRateLimiter, generalRateLimiter } from '../middleware/rateLimiter.js';

const router = Router();
const upload = multer({ dest: 'uploads/' });

// API root - health check
router.get('/', (req, res) => {
  res.json({ success: true, message: 'Chat API is running', version: '1.0.0' });
});

// Auth routes
router.post('/auth/register', authRateLimiter, authController.register);
router.post('/auth/login', authRateLimiter, authController.login);
router.post('/auth/verify-2fa', authController.verify2FA);
router.post('/auth/refresh-token', authController.refreshToken);
router.post('/auth/logout', authController.logout);
router.post('/auth/forgot-password', authController.forgotPassword);
router.post('/auth/reset-password', authController.resetPassword);
router.get('/auth/google', oauthController.googleAuthRedirect);
router.get('/auth/google/callback', oauthController.googleCallback);
router.get('/auth/facebook', oauthController.facebookAuthRedirect);
router.get('/auth/facebook/callback', oauthController.facebookCallback);

// User routes
router.get('/users/me', authenticate, userController.getProfile);
router.put('/users/me', authenticate, userController.updateProfile);
router.post('/users/me/avatar', authenticate, upload.single('avatar'), userController.uploadAvatar);
router.get('/users/search', authenticate, userController.searchUsers);
router.get('/users/contacts', authenticate, userController.getContacts);
router.post('/users/contacts', authenticate, userController.addContact);
router.post('/users/block', authenticate, userController.blockUser);
router.post('/users/unblock', authenticate, userController.unblockUser);

// Chat routes
router.get('/chats', authenticate, chatController.getChats);
router.get('/chats/:id', authenticate, chatController.getChat);
router.post('/chats', authenticate, chatController.createChat);
router.put('/chats/:id', authenticate, chatController.updateChat);
router.delete('/chats/:id', authenticate, chatController.deleteChat);
router.post('/chats/:id/participants', authenticate, chatController.addParticipant);
router.delete('/chats/:id/participants', authenticate, chatController.removeParticipant);
router.post('/chats/:id/pin', authenticate, chatController.pinChat);
router.delete('/chats/:id/pin', authenticate, chatController.unpinChat);
router.post('/chats/:id/archive', authenticate, chatController.archiveChat);
router.delete('/chats/:id/archive', authenticate, chatController.unarchiveChat);
router.post('/chats/:id/mute', authenticate, chatController.muteChat);
router.delete('/chats/:id/mute', authenticate, chatController.unmuteChat);

// Message routes
router.get('/chats/:chatId/messages', authenticate, messageController.getMessages);
router.get('/chats/:chatId/messages/search', authenticate, messageController.searchMessages);
router.post('/messages/star', authenticate, messageController.starMessage);
router.delete('/messages/star', authenticate, messageController.unstarMessage);
router.get('/chats/:chatId/messages/starred', authenticate, messageController.getStarredMessages);
router.post('/messages/forward', authenticate, messageController.forwardMessage);

// Status routes
router.get('/statuses', authenticate, statusController.getStatuses);
router.get('/statuses/me', authenticate, statusController.getMyStatuses);
router.post('/statuses', authenticate, statusController.createStatus);
router.delete('/statuses/:id', authenticate, statusController.deleteStatus);
router.post('/statuses/:id/view', authenticate, statusController.viewStatus);

// Upload routes
router.post('/upload', authenticate, upload.single('file'), uploadController.uploadFile);
router.delete('/upload', authenticate, uploadController.deleteFile);

// Call routes
router.get('/calls', authenticate, callController.getCalls);
router.get('/calls/:id', authenticate, callController.getCall);
router.put('/calls/:id/end', authenticate, callController.endCall);
router.get('/calls/history', authenticate, callController.getCallHistory);

export default router;
