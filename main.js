/* Main application */
const tokenMgr = require("./assets/tokenmgr.js");
const login = require("./assets/login.js");
const { App } = require("./assets/core/app.js");
const { Client, Intents } = require("discord.js");
const crash = require("./assets/crash.js");


var application = null;

const thereIsToken = !tokenMgr.isTokenkEmpty();


if(thereIsToken)
	startApp();
else {
	login.show(startApp);
}

function checkTokenValidity(token) {
	var tempClient = new Client({
		intents: [Intents.FLAGS.GUILDS, Intents.FLAGS.GUILD_MESSAGES],
	});
	try { 
		tempClient.login(token);
	}
	catch(err) { 
		return false;
	}
	return true;
}

function startApp(token) {
	console.log("Launching...");
	console.log("Checking token validity...");
	var tokenValid;
	if (!token)
		token = tokenMgr.getToken();
	tokenValid = checkTokenValidity(token);
	if (tokenValid)
		application = new App(token);
	else {
		crash.critical("Invalid token.");
	}
}