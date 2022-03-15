const path = require(`path`);
const ModuleManager = require(`./module-manager`);
const config = require(`./config`);
const Reciever = require(`./receiver`);

class ReceiverManager extends ModuleManager {
    constructor() {
        super(config.get().paths.receivers);
    }

    load(name) {
        return new Promise((resolve, reject) => {
            try {
                const requirePath = this.pathsFor(name).requirePath;
                const receiverClass = require(path.relative(__dirname, requirePath))(require(`../`));
                const receiver = new receiverClass();
                receiver.name = name;
                resolve(receiver);
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

module.exports = ReceiverManager;