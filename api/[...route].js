const app = require('../server/app.cjs');

module.exports = (req, res) => {
  return app(req, res);
};

