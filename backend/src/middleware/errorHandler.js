const ApiError = require("./utils/ApiError");

module.exports = (err, req, res, next) => {
  if (err instanceof ApiError)
    return res.status(err.status).json({ errors: err.errors });

  console.error(err);
  res.status(500).json({ errors: ["Internal server error"] });
};
