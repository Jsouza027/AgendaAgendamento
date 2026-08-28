require('dotenv').config();

const express = require('express');
const cors = require('cors');
const { getDb } = require('./database');
const authMiddleware = require('./middleware/auth');
const { errorHandler } = require('./middleware/errorHandler');

// Rotas
const authRoutes = require('./routes/auth');
const clientesRoutes = require('./routes/clientes');
const procedimentosRoutes = require('./routes/procedimentos');
const profissionaisRoutes = require('./routes/profissionais');
const agendamentosRoutes = require('./routes/agendamentos');

const app = express();
const PORT = process.env.PORT || 8080;

// ==================== Middlewares ====================

// CORS — permite todas as origens (equivalente ao CorsConfig.java)
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

// Parse JSON
app.use(express.json());

// Autenticação (aplica antes das rotas)
app.use(authMiddleware);

// ==================== Rotas ====================

app.use('/api/auth', authRoutes);
app.use('/api/clientes', clientesRoutes);
app.use('/api/procedimentos', procedimentosRoutes);
app.use('/api/profissionais', profissionaisRoutes);
app.use('/api/agendamentos', agendamentosRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ==================== Error Handler ====================

app.use(errorHandler);

// ==================== Inicialização ====================

// Inicializa o banco de dados
getDb();

app.listen(PORT, () => {
  console.log(`\n🚀 Servidor rodando em http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/health`);
  console.log(`📁 Banco de dados: ${process.env.DB_PATH || './data/salao.db'}\n`);
});
