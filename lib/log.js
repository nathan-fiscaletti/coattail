const log = (prefix, writer=process.stdout) => {
    if (!Array.isArray(prefix)) {
        prefix = [prefix];
    }

    return {
        prefixes: prefix,

        prefixString: function() { return `(${this.prefixes.join('/')})`; },

        child: function (prefix) { return log(this.prefixes.concat(prefix)) },
        parent: function () { return log([...this.prefixes].slice(0, -1)) },
    
        format: function (level, msg) { return `${new Date().toISOString()} ${level} ${this.prefixString()} ${typeof msg === 'object' ? JSON.stringify(msg, null, 4) : msg}` },
    
        info: function (msg) { writer.write(`${this.format(`INFO`, msg)}\n`) },
        warning: function (msg) { writer.write(`${this.format(`WARN`, msg)}\n`) },
        error: function (msg) { writer.write(`${this.format(`ERRO`, msg)}\n`) },
        debug: function (msg) { writer.write(`${this.format(`DEBG`, msg)}\n`) }
    };
};

module.exports = log;