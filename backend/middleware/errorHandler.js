const { ZodError } = require('zod');
const multer = require('multer');
const AppError = require('../utils/AppError');

const notFound = (_req, _res, next) => next(new AppError(404, 'That page was not found.'));

// Never leaks stack traces to the client.
// eslint-disable-next-line no-unused-vars
const errorHandler = (err, _req, res, _next) => {
  if (err instanceof ZodError) {
    const first = err.issues[0];
    return res.status(400).json({
      error: {
        message: first?.message || 'Some details look wrong. Please check and try again.',
        fields: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })),
      },
    });
  }
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: { message: err.message, code: err.code } });
  }
  if (err instanceof multer.MulterError) {
    const message =
      err.code === 'LIMIT_FILE_SIZE'
        ? 'That photo is too large. Please use a photo under 5 MB.'
        : 'We could not read that upload. Please try again.';
    return res.status(err.code === 'LIMIT_FILE_SIZE' ? 413 : 400).json({ error: { message } });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: { message: 'We could not understand that request.' } });
  }
  if (err.name === 'CastError') {
    return res.status(400).json({ error: { message: 'That item could not be found.' } });
  }
  if (err.code === 11000) {
    return res.status(409).json({ error: { message: 'That already exists.' } });
  }
  console.error(err); // full detail stays in the server log only
  return res.status(500).json({ error: { message: 'Something went wrong on our side. Please try again.' } });
};

module.exports = { notFound, errorHandler };
