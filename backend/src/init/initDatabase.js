const { pool } = require("../config/database");
const postsData = require("../../data/posts");

async function initDatabase() {
  let connection;

  try {
    connection = await pool.getConnection();
    console.log("Initialisation de la base de données...");

    // Créer la table users
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id INT PRIMARY KEY AUTO_INCREMENT,
        username VARCHAR(255) NOT NULL UNIQUE,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        image_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    console.log('Table "users" créée ou déjà existante');

    // Ajouter la colonne image_url si elle n'existe pas (migration)
    try {
      await connection.query(`
        ALTER TABLE users ADD COLUMN image_url VARCHAR(500)
      `);
      console.log('Colonne "image_url" ajoutée à la table users');
    } catch (error) {
      // La colonne existe déjà, ignorer l'erreur
      if (error.code !== "ER_DUP_FIELDNAME") {
        throw error;
      }
    }

    // Créer la table posts
    await connection.query(`
      CREATE TABLE IF NOT EXISTS posts (
        id INT PRIMARY KEY AUTO_INCREMENT,
        author VARCHAR(255) NOT NULL,
        image_url VARCHAR(500),
        content TEXT NOT NULL,
        likes INT DEFAULT 0,
        user_id INT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('Table "posts" créée ou déjà existante');

    // Ajouter la colonne user_id si elle n'existe pas (migration)
    try {
      await connection.query(`
        ALTER TABLE posts ADD COLUMN user_id INT
      `);
      console.log('Colonne "user_id" ajoutée à la table posts');

      // Ajouter la contrainte de clé étrangère
      try {
        await connection.query(`
          ALTER TABLE posts ADD CONSTRAINT fk_posts_user 
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        `);
        console.log("Contrainte de clé étrangère ajoutée à posts.user_id");
      } catch (fkError) {
        // La contrainte existe déjà, ignorer l'erreur
        if (fkError.code !== "ER_DUP_KEYNAME") {
          console.log(
            "Note: Contrainte de clé étrangère déjà existante ou erreur:",
            fkError.code,
          );
        }
      }
    } catch (error) {
      // La colonne existe déjà, ignorer l'erreur
      if (error.code !== "ER_DUP_FIELDNAME") {
        throw error;
      }
    }

    // Supprimer la colonne author si elle existe (migration)
    try {
      await connection.query(`
        ALTER TABLE posts DROP COLUMN author
      `);
      console.log('Colonne "author" supprimée de la table posts');
    } catch (error) {
      // La colonne n'existe pas, ignorer l'erreur
      if (error.code !== "ER_CANT_DROP_FIELD_OR_KEY") {
        console.log(
          "Note: Colonne author déjà supprimée ou erreur:",
          error.code,
        );
      }
    }

    // Créer la table comments
    await connection.query(`
      CREATE TABLE IF NOT EXISTS comments (
        id INT PRIMARY KEY AUTO_INCREMENT,
        post_id INT NOT NULL,
        user_id INT,
        comment TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE,
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
      )
    `);
    console.log('Table "comments" créée ou déjà existante');

    // Ajouter la colonne user_id si elle n'existe pas (migration)
    try {
      await connection.query(`
        ALTER TABLE comments ADD COLUMN user_id INT
      `);
      console.log('Colonne "user_id" ajoutée à la table comments');

      // Ajouter la contrainte de clé étrangère
      try {
        await connection.query(`
          ALTER TABLE comments ADD CONSTRAINT fk_comments_user 
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
        `);
        console.log("Contrainte de clé étrangère ajoutée à comments.user_id");
      } catch (fkError) {
        // La contrainte existe déjà, ignorer l'erreur
        if (fkError.code !== "ER_DUP_KEYNAME") {
          console.log(
            "Note: Contrainte de clé étrangère déjà existante ou erreur:",
            fkError.code,
          );
        }
      }
    } catch (error) {
      // La colonne existe déjà, ignorer l'erreur
      if (error.code !== "ER_DUP_FIELDNAME") {
        throw error;
      }
    }

    // Supprimer la colonne user si elle existe (migration)
    try {
      await connection.query(`
        ALTER TABLE comments DROP COLUMN user
      `);
      console.log('Colonne "user" supprimée de la table comments');
    } catch (error) {
      // La colonne n'existe pas, ignorer l'erreur
      if (error.code !== "ER_CANT_DROP_FIELD_OR_KEY") {
        console.log("Note: Colonne user déjà supprimée ou erreur:", error.code);
      }
    }

    // Vérifier si les données existent déjà
    const [existingPosts] = await connection.query(
      "SELECT COUNT(*) as count FROM posts",
    );

    if (existingPosts[0].count === 0) {
      console.log("🔄 Migration des données depuis posts.js...");

      // Créer un utilisateur par défaut pour les posts initiaux si aucun utilisateur n'existe
      const [existingUsers] = await connection.query(
        "SELECT COUNT(*) as count FROM users",
      );

      let defaultUserId = 1;

      if (existingUsers[0].count === 0) {
        console.log(
          "Création d'un utilisateur par défaut pour les posts initiaux...",
        );
        const bcrypt = require("bcryptjs");
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash("defaultpassword", salt);

        const [userResult] = await connection.query(
          "INSERT INTO users (username, email, password, image_url) VALUES (?, ?, ?, ?)",
          [
            "default_user",
            "default@example.com",
            hashedPassword,
            "https://i.pravatar.cc/150?img=10",
          ],
        );
        defaultUserId = userResult.insertId;
        console.log(`Utilisateur par défaut créé avec l'ID: ${defaultUserId}`);
      } else {
        // Récupérer le premier utilisateur existant
        const [firstUser] = await connection.query(
          "SELECT id FROM users ORDER BY id ASC LIMIT 1",
        );
        defaultUserId = firstUser[0].id;
        console.log(
          `Utilisation de l'utilisateur existant ID: ${defaultUserId}`,
        );
      }

      // Insérer les posts en les liant à l'utilisateur par défaut
      for (const post of postsData) {
        await connection.query(
          "INSERT INTO posts (id, image_url, content, likes, user_id) VALUES (?, ?, ?, ?, ?)",
          [post.id, post.image_url, post.content, post.likes, defaultUserId],
        );

        // Insérer les commentaires pour ce post (liés à l'utilisateur par défaut)
        if (post.comments && post.comments.length > 0) {
          for (const comment of post.comments) {
            await connection.query(
              "INSERT INTO comments (post_id, user_id, comment) VALUES (?, ?, ?)",
              [post.id, defaultUserId, comment.comment],
            );
          }
        }
      }

      console.log(
        `${postsData.length} posts et leurs commentaires ont été migrés avec succès!`,
      );
      console.log(
        `Tous les posts ont été liés à l'utilisateur ID: ${defaultUserId}`,
      );
    } else {
      console.log("Les données existent déjà dans la base de données");
    }

    // Migration: Lier les posts existants sans user_id à un utilisateur
    const [postsWithoutUser] = await connection.query(
      "SELECT COUNT(*) as count FROM posts WHERE user_id IS NULL",
    );

    if (postsWithoutUser[0].count > 0) {
      console.log(
        `🔄 Migration: ${postsWithoutUser[0].count} posts sans user_id trouvés...`,
      );

      // Récupérer le premier utilisateur
      const [firstUser] = await connection.query(
        "SELECT id FROM users ORDER BY id ASC LIMIT 1",
      );

      if (firstUser.length > 0) {
        const userId = firstUser[0].id;
        await connection.query(
          "UPDATE posts SET user_id = ? WHERE user_id IS NULL",
          [userId],
        );
        console.log(
          `✅ Tous les posts ont été liés à l'utilisateur ID: ${userId}`,
        );
      } else {
        console.log("⚠️ Aucun utilisateur trouvé pour lier les posts");
      }
    }

    // Migration: Lier les commentaires existants sans user_id à un utilisateur
    const [commentsWithoutUser] = await connection.query(
      "SELECT COUNT(*) as count FROM comments WHERE user_id IS NULL",
    );

    if (commentsWithoutUser[0].count > 0) {
      console.log(
        `🔄 Migration: ${commentsWithoutUser[0].count} commentaires sans user_id trouvés...`,
      );

      // Récupérer le premier utilisateur
      const [firstUser] = await connection.query(
        "SELECT id FROM users ORDER BY id ASC LIMIT 1",
      );

      if (firstUser.length > 0) {
        const userId = firstUser[0].id;
        await connection.query(
          "UPDATE comments SET user_id = ? WHERE user_id IS NULL",
          [userId],
        );
        console.log(
          `✅ Tous les commentaires ont été liés à l'utilisateur ID: ${userId}`,
        );
      } else {
        console.log("⚠️ Aucun utilisateur trouvé pour lier les commentaires");
      }
    }

    console.log("Initialisation de la base de données terminée!");
  } catch (error) {
    console.error(
      "Erreur lors de l'initialisation de la base de données:",
      error,
    );
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
}

module.exports = { initDatabase };
