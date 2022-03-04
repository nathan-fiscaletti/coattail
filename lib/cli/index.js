const fs = require(`fs`);
const path = require(`path`);
const commandLineArgs = require('command-line-args');
const commandLineUsage = require('command-line-usage');
const chalk = require('chalk');
const readline = require('readline');
const stripAnsi = require(`strip-ansi`);

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
    stream: (title, task, initialBody = '...') => ({
        title,
        started: false,
        lineCount: 0,
        start: async function () {
            if (this.started) {
                return;
            }

            this.started = true;
            this.lineCount = 0;
            console.log('');
            console.log(` [${chalk.hex('#b0b0b0')('%')}] ${this.title}`);
            console.log('  │');
            console.log(`  │  ${chalk.bold(task)}`);
            console.log('  │');
            console.log('  ├─');
            console.log('  │');
            console.log(`  │  ${initialBody}`);
            console.log('  │');
            console.log('  ╰─');
            console.log('');

            return Promise.resolve();
        },
        write: async function (lines) {
            if (!this.started) {
                return;
            }

            if (this.lineCount > 0) {
                process.stdout.write('\033[2K\033[1A\033[2K\033[1A\033[2K\033[1A\033[2K');
            } else {
                process.stdout.write('\033[2K\033[1A\033[2K\033[1A\033[2K\033[1A\033[2K\033[1A\033[2K');
            }
            if (!Array.isArray(lines)) {
                lines = [lines];
            }
            this.lineCount += lines.length;
            for (const line of lines) {
                console.log(`  │  ${line}`);
            }
            console.log('  │');
            console.log('  ╰─');
            console.log('');

            return Promise.resolve();
        },
        clear: async function () {
            if (!this.started) {
                return;
            }

            const linesToRemove = this.lineCount + 10;
            for (let i = 0; i < linesToRemove; i++) {
                process.stdout.write('\033[2K\033[1A');
            }
            this.started = false;

            return Promise.resolve();
        }
    }),
    error: (error, details=undefined) => {
        if (process.env.COATTAIL_OUTPUT === 'json') {
            console.error(JSON.stringify({error: stripAnsi(error).trim(), details: stripAnsi(details).trim()}));
        } else if (process.env.COATTAIL_OUTPUT === 'plain') {
            console.error(stripAnsi(error).trim());
            if (!Array.isArray(details)) {
                details = details.split(/\r?\n/);
            }
            for (const detailLine of details) {
                console.error(stripAnsi(detailLine).trim());
            }
        } else {
            console.error('');
            console.error(` [${chalk.hex('#e64e4e')('X')}] ${chalk.hex('#e64e4e')('Error')}`);
            console.error('  │');
            console.error(`  │  ${chalk.bold(error)}`);
            if (details !== undefined) {
                console.error('  │');
                console.error('  ├─');
                console.error('  │');
                let outputDetails = details;
                if (!Array.isArray(details)) {
                    outputDetails = details.split(/\r?\n/);
                }
                for (const detailsLine of outputDetails) {
                    console.error(`  ${chalk.reset('│')}  ${detailsLine}`);
                }
                console.error('  │');
                console.error('  ╰─');
            } else {
                console.error('  │');
                console.error('  ╰─');
            }
            console.error('');
        }
    },
    waiting: (message) => {
        if (process.env.COATTAIL_OUTPUT === 'json') {
            // Ignore waiting for JSON output type.
        } else if (process.env.COATTAIL_OUTPUT === 'plain') {
            console.log(stripAnsi(message));
        } else {
            console.log('');
            console.log(` [${chalk.hex('#b0b0b0')('%')}] Loading...`);
            console.log('  │');
            console.log(`  │  ${message}`);
            console.log('  │');
            console.log('  ╰─');
        }
    },
    success: (message, details=undefined) => {
        if (process.env.COATTAIL_OUTPUT === 'json') {
            console.log(JSON.stringify({message: stripAnsi(message).trim(), details: details.map(e => stripAnsi(e).trim())}));
        } else if (process.env.COATTAIL_OUTPUT === 'plain') {
            console.log(stripAnsi(message).trim());
            if (!Array.isArray(details)) {
                details = details.split(/\r?\n/);
            }
            for (const detailLine of details) {
                console.log(stripAnsi(detailLine).trim());
            }
        } else {
            console.log('');
            console.log(` [${chalk.hex('#6ce64e')('O')}] ${chalk.hex('#6ce64e')('Success')}`);
            console.log('  │');
            console.log(`  │  ${chalk.bold(message)}`);
            if (details !== undefined) {
                console.log('  │');
                console.log('  ├─');
                console.log('  │');
                let outputDetails = details;
                if (!Array.isArray(details)) {
                    outputDetails = details.split(/\r?\n/);
                }
                for (const detailsLine of outputDetails) {
                    console.log(`  ${chalk.reset('│')}  ${detailsLine}`);
                }
                console.log('  │');
                console.log('  ╰─');
            } else {
                console.log('  │');
                console.log('  ╰─');
            }
            console.log('');
        }
    },
    raw: (message) => {
        if (process.env.COATTAIL_OUTPUT === 'json') {
            console.log(JSON.stringify({message: stripAnsi(message).trim()}));
        } else if (process.env.COATTAIL_OUTPUT === 'plain') {
            console.log(stripAnsi(message).trim());
        } else {
            console.log(message);
        }
    },
    missing: function (name) {
        this.error(`Missing required parameter ${chalk.hex('#4e88e6')(`--${name}`)}.`, `Run with ${chalk.hex('#4e88e6')(`--help`)} for more information.`);
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
        new: path.join(__dirname, 'new'),
        ...processDir(path.join(__dirname, 'commands'))
    };
    await readCommand(cliMapping, process.argv);
}