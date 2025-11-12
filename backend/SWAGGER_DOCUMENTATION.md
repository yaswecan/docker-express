# Swagger API Documentation

## Overview

This backend API now includes comprehensive Swagger/OpenAPI documentation that provides an interactive interface to explore and test all available endpoints.

**Note**: This API also includes **WebSocket support** via Socket.IO for real-time updates. When a new post is created, all connected clients receive an instant notification through the `newPost` event. See [WEBSOCKET_DOCUMENTATION.md](./WEBSOCKET_DOCUMENTATION.md) for details.

## Accessing Swagger UI

Once the backend server is running, you can access the Swagger documentation at:

```
http://localhost:3000/api-docs
```

## Features

### Interactive API Testing

- **Try it out**: Test API endpoints directly from the browser
- **Request/Response Examples**: View sample requests and responses for each endpoint
- **Schema Validation**: See detailed schema definitions for all data models
- **Authentication**: Test protected endpoints with JWT tokens

### Real-Time Features

The API uses **Socket.IO** for real-time communication:

- **Event**: `newPost` - Emitted when a new post is created via `POST /api/posts`
- **Connection**: `http://localhost:3000`
- **Documentation**: See [WEBSOCKET_DOCUMENTATION.md](./WEBSOCKET_DOCUMENTATION.md)

### Available Endpoints

#### Authentication Endpoints (`/api/auth`)

1. **POST /api/auth/register** - Register a new user
2. **POST /api/auth/login** - Login and receive JWT token
3. **GET /api/auth/me** - Get current user profile (protected)
4. **POST /api/auth/logout** - Logout user (protected)
5. **PUT /api/auth/update-profile** - Update user profile (protected)
6. **PUT /api/auth/change-password** - Change password (protected)

#### Posts Endpoints (`/api`)

1. **GET /api/posts** - Get all posts with comments
2. **GET /api/posts/:id** - Get a specific post
3. **POST /api/posts** - Create a new post (protected)
4. **POST /api/posts/:id/comments** - Add a comment to a post (protected)
5. **PUT /api/posts/:id/like** - Like a post (protected)
6. **POST /api/posts/generate** - Generate posts manually

## Using Authentication in Swagger

### Step 1: Register or Login

1. Navigate to the **Authentication** section in Swagger UI
2. Use the **POST /api/auth/register** endpoint to create a new account, or
3. Use the **POST /api/auth/login** endpoint with existing credentials

### Step 2: Copy the JWT Token

After successful login/registration, copy the `token` value from the response:

```json
{
  "message": "Login successful",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": { ... }
}
```

### Step 3: Authorize in Swagger

1. Click the **"Authorize"** button at the top of the Swagger UI (or the lock icon next to protected endpoints)
2. In the dialog that appears, enter: `Bearer <your-token>`
   - Example: `Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...`
3. Click **"Authorize"**
4. Click **"Close"**

### Step 4: Test Protected Endpoints

Now you can test any protected endpoint (marked with a lock icon) and the JWT token will be automatically included in the request headers.

## Example Workflows

### Creating a Post

1. **Authenticate** using the steps above
2. Navigate to **POST /api/posts**
3. Click **"Try it out"**
4. Enter the request body:
   ```json
   {
     "content": "This is my first post!",
     "image_url": "https://example.com/image.jpg"
   }
   ```
5. Click **"Execute"**
6. View the response with the newly created post

### Adding a Comment

1. **Authenticate** (if not already authenticated)
2. Navigate to **POST /api/posts/{id}/comments**
3. Click **"Try it out"**
4. Enter the post ID in the path parameter
5. Enter the request body:
   ```json
   {
     "comment": "Great post!"
   }
   ```
6. Click **"Execute"**

### Liking a Post

1. **Authenticate** (if not already authenticated)
2. Navigate to **PUT /api/posts/{id}/like**
3. Click **"Try it out"**
4. Enter the post ID in the path parameter
5. Click **"Execute"**

## Data Models

### User Schema

