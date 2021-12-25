const { fileStream } = require("./file.js");

const path = "assets/data/token.txt";
const getToken = () => {
	var tokenFile = new fileStream(path);
	return tokenFile.readFile();
};
const changeToken = (token) => {
	var tokenFile = new fileStream(path);
	tokenFile.writeFile(token);
};
const isTokenkEmpty = () => {
	var token = getToken();
	var isEmpty = !token || token.length === 0;
	var isBlank = /^\s*$/.test(token)

	return (isEmpty || isBlank);
};

module.exports = {
	getToken,
	changeToken,
	isTokenkEmpty,
	path
};