// middleware/userValidation.js
const ApiError = require("../utils/ApiError");
const {
  validateEmail,
  validatePassword,
  validateRole,
  validateFirstName,
  validateLastName,
  validateBio,
  validateProfileImage,
} = require("../utils/validators");

function validateUserLogIn(req, res, next) {
  const { email, password } = req.body;
  const errors = [validateEmail(email), validatePassword(password)];

  const filtered = errors.filter(Boolean);
  if (filtered.length) throw new ApiError(400, filtered);
  next();
}

function validateUser(req, res, next) {
  const { email, password, role, firstName, lastName, bio, profileImage } =
    req.body;
  const errors = [
    validateEmail(email),
    validatePassword(password),
    validateRole(role), // ← validiamo qui
    validateFirstName(firstName),
    validateLastName(lastName),
    validateBio(bio),
    validateProfileImage(profileImage),
  ];

  if (role === "admin") {
    errors.pop();
    errors.pop();
    errors.pop();
    errors.pop();
  }

  const filtered = errors.filter(Boolean);
  if (filtered.length) throw new ApiError(400, filtered);
  next();
}

async function validateUserUpdate(req, res, next) {
  const {
    role,
    email,
    password,
    isActive,
    firstName,
    lastName,
    bio,
    profileImage,
  } = req.body;
  const errors = [];

  // blocco tentativi di cambiare role
  if (role !== undefined) {
    errors.push("Role cannot be changed once set.");
  }

  if (email) errors.push(validateEmail(email));
  if (password) errors.push(validatePassword(password));
  if (isActive !== undefined && typeof isActive !== "boolean") {
    errors.push("isActive must be boolean.");
  }

  if (firstName !== undefined) errors.push(validateFirstName(firstName));
  if (lastName !== undefined) errors.push(validateLastName(lastName));
  if (bio !== undefined) errors.push(validateBio(bio));
  if (profileImage !== undefined)
    errors.push(validateProfileImage(profileImage));

  const filtered = errors.filter(Boolean);
  if (filtered.length) throw new ApiError(400, filtered);
  next();
}

module.exports = {
  validateUserLogIn,
  validateUser,
  validateUserUpdate,
};
