const validator = require("validator");

// Ruoli e opzioni password rimangono invariati
const ALLOWED_ROLES = ["general", "admin"];
const PW_OPTIONS = {
  minLength: 8,
  minLowercase: 1,
  minUppercase: 1,
  minNumbers: 1,
  minSymbols: 1,
};

// Validazione email
function validateEmail(email) {
  if (!email) return "Email is required.";
  if (!validator.isEmail(email)) return "Email is not valid.";
}

// Validazione password
function validatePassword(password) {
  if (!password) return "Password is required.";
  if (!validator.isStrongPassword(password, PW_OPTIONS))
    return (
      "Password not strong enough " +
      `(min ${PW_OPTIONS.minLength} chars, upper, lower, number, symbol).`
    );
}

// Validazione ruolo
function validateRole(role) {
  if (role && !ALLOWED_ROLES.includes(role))
    return `Role must be one of: ${ALLOWED_ROLES.join(", ")}.`;
}

// Funzione generica per nomi
function validateName(name, fieldName) {
  if (name === undefined || name === null || name === "") {
    return `${fieldName} is required.`;
  }
  if (typeof name !== "string") {
    return `${fieldName} must be a string.`;
  }
  const trimmed = name.trim();
  if (trimmed.length < 2) {
    return `${fieldName} must be at least 2 characters.`;
  }
  if (trimmed.length > 30) {
    return `${fieldName} must be at most 30 characters.`;
  }
  // Solo lettere (Unicode) spazi, apostrofi e trattini
  const nameRegex = /^[\p{L}\s'-]+$/u;
  if (!nameRegex.test(trimmed)) {
    return `${fieldName} contains invalid characters.`;
  }
}

// Wrapper specifici
function validateFirstName(firstName) {
  return validateName(firstName, "firstName");
}

function validateLastName(lastName) {
  return validateName(lastName, "lastName");
}

// Validazione bio (opzionale, ma se presente non supera i 160 caratteri)
function validateBio(bio) {
  if (bio === undefined || bio === null || bio === "") {
    return; // ok, è opzionale
  }
  if (typeof bio !== "string") {
    return "Bio must be a string.";
  }
  if (bio.trim().length > 160) {
    return "Bio must be at most 160 characters.";
  }
}

// Validazione profileImage (opzionale, ma se presente deve essere un URL valido)
function validateProfileImage(url) {
  if (url === undefined || url === null || url === "") {
    return; // ok, fallback al default
  }
  if (typeof url !== "string") {
    return "Profile image URL must be a string.";
  }
  if (
    !validator.isURL(url, {
      protocols: ["http", "https"],
      require_protocol: true,
    })
  ) {
    return "Profile image must be a valid URL (http/https).";
  }
}

module.exports = {
  validateEmail,
  validatePassword,
  validateRole,
  validateFirstName,
  validateLastName,
  validateBio,
  validateProfileImage,
};
