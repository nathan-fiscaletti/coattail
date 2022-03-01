const path = require(`path`);
const ModuleManager = require(`./module-manager`);
const config = require(`./config`);

class ActionManager extends ModuleManager {
    constructor() {
        super(config.get().paths.actions);
    }

    load(name) {
        return new Promise((resolve, reject) => {
            try {
                const requirePath = this.pathsFor(name).requirePath;
                const actionClass = require(path.relative(__dirname, requirePath));
                const action = new actionClass();
                action.name = name;
                resolve(action);
            } catch (err) {
                reject(err);
            }
        });
    }

    loadAll() {
        const modules = this.allModules();
        const resultPromises = [];
        for(const module of modules) {
            resultPromises.push(this.load(module.name));
        }
        return Promise.all(resultPromises);
    }
}

module.exports = ActionManager;