const cron = require("node-cron");
const { pool } = require("../config/database");
const { getIO } = require("../config/socket");

// Listes de données pour générer des posts aléatoires
// const authors = [
//   "Alice Dupont",
//   "Bob Martin",
//   "Claire Durand",
//   "David Leroy",
//   "Emma Lefevre",
//   "François Petit",
//   "Gabriel Moreau",
//   "Hélène Richard",
//   "Isabelle Bernard",
//   "Jacques Simon",
//   "Karim Nasser",
//   "Laura Fontaine",
//   "Mathieu Roy",
//   "Nadia Lopez",
//   "Olivier Dubois",
//   "Pauline Gauthier",
//   "Quentin Fabre",
//   "Raphaëlle Simon",
//   "Stéphane Marchand",
//   "Valérie Caron",
// ];

const topics = [
  { content: "Découverte de React", tags: "#React #Coding #WebDevelopment" },
  { content: "Introduction au JavaScript", tags: "#JavaScript #CodeNewbie" },
  { content: "Les bases du CSS", tags: "#CSS #Frontend #Design" },
  { content: "Programmation orientée objet", tags: "#OOP #CodingLife" },
  { content: "Apprendre HTML facilement", tags: "#HTML #WebDesign" },
  { content: "Les hooks en React", tags: "#ReactHooks #WebDev" },
  { content: "API REST pour débutants", tags: "#API #JavaScript" },
  { content: "CSS Grid et Flexbox", tags: "#CSSGrid #Flexbox #Frontend" },
  { content: "Gestion du state avec Redux", tags: "#Redux #React" },
  { content: "Node.js pour débutants", tags: "#NodeJS #Backend" },
  { content: "Introduction à TypeScript", tags: "#TypeScript #JS" },
  { content: "GraphQL expliqué simplement", tags: "#GraphQL #API" },
  { content: "Les promises en JavaScript", tags: "#Promises #Async" },
  { content: "Async/Await en pratique", tags: "#AsyncAwait #JS" },
  { content: "Créer un formulaire React", tags: "#ReactForms #WebDev" },
  { content: "Introduction au routing React", tags: "#ReactRouter #Frontend" },
  { content: "Composants fonctionnels vs classes", tags: "#React #Components" },
  {
    content: "Styled-components et CSS-in-JS",
    tags: "#StyledComponents #CSSinJS",
  },
  { content: "Optimiser son React App", tags: "#ReactPerformance #WebDev" },
  { content: "Déboguer une application React", tags: "#ReactDebug #Frontend" },
  { content: "Docker pour les développeurs", tags: "#Docker #DevOps" },
  { content: "Git et GitHub essentiels", tags: "#Git #GitHub #VersionControl" },
  { content: "Tests unitaires avec Jest", tags: "#Jest #Testing #JavaScript" },
  { content: "MongoDB et bases NoSQL", tags: "#MongoDB #NoSQL #Database" },
  { content: "Sécurité des applications web", tags: "#WebSecurity #HTTPS" },
];

const comments = [
  { user: "Alice Dupont", comment: "Super post !" },
  { user: "Bob Martin", comment: "Merci pour les astuces !" },
  { user: "Claire Durand", comment: "Très utile, merci !" },
  { user: "David Leroy", comment: "Super guide !" },
  { user: "Emma Lefevre", comment: "Merci pour ce tuto !" },
  { user: "François Petit", comment: "Très intéressant !" },
  { user: "Gabriel Moreau", comment: "Super explication !" },
  { user: "Hélène Richard", comment: "Merci pour les exemples !" },
  { user: "Isabelle Bernard", comment: "Très utile !" },
  { user: "Jacques Simon", comment: "Excellent tuto !" },
  { user: "Karim Nasser", comment: "Merci pour ce post !" },
  { user: "Laura Fontaine", comment: "Clair et précis !" },
  { user: "Mathieu Roy", comment: "Merci pour les explications !" },
  { user: "Nadia Lopez", comment: "Top post !" },
  { user: "Olivier Dubois", comment: "Merci beaucoup !" },
];

// Fonction pour obtenir un élément aléatoire d'un tableau
function getRandomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

