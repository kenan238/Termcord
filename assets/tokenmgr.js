const file = require("./file.js");

const getToken = () => {
	var tokenFile = new file.fileStream("assets/data/token.txt");
	return tokenFile.readFile();
}
const changeToken = (token) => {
	var tokenFile = new file.fileStream("assets/data/token.txt");
	tokenFile.writeFile(token);
}

module.exports = {
	getToken,
	changeToken
};