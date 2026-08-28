/**
 * Tratamento global de erros.
 * Equivalente ao GlobalExceptionHandler.java do Spring Boot.
 */
function errorHandler(err, req, res, _next) {
  console.error('Erro:', err.message);

  const statusCode = err.statusCode || 500;
  const message = err.statusCode ? err.message : 'Erro interno no servidor.';

  res.status(statusCode).json({
    timestamp: new Date().toISOString(),
    status: statusCode,
    message,
  });
}

/**
 * Classe de erro HTTP customizada para lançar erros com status code.
 */
class HttpError extends Error {
  constructor(statusCode, message) {
    super(message);
    this.statusCode = statusCode;
  }
}

module.exports = { errorHandler, HttpError };
