const reteLimit = require("express-rate-limit");
const { logEvents } = require("./logger");

const loginLimiter = reteLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // Limit each IP to 5 login requests per `window` per minute
  message: {
    message: `Too many login attemps from this IP, please try again after a 60 second pause`,
  },
  handler: (req, res, next, options) => {
    logEvents(
      `Too Many Requests: ${options.message.message}\t${req.method}\t${req.url}\t${req.eaders.origin}`,
      "errLog.log"
    );
    res.status(options.statusCode).send(options.message);
  },
  standardHeaders: true,
  legacyHeaders: true,
});

module.exports = loginLimiter;
