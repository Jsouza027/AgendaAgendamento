const express = require('express');
const { getDb } = require('../database');
const { HttpError } = require('../middleware/errorHandler');

const router = express.Router();

/**
 * Helper: monta objeto agendamento com dados aninhados (cliente, profissional, procedimento)
 */
function buildAgendamentoObj(row) {
  return {
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
  };
}

const AGENDAMENTO_JOIN_SQL = `
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
`;

/**
 * GET /api/agendamentos?data=YYYY-MM-DD
 * Lista agendamentos de um dia (default: hoje)
 */
router.get('/', (req, res, next) => {
  try {
    const db = getDb();
    const data = req.query.data || new Date().toISOString().split('T')[0];
    const inicio = `${data} 00:00:00`;
    const fim = `${data} 23:59:59`;

    const rows = db.prepare(
      `${AGENDAMENTO_JOIN_SQL} WHERE a.data_hora BETWEEN ? AND ? ORDER BY a.data_hora ASC`
    ).all(inicio, fim);

    res.json(rows.map(buildAgendamentoObj));
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/agendamentos/todos
 */
router.get('/todos', (req, res, next) => {
  try {
    const db = getDb();
    const rows = db.prepare(`${AGENDAMENTO_JOIN_SQL} ORDER BY a.data_hora DESC`).all();
    res.json(rows.map(buildAgendamentoObj));
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/agendamentos/cliente/:id
 */
router.get('/cliente/:id', (req, res, next) => {
  try {
    const db = getDb();
    const rows = db.prepare(
      `${AGENDAMENTO_JOIN_SQL} WHERE a.cliente_id = ? ORDER BY a.data_hora DESC`
    ).all(req.params.id);
    res.json(rows.map(buildAgendamentoObj));
  } catch (err) {
    next(err);
  }
});

/**
 * GET /api/agendamentos/dashboard-stats
 */
router.get('/dashboard-stats', (req, res, next) => {
  try {
    const db = getDb();
    const hoje = new Date().toISOString().split('T')[0];
    const inicioDia = `${hoje} 00:00:00`;
    const fimDia = `${hoje} 23:59:59`;

    // Primeiro dia do mês e último dia do mês
    const now = new Date();
    const inicioMes = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01 00:00:00`;
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    const fimMes = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(lastDay).padStart(2, '0')} 23:59:59`;

    // Faturamento do dia (CONFIRMADO + CONCLUIDO)
    const fatDia = db.prepare(`
      SELECT COALESCE(SUM(p.preco), 0) as total
      FROM agendamentos a
      JOIN procedimentos p ON a.procedimento_id = p.id
      WHERE a.data_hora BETWEEN ? AND ? AND a.status IN ('CONFIRMADO', 'CONCLUIDO')
    `).get(inicioDia, fimDia);

    // Faturamento do mês
    const fatMes = db.prepare(`
      SELECT COALESCE(SUM(p.preco), 0) as total
      FROM agendamentos a
      JOIN procedimentos p ON a.procedimento_id = p.id
      WHERE a.data_hora BETWEEN ? AND ? AND a.status IN ('CONFIRMADO', 'CONCLUIDO')
    `).get(inicioMes, fimMes);

    // Contagens do dia
    const totalHoje = db.prepare(
      'SELECT COUNT(*) as count FROM agendamentos WHERE data_hora BETWEEN ? AND ?'
    ).get(inicioDia, fimDia);

    const confirmadosHoje = db.prepare(
      "SELECT COUNT(*) as count FROM agendamentos WHERE data_hora BETWEEN ? AND ? AND status = 'CONFIRMADO'"
    ).get(inicioDia, fimDia);

    const pendentesHoje = db.prepare(
      "SELECT COUNT(*) as count FROM agendamentos WHERE data_hora BETWEEN ? AND ? AND status = 'PENDENTE'"
    ).get(inicioDia, fimDia);

    // Top procedimentos do mês
    const topProcedimentos = db.prepare(`
      SELECT p.nome, COUNT(*) as count
      FROM agendamentos a
      JOIN procedimentos p ON a.procedimento_id = p.id
      WHERE a.data_hora BETWEEN ? AND ? AND a.status != 'CANCELADO' AND a.procedimento_id IS NOT NULL
      GROUP BY p.nome
      ORDER BY count DESC
      LIMIT 5
    `).all(inicioMes, fimMes);

    res.json({
      faturamentoDia: fatDia.total,
      faturamentoMes: fatMes.total,
      totalHoje: totalHoje.count,
      confirmadosHoje: confirmadosHoje.count,
      pendentesHoje: pendentesHoje.count,
      topProcedimentos,
    });
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/agendamentos
 */
router.post('/', (req, res, next) => {
  try {
    const db = getDb();
    const { clienteId, profissionalId, procedimentoId, dataHora, observacoes } = req.body;

    if (!clienteId || !profissionalId || !procedimentoId || !dataHora) {
      throw new HttpError(400, 'Campos obrigatórios: clienteId, profissionalId, procedimentoId, dataHora.');
    }

    // Normaliza dataHora
    let dataHoraNorm = dataHora;
    if (dataHoraNorm.length === 16) {
      dataHoraNorm += ':00';
    } else if (dataHoraNorm.length > 19) {
      dataHoraNorm = dataHoraNorm.substring(0, 19);
    }
    // Converte formato ISO "T" para espaço para SQLite
    const dataHoraDb = dataHoraNorm.replace('T', ' ');

    // Busca entidades
    const cliente = db.prepare('SELECT * FROM clientes WHERE id = ?').get(clienteId);
    if (!cliente) throw new HttpError(404, 'Cliente não encontrado');

    const prof = db.prepare('SELECT * FROM profissionais WHERE id = ?').get(profissionalId);
    if (!prof) throw new HttpError(404, 'Profissional não encontrado');

    const proc = db.prepare('SELECT * FROM procedimentos WHERE id = ?').get(procedimentoId);
    if (!proc) throw new HttpError(404, 'Procedimento não encontrado');

    // Valida expediente
    const horaStr = dataHoraNorm.includes('T')
      ? dataHoraNorm.split('T')[1].substring(0, 5)
      : dataHoraNorm.split(' ')[1].substring(0, 5);

    const [horaH, horaM] = horaStr.split(':').map(Number);
    const horaMinutos = horaH * 60 + horaM;
    const fimAgMinutos = horaMinutos + proc.duracao_minutos;

    const horarioInicio = prof.horario_inicio || '08:00';
    const horarioFim = prof.horario_fim || '18:00';
    const [iniH, iniM] = horarioInicio.split(':').map(Number);
    const [fimH, fimM] = horarioFim.split(':').map(Number);
    const inicioExpMinutos = iniH * 60 + iniM;
    const fimExpMinutos = fimH * 60 + fimM;

    if (horaMinutos < inicioExpMinutos || fimAgMinutos > fimExpMinutos) {
      throw new HttpError(409, `Horário fora do expediente do profissional (${horarioInicio} às ${horarioFim}).`);
    }

    // Valida intervalo de almoço
    if (prof.almoco_inicio && prof.almoco_fim) {
      const [alIniH, alIniM] = prof.almoco_inicio.split(':').map(Number);
      const [alFimH, alFimM] = prof.almoco_fim.split(':').map(Number);
      const alIniMin = alIniH * 60 + alIniM;
      const alFimMin = alFimH * 60 + alFimM;

      if (horaMinutos < alFimMin && fimAgMinutos > alIniMin) {
        throw new HttpError(409, `Horário conflita com o intervalo de almoço do profissional (${prof.almoco_inicio} às ${prof.almoco_fim}).`);
      }
    }

    // Valida conflito com agendamentos existentes
    const dataStr = dataHoraDb.split(' ')[0];
    const inicioDia = `${dataStr} 00:00:00`;
    const fimDia = `${dataStr} 23:59:59`;

    const agsDia = db.prepare(`
      SELECT a.*, p.duracao_minutos as proc_duracao
      FROM agendamentos a
      LEFT JOIN procedimentos p ON a.procedimento_id = p.id
      WHERE a.profissional_id = ?
        AND a.status NOT IN ('CANCELADO', 'FALTOU')
        AND a.data_hora BETWEEN ? AND ?
    `).all(profissionalId, inicioDia, fimDia);

    for (const ag of agsDia) {
      const durExistente = ag.proc_duracao || 30;
      const agDataHora = ag.data_hora;
      const [agDatePart, agTimePart] = agDataHora.split(' ');
      const [agH, agMi] = agTimePart.split(':').map(Number);
      const agInicioMin = agH * 60 + agMi;
      const agFimMin = agInicioMin + durExistente;

      // Verifica overlap
      if (horaMinutos < agFimMin && fimAgMinutos > agInicioMin) {
        throw new HttpError(409, 'O profissional já possui um agendamento neste horário. Por favor, escolha outro horário.');
      }
    }

    // Cria o agendamento
    const result = db.prepare(
      'INSERT INTO agendamentos (cliente_id, profissional_id, procedimento_id, data_hora, observacoes) VALUES (?, ?, ?, ?, ?)'
    ).run(clienteId, profissionalId, procedimentoId, dataHoraDb, observacoes || '');

    // Retorna o agendamento completo com JOINs
    const row = db.prepare(`${AGENDAMENTO_JOIN_SQL} WHERE a.id = ?`).get(result.lastInsertRowid);
    res.json(buildAgendamentoObj(row));
  } catch (err) {
    next(err);
  }
});

/**
 * PATCH /api/agendamentos/:id/status
 */
router.patch('/:id/status', (req, res, next) => {
  try {
    const db = getDb();
    const { status } = req.body;
    const validStatuses = ['PENDENTE', 'CONFIRMADO', 'CONCLUIDO', 'CANCELADO', 'FALTOU'];

    if (!validStatuses.includes(status)) {
      throw new HttpError(400, `Status inválido. Use: ${validStatuses.join(', ')}`);
    }

    const existing = db.prepare('SELECT id FROM agendamentos WHERE id = ?').get(req.params.id);
    if (!existing) throw new HttpError(404, 'Agendamento não encontrado');

    db.prepare('UPDATE agendamentos SET status = ? WHERE id = ?').run(status, req.params.id);

    const row = db.prepare(`${AGENDAMENTO_JOIN_SQL} WHERE a.id = ?`).get(req.params.id);
    res.json(buildAgendamentoObj(row));
  } catch (err) {
    next(err);
  }
});

/**
 * DELETE /api/agendamentos/:id
 */
router.delete('/:id', (req, res, next) => {
  try {
    const db = getDb();
    db.prepare('DELETE FROM agendamentos WHERE id = ?').run(req.params.id);
    res.status(204).send();
  } catch (err) {
    next(err);
  }
});

module.exports = router;