// Fonction pour générer un nombre aléatoire entre min et max
function getRandomNumber(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

// Fonction pour générer un post aléatoire
async function generateRandomPost() {
  const topic = getRandomElement(topics);
  const seed = getRandomNumber(1000, 9999);
  const imageUrl = `https://picsum.photos/seed/${seed}/400/300`;
  const content = `${topic.content} 🚀 ${topic.tags}`;
  const likes = getRandomNumber(50, 200);

  try {
    // Récupérer un utilisateur aléatoire de la base de données
    const [users] = await pool.query(
      "SELECT id, username FROM users ORDER BY RAND() LIMIT 1",
    );

    // Si aucun utilisateur n'existe, ne pas créer de post
    if (users.length === 0) {
      console.log("⚠️ Aucun utilisateur trouvé, impossible de générer un post");
      return null;
    }

    const userId = users[0].id;

    // Insérer le post
    const [result] = await pool.query(
      "INSERT INTO posts (image_url, content, likes, user_id) VALUES (?, ?, ?, ?)",
      [imageUrl, content, likes, userId],
    );

    const postId = result.insertId;

    // Ajouter 0 à 3 commentaires aléatoires (liés à des utilisateurs aléatoires)
    const numComments = getRandomNumber(0, 3);
    for (let i = 0; i < numComments; i++) {
      const randomComment = getRandomElement(comments);

      // Récupérer un utilisateur aléatoire pour le commentaire
      const [commentUsers] = await pool.query(
        "SELECT id FROM users ORDER BY RAND() LIMIT 1",
      );

      const commentUserId =
        commentUsers.length > 0 ? commentUsers[0].id : userId;

      await pool.query(
        "INSERT INTO comments (post_id, user_id, comment) VALUES (?, ?, ?)",
        [postId, commentUserId, randomComment.comment],
      );
    }

    console.log(
      `✅ Post généré: "${content.substring(0, 50)}..." par user #${userId}`,
    );

    // Récupérer le post complet avec ses commentaires pour l'envoyer via Socket.IO
    const [posts] = await pool.query(
      `SELECT 
        p.id, 
        p.content, 
        p.image_url, 
        p.likes, 
        p.created_at,
        p.user_id,
        u.username as author,
        u.image_url as author_image_url
      FROM posts p
      LEFT JOIN users u ON p.user_id = u.id
      WHERE p.id = ?`,
      [postId],
    );

    const [postComments] = await pool.query(
      `SELECT 
        c.comment, 
        c.created_at,
        c.user_id,
        u.username as user,
        u.image_url as user_image_url
      FROM comments c
      LEFT JOIN users u ON c.user_id = u.id
      WHERE c.post_id = ? 
      ORDER BY c.created_at DESC`,
      [postId],
    );

    const newPost = {
      id: posts[0].id,
      author: posts[0].author,
      author_image_url: posts[0].author_image_url,
      user_id: posts[0].user_id,
      image_url: posts[0].image_url,
      content: posts[0].content,
      likes: posts[0].likes,
      created_at: posts[0].created_at,
      comments: postComments,
    };

    // Émettre l'événement Socket.IO pour notifier les clients
    try {
      const io = getIO();
      io.emit("newPost", newPost);
      console.log(`📡 Notification Socket.IO envoyée pour le post #${postId}`);
    } catch (error) {
      console.log("⚠️ Socket.IO pas encore initialisé, notification ignorée");
    }

    return postId;
  } catch (error) {
    console.error("❌ Erreur lors de la génération du post:", error);
    throw error;
  }
}

// Fonction pour générer plusieurs posts
async function generateMultiplePosts(count = 10) {
  console.log(`🔄 Génération de ${count} nouveaux posts...`);
  const startTime = Date.now();

  try {
    const promises = [];
    for (let i = 0; i < count; i++) {
      promises.push(generateRandomPost());
    }

    await Promise.all(promises);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ ${count} posts générés avec succès en ${duration}s`);
  } catch (error) {
    console.error("❌ Erreur lors de la génération des posts:", error);
  }
}

// Configurer le cron job pour s'exécuter toutes les 5 minutes
function startPostGeneratorCron() {
  // Cron expression: '*/5 * * * *' = toutes les 5 minutes
  const job = cron.schedule("*/1 * * * *", async () => {
    const now = new Date().toLocaleString("fr-FR");
    console.log(
      `\n⏰ [${now}] Démarrage du cron job de génération de posts...`,
    );
    await generateMultiplePosts(10);
  });

  console.log(
    "🕐 Cron job de génération de posts démarré (toutes les 5 minutes)",
  );
  console.log(
    "📝 10 nouveaux posts seront créés automatiquement toutes les 5 minutes",
  );

  return job;
}

module.exports = {
  startPostGeneratorCron,
  generateMultiplePosts,
  generateRandomPost,
};
