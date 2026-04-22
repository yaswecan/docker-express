export default function Navbar({ user, onLogout }) {
  return (
    <header
      style={{
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        color: "white",
        padding: "20px 30px",
        borderRadius: "10px",
        marginBottom: "20px",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "15px",
      }}
    >
      <div>
        <h1 style={{ margin: "0 0 5px 0" }}>
          🚀 React + Socket.IO + Express + MySQL
        </h1>
        <p style={{ margin: "0", fontSize: "14px", opacity: "0.9" }}>
          Authentification JWT activée
        </p>
      </div>

      {user && (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "15px",
            background: "rgba(255,255,255,0.1)",
            padding: "10px 20px",
            borderRadius: "25px",
          }}
        >
          <div
            style={{
              width: "35px",
              height: "35px",
              borderRadius: "50%",
              background: "white",
              color: "#667eea",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "bold",
              fontSize: "16px",
            }}
          >
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div>
            <div style={{ fontWeight: "bold" }}>{user.username}</div>
            <div style={{ fontSize: "12px", opacity: "0.8" }}>{user.email}</div>
          </div>
          <button
            onClick={onLogout}
            style={{
              background: "rgba(255,255,255,0.2)",
              color: "white",
              border: "1px solid rgba(255,255,255,0.3)",
              padding: "8px 16px",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "14px",
              fontWeight: "bold",
              transition: "background 0.2s",
            }}
            onMouseEnter={(e) =>
              (e.target.style.background = "rgba(255,255,255,0.3)")
            }
            onMouseLeave={(e) =>
              (e.target.style.background = "rgba(255,255,255,0.2)")
            }
          >
            Déconnexion
          </button>
        </div>
      )}
    </header>
  );
}
