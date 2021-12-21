/* Login */
const tokenMgr = require("./tokenmgr.js");
const blessed = require("reblessed");
var screen = blessed.screen({
  smartCSR: true
});

module.exports.show = function (callback) {
	screen.title = "Termcord - Login.";

	// make a box in blessed
	var box = blessed.box({
		top: "center",
		left: "center",
		width: "50%",
		height: "50%",
		content: "Enter {bold}bot{/bold} token.",
		tags: true,
		border: {
			type: "line"
		},
		style: {
			fg: "white",
			bg: "black",
			border: {
				fg: "red"
			},
			hover: {
				bg: "purple"
			}
		}
	});

	var input = blessed.textbox({
		parent: box,
		top: "center",
		left: "center",
		width: "50%",
		height: "40%",
		content: "Token",
		tags: true,
		inputOnFocus: true,
		border: {
			type: "line"
		},
		style: {
			fg: "magenta",
			bg: "white",
			border: {
				fg: "green"
			},
			hover: {
				bg: "purple"
			}
		}
	});

	// print something when the input box is submitted (enter key)
	input.on("submit", function (value) {
		console.log("Loading...");
		tokenMgr.changeToken(value);
		setInterval(() => {
			screen.destroy()
			callback();
		}, 1000);
	});

	screen.append(box);
	input.focus();

	screen.render();
}
