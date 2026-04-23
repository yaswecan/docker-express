const { authenticateToken } = require("../src/middleware/auth");
const jwt = require("jsonwebtoken");
const { pool } = require("../src/config/database");

jest.mock("jsonwebtoken");
jest.mock("../src/config/database");

describe("authenticateToken middleware", () => {
  let req, res, next;

  beforeEach(() => {
    req = { headers: {}, user: null };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
    next = jest.fn();
    jwt.verify.mockClear();
    pool.query.mockClear();
  });

  it("should authenticate valid token and set req.user", async () => {
    const mockUser = { id: 1, username: "testuser", email: "test@example.com" };
    jwt.verify.mockReturnValue({ userId: 1 });
    pool.query.mockResolvedValue([[mockUser]]);

    req.headers.authorization = "Bearer valid.token.here";

    await authenticateToken(req, res, next);

    expect(jwt.verify).toHaveBeenCalledWith(
      "valid.token.here",
      expect.any(String),
    );
    expect(pool.query).toHaveBeenCalledWith(
      "SELECT id, username, email, image_url, created_at FROM users WHERE id = ?",
      [1],
    );
    expect(req.user).toEqual(mockUser);
    expect(next).toHaveBeenCalled();
  });

  it("should return 401 if no token", async () => {
    await authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Accès refusé",
      message: "Token d'authentification manquant",
    });
    expect(next).not.toHaveBeenCalled();
  });

  it("should return 403 if invalid token", async () => {
    const error = new Error("invalid");
    error.name = "JsonWebTokenError";
    jwt.verify.mockImplementation(() => {
      throw error;
    });

    req.headers.authorization = "Bearer invalid.token";

    await authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: "Token invalide",
      message: "Le token d'authentification est invalide",
    });
  });

  it("should return 401 if user not found in DB", async () => {
    jwt.verify.mockReturnValue({ userId: 999 });
    pool.query.mockResolvedValue([[]]);

    req.headers.authorization = "Bearer token.user.missing";

    await authenticateToken(req, res, next);

    expect(res.status).toHaveBeenCalledWith(401);
    expect(res.json).toHaveBeenCalledWith({
      error: "Accès refusé",
      message: "Utilisateur non trouvé",
    });
  });
});
