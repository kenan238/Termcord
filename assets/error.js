const blessed = require("reblessed");

const ErrLevels  = {
    normal: 0,  // Just display error with option to restart
    high: 1,    // Error in bold and red
    critical: 3 // Display stack trace 
};

class ErrApp {
    constructor (err, level) {
        this.screen = blessed.screen({
            smartCSR: true,
            title: "Termcord - Error"
        });
        this.err    = err;
        this.level  = level;
    }

    show () {
        var box = blessed.box({
            top: "center",
            left: "center",
            width: "100%",
            height: "100%",
            border: {
                type: "line"
            },
            style: {
                border: {
                    fg: "red"
                }
            }
        });

        var text = blessed.text({
            top: "center",
            left: "center",
            width: "100%",
            height: "100%",
            content: '',
            style: {
                fg: "red"
            }
        });

        box.append(text);
        this.screen.append(box);
        this.screen.render();
    }
}


module.exports = { 
    ErrApp,
    ErrLevels 
};