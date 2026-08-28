const express = require('express');
const { getDb } = require('../database');
const { HttpError } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * Helper: formata profissional com lista de procedimentos vinculados
 */
function formatProfissional(row, db) {
  const procedimentos = db.prepare(`
    SELECT p.* FROM procedimentos p
    JOIN profissional_procedimento pp ON p.id = pp.procedimento_id
    WHERE pp.profissional_id = ?
  `).all(row.id);

  return {
    id: row.id,
    nome: row.nome,
    especialidades: row.especialidades,
    ativo: row.ativo === 1,
    horarioInicio: row.horario_inicio || '08:00',
    horarioFim: row.horario_fim || '18:00',
    almocoInicio: row.almoco_inicio,
    almocoFim: row.almoco_fim,
    procedimentos: procedimentos.map(p => ({
      id: p.id,
      nome: p.nome,
      descricao: p.descricao,
      duracaoMinutos: p.duracao_minutos,
      preco: p.preco,
      ativo: p.ativo === 1,
    })),
  };
}

/**
 * GET /api/profissionais
 * Lista ativos apenas
 */
router.get('/', (req, res, next) => {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM profissionais WHERE ativo = 1 ORDER BY nome').all();
    res.json(rows.map(row => formatProfissional(row, db)));
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/profissionais/todos
 */
router.get('/todos', (req, res, next) => {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM profissionais ORDER BY nome').all();
    res.json(rows.map(row => formatProfissional(row, db)));
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/profissionais/:id
 */
router.get('/:id', (req, res, next) => {
  try {
    const db = getDb();
    const row = db.prepare('SELECT * FROM profissionais WHERE id = ?').get(req.params.id);
    if (!row) throw new HttpError(404, 'Profissional não encontrado');
    res.json(formatProfissional(row, db));
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/profissionais/por-procedimento/:procedimentoId
 * Filtra profissionais ativos que realizam um procedimento específico
 */
router.get('/por-procedimento/:procedimentoId', (req, res, next) => {
  try {
    const db = getDb();
    const rows = db.prepare(`
      SELECT DISTINCT pr.* FROM profissionais pr
      JOIN profissional_procedimento pp ON pr.id = pp.profissional_id
      WHERE pr.ativo = 1 AND pp.procedimento_id = ?
      ORDER BY pr.nome
    `).all(req.params.procedimentoId);
    res.json(rows.map(row => formatProfissional(row, db)));
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/profissionais
 */
router.post('/', (req, res, next) => {
  try {
    const db = getDb();
    const { nome, especialidades, horarioInicio, horarioFim, almocoInicio, almocoFim } = req.body;

    if (!nome || !nome.trim()) throw new HttpError(400, 'Nome é obrigatório');

    const result = db.prepare(
      'INSERT INTO profissionais (nome, especialidades, ativo, horario_inicio, horario_fim, almoco_inicio, almoco_fim) VALUES (?, ?, 1, ?, ?, ?, ?)'
    ).run(
      nome,
      especialidades || null,
      horarioInicio || '08:00',
      horarioFim || '18:00',
      almocoInicio || null,
      almocoFim || null
    );

    const row = db.prepare('SELECT * FROM profissionais WHERE id = ?').get(result.lastInsertRowid);
    res.json(formatProfissional(row, db));
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/profissionais/:id
 */
router.put('/:id', (req, res, next) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM profissionais WHERE id = ?').get(req.params.id);
    if (!existing) throw new HttpError(404, 'Profissional não encontrado');

    const { nome, especialidades, ativo, horarioInicio, horarioFim, almocoInicio, almocoFim } = req.body;

    db.prepare(`
      UPDATE profissionais SET
        nome = ?,
        especialidades = ?,
        ativo = ?,
        horario_inicio = ?,
        horario_fim = ?,
        almoco_inicio = ?,
        almoco_fim = ?
      WHERE id = ?
    `).run(
      nome,
      especialidades || null,
      ativo != null ? (ativo ? 1 : 0) : existing.ativo,
      horarioInicio || existing.horario_inicio,
      horarioFim || existing.horario_fim,
      almocoInicio !== undefined ? almocoInicio : existing.almoco_inicio,
      almocoFim !== undefined ? almocoFim : existing.almoco_fim,
      req.params.id
    );

    const row = db.prepare('SELECT * FROM profissionais WHERE id = ?').get(req.params.id);
    res.json(formatProfissional(row, db));
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/profissionais/:id/procedimentos
 * Vincula procedimentos ao profissional
 */
router.put('/:id/procedimentos', (req, res, next) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM profissionais WHERE id = ?').get(req.params.id);
    if (!existing) throw new HttpError(404, 'Profissional não encontrado');

    const { procedimentoIds } = req.body;

    // Remove vínculos atuais e insere novos
    const updateProcedimentos = db.transaction((profId, ids) => {
      db.prepare('DELETE FROM profissional_procedimento WHERE profissional_id = ?').run(profId);

      if (ids && ids.length > 0) {
        const insert = db.prepare(
          'INSERT INTO profissional_procedimento (profissional_id, procedimento_id) VALUES (?, ?)'
        );
        for (const procId of ids) {
          insert.run(profId, procId);
        }
      }
    });

    updateProcedimentos(parseInt(req.params.id), procedimentoIds || []);
    res.status(200).send();
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/profissionais/:id
 * Soft delete: marca como inativo
 */
router.delete('/:id', (req, res, next) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM profissionais WHERE id = ?').get(req.params.id);
    if (!existing) throw new HttpError(404, 'Profissional não encontrado');

    db.prepare('UPDATE profissionais SET ativo = 0 WHERE id = ?').run(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
