/* Main application */
const tokenMgr = require("./assets/tokenmgr.js");
const login = require("./assets/login.js");
const { App } = require("./assets/core/app.js");
var application = null;


if (tokenMgr.getToken() === "") {
	console.log("Empty token found.");
	login.show();
	application = new App(tokenMgr.getToken());
} else {
	console.log("There is a token, starting...");
	application = new App(tokenMgr.getToken());
}