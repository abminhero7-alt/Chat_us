# Chat US API Documentation

## Base URL
```
http://localhost:3001/api
```

## Authentication

All authenticated endpoints require a Bearer token in the Authorization header:
```
Authorization: Bearer <token>
```

---

## Auth Endpoints

### POST `/auth/register`
Register a new user account.

**Body:**
```json
{
  "email": "user@example.com",
  "phone": "+1234567890",
  "password": "SecurePass123!",
  "displayName": "John Doe"
}
```

**Response:** `201 Created`
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "email": "...", "displayName": "..." },
    "token": "jwt_token",
    "refreshToken": "refresh_token"
  }
}
```

### POST `/auth/login`
Login with email/phone and password.

**Body:**
```json
{
  "email": "user@example.com",
  "password": "SecurePass123!"
}
```

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "user": { "id": "...", "displayName": "..." },
    "token": "jwt_token",
    "refreshToken": "refresh_token",
    "requires2FA": false
  }
}
```

### POST `/auth/verify-2fa`
Verify two-factor authentication code.

**Body:**
```json
{
  "userId": "user_id",
  "code": "123456"
}
```

### POST `/auth/refresh-token`
Refresh an expired access token.

**Body:**
```json
{
  "refreshToken": "refresh_token"
}
```

### POST `/auth/logout`
Logout and invalidate refresh token.

**Body:**
```json
{
  "refreshToken": "refresh_token"
}
```

### POST `/auth/forgot-password`
Request password reset link.

**Body:**
```json
{
  "email": "user@example.com"
}
```

### POST `/auth/reset-password`
Reset password with token.

**Body:**
```json
{
  "token": "reset_token",
  "newPassword": "NewSecurePass123!"
}
```

---

## User Endpoints

### GET `/users/me`
Get current user profile.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "id": "...",
    "email": "user@example.com",
    "displayName": "John Doe",
    "avatarUrl": "https://...",
    "statusMessage": "Hey there!",
    "onlineStatus": "ONLINE",
    "theme": "light",
    "lastSeenPrivacy": "EVERYONE",
    "profilePhotoPrivacy": "EVERYONE"
  }
}
```

### PUT `/users/me`
Update user profile.

**Body:**
```json
{
  "displayName": "New Name",
  "statusMessage": "New status",
  "theme": "dark",
  "lastSeenPrivacy": "CONTACTS",
  "profilePhotoPrivacy": "CONTACTS",
  "statusPrivacy": "EVERYONE"
}
```

### POST `/users/me/avatar`
Upload profile avatar.

**Body:** `multipart/form-data`
- `avatar`: Image file (max 20MB)

### GET `/users/search?query=<string>`
Search users by name or email.

**Response:** `200 OK`
```json
{
  "success": true,
  "data": [
    { "id": "...", "displayName": "...", "avatarUrl": "...", "onlineStatus": "ONLINE" }
  ]
}
```

### GET `/users/contacts`
Get user's contacts list.

### POST `/users/contacts`
Add a contact.

**Body:**
```json
{
  "email": "contact@example.com"
}
```

### POST `/users/block`
Block a user.

**Body:**
```json
{
  "userId": "user_id_to_block"
}
```

### POST `/users/unblock`
Unblock a user.

**Body:**
```json
{
  "userId": "user_id_to_unblock"
}
```

---

## Chat Endpoints

### GET `/chats`
Get user's chat list.

**Query Parameters:**
- `page` (default: 1)
- `limit` (default: 20)
- `archived` (default: false)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "chats": [...],
    "total": 10,
    "hasMore": false
  }
}
```

### GET `/chats/:id`
Get chat details.

### POST `/chats`
Create a new chat.

**Body:**
```json
{
  "type": "PRIVATE",
  "participantIds": ["user_id_1", "user_id_2"]
}
```

For group chats:
```json
{
  "type": "GROUP",
  "name": "Dev Team",
  "description": "Team chat",
  "participantIds": ["user_id_1", "user_id_2"]
}
```

### PUT `/chats/:id`
Update chat (name, description, avatar).

### DELETE `/chats/:id`
Delete a chat.

### POST `/chats/:id/participants`
Add participants to a group.

**Body:**
```json
{
  "userIds": ["user_id_1", "user_id_2"]
}
```

### DELETE `/chats/:id/participants`
Remove a participant from a group.

**Body:**
```json
{
  "userId": "user_id"
}
```

### POST `/chats/:id/pin`
Pin a chat.

### DELETE `/chats/:id/pin`
Unpin a chat.

### POST `/chats/:id/archive`
Archive a chat.

### DELETE `/chats/:id/archive`
Unarchive a chat.

### POST `/chats/:id/mute`
Mute a chat.

**Body:**
```json
{
  "duration": 3600000
}
```

### DELETE `/chats/:id/mute`
Unmute a chat.

---

## Message Endpoints

### GET `/chats/:chatId/messages`
Get messages for a chat.

