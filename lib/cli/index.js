const fs = require(`fs`);
const path = require(`path`);
const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');
const chalk = require('chalk');
const readline = require('readline');

// TODO: implement this class instead?
// class Command {
//     constructor({title, description, usage, arguments}) {
//         this.title = title;
//         this.description = description;
//         this.usage = usage;

//         // Add help argument.
//         arguments.unshift({
//             name: 'help',
//             alias: 'h',
//             description: 'Shows this help message.',
//             type: Boolean
//         });
//         this.arguments = arguments;
//     }

//     process(options) {
//         throw new Error('Abstract class must implement process() method.');
//     }
// }

const cli = {
    argv: process.argv,
    validateRequired: function (options, required) {
        for(const requiredOption of required) {
            if (!options[requiredOption]) {
                this.missing(requiredOption);
                return false;
            }
        }
        return true;
    },
    missing: (name) => {
        console.error(`${chalk.hex('#e64e4e')('Error')}: Missing required parameter ${chalk.bold(`--${name}`)}`);
    },
    printHelp: (def) => {
        console.log(commandLineUsage(def));
    },
    query: async function(query) {
        const rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout,
        });
    
        return new Promise(resolve => rl.question(query, ans => {
            rl.close();
            resolve(ans);
        }));
    },
    yesOrNo: async function(msg) {
        const input = await this.query(`${msg} (y/n) : `);
        const yesVals = ['y', 'yes'];
        for (const yesVal of yesVals) {
            if (yesVal === input.toLowerCase()) {
                return true;
            }
        }

        return false;
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
}