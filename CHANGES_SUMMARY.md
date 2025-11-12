# Database Schema Updates - Summary

## Changes Implemented

### 1. ✅ Added `image_url` to Users Table

**File: `backend/src/init/initDatabase.js`**

- Added `image_url VARCHAR(500)` column to users table schema
- Added migration logic to handle existing databases (ALTER TABLE with error handling)
- Users can now have profile images

### 2. ✅ Updated Authentication Routes

**File: `backend/src/routes/auth.js`**

- **POST /api/auth/register**: Now accepts optional `image_url` parameter
- **POST /api/auth/login**: Returns `image_url` in user object
- **GET /api/auth/me**: Returns `image_url` in user profile
- **PUT /api/auth/update-profile**: Now allows updating `image_url` (dynamic query builder)
- All user queries now include `image_url` field

### 3. ✅ Updated Authentication Middleware

**File: `backend/src/middleware/auth.js`**

- Updated `authenticateToken` to include `image_url` in user queries
- Updated `optionalAuth` to include `image_url` in user queries
- User object in `req.user` now contains `image_url`

### 4. ✅ Enhanced Post-User Relationship

**File: `backend/src/routes/api.js`**

- **GET /api/posts**: Now uses LEFT JOIN with users table to fetch author details
  - Returns: `author` (username), `author_image_url`, `user_id`
- **GET /api/posts/:id**: Same JOIN implementation for single post
- **POST /api/posts**: Already correctly uses `user_id` from authenticated user
- **PUT /api/posts/:id/like**: Returns post with author details from users table
- All post responses now include author information from the users table

### 5. ✅ Updated Post Generator

**File: `backend/src/jobs/postGenerator.js`**

- Modified to fetch random users from database instead of using hardcoded names
- Generated posts now properly link to real users via `user_id`
- Falls back to hardcoded names if no users exist in database
- Post retrieval uses JOIN to include author details

## Database Schema

### Users Table

```sql
CREATE TABLE users (
  id INT PRIMARY KEY AUTO_INCREMENT,
  username VARCHAR(255) NOT NULL UNIQUE,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  image_url VARCHAR(500),              -- ✨ NEW FIELD
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
)
```

### Posts Table (Already had the relationship)

```sql
CREATE TABLE posts (
  id INT PRIMARY KEY AUTO_INCREMENT,
  author VARCHAR(255) NOT NULL,        -- Kept for backward compatibility
  image_url VARCHAR(500),
  content TEXT NOT NULL,
  likes INT DEFAULT 0,
  user_id INT,                         -- ✨ FOREIGN KEY to users
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
)
```

## API Response Changes

### User Object (Auth endpoints)

```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "image_url": "https://example.com/avatar.jpg", // ✨ NEW
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

### Post Object (API endpoints)

```json
{
  "id": 1,
  "author": "john_doe",                           // From users table
  "author_image_url": "https://example.com/avatar.jpg",  // ✨ NEW
  "user_id": 1,                                   // ✨ EXPOSED
  "image_url": "https://example.com/post.jpg",
  "content": "Post content...",
  "likes": 42,
  "created_at": "2024-01-01T00:00:00.000Z",
  "comments": [...]
}
```

## Testing Recommendations

1. **Test User Registration with image_url**

   ```bash
   curl -X POST http://localhost:3001/api/auth/register \
     -H "Content-Type: application/json" \
     -d '{
       "username": "testuser",
       "email": "test@example.com",
       "password": "password123",
       "image_url": "https://i.pravatar.cc/150?img=1"
     }'
   ```

2. **Test Profile Update with image_url**

   ```bash
   curl -X PUT http://localhost:3001/api/auth/update-profile \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "image_url": "https://i.pravatar.cc/150?img=2"
     }'
   ```

3. **Test Post Creation** (should automatically link to authenticated user)

   ```bash
   curl -X POST http://localhost:3001/api/posts \
     -H "Content-Type: application/json" \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -d '{
       "content": "My first post!",
       "image_url": "https://picsum.photos/400/300"
     }'
   ```

4. **Test Post Retrieval** (should include author details)

   ```bash
   curl http://localhost:3001/api/posts
   ```

5. **Test Post Generator** (should use real users)
   ```bash
   curl -X POST http://localhost:3001/api/posts/generate \
     -H "Content-Type: application/json" \
     -d '{"count": 5}'
   ```

## Migration Notes

- The database migration is handled automatically on server startup
- Existing users will have `image_url` set to NULL
- Existing posts already have `user_id` field (was already in schema)
- No data loss will occur during migration
- The `author` field in posts is kept for backward compatibility

## Next Steps (Optional Enhancements)

1. Add user relationship to comments table
2. Remove redundant `author` field from posts (use only user_id)
3. Add cascade delete for user posts
4. Add user profile endpoint to fetch user's posts
5. Add image upload functionality for user avatars
