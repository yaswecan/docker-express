const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Social Media API",
      version: "1.0.0",
      description: "Social Media API",
      contact: {
        name: "API Support",
        email: "eden@schooll.com",
      },
    },
    servers: [
      {
        url: "http://localhost:3000",
        description: "Development server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
          description: "Enter your JWT token in the format: Bearer <token>",
        },
      },
      schemas: {
        User: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              description: "User ID",
              example: 1,
            },
            username: {
              type: "string",
              description: "Username",
              example: "john_doe",
            },
            email: {
              type: "string",
              format: "email",
              description: "User email",
              example: "john@example.com",
            },
            image_url: {
              type: "string",
              nullable: true,
              description: "User profile image URL",
              example: "https://example.com/avatar.jpg",
            },
            created_at: {
              type: "string",
              format: "date-time",
              description: "Account creation timestamp",
            },
          },
        },
        Post: {
          type: "object",
          properties: {
            id: {
              type: "integer",
              description: "Post ID",
              example: 1,
            },
            author: {
              type: "string",
              description: "Post author username",
              example: "john_doe",
            },
            author_image_url: {
              type: "string",
              nullable: true,
              description: "Author profile image URL",
              example: "https://example.com/avatar.jpg",
            },
            user_id: {
              type: "integer",
              description: "Author user ID",
              example: 1,
            },
            image_url: {
              type: "string",
              nullable: true,
              description: "Post image URL",
              example: "https://example.com/post-image.jpg",
            },
            content: {
              type: "string",
              description: "Post content",
              example: "This is my first post!",
            },
            likes: {
              type: "integer",
              description: "Number of likes",
              example: 42,
            },
            created_at: {
              type: "string",
              format: "date-time",
              description: "Post creation timestamp",
            },
            comments: {
              type: "array",
              items: {
                $ref: "#/components/schemas/Comment",
              },
            },
          },
        },
        Comment: {
          type: "object",
          properties: {
            comment: {
              type: "string",
              description: "Comment text",
              example: "Great post!",
            },
            user: {
              type: "string",
              description: "Commenter username",
              example: "jane_doe",
            },
            user_id: {
              type: "integer",
              description: "Commenter user ID",
              example: 2,
            },
            user_image_url: {
              type: "string",
              nullable: true,
              description: "Commenter profile image URL",
              example: "https://example.com/avatar2.jpg",
            },
            created_at: {
              type: "string",
              format: "date-time",
              description: "Comment creation timestamp",
            },
          },
        },
        Error: {
          type: "object",
          properties: {
            error: {
              type: "string",
              description: "Error type",
              example: "Validation Error",
            },
            message: {
              type: "string",
              description: "Error message",
              example: "Invalid input data",
            },
          },
        },
        RegisterRequest: {
          type: "object",
          required: ["username", "email", "password"],
          properties: {
            username: {
              type: "string",
              description: "Desired username",
              example: "john_doe",
            },
            email: {
              type: "string",
              format: "email",
              description: "User email address",
              example: "john@example.com",
            },
            password: {
              type: "string",
              format: "password",
              minLength: 6,
              description: "User password (minimum 6 characters)",
              example: "password123",
            },
            image_url: {
              type: "string",
              nullable: true,
              description: "Optional profile image URL",
              example: "https://example.com/avatar.jpg",
            },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: {
              type: "string",
              format: "email",
              description: "User email address",
              example: "john@example.com",
            },
            password: {
              type: "string",
              format: "password",
              description: "User password",
              example: "password123",
            },
          },
        },
        AuthResponse: {
          type: "object",
          properties: {
            message: {
              type: "string",
              example: "Login successful",
            },
            token: {
              type: "string",
              description: "JWT authentication token",
              example: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
            },
            user: {
              $ref: "#/components/schemas/User",
            },
          },
        },
        UpdateProfileRequest: {
          type: "object",
          properties: {
            username: {
              type: "string",
              description: "New username",
              example: "john_doe_updated",
            },
            image_url: {
              type: "string",
              nullable: true,
              description: "New profile image URL",
              example: "https://example.com/new-avatar.jpg",
            },
          },
        },
        ChangePasswordRequest: {
          type: "object",
          required: ["currentPassword", "newPassword"],
          properties: {
            currentPassword: {
              type: "string",
              format: "password",
              description: "Current password",
              example: "oldpassword123",
            },
            newPassword: {
              type: "string",
              format: "password",
              minLength: 6,
              description: "New password (minimum 6 characters)",
              example: "newpassword123",
            },
          },
        },
        CreatePostRequest: {
          type: "object",
          required: ["content"],
          properties: {
            content: {
              type: "string",
              description: "Post content",
              example: "This is my new post!",
            },
            image_url: {
              type: "string",
              nullable: true,
              description: "Optional post image URL",
              example: "https://example.com/post-image.jpg",
            },
          },
        },
        CreateCommentRequest: {
          type: "object",
          required: ["comment"],
          properties: {
            comment: {
              type: "string",
              description: "Comment text",
              example: "Great post!",
            },
          },
        },
        GeneratePostsRequest: {
          type: "object",
          properties: {
            count: {
              type: "integer",
              minimum: 1,
              maximum: 100,
              description: "Number of posts to generate (1-100)",
              example: 10,
            },
          },
        },
      },
    },
    security: [
      {
        bearerAuth: [],
      },
    ],
  },
  apis: ["./src/routes/*.js"], // Path to the API routes
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
