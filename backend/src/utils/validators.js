const validator = require("validator");

const ALLOWED_ROLES = ["general", "admin"];
const PW_OPTIONS = {
  minLength: 8,
  minLowercase: 1,
  minUppercase: 1,
  minNumbers: 1,
  minSymbols: 1,
};

function validateEmail(email) {
  if (!email) return "Email is required.";
  if (!validator.isEmail(email)) return "Email is not valid.";
}

function validatePassword(password) {
  if (!password) return "Password is required.";
  if (!validator.isStrongPassword(password, PW_OPTIONS))
    return (
      "Password not strong enough " +
      `(min ${PW_OPTIONS.minLength} chars, upper, lower, number, symbol).`
    );
}

function validateRole(role) {
  if (role && !ALLOWED_ROLES.includes(role))
    return `Role must be one of: ${ALLOWED_ROLES.join(", ")}.`;
}

module.exports = {
  validateEmail,
  validatePassword,
  validateRole,
};
