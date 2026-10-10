// An error whose message is safe to show to the user.
class AppError extends Error {
  constructor(status, message, code) {
    super(message);
    this.status = status;
    this.code = code;
  }
}
module.exports = AppError;
