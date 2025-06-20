class ApiError extends Error {
  constructor(status, errors) {
    super();
    this.status = status;
    // sempre un array di stringhe
    this.errors = Array.isArray(errors) ? errors : [errors];
  }
}
module.exports = ApiError;
