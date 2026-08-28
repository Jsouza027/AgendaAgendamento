const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');

let db;

function hashPassword(password) {
  return crypto.createHash('sha256').update(password).digest('base64');
}

function getDb() {
  if (db) return db;

  const dbPath = process.env.DB_PATH || './data/salao.db';
  const dbDir = path.dirname(dbPath);

  // Cria o diretório se não existir
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  db = new Database(dbPath);

  // Habilita WAL mode para melhor performance
  db.pragma('journal_mode = WAL');
  db.pragma('foreign_keys = ON');

  createTables();
  seedData();

  return db;
}

function createTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS usuarios (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      token TEXT
    );

    CREATE TABLE IF NOT EXISTS clientes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      telefone TEXT NOT NULL,
      email TEXT,
      criado_em TEXT DEFAULT (datetime('now', 'localtime'))
    );

    CREATE TABLE IF NOT EXISTS procedimentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      descricao TEXT,
      duracao_minutos INTEGER NOT NULL,
      preco REAL NOT NULL,
      ativo INTEGER DEFAULT 1
    );

    CREATE TABLE IF NOT EXISTS profissionais (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      nome TEXT NOT NULL,
      especialidades TEXT,
      ativo INTEGER DEFAULT 1,
      horario_inicio TEXT DEFAULT '08:00',
      horario_fim TEXT DEFAULT '18:00',
      almoco_inicio TEXT,
      almoco_fim TEXT
    );

    CREATE TABLE IF NOT EXISTS profissional_procedimento (
      profissional_id INTEGER NOT NULL,
      procedimento_id INTEGER NOT NULL,
      PRIMARY KEY (profissional_id, procedimento_id),
      FOREIGN KEY (profissional_id) REFERENCES profissionais(id),
      FOREIGN KEY (procedimento_id) REFERENCES procedimentos(id)
    );

    CREATE TABLE IF NOT EXISTS agendamentos (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      cliente_id INTEGER NOT NULL,
      profissional_id INTEGER NOT NULL,
      procedimento_id INTEGER NOT NULL,
      data_hora TEXT NOT NULL,
      status TEXT DEFAULT 'PENDENTE' CHECK(status IN ('PENDENTE','CONFIRMADO','CONCLUIDO','CANCELADO','FALTOU')),
      observacoes TEXT,
      criado_em TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (cliente_id) REFERENCES clientes(id),
      FOREIGN KEY (profissional_id) REFERENCES profissionais(id),
      FOREIGN KEY (procedimento_id) REFERENCES procedimentos(id)
    );
  `);
}

function seedData() {
  // Cria o usuário admin se não existir
  const existente = db.prepare('SELECT id FROM usuarios WHERE username = ?').get('salao.bella');
  if (!existente) {
    db.prepare('INSERT INTO usuarios (username, password) VALUES (?, ?)')
      .run('salao.bella', hashPassword('esp@cobella'));
    console.log('==> Usuário admin "salao.bella" criado com sucesso!');
  } else {
    console.log('==> Usuário admin "salao.bella" já existe. Nenhuma ação necessária.');
  }

  // Inicializa Procedimentos padrões se a tabela estiver vazia
  const countProc = db.prepare('SELECT COUNT(*) as count FROM procedimentos').get();
  if (countProc.count === 0) {
    const insertProc = db.prepare(
      'INSERT INTO procedimentos (nome, descricao, duracao_minutos, preco) VALUES (?, ?, ?, ?)'
    );

    const procedimentos = [
      ['Manicure', 'Esmaltação e cuidados com as unhas das mãos', 60, 45.00],
      ['Pedicure', 'Esmaltação e cuidados com as unhas dos pés', 60, 50.00],
      ['Gel/Acrigel', 'Alongamento e reconstrução de unhas', 120, 150.00],
      ['Escova Progressiva', 'Alisamento e hidratação dos fios', 180, 200.00],
      ['Escova Simples', 'Modelagem e brilho dos fios', 60, 70.00],
      ['Chapinha', 'Alisamento temporário com prancha', 45, 55.00],
      ['Corte Feminino', 'Corte e finalização', 60, 80.00],
      ['Coloração', 'Pintura completa dos fios', 120, 180.00],
      ['Hidratação', 'Tratamento profundo para os fios', 90, 90.00],
    ];

    const insertMany = db.transaction((items) => {
      for (const item of items) {
        insertProc.run(...item);
      }
    });
    insertMany(procedimentos);
    console.log('==> Procedimentos iniciais inseridos com sucesso!');
  }

  // Inicializa Profissionais padrões se a tabela estiver vazia
  const countProf = db.prepare('SELECT COUNT(*) as count FROM profissionais').get();
  if (countProf.count === 0) {
    const insertProf = db.prepare(
      'INSERT INTO profissionais (nome, especialidades) VALUES (?, ?)'
    );

    const profissionais = [
      ['Ana Paula', 'Manicure, Pedicure, Gel'],
      ['Carla Souza', 'Escova, Chapinha, Corte'],
      ['Juliana Lima', 'Coloração, Hidratação, Escova Progressiva'],
    ];

    const insertMany = db.transaction((items) => {
      for (const item of items) {
        insertProf.run(...item);
      }
    });
    insertMany(profissionais);
    console.log('==> Profissionais iniciais inseridos com sucesso!');
  }
}

module.exports = { getDb, hashPassword };
