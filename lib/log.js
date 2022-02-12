require('node-json-color-stringify');

const log = (prefix, stdOut=process.stdout, stdErr=process.stderr) => {
    if (!Array.isArray(prefix)) {
        prefix = [prefix];
    }

    return {
        prefixes: prefix,
        stdOut, stdErr,

        prefixString: function() { return `(${this.prefixes.join('/')})`; },

        child: function (prefix) { return log(this.prefixes.concat(prefix), this.stdOut, this.stdErr); },
        parent: function () { return log([...this.prefixes].slice(0, -1), this.stdOut, this.stdErr); },
        silent: function () { return log(this.prefixes, null, null)},
    
        format: function (level, msg) { return `${new Date().toISOString()} ${level} ${this.prefixString()} ${typeof msg === 'object' ? JSON.stringify(msg, null, 4) : msg}`; },
    
        info: function (msg) { if (this.stdOut) this.stdOut.write(`${this.format(`INFO`, msg)}\n`); },
        warning: function (msg) { if (this.stdErr) this.stdErr.write(`${this.format(`WARN`, msg)}\n`); },
        error: function (msg) { if (this.stdErr) this.stdErr.write(`${this.format(`ERRO`, msg)}\n`); },
        debug: function (msg) { if (this.stdOut) this.stdOut.write(`${this.format(`DEBG`, msg)}\n`); },
        object: function(prefix, obj) { if(this.stdOut) this.stdOut.write(`${this.format(`INFO`, '')}${prefix}: ${JSON.colorStringify(obj, null, 2)}\n`); },

        incoming: function(packet) { this.object('INCOMING', packet); },
        outgoing: function(packet) { this.object('OUTGOING', packet); },
    };
};

module.exports = log;