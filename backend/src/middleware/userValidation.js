const {
  validateEmail,
  validatePassword,
  validateRole,
} = require("../utils/validators");

// per POST /users
function validateUser(req, res, next) {
  const { email, password, role } = req.body;
  const errors = [
    validateEmail(email),
    validatePassword(password),
    validateRole(role),
  ].filter(Boolean);

  if (errors.length) return res.status(400).json({ errors });
  next();
}

// per PATCH /users/:id
function validateUserUpdate(req, res, next) {
  const { email, password, role, isActive } = req.body;
  const errors = [
    email ? validateEmail(email) : undefined,
    password ? validatePassword(password) : undefined,
    role ? validateRole(role) : undefined,
    isActive !== undefined && typeof isActive !== "boolean"
      ? "isActive must be boolean."
      : undefined,
  ].filter(Boolean);

  if (errors.length) return res.status(400).json({ errors });
  next();
}

module.exports = {
  validateUser,
  validateUserUpdate,
};
