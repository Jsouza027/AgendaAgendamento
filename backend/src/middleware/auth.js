const { getDb } = require('../database');

/**
 * Middleware de autenticação Bearer Token.
 * Equivalente ao SecurityFilter.java do Spring Boot.
 */
function authMiddleware(req, res, next) {
  const path = req.path;

  // Permitir login e requisições OPTIONS (preflight CORS)
  if (path.startsWith('/api/auth/login') || req.method === 'OPTIONS') {
    return next();
  }

  // Para rotas /api/, checar o token
  if (path.startsWith('/api/')) {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const db = getDb();
      const usuario = db.prepare('SELECT id FROM usuarios WHERE token = ?').get(token);

      if (usuario) {
        req.userId = usuario.id;
        return next();
      }
    }

    // Token inválido ou não enviado
    return res.status(401).send('Acesso nao autorizado');
  }

  // Se não for rota da API, deixa passar
  next();
}

module.exports = authMiddleware;
