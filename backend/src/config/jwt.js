// Configuration JWT
const JWT_SECRET =
  process.env.JWT_SECRET ||
  "votre_secret_jwt_super_securise_a_changer_en_production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d"; // 7 jours par défaut

module.exports = {
  JWT_SECRET,
  JWT_EXPIRES_IN,
};
