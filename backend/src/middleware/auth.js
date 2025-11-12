const jwt = require("jsonwebtoken");
const { JWT_SECRET } = require("../config/jwt");
const { pool } = require("../config/database");

/**
 * Middleware pour vérifier le token JWT
 */
async function authenticateToken(req, res, next) {
  try {
    // Récupérer le token depuis le header Authorization
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1]; // Format: "Bearer TOKEN"

    if (!token) {
      return res.status(401).json({
        error: "Accès refusé",
        message: "Token d'authentification manquant",
      });
    }

    // Vérifier et décoder le token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Vérifier que l'utilisateur existe toujours dans la base de données
    const [users] = await pool.query(
      "SELECT id, username, email, image_url, created_at FROM users WHERE id = ?",
      [decoded.userId]
    );

    if (users.length === 0) {
      return res.status(401).json({
        error: "Accès refusé",
        message: "Utilisateur non trouvé",
      });
    }

    // Ajouter les informations de l'utilisateur à la requête
    req.user = users[0];
    next();
  } catch (error) {
    if (error.name === "JsonWebTokenError") {
      return res.status(403).json({
        error: "Token invalide",
        message: "Le token d'authentification est invalide",
      });
    }

    if (error.name === "TokenExpiredError") {
      return res.status(403).json({
        error: "Token expiré",
        message: "Le token d'authentification a expiré",
      });
    }

    console.error("Erreur lors de l'authentification:", error);
    return res.status(500).json({
      error: "Erreur serveur",
      message: "Une erreur est survenue lors de l'authentification",
    });
  }
}

/**
 * Middleware optionnel - ajoute les infos utilisateur si le token est présent, mais ne bloque pas
 */
async function optionalAuth(req, res, next) {
  try {
    const authHeader = req.headers["authorization"];
    const token = authHeader && authHeader.split(" ")[1];

    if (token) {
      const decoded = jwt.verify(token, JWT_SECRET);
      const [users] = await pool.query(
        "SELECT id, username, email, image_url, created_at FROM users WHERE id = ?",
        [decoded.userId]
      );

      if (users.length > 0) {
        req.user = users[0];
      }
    }
  } catch (error) {
    // En cas d'erreur, on continue sans utilisateur authentifié
    console.log("Token invalide ou expiré (optionalAuth)");
  }

  next();
}

module.exports = {
  authenticateToken,
  optionalAuth,
};
