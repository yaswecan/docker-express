const mysql = require("mysql2/promise");

// Configuration de la connexion MySQL
const dbConfig = {
  host: process.env.DB_HOST || "mysql",
  user: process.env.DB_USER || "db_user",
  password: process.env.DB_PASSWORD || "db_password",
  database: process.env.DB_NAME || "social_media_db",
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
};

// Créer un pool de connexions
const pool = mysql.createPool(dbConfig);

// Fonction pour tester la connexion
async function testConnection() {
  try {
    const connection = await pool.getConnection();
    console.log("Connexion à MySQL réussie");
    connection.release();
    return true;
  } catch (error) {
    console.error("Erreur de connexion à MySQL:", error.message);
    return false;
  }
}

module.exports = {
  pool,
  testConnection,
};
