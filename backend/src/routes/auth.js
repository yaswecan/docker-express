const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { pool } = require("../config/database");
const { JWT_SECRET, JWT_EXPIRES_IN } = require("../config/jwt");
const { authenticateToken } = require("../middleware/auth");

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user
 *     description: Create a new user account with username, email, and password
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RegisterRequest'
 *     responses:
 *       201:
 *         description: User successfully registered
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Validation error (missing fields, invalid email, or short password)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Email or username already exists
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
router.post("/register", async (req, res) => {
  try {
    const { username, email, password, image_url } = req.body;

    // Validation des champs
    if (!username || !email || !password) {
      return res.status(400).json({
        error: "Champs manquants",
        message: "Les champs username, email et password sont requis",
      });
    }

    // Validation de l'email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({
        error: "Email invalide",
        message: "Veuillez fournir une adresse email valide",
      });
    }

    // Validation du mot de passe (minimum 6 caractères)
    if (password.length < 6) {
      return res.status(400).json({
        error: "Mot de passe trop court",
        message: "Le mot de passe doit contenir au moins 6 caractères",
      });
    }

    // Vérifier si l'email existe déjà
    const [existingUsers] = await pool.query(
      "SELECT id FROM users WHERE email = ?",
      [email],
    );

    if (existingUsers.length > 0) {
      return res.status(409).json({
        error: "Email déjà utilisé",
        message: "Un compte existe déjà avec cet email",
      });
    }

    // Vérifier si le username existe déjà
    const [existingUsernames] = await pool.query(
      "SELECT id FROM users WHERE username = ?",
      [username],
    );

    if (existingUsernames.length > 0) {
      return res.status(409).json({
        error: "Username déjà utilisé",
        message: "Ce nom d'utilisateur est déjà pris",
      });
    }

    // Hasher le mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Créer l'utilisateur
    const [result] = await pool.query(
      "INSERT INTO users (username, email, password, image_url) VALUES (?, ?, ?, ?)",
      [username, email, hashedPassword, image_url || null],
    );

    // Générer le token JWT
    const token = jwt.sign({ userId: result.insertId }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    // Récupérer l'utilisateur créé (sans le mot de passe)
    const [newUser] = await pool.query(
      "SELECT id, username, email, image_url, created_at FROM users WHERE id = ?",
      [result.insertId],
    );

    res.status(201).json({
      message: "Utilisateur créé avec succès",
      token,
      user: newUser[0],
    });
  } catch (error) {
    console.error("Erreur lors de l'inscription:", error);
    res.status(500).json({
      error: "Erreur serveur",
      message: "Une erreur est survenue lors de l'inscription",
    });
  }
});

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login user
 *     description: Authenticate user with email and password
 *     tags: [Authentication]
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/LoginRequest'
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthResponse'
 *       400:
 *         description: Missing required fields
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Invalid credentials
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
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    // Validation des champs
    if (!email || !password) {
      return res.status(400).json({
        error: "Champs manquants",
        message: "Les champs email et password sont requis",
      });
    }

    // Récupérer l'utilisateur par email
    const [users] = await pool.query(
      "SELECT id, username, email, password, image_url, created_at FROM users WHERE email = ?",
      [email],
    );

    if (users.length === 0) {
      return res.status(401).json({
        error: "Identifiants invalides",
        message: "Email ou mot de passe incorrect",
      });
    }

    const user = users[0];

    // Vérifier le mot de passe
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: "Identifiants invalides",
        message: "Email ou mot de passe incorrect",
      });
    }

    // Générer le token JWT
    const token = jwt.sign({ userId: user.id }, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
    });

    // Retourner l'utilisateur sans le mot de passe
    const { password: userWithoutPassword } = user;

    res.json({
      message: "Connexion réussie",
      token,
      user: userWithoutPassword,
    });
  } catch (error) {
    console.error("Erreur lors de la connexion:", error);
    res.status(500).json({
      error: "Erreur serveur",
      message: "Une erreur est survenue lors de la connexion",
    });
  }
});

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     description: Retrieve the authenticated user's profile information
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   $ref: '#/components/schemas/User'
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
router.get("/me", authenticateToken, async (req, res) => {
  try {
    // L'utilisateur est déjà disponible dans req.user grâce au middleware
    res.json({
      user: req.user,
    });
  } catch (error) {
    console.error("Erreur lors de la récupération du profil:", error);
    res.status(500).json({
      error: "Erreur serveur",
      message: "Une erreur est survenue lors de la récupération du profil",
    });
  }
});

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: Logout user
 *     description: Logout the authenticated user (token should be removed client-side)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Déconnexion réussie
 *       401:
 *         description: Unauthorized - Invalid or missing token
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post("/logout", authenticateToken, (req, res) => {
  // La déconnexion se fait principalement côté client en supprimant le token
  // Cette route peut être utilisée pour des logs ou d'autres actions
  res.json({
    message: "Déconnexion réussie",
  });
});

