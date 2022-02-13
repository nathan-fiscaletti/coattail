const path = require(`path`);
const fs = require(`fs`);
const { pick } = require(`lodash`);

class ModuleManager {
    constructor(dir, ext='.js') {
        this.dir = dir;
        this.ext = ext;
    }

    allModules() {
        return fs.readdirSync(this.dir)
                .filter(p => p.endsWith(this.ext))
                .map(module => ({
                    name: module.replace(this.ext, ''),
                    absolutePath: path.join(this.dir, module),
                    requirePath: path.join(this.dir, module.replace(this.ext, ''))
                }));
    }

    pathsFor(name) {
        const [ module ] = this.allModules().filter(module => module.name === name);
        return pick(module, ['absolutePath', 'requirePath']);
    }
}

module.exports = ModuleManager;