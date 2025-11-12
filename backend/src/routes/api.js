const express = require("express");
const router = express.Router();
const { pool } = require("../config/database");
const { generateMultiplePosts } = require("../jobs/postGenerator");
const { getIO } = require("../config/socket");
const { authenticateToken } = require("../middleware/auth");

/**
 * @swagger
 * /api/posts:
 *   get:
 *     summary: Get all posts
 *     description: Retrieve all posts with their comments (limited to 10 most recent posts)
 *     tags: [Posts]
 *     security: []
 *     responses:
 *       200:
 *         description: Posts retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 posts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Post'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/posts", async (req, res) => {
  try {
    // Récupérer tous les posts avec les informations de l'auteur
    const [posts] = await pool.query(
      `SELECT 
        p.id, 
        p.content, 
        p.image_url, 
        p.likes, 
        p.created_at,
        p.user_id,
        u.username as author,
        u.image_url as author_image_url
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      ORDER BY p.id DESC 
      LIMIT 10`
    );

    // Pour chaque post, récupérer ses commentaires
    const postsWithComments = await Promise.all(
      posts.map(async (post) => {
        const [comments] = await pool.query(
          `SELECT 
            c.comment, 
            c.created_at,
            c.user_id,
            u.username as user,
            u.image_url as user_image_url
          FROM comments c
          LEFT JOIN users u ON c.user_id = u.id
          WHERE c.post_id = ? 
          ORDER BY c.created_at DESC`,
          [post.id]
        );

        return {
          id: post.id,
          author: post.author,
          author_image_url: post.author_image_url,
          user_id: post.user_id,
          image_url: post.image_url,
          content: post.content,
          likes: post.likes,
          created_at: post.created_at,
          comments: comments,
        };
      })
    );

    res.json({ posts: postsWithComments });
  } catch (error) {
    console.error("Erreur lors de la récupération des posts:", error);
    res.status(500).json({
      error: "Erreur lors de la récupération des posts",
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/posts/{id}:
 *   get:
 *     summary: Get a specific post
 *     description: Retrieve a single post by ID with all its comments
 *     tags: [Posts]
 *     security: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Post ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Post retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 post:
 *                   $ref: '#/components/schemas/Post'
 *       404:
 *         description: Post not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get("/posts/:id", async (req, res) => {
  try {
    const postId = req.params.id;

    // Récupérer le post avec les informations de l'auteur
    const [posts] = await pool.query(
      `SELECT 
        p.id, 
        p.content, 
        p.image_url, 
        p.likes, 
        p.created_at,
        p.user_id,
        u.username as author,
        u.image_url as author_image_url
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = ?`,
      [postId]
    );

    if (posts.length === 0) {
      return res.status(404).json({ error: "Post non trouvé" });
    }

    // Récupérer les commentaires du post
    const [comments] = await pool.query(
      `SELECT 
        c.comment, 
        c.created_at,
        c.user_id,
        u.username as user,
        u.image_url as user_image_url
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ? 
      ORDER BY c.created_at ASC`,
      [postId]
    );
    const post = {
      id: posts[0].id,
      author: posts[0].author,
      author_image_url: posts[0].author_image_url,
      user_id: posts[0].user_id,
      image_url: posts[0].image_url,
      content: posts[0].content,
      likes: posts[0].likes,
      created_at: posts[0].created_at,
      comments: comments,
    };

    res.json({ post });
  } catch (error) {
    console.error("Erreur lors de la récupération du post:", error);
    res.status(500).json({
      error: "Erreur lors de la récupération du post",
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/posts:
 *   post:
 *     summary: Create a new post
 *     description: Create a new post with content and optional image (requires authentication)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreatePostRequest'
 *     responses:
 *       201:
 *         description: Post created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Post créé avec succès
 *                 post:
 *                   $ref: '#/components/schemas/Post'
 *       400:
 *         description: Missing required content field
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/posts", authenticateToken, async (req, res) => {
  try {
    const { image_url, content } = req.body;
    const user_id = req.user.id;

    if (!content) {
      return res.status(400).json({
        error: "Le champ content est requis",
      });
    }

    const [result] = await pool.query(
      "INSERT INTO posts (image_url, content, likes, user_id) VALUES (?, ?, 0, ?)",
      [image_url || null, content, user_id]
    );

    const [newPost] = await pool.query(
      `SELECT 
        p.id, 
        p.content, 
        p.image_url, 
        p.likes, 
        p.created_at,
        p.user_id,
        u.username as author,
        u.image_url as author_image_url
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = ?`,
      [result.insertId]
    );

    const postWithComments = {
      id: newPost[0].id,
      author: newPost[0].author,
      author_image_url: newPost[0].author_image_url,
      user_id: newPost[0].user_id,
      image_url: newPost[0].image_url,
      content: newPost[0].content,
      likes: newPost[0].likes,
      created_at: newPost[0].created_at,
      comments: [],
    };

    // Émettre l'événement Socket.IO pour notifier les clients
    try {
      const io = getIO();
      io.emit("newPost", postWithComments);
      console.log(
        `📡 Notification Socket.IO envoyée pour le nouveau post #${result.insertId}`
      );
    } catch (error) {
      console.log("⚠️ Socket.IO pas disponible, notification ignorée");
    }

    res.status(201).json({
      message: "Post créé avec succès",
      post: postWithComments,
    });
  } catch (error) {
    console.error("Erreur lors de la création du post:", error);
    res.status(500).json({
      error: "Erreur lors de la création du post",
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/posts/{id}/comments:
 *   post:
 *     summary: Add a comment to a post
 *     description: Add a new comment to a specific post (requires authentication)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Post ID
 *         example: 1
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/CreateCommentRequest'
 *     responses:
 *       201:
 *         description: Comment added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Commentaire ajouté avec succès
 *                 comment:
 *                   $ref: '#/components/schemas/Comment'
 *       400:
 *         description: Missing required comment field
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Post not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/posts/:id/comments", authenticateToken, async (req, res) => {
  try {
    const postId = req.params.id;
    const { comment } = req.body;
    const userId = req.user.id;

    if (!comment) {
      return res.status(400).json({
        error: "Le champ comment est requis",
      });
    }

    // Vérifier que le post existe
    const [posts] = await pool.query("SELECT id FROM posts WHERE id = ?", [
      postId,
    ]);

    if (posts.length === 0) {
      return res.status(404).json({ error: "Post non trouvé" });
    }

    // Ajouter le commentaire
    const [result] = await pool.query(
      "INSERT INTO comments (post_id, user_id, comment) VALUES (?, ?, ?)",
      [postId, userId, comment]
    );

    const [newComment] = await pool.query(
      `SELECT 
        c.comment, 
        c.created_at,
        c.user_id,
        u.username as user,
        u.image_url as user_image_url
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      message: "Commentaire ajouté avec succès",
      comment: newComment[0],
    });
  } catch (error) {
    console.error("Erreur lors de l'ajout du commentaire:", error);
    res.status(500).json({
      error: "Erreur lors de l'ajout du commentaire",
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/posts/{id}/like:
 *   put:
 *     summary: Like a post
 *     description: Increment the like count of a specific post (requires authentication)
 *     tags: [Posts]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Post ID
 *         example: 1
 *     responses:
 *       200:
 *         description: Like added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Like ajouté avec succès
 *                 post:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     author:
 *                       type: string
 *                     author_image_url:
 *                       type: string
 *                       nullable: true
 *                     user_id:
 *                       type: integer
 *                     image_url:
 *                       type: string
 *                       nullable: true
 *                     content:
 *                       type: string
 *                     likes:
 *                       type: integer
 *                     created_at:
 *                       type: string
 *                       format: date-time
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Post not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put("/posts/:id/like", authenticateToken, async (req, res) => {
  try {
    const postId = req.params.id;

    // Vérifier que le post existe
    const [posts] = await pool.query(
      "SELECT id, likes FROM posts WHERE id = ?",
      [postId]
    );

    if (posts.length === 0) {
      return res.status(404).json({ error: "Post non trouvé" });
    }

    // Incrémenter les likes
    await pool.query("UPDATE posts SET likes = likes + 1 WHERE id = ?", [
      postId,
    ]);

    const [updatedPost] = await pool.query(
      `SELECT 
        p.id, 
        p.content, 
        p.image_url, 
        p.likes, 
        p.created_at,
        p.user_id,
        u.username as author,
        u.image_url as author_image_url
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = ?`,
      [postId]
    );

    res.json({
      message: "Like ajouté avec succès",
      post: {
        id: updatedPost[0].id,
        author: updatedPost[0].author,
        author_image_url: updatedPost[0].author_image_url,
        user_id: updatedPost[0].user_id,
        image_url: updatedPost[0].image_url,
        content: updatedPost[0].content,
        likes: updatedPost[0].likes,
        created_at: updatedPost[0].created_at,
      },
    });
  } catch (error) {
    console.error("Erreur lors de l'ajout du like:", error);
    res.status(500).json({
      error: "Erreur lors de l'ajout du like",
      message: error.message,
    });
  }
});

/**
 * @swagger
 * /api/posts/generate:
 *   post:
 *     summary: Generate posts manually
 *     description: Manually trigger the generation of multiple posts (1-100)
 *     tags: [Posts]
 *     security: []
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/GeneratePostsRequest'
 *     responses:
 *       200:
 *         description: Posts generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 10 posts générés avec succès
 *                 count:
 *                   type: integer
 *                   example: 10
 *       400:
 *         description: Invalid count (must be between 1 and 100)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/posts/generate", async (req, res) => {
  try {
    const count = req.body.count || 10;

    if (count < 1 || count > 100) {
      return res.status(400).json({
        error: "Le nombre de posts doit être entre 1 et 100",
      });
    }

    await generateMultiplePosts(count);

    res.json({
      message: `${count} posts générés avec succès`,
      count: count,
    });
  } catch (error) {
    console.error("Erreur lors de la génération manuelle des posts:", error);
    res.status(500).json({
      error: "Erreur lors de la génération des posts",
      message: error.message,
    });
  }
});

module.exports = router;