**Query Parameters:**
- `limit` (default: 50)
- `cursor` (for pagination)

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "messages": [
      {
        "id": "...",
        "chatId": "...",
        "senderId": "...",
        "sender": { "id": "...", "displayName": "...", "avatarUrl": "..." },
        "content": "Hello!",
        "type": "TEXT",
        "status": "READ",
        "isEdited": false,
        "isDeleted": false,
        "replyTo": null,
        "reactions": [],
        "createdAt": "2024-01-01T00:00:00.000Z",
        "readBy": ["user_id"],
        "deliveredTo": ["user_id"]
      }
    ],
    "hasMore": true,
    "cursor": "2024-01-01T00:00:00.000Z"
  }
}
```

### GET `/chats/:chatId/messages/search?query=<string>`
Search messages in a chat.

### POST `/messages/star`
Star a message.

**Body:**
```json
{
  "messageId": "message_id"
}
```

### DELETE `/messages/star`
Unstar a message.

**Body:**
```json
{
  "messageId": "message_id"
}
```

### GET `/chats/:chatId/messages/starred`
Get starred messages.

### POST `/messages/forward`
Forward a message.

**Body:**
```json
{
  "messageId": "message_id",
  "chatIds": ["chat_id_1", "chat_id_2"]
}
```

---

## Status Endpoints

### GET `/statuses`
Get contacts' active statuses.

### GET `/statuses/me`
Get my active statuses.

### POST `/statuses`
Create a new status.

**Body:**
```json
{
  "type": "TEXT",
  "content": "Having a great day!",
  "mediaUrl": "https://..."
}
```

### DELETE `/statuses/:id`
Delete a status.

### POST `/statuses/:id/view`
Mark a status as viewed.

---

## Upload Endpoints

### POST `/upload`
Upload a file.

**Body:** `multipart/form-data`
- `file`: File to upload
- `category`: `image`, `video`, `audio`, or `document`

**Response:** `200 OK`
```json
{
  "success": true,
  "data": {
    "url": "https://res.cloudinary.com/...",
    "thumbnailUrl": "https://...",
    "publicId": "...",
    "size": 123456,
    "mimetype": "image/jpeg"
  }
}
```

### DELETE `/upload`
Delete an uploaded file.

**Body:**
```json
{
  "publicId": "Chat US/image/abc123"
}
```

---

## Call Endpoints

### GET `/calls`
Get user's calls.

### GET `/calls/:id`
Get call details.

### PUT `/calls/:id/end`
End a call.

**Body:**
```json
{
  "duration": 120
}
```

### GET `/calls/history`
Get call history.

---

## WebSocket Events

Connect to WebSocket: `ws://localhost:3001`

### Client Events

| Event | Payload | Description |
|-------|---------|-------------|
| `message:send` | `{ chatId, content, type, mediaUrl, replyToId }` | Send a message |
| `message:edit` | `{ messageId, content }` | Edit a message |
| `message:delete` | `{ messageId, deleteForEveryone }` | Delete a message |
| `message:react` | `{ messageId, emoji }` | React to a message |
| `message:read` | `{ chatId }` | Mark messages as read |
| `typing:start` | `{ chatId }` | Start typing indicator |
| `typing:stop` | `{ chatId }` | Stop typing indicator |
| `call:initiate` | `{ receiverId, type, sdpOffer }` | Initiate a call |
| `call:signal` | `{ callId, targetUserId, type, data }` | WebRTC signaling |
| `call:accept` | `{ callId, sdpAnswer }` | Accept a call |
| `call:reject` | `{ callId }` | Reject a call |
| `call:end` | `{ callId }` | End a call |
| `status:view` | `statusId` | View a status |
| `presence:update` | `status` | Update online status |
| `chat:pin` | `chatId` | Pin a chat |
| `chat:archive` | `chatId` | Archive a chat |

### Server Events

| Event | Payload | Description |
|-------|---------|-------------|
| `message:new` | `Message` | New message received |
| `message:edited` | `Message` | Message was edited |
| `message:deleted` | `{ messageId, chatId }` | Message was deleted |
| `message:reacted` | `{ messageId, reaction }` | Reaction added/updated |
| `message:read` | `{ messageId, chatId, userId }` | Message was read |
| `message:delivered` | `{ messageId, chatId, userId }` | Message was delivered |
| `typing:user` | `{ chatId, userId, userName }` | User is typing |
| `call:incoming` | `{ callId, callerId, callerName, type }` | Incoming call |
| `call:signal` | `{ callId, type, data }` | WebRTC signaling data |
| `call:accepted` | `{ callId, sdpAnswer }` | Call was accepted |
| `call:rejected` | `{ callId }` | Call was rejected |
| `call:ended` | `{ callId, duration }` | Call ended |
| `presence:updated` | `{ userId, status, lastSeen }` | User presence changed |
| `chat:updated` | `{ id, ...updates }` | Chat was updated |
| `status:viewed` | `{ statusId, viewerId }` | Status was viewed |
| `error` | `string` | Error message |

---

## Error Responses

All errors follow this format:
```json
{
  "success": false,
  "error": "Error message"
}
```

### Common HTTP Status Codes
- `200` - Success
- `201` - Created
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `429` - Rate Limited
- `500` - Internal Server Error
