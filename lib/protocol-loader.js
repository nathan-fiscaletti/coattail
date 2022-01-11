const fs = require(`fs`);
const path = require(`path`);

const loadOperations = (dir) => {
    const files = fs.readdirSync(dir).filter(
        f => {
            const fPath = path.join(dir, f);
            return (
                path.extname(fPath) === '.js' ||
                fs.lstatSync(fPath).isDirectory()
            ) && path.basename(fPath) !== 'index.js';
        }
    );

    const opCodes = [];
    const operations = {};
    files.forEach(f => {
        const fPath = path.join(dir, f);
        if (fs.lstatSync(fPath).isDirectory()) {
            const name = path.basename(fPath);

            const { 
                operations: subOperations,
                opCodes: subOpCodes 
            } = loadOperations(fPath);

            operations[name] = subOperations;
            for (const subOpCode of subOpCodes) {
                opCodes.push(`${name}.${subOpCode}`);
            }
        } else {
            const moduleName = f.replace('.js', '');
            const opCode = moduleName.replace('-', '_');
            operations[opCode] = require(
                path.join(dir, `${moduleName}`)
            );
            opCodes.push(opCode);
        }
    });

    return {
        operations,
        opCodes
    };
}

class Operations {
    constructor(operations, opCodes) {
        this.operations = operations;
        this.opCodes = opCodes;
    }

    get(name) {
        const parts = name.split('.');
        let obj = this.operations;
        for(const part of parts) {
            obj = obj[part];
        }
        return obj;
    }

    isValidOpCode(opCode) {
        return this.opCodes.includes(opCode);
    }
}

module.exports = (section) => {
    const availableSections = ['server', 'client'];
    if (!availableSections.includes(section)) {
        throw new Error(
            `Unknown protocol library: ${section}. Must be one of ${availableSections.join(', ')}`
        );
    }

    const dir = path.join(__dirname, section, 'protocol');

    const { operations, opCodes } = loadOperations(dir);
    return new Operations(operations, opCodes);
};