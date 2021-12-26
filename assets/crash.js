const { ErrLevel, ErrApp } = require("./assets/error.js");

const critical = e => {
    var err = new ErrApp(ErrLevel.critical, "Termcord has crashed: " + e);
    err.show();
};

module.exports = { critical };