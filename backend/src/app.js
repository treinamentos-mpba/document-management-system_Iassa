const express = require('express');
const multer = require('multer');
const documentRoutes = require('./routes/documentRoutes');
const { port } = require('./config');

const app = express();

app.use(express.json());
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});
app.use(documentRoutes);

app.use((error, req, res, next) => {
  if (res.headersSent) {
    return next(error);
  }

  let status = 500;
  let code = 'INTERNAL_SERVER_ERROR';
  let message = 'Ocorreu um erro interno.';

  if (error.code === 'USER_REQUIRED' || error.code === 'FILE_REQUIRED') {
    status = 400;
    code = error.code;
    message = error.message;
  } else if (error.code === 'DOCUMENT_NOT_FOUND') {
    status = 404;
    code = error.code;
    message = error.message;
  } else if (error instanceof multer.MulterError) {
    status = error.code === 'LIMIT_FILE_SIZE' ? 413 : 400;
    code = error.code;
    message = status === 413 ? 'O arquivo excede o limite permitido.' : 'Upload inválido.';
  }

  return res.status(status).json({ error: { code, message } });
});

if (require.main === module) {
  app.listen(port, () => {
    console.log(`DMS backend ouvindo na porta ${port}`);
  });
}

module.exports = app;
