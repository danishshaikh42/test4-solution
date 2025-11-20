const notFound = (req, res, next) => {
  const err = new Error('Route Not Found');
  err.status = 404;
  next(err);
}

// Generic error handler for Express
const errorHandler = (err, req, res, next) => {
  const status = err.status || 500;
  const payload = { error: err.message || 'Internal Server Error' };
  // In production you might hide stack traces; here we return minimal info
  res.status(status).json(payload);
};

module.exports = { notFound, errorHandler };