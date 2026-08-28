const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { getDb, hashPassword } = require('../database');
const { HttpError } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * POST /api/auth/login
 * Equivalente ao AuthController.java
 */
router.post('/login', (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      throw new HttpError(400, 'Usuário e senha são obrigatórios.');
    }

    const db = getDb();
    const usuario = db.prepare('SELECT * FROM usuarios WHERE username = ?').get(username);

    if (usuario) {
      const hashedPassword = hashPassword(password);

      if (usuario.password === hashedPassword) {
        // Gera novo token
        const token = uuidv4();
        db.prepare('UPDATE usuarios SET token = ? WHERE id = ?').run(token, usuario.id);

        return res.json({
          token,
          message: 'Login realizado com sucesso',
        });
      }
    }

    throw new HttpError(401, 'Credenciais inválidas');
  } catch (err) {
    next(err);
  }
});

module.exports = router;
