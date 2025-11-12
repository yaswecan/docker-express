let io = null;

// Initialiser Socket.IO
function initSocket(server) {
  const { Server } = require("socket.io");

  io = new Server(server, {
    cors: {
      origin: ["http://localhost:5173", "http://localhost:3000"],
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.on("connection", (socket) => {
    console.log(`✅ Client connecté: ${socket.id}`);

    socket.on("disconnect", () => {
      console.log(`❌ Client déconnecté: ${socket.id}`);
    });
  });

  console.log("🔌 Socket.IO initialisé avec succès");
  return io;
}

// Obtenir l'instance Socket.IO
function getIO() {
  if (!io) {
    throw new Error("Socket.IO n'est pas initialisé !");
  }
  return io;
}

module.exports = {
  initSocket,
  getIO,
};
