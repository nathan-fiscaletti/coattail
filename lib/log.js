require('node-json-color-stringify');
const stream = require(`stream`);

class LogBuffer {
    constructor() {
        this.lines = [];
    }

    write(data) {
        const l = data.split(/\r?\n/);
        for (const line of l) {
            this.lines.push(line);
        }
    }
}

const log = (prefix, color=true, stdOut=process.stdout, stdErr=process.stderr) => {
    if (!Array.isArray(prefix)) {
        prefix = [prefix];
    }

    return {
        prefixes: prefix,
        stdOut,
        stdErr,
        color,

        prefixString: function() { return `(${this.prefixes.join('/')})`; },

        child: function (prefix) { const l = log(this.prefixes.concat(prefix), this.color, this.stdOut, this.stdErr); l.buffer = this.buffer; return l; },
        parent: function () { const l = log([...this.prefixes].slice(0, -1), this.color, this.stdOut, this.stdErr); l.buffer = this.buffer; return l; },
        silent: function () { return log(this.prefixes, this.color, null, null)},
        buffered: function () { const buff = this.buffer || new LogBuffer(); const l = log(this.prefixes, this.color, buff, buff); l.buffer = buff; return l;},

        format: function (level, msg) { return `${new Date().toISOString()} ${level} ${this.prefixString()} ${typeof msg === 'object' ? (this.color ? JSON.colorStringify(msg, null, 2) : JSON.stringify(msg, null, 2)) : msg}`; },

        info: function (msg) { if (this.stdOut) this.stdOut.write(`${this.format(`INFO`, msg)}\n`); },
        warning: function (msg) { if (this.stdErr) this.stdErr.write(`${this.format(`WARN`, msg)}\n`); },
        error: function (msg) { if (this.stdErr) this.stdErr.write(`${this.format(`ERRO`, msg)}\n`); },
        debug: function (msg) { if (this.stdOut) this.stdOut.write(`${this.format(`DEBG`, msg)}\n`); },
        object: function(prefix, obj) { if(this.stdOut) this.stdOut.write(`${this.format(`INFO`, '')}${prefix}: ${this.color ? JSON.colorStringify(obj, null, 2) : JSON.stringify(obj, null, 2)}\n`); },

        incoming: function(packet) { this.object('INCOMING', packet); },
        outgoing: function(packet) { this.object('OUTGOING', packet); },
    };
};

module.exports = log;