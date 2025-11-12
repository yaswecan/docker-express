const express = require("express");
const http = require("http");
const cors = require("cors");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const apiRoutes = require("./routes/api");
const authRoutes = require("./routes/auth");
const { testConnection } = require("./config/database");
const { initDatabase } = require("./init/initDatabase");
const { startPostGeneratorCron } = require("./jobs/postGenerator");
const { initSocket } = require("./config/socket");

const app = express();
const server = http.createServer(app);
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Swagger Documentation
app.use(
  "/api-docs",
  swaggerUi.serve,
  swaggerUi.setup(swaggerSpec, {
    customCss: ".swagger-ui .topbar { display: none }",
    customSiteTitle: "Social Media API Documentation",
  })
);

// Swagger JSON endpoint
app.get("/api-docs.json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api", apiRoutes);

// Root route
app.get("/", (req, res) => {
  res.json({
    message: "Backend Express API is running! 🚀",
    version: "1.0.0",
    documentation: "http://localhost:3000/api-docs",
    endpoints: {
      auth: {
        register: "/api/auth/register",
        login: "/api/auth/login",
        me: "/api/auth/me",
        logout: "/api/auth/logout",
        updateProfile: "/api/auth/update-profile",
        changePassword: "/api/auth/change-password",
      },
      posts: "/api/posts",
    },
    database: "MySQL connected",
  });
});

// Fonction pour démarrer le serveur
async function startServer() {
  try {
    // Tester la connexion à la base de données
    const isConnected = await testConnection();

    if (!isConnected) {
      console.error("❌ Impossible de se connecter à la base de données");
      process.exit(1);
    }

    // Initialiser la base de données (créer les tables et migrer les données)
    await initDatabase();

    // Initialiser Socket.IO
    initSocket(server);

    // Démarrer le cron job de génération de posts
    startPostGeneratorCron();

    // Démarrer le serveur
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Backend server is running on http://localhost:${PORT}`);
      console.log(`📊 phpMyAdmin is available at http://localhost:8080`);
      console.log(
        `🤖 Cron job actif: 10 posts générés automatiquement toutes les 5 minutes`
      );
      console.log(`🔌 Socket.IO prêt pour les connexions en temps réel`);
    });
  } catch (error) {
    console.error("❌ Erreur lors du démarrage du serveur:", error);
    process.exit(1);
  }
}

// Démarrer le serveur
startServer();
