const fs = require(`fs`);
const path = require(`path`);

const loadOperations = (dir, groupName=undefined) => {
    const files = fs.readdirSync(dir).filter(
        f => {
            const fPath = path.join(dir, f);
            return (
                path.extname(fPath) === '.js' ||
                fs.lstatSync(fPath).isDirectory()
            ) && path.basename(fPath) !== 'index.js';
        }
    );

    let groupKeyFound = false;

    const opCodes = [];
    const operations = {};

    for(const f of files) {
        const fPath = path.join(dir, f);
        if (fs.lstatSync(fPath).isDirectory()) {
            const name = path.basename(fPath);

            const { 
                operations: subOperations,
                opCodes: subOpCodes,
                groupKeyFound
            } = loadOperations(fPath, name);

            operations[name] = subOperations;

            if (groupKeyFound) {
                opCodes.push(`${name}`);
            }
            for (const subOpCode of subOpCodes) {
                opCodes.push(`${name}.${subOpCode}`);
            }
        } else {
            const moduleName = f.replace('.js', '');
            const opCode = Operations.opCodeForModuleName(moduleName);
            operations[opCode] = path.join(dir, `${moduleName}`);
            const isGroupKey = moduleName === groupName;
            groupKeyFound = groupKeyFound || isGroupKey;
            if (!isGroupKey) {
                opCodes.push(opCode);
            }
        }
    }

    return new Operations(operations, opCodes, groupKeyFound);
}

class Operations {
    constructor(operations, opCodes, groupKeyFound) {
        this.operations = operations;
        this.opCodes = opCodes;
        this.groupKeyFound = groupKeyFound;
    }

    get(name, {chain, ...data }={}) {
        const parts = name.split('.');
        let ops = this.operations;

        for(const part of parts) {
            if (part === parts[parts.length-1] && ops[part][part]) {
                ops = ops[part][part];
            } else {
                ops = ops[part];
            }
        }

        const opClass = require(ops);
        return new opClass(name, chain, data);
    }

    isValidOpCode(opCode) {
        return this.opCodes.includes(opCode);
    }
}

Operations.opCodeForModuleName = (name) => name.replace(/[^A-Za-z0-9\-]/g, '-');

module.exports = loadOperations(path.join(__dirname, 'operations'));