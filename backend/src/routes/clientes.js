const express = require('express');
const { getDb } = require('../database');
const { HttpError } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * Helper: formata objeto cliente para JSON (camelCase)
 */
function formatCliente(row) {
  return {
    id: row.id,
    nome: row.nome,
    telefone: row.telefone,
    email: row.email,
    criadoEm: row.criado_em,
  };
}

/**
 * GET /api/clientes
 * Lista todos ordenados por nome
 */
router.get('/', (req, res, next) => {
  try {
    const db = getDb();
    const rows = db.prepare('SELECT * FROM clientes ORDER BY nome').all();
    res.json(rows.map(formatCliente));
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/clientes/paginado?busca=&page=0&size=10
 * Lista paginada com busca opcional — retorna formato compatível com Spring Page
 */
router.get('/paginado', (req, res, next) => {
  try {
    const db = getDb();
    const busca = req.query.busca || '';
    const page = parseInt(req.query.page) || 0;
    const size = parseInt(req.query.size) || 10;
    const offset = page * size;

    const buscaLike = `%${busca}%`;

    const totalResult = db.prepare(
      'SELECT COUNT(*) as total FROM clientes WHERE nome LIKE ? COLLATE NOCASE OR telefone LIKE ?'
    ).get(buscaLike, buscaLike);

    const totalElements = totalResult.total;
    const totalPages = Math.ceil(totalElements / size);

    const rows = db.prepare(
      'SELECT * FROM clientes WHERE nome LIKE ? COLLATE NOCASE OR telefone LIKE ? ORDER BY nome LIMIT ? OFFSET ?'
    ).all(buscaLike, buscaLike, size, offset);

    res.json({
      content: rows.map(formatCliente),
      totalElements,
      totalPages,
      number: page,
      size,
      first: page === 0,
      last: page >= totalPages - 1,
      empty: rows.length === 0,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/clientes/buscar?nome=
 */
router.get('/buscar', (req, res, next) => {
  try {
    const db = getDb();
    const nome = req.query.nome || '';
    const rows = db.prepare(
      'SELECT * FROM clientes WHERE nome LIKE ? COLLATE NOCASE ORDER BY nome'
    ).all(`%${nome}%`);
    res.json(rows.map(formatCliente));
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/clientes/:id
 */
router.get('/:id', (req, res, next) => {
  try {
    const db = getDb();
    const row = db.prepare('SELECT * FROM clientes WHERE id = ?').get(req.params.id);
    if (!row) throw new HttpError(404, 'Cliente não encontrado');
    res.json(formatCliente(row));
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/clientes/:id/historico
 * Retorna o histórico de agendamentos de um cliente
 */
router.get('/:id/historico', (req, res, next) => {
  try {
    const db = getDb();
    const rows = db.prepare(`
      SELECT
        a.id, a.data_hora, a.status, a.observacoes, a.criado_em,
        a.cliente_id, c.nome as cliente_nome, c.telefone as cliente_telefone, c.email as cliente_email, c.criado_em as cliente_criado_em,
        a.profissional_id, pr.nome as profissional_nome, pr.especialidades as profissional_especialidades, pr.ativo as profissional_ativo,
        pr.horario_inicio as profissional_horario_inicio, pr.horario_fim as profissional_horario_fim,
        pr.almoco_inicio as profissional_almoco_inicio, pr.almoco_fim as profissional_almoco_fim,
        a.procedimento_id, p.nome as procedimento_nome, p.descricao as procedimento_descricao,
        p.duracao_minutos as procedimento_duracao_minutos, p.preco as procedimento_preco, p.ativo as procedimento_ativo
      FROM agendamentos a
      LEFT JOIN clientes c ON a.cliente_id = c.id
      LEFT JOIN profissionais pr ON a.profissional_id = pr.id
      LEFT JOIN procedimentos p ON a.procedimento_id = p.id
      WHERE a.cliente_id = ?
      ORDER BY a.data_hora DESC
    `).all(req.params.id);

    res.json(rows.map(row => ({
      id: row.id,
      dataHora: row.data_hora,
      status: row.status,
      observacoes: row.observacoes,
      criadoEm: row.criado_em,
      cliente: {
        id: row.cliente_id,
        nome: row.cliente_nome,
        telefone: row.cliente_telefone,
        email: row.cliente_email,
        criadoEm: row.cliente_criado_em,
      },
      profissional: {
        id: row.profissional_id,
        nome: row.profissional_nome,
        especialidades: row.profissional_especialidades,
        ativo: row.profissional_ativo === 1,
        horarioInicio: row.profissional_horario_inicio || '08:00',
        horarioFim: row.profissional_horario_fim || '18:00',
        almocoInicio: row.profissional_almoco_inicio,
        almocoFim: row.profissional_almoco_fim,
      },
      procedimento: {
        id: row.procedimento_id,
        nome: row.procedimento_nome,
        descricao: row.procedimento_descricao,
        duracaoMinutos: row.procedimento_duracao_minutos,
        preco: row.procedimento_preco,
        ativo: row.procedimento_ativo === 1,
      },
    })));
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/clientes
 */
router.post('/', (req, res, next) => {
  try {
    const db = getDb();
    const { nome, telefone, email } = req.body;

    if (!nome || !nome.trim()) throw new HttpError(400, 'Nome é obrigatório');
    if (!telefone || !telefone.trim()) throw new HttpError(400, 'Telefone é obrigatório');

    const result = db.prepare(
      'INSERT INTO clientes (nome, telefone, email) VALUES (?, ?, ?)'
    ).run(nome, telefone, email || null);

    const row = db.prepare('SELECT * FROM clientes WHERE id = ?').get(result.lastInsertRowid);
    res.json(formatCliente(row));
  } catch (err) {
    next(err);
  }
});

/**
 * PUT /api/clientes/:id
 */
router.put('/:id', (req, res, next) => {
  try {
    const db = getDb();
    const existing = db.prepare('SELECT * FROM clientes WHERE id = ?').get(req.params.id);
    if (!existing) throw new HttpError(404, 'Cliente não encontrado');

    const { nome, telefone, email } = req.body;
    db.prepare(
      'UPDATE clientes SET nome = ?, telefone = ?, email = ? WHERE id = ?'
    ).run(nome, telefone, email || null, req.params.id);

    const row = db.prepare('SELECT * FROM clientes WHERE id = ?').get(req.params.id);
    res.json(formatCliente(row));
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/clientes/:id
 */
router.delete('/:id', (req, res, next) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM clientes WHERE id = ?').run(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
