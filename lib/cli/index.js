const yargs = require(`yargs`);

const COMM_MODULES = {
    api: require(`./commands/api`),
    database: require(`./commands/database`)
};

async function execute() {
    const compiled = yargs
        .usage(`coattail -l | -h | [ -m <module> [ -l | -a <action> [ -f <flags> | -l ] ] ]`)
        .option('m', { alias: 'module', describe: 'Module on which to perform action.', type: 'string' })
        .option('a', { alias: 'action', describe: 'Action to perform on specified module.', type: 'string'})
        .option('l', { alias: 'list', describe: 'Lists available modules, available actions for specified module or available flags for specified action..', type: 'boolean'})
        .option('h', { alias: 'help', describe: 'Shows this help message.', type: 'boolean'})
        .options('f', { alias: 'flags', describe: 'Flags to pass to specified action.', type: 'array'});

    const options = compiled.argv;

    if (process.argv.length < 3 || options.help) {
        compiled.showHelp();
        compiled.exit(0);
    }

    if (options.module) {
        const modName = options.module;

        if (! Object.keys(COMM_MODULES).includes(modName)) {
            console.log(`Invalid module '${modName}'.`);
            compiled.exit(1);
        }

        const mod = COMM_MODULES[modName];

        if (options.action) {
            const actionName = options.action;

            if (! Object.keys(mod.actions).includes(actionName)) {
                console.log(`Invalid action '${actionName}' for module '${modName}'.`);
                compiled.exit(1);
            }

            const action = mod.actions[actionName];

            if (options.list) {
                console.log(`Available flags for action '${options.action}' of module '${modName}':`);
                const flagNames = Object.keys(action.flags);
                flagNames.forEach(name => console.log(`    - ${name}: ${action.flags[name]}`));
                compiled.exit(0);
            }

            if (options.flags && options.flags.length > 0) {
                options.flags.forEach(flag => {
                    if (! Object.keys(action.flags).includes(flag)) {
                        console.log(`Invalid flag '${flag}' for action '${actionName}' of module '${modName}'.`);
                        compiled.exit(1);
                    }
                })
            }

            try {
                await mod[actionName](options.flags);
            } catch (err) {
                console.log(err);
            }
        } else {
            if (options.list) {
                console.log(`Available actions for module '${modName}':`);
                const actionNames = Object.keys(mod.actions);
                actionNames.forEach(name => console.log(`    - ${name}: ${mod.actions[name].description}`));
                compiled.exit(0);
            }
        }
    } else {
        if (options.list) {
            console.log(`coattail: Available modules:`);
            const moduleNames = Object.keys(COMM_MODULES);
            moduleNames.forEach(name => console.log(`    - ${name}: ${COMM_MODULES[name].description}`));
            compiled.exit(0);
        }

        if (options.help) {
            compiled.showHelp();
            compiled.exit(0);
        }
    }
}

module.exports = {
    execute
};