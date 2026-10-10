// validate(schema, 'body' | 'query') -> replaces req[source] with the parsed (cleaned) value
module.exports = (schema, source = 'body') => (req, _res, next) => {
  const result = schema.safeParse(req[source]);
  if (!result.success) return next(result.error); // handled in errorHandler
  req[source] = result.data;
  next();
};
