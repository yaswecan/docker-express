import { useState, useEffect } from "react";
import { io } from "socket.io-client";
import LoginForm from "./components/LoginForm";
import SignupForm from "./components/SignupForm";
import Navbar from "./components/Navbar";

export default function App() {
  const [posts, setPosts] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [socket, setSocket] = useState(null);
  const [user, setUser] = useState(null);
  const [showSignup, setShowSignup] = useState(false);

  useEffect(() => {
    // Vérifier si l'utilisateur est déjà connecté
    const savedToken = localStorage.getItem("token");
    const savedUser = localStorage.getItem("user");

    if (savedToken && savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    // Connexion au serveur Socket.IO seulement si l'utilisateur est connecté
    if (!user) return;

    const newSocket = io("http://159.69.22.78", {
      transports: ["websocket", "polling"],
    });

    newSocket.on("connect", () => {
      console.log("✅ Connecté au serveur Socket.IO");
      setIsConnected(true);
    });

    newSocket.on("disconnect", () => {
      console.log("❌ Déconnecté du serveur Socket.IO");
      setIsConnected(false);
    });

    // Écouter les nouveaux posts
    newSocket.on("newPost", (newPost) => {
      console.log("📬 Nouveau post reçu:", newPost);

      // Ajouter le post au début de la liste
      setPosts((prevPosts) => [newPost, ...prevPosts]);

      // Ajouter une notification
      const notification = {
        id: Date.now(),
        message: `Nouveau post de ${newPost.author}`,
        post: newPost,
      };
      setNotifications((prev) => [notification, ...prev]);

      // Supprimer la notification après 5 secondes
      setTimeout(() => {
        setNotifications((prev) =>
          prev.filter((n) => n.id !== notification.id),
        );
      }, 5000);
    });

    setSocket(newSocket);

    // Charger les posts existants
    fetchPosts();

    return () => {
      newSocket.close();
    };
  }, [user]);

  const fetchPosts = async () => {
    try {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/posts`);
      const data = await response.json();
      setPosts(data.posts || []);
    } catch (error) {
      console.error("Erreur lors du chargement des posts:", error);
    }
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setShowSignup(false);
  };

  const handleSignupSuccess = (userData) => {
    setUser(userData);
    setShowSignup(false);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(null);
    setPosts([]);
    if (socket) {
      socket.close();
    }
  };

  // Si l'utilisateur n'est pas connecté, afficher les formulaires d'authentification
  if (!user) {
    return (
      <div
        style={{
          padding: "20px",
          fontFamily: "Arial, sans-serif",
          minHeight: "100vh",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        }}
      >
        {showSignup ? (
          <SignupForm
            onSignupSuccess={handleSignupSuccess}
            onSwitchToLogin={() => setShowSignup(false)}
          />
        ) : (
          <LoginForm
            onLoginSuccess={handleLoginSuccess}
            onSwitchToSignup={() => setShowSignup(true)}
          />
        )}
      </div>
    );
  }

  // Si l'utilisateur est connecté, afficher l'application
  return (
    <div style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <Navbar user={user} onLogout={handleLogout} />

      <div
        style={{
          maxWidth: "800px",
          margin: "0 auto 20px",
          padding: "15px 20px",
          background: isConnected ? "#e8f5e9" : "#ffebee",
          borderRadius: "8px",
          textAlign: "center",
          fontSize: "14px",
          fontWeight: "bold",
          color: isConnected ? "#2e7d32" : "#c62828",
        }}
      >
        {isConnected
          ? "🟢 Connecté au serveur en temps réel"
          : "🔴 Déconnecté du serveur"}
      </div>

      {/* Notifications */}
      <div
        style={{
          position: "fixed",
          top: "20px",
          right: "20px",
          zIndex: 1000,
          maxWidth: "400px",
        }}
      >
        {notifications.map((notif) => (
          <div
            key={notif.id}
            style={{
              background: "#4CAF50",
              color: "white",
              padding: "15px 20px",
              borderRadius: "8px",
              marginBottom: "10px",
              boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
              animation: "slideIn 0.3s ease-out",
            }}
          >
            <strong>🔔 {notif.message}</strong>
            <p style={{ margin: "5px 0 0 0", fontSize: "14px" }}>
              {notif.post.content.substring(0, 50)}...
            </p>
          </div>
        ))}
      </div>

      {/* Liste des posts */}
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        <h2 style={{ marginBottom: "20px" }}>
          📝 Posts récents ({posts.length})
        </h2>

        {posts.length === 0 ? (
          <p style={{ textAlign: "center", color: "#666" }}>
            Aucun post pour le moment. Les nouveaux posts apparaîtront ici
            automatiquement ! 🎉
          </p>
        ) : (
          <div
            style={{ display: "flex", flexDirection: "column", gap: "20px" }}
          >
            {posts.map((post) => (
              <div
                key={post.id}
                style={{
                  border: "1px solid #ddd",
                  borderRadius: "10px",
                  padding: "20px",
                  background: "white",
                  boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
                  transition: "transform 0.2s",
                }}
                onMouseEnter={(e) =>
                  (e.currentTarget.style.transform = "translateY(-2px)")
                }
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = "translateY(0)")
                }
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    marginBottom: "10px",
                  }}
                >
                  <div
                    style={{
                      width: "40px",
                      height: "40px",
                      borderRadius: "50%",
                      background:
                        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontWeight: "bold",
                      marginRight: "10px",
                    }}
                  >
                    {post.author.charAt(0)}
                  </div>
                  <div>
                    <strong>{post.author}</strong>
                    <div style={{ fontSize: "12px", color: "#666" }}>
                      {new Date(post.created_at).toLocaleString("fr-FR")}
                    </div>
                  </div>
                </div>

                {post.image_url && (
                  <img
                    src={post.image_url}
                    alt="Post"
                    style={{
                      width: "100%",
                      borderRadius: "8px",
                      marginBottom: "10px",
                    }}
                  />
                )}

                <p style={{ margin: "10px 0", lineHeight: "1.6" }}>
                  {post.content}
                </p>

                <div
                  style={{
                    display: "flex",
                    gap: "15px",
                    color: "#666",
                    fontSize: "14px",
                    marginTop: "10px",
                  }}
                >
                  <span>❤️ {post.likes} likes</span>
                  <span>💬 {post.comments?.length || 0} commentaires</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <style>{`
        @keyframes slideIn {
          from {
            transform: translateX(400px);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
