const fs = require(`fs`);
const path = require(`path`);
const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');
const c = require('ansi-colors');

const cli = {
    argv: process.argv,
    missing: (name) => {
        console.error(`${c.red('Error')}: Missing required parameter ${c.bold(`--${name}`)}`);
    },
    printHelp: (def) => {
        console.log(commandLineUsage(def));
    }
};

const processDir = (dir) => {
    const structure = {};

    const files = fs.readdirSync(dir);
    
    for(let commandFile of files) {
        const filePath = path.join(dir, commandFile);

        const commandName = commandFile.replace('.js', '');

        if(commandName !== 'help') {
            if (fs.lstatSync(filePath).isDirectory()) {
                let __help;
                const rootCommandPath = path.join(filePath, `help.js`);
                if (fs.existsSync(rootCommandPath)) {
                    __help = rootCommandPath.replace('.js', '');
                }
                structure[commandName] = {
                    __help,
                    ...processDir(path.join(dir, commandFile), commandName)
                };
            } else {
                structure[commandName] = `${path.join(dir, commandName)}`;
            }
        }
    }

    return structure;
}

const readCommand = async (mapping, argv, parent=undefined) => {
    let commandDefinition = [
        { name: 'command', defaultOption: true }
    ];
    const command = commandLineArgs(commandDefinition, { argv, stopAtFirstUnknown: true });

    if (command.command === undefined) {
        if (mapping.__help) {
            await require(mapping.__help)(cli);
            return;
        }
    }

    delete mapping.__help;

    if (!Object.keys(mapping).includes(command.command)) {
        console.log(`error, unknown command: ${command.command}`);
    } else {
        if (typeof mapping[command.command] === 'object') {
            readCommand(mapping[command.command], command._unknown || [], command.command);
        } else {
            cli.argv = command._unknown || [];
            await require(mapping[command.command])(cli);
        }
    }
}


module.exports = async () => {
    const cliMapping = {
        __help: path.join(__dirname, 'help'),
        ...processDir(path.join(__dirname, 'commands'))
    };
    await readCommand(cliMapping, process.argv);


    // let mainCommandDefinition = [
    //     { name: 'name', defaultOption: true }
    // ];
    // const mainCommand = commandLineArgs(mainCommandDefinition, { stopAtFirstUnknown: true });
    // let argv = mainCommand._unknown || [];

    // if (mainCommand.name === 'peer') {
    //     const subCommandDefinitions = [
    //         { name: 'add' },
    //         { name: 'show' },
    //         { name: 'list', defaultOption: true }
    //     ];

    //     const peerCommand = commandLineArgs(subCommandDefinitions, { argv, stopAtFirstUnknown: true });
    //     let argv = peerCommand._unknown || [];

    //     if (peerCommand.name === 'list') {
            
    //     }
    // }

    // const cli = new SuperCli();

    // fs.readdirSync(path.join(__dirname, 'commands')).forEach(commandFile => {
    //     const commandName = commandFile.replace('.js', '');
    //     const command = require(`.${path.sep}${path.join('commands', commandName)}`);
    //     cli.on(commandName, command);
    // });
}