```json
{
  "id": 1,
  "username": "john_doe",
  "email": "john@example.com",
  "image_url": "https://example.com/avatar.jpg",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

### Post Schema

```json
{
  "id": 1,
  "author": "john_doe",
  "author_image_url": "https://example.com/avatar.jpg",
  "user_id": 1,
  "image_url": "https://example.com/post-image.jpg",
  "content": "This is my first post!",
  "likes": 42,
  "created_at": "2024-01-01T00:00:00.000Z",
  "comments": [...]
}
```

### Comment Schema

```json
{
  "comment": "Great post!",
  "user": "jane_doe",
  "user_id": 2,
  "user_image_url": "https://example.com/avatar2.jpg",
  "created_at": "2024-01-01T00:00:00.000Z"
}
```

## Response Codes

- **200 OK**: Request successful
- **201 Created**: Resource created successfully
- **400 Bad Request**: Invalid request data
- **401 Unauthorized**: Missing or invalid authentication token
- **404 Not Found**: Resource not found
- **409 Conflict**: Resource already exists (e.g., duplicate email)
- **500 Internal Server Error**: Server error

## Additional Features

### OpenAPI JSON Specification

You can also access the raw OpenAPI specification in JSON format at:

```
http://localhost:3000/api-docs.json
```

This can be used with other API tools like Postman, Insomnia, or for generating client SDKs.

### Swagger Configuration

The Swagger configuration is located in:

```
backend/src/config/swagger.js
```

You can customize:

- API information (title, description, version)
- Server URLs
- Security schemes
- Component schemas

## Testing Tips

1. **Start with Authentication**: Always test login/register first to get a valid token
2. **Use the Authorize Button**: This is easier than manually adding the Bearer token to each request
3. **Check Response Schemas**: Review the response schemas to understand the data structure
4. **Test Error Cases**: Try invalid inputs to see error responses
5. **Generate Test Data**: Use the `/api/posts/generate` endpoint to create sample posts

## Troubleshooting

### "Unauthorized" Errors

- Make sure you've clicked the "Authorize" button and entered a valid token
- Check that your token hasn't expired (default expiration is 24 hours)
- Ensure you're using the format: `Bearer <token>`

### "404 Not Found" on Swagger UI

- Verify the backend server is running on port 3000
- Check that you're accessing `http://localhost:3000/api-docs` (not `/api-docs/`)

### Changes Not Reflected

- Restart the backend server after making changes to route files
- Clear your browser cache if Swagger UI doesn't update

## Development

### Adding New Endpoints

When adding new endpoints to the API:

1. Add JSDoc comments with Swagger annotations above the route handler
2. Follow the existing pattern in `auth.js` or `api.js`
3. Define any new schemas in `swagger.js` under `components.schemas`
4. Restart the server to see changes in Swagger UI

Example:

```javascript
/**
 * @swagger
 * /api/example:
 *   get:
 *     summary: Example endpoint
 *     description: Description of what this endpoint does
 *     tags: [Example]
 *     responses:
 *       200:
 *         description: Success response
 */
router.get("/example", (req, res) => {
  // Handler code
});
```

## WebSocket Integration

When you create a post using `POST /api/posts`, the server:

1. Creates the post in the database
2. Returns the post in the HTTP response (201 Created)
3. **Emits a `newPost` event via Socket.IO** to all connected clients

This allows real-time updates without polling. See [WEBSOCKET_DOCUMENTATION.md](./WEBSOCKET_DOCUMENTATION.md) for:

- Connection setup
- Event listeners
- Client implementation examples (React, Vanilla JS)
- Testing WebSocket events

## Resources

- [Swagger/OpenAPI Specification](https://swagger.io/specification/)
- [swagger-jsdoc Documentation](https://github.com/Surnet/swagger-jsdoc)
- [swagger-ui-express Documentation](https://github.com/scottie1984/swagger-ui-express)
- [Socket.IO Documentation](https://socket.io/docs/v4/)
- [WebSocket Documentation](./WEBSOCKET_DOCUMENTATION.md)

## Support

For issues or questions about the API documentation:

1. Check this documentation first
2. Review the Swagger UI interface for endpoint details
3. Consult the main README.md for general API information
4. Check the AUTH_API_DOCUMENTATION.md for authentication details
