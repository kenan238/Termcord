module.exports.fileStream = class {
    constructor(filename) {
        this.path = require('path');
        this.fs = require('fs');
        this.filename = filename;
        this.temp = null;
        this.fileExists = () => this.fs.existsSync(this.filename);
    }
    createFile() {
        if(!this.fileExists()) {
            this.fs.writeFile(this.filename, ``, (err)=> {
                if(err) console.warn(`[FS] Error while creating file ${this.filename}. ${err}`);
            });
        } else console.warn("[FS] Already created the file.");
    }
    writeFile(content) {
        if(this.fileExists()) {
            this.fs.writeFile(this.filename, content, (err) => {
                if(err) console.warn(`[FS] Error while writing to file ${this.filename}. ${err}`);
            });
        } else if(!this.fileExists()) {
            console.warn(`[FS] End destination (${this.filename}) doesn't exist. Cannot write to file.`)
        }
    }
    readFile(encoding = 'utf8') {
        return this.fs.readFileSync(this.filename, encoding);
    }
};