/**
 * @swagger
 * /api/auth/update-profile:
 *   put:
 *     summary: Update user profile
 *     description: Update the authenticated user's username and/or profile image
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/UpdateProfileRequest'
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Profil mis à jour avec succès
 *                 user:
 *                   $ref: '#/components/schemas/User'
 *       400:
 *         description: Missing required fields
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
 *       409:
 *         description: Username already taken
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
router.put("/update-profile", authenticateToken, async (req, res) => {
  try {
    const { username, image_url } = req.body;
    const userId = req.user.id;

    if (!username && image_url === undefined) {
      return res.status(400).json({
        error: "Champ manquant",
        message: "Au moins un champ (username ou image_url) est requis",
      });
    }

    // Vérifier si le nouveau username est déjà pris par un autre utilisateur
    if (username) {
      const [existingUsers] = await pool.query(
        "SELECT id FROM users WHERE username = ? AND id != ?",
        [username, userId],
      );

      if (existingUsers.length > 0) {
        return res.status(409).json({
          error: "Username déjà utilisé",
          message: "Ce nom d'utilisateur est déjà pris",
        });
      }
    }

    // Construire la requête de mise à jour dynamiquement
    const updates = [];
    const values = [];

    if (username) {
      updates.push("username = ?");
      values.push(username);
    }

    if (image_url !== undefined) {
      updates.push("image_url = ?");
      values.push(image_url || null);
    }

    values.push(userId);

    // Mettre à jour les champs
    await pool.query(
      `UPDATE users SET ${updates.join(", ")} WHERE id = ?`,
      values,
    );

    // Récupérer l'utilisateur mis à jour
    const [updatedUser] = await pool.query(
      "SELECT id, username, email, image_url, created_at FROM users WHERE id = ?",
      [userId],
    );

    res.json({
      message: "Profil mis à jour avec succès",
      user: updatedUser[0],
    });
  } catch (error) {
    console.error("Erreur lors de la mise à jour du profil:", error);
    res.status(500).json({
      error: "Erreur serveur",
      message: "Une erreur est survenue lors de la mise à jour du profil",
    });
  }
});

/**
 * @swagger
 * /api/auth/change-password:
 *   put:
 *     summary: Change user password
 *     description: Change the authenticated user's password
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Mot de passe changé avec succès
 *       400:
 *         description: Validation error (missing fields or password too short)
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized or incorrect current password
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User not found
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
router.put("/change-password", authenticateToken, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    // Validation des champs
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        error: "Champs manquants",
        message: "Les champs currentPassword et newPassword sont requis",
      });
    }

    // Validation du nouveau mot de passe
    if (newPassword.length < 6) {
      return res.status(400).json({
        error: "Mot de passe trop court",
        message: "Le nouveau mot de passe doit contenir au moins 6 caractères",
      });
    }

    // Récupérer l'utilisateur avec son mot de passe
    const [users] = await pool.query(
      "SELECT password FROM users WHERE id = ?",
      [userId],
    );

    if (users.length === 0) {
      return res.status(404).json({
        error: "Utilisateur non trouvé",
        message: "L'utilisateur n'existe pas",
      });
    }

    // Vérifier le mot de passe actuel
    const isPasswordValid = await bcrypt.compare(
      currentPassword,
      users[0].password,
    );

    if (!isPasswordValid) {
      return res.status(401).json({
        error: "Mot de passe incorrect",
        message: "Le mot de passe actuel est incorrect",
      });
    }

    // Hasher le nouveau mot de passe
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Mettre à jour le mot de passe
    await pool.query("UPDATE users SET password = ? WHERE id = ?", [
      hashedPassword,
      userId,
    ]);

    res.json({
      message: "Mot de passe changé avec succès",
    });
  } catch (error) {
    console.error("Erreur lors du changement de mot de passe:", error);
    res.status(500).json({
      error: "Erreur serveur",
      message: "Une erreur est survenue lors du changement de mot de passe",
    });
  }
});

module.exports = router;
