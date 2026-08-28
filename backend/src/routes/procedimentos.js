const express = require('express');
const { getDb } = require('../database');
const { HttpError } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * Helper: formata objeto procedimento para JSON (camelCase)
 */
function formatProcedimento(row) {
  return {
    id: row.id,
    nome: row.nome,
    descricao: row.descricao,
    duracaoMinutos: row.duracao_minutos,
    preco: row.preco,
    ativo: row.ativo === 1,
  };
}

/**
 * GET /api/procedimentos
 * Lista ativos apenas
 */
router.get('/', (req, res, next) => {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM procedimentos WHERE ativo = 1 ORDER BY nome').all();
    res.json(rows.map(formatProcedimento));
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/procedimentos/todos
 * Lista todos (incluindo inativos)
 */
router.get('/todos', (req, res, next) => {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM procedimentos ORDER BY nome').all();
    res.json(rows.map(formatProcedimento));
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/procedimentos/:id
 */
router.get('/:id', (req, res, next) => {
  try {
    const db = getDb();
    const row = db.prepare('SELECT * FROM procedimentos WHERE id = ?').get(req.params.id);
    if (!row) throw new HttpError(404, 'Procedimento não encontrado');
    res.json(formatProcedimento(row));
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/procedimentos
 */
router.post('/', (req, res, next) => {
  try {
    const db = getDb();
    const { nome, descricao, duracaoMinutos, preco } = req.body;

    if (!nome || !nome.trim()) throw new HttpError(400, 'Nome é obrigatório');
    if (preco == null) throw new HttpError(400, 'Preço é obrigatório');
    if (duracaoMinutos == null) throw new HttpError(400, 'Duração é obrigatória');

    const result = db.prepare(
      'INSERT INTO procedimentos (nome, descricao, duracao_minutos, preco, ativo) VALUES (?, ?, ?, ?, 1)'
    ).run(nome, descricao || null, duracaoMinutos, preco);

    const row = db.prepare('SELECT * FROM procedimentos WHERE id = ?').get(result.lastInsertRowid);
    res.json(formatProcedimento(row));
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/procedimentos/:id
 */
router.put('/:id', (req, res, next) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM procedimentos WHERE id = ?').get(req.params.id);
    if (!existing) throw new HttpError(404, 'Procedimento não encontrado');

    const { nome, descricao, duracaoMinutos, preco, ativo } = req.body;

    db.prepare(
      'UPDATE procedimentos SET nome = ?, descricao = ?, duracao_minutos = ?, preco = ?, ativo = ? WHERE id = ?'
    ).run(
      nome,
      descricao || null,
      duracaoMinutos,
      preco,
      ativo != null ? (ativo ? 1 : 0) : existing.ativo,
      req.params.id
    );

    const row = db.prepare('SELECT * FROM procedimentos WHERE id = ?').get(req.params.id);
    res.json(formatProcedimento(row));
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/procedimentos/:id
 * Soft delete: marca como inativo
 */
router.delete('/:id', (req, res, next) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM procedimentos WHERE id = ?').get(req.params.id);
    if (!existing) throw new HttpError(404, 'Procedimento não encontrado');

    db.prepare('UPDATE procedimentos SET ativo = 0 WHERE id = ?').run(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
