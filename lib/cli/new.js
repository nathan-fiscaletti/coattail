const templates = require(`../templates`);
const path = require(`path`);
const paths = require(`../paths`);
const fs = require(`fs`);
const chalk = require(`chalk`);
const childProcess = require(`child_process`);
const { generateKeyPairSync } = require(`crypto`);
const commandLineArgs = require(`command-line-args`);

const options = [
    {
        name: 'help',
        alias: 'h',
        description: 'Shows this help message.',
        type: Boolean
    },
    {
        name: 'dir',
        alias: 'd',
        description: 'The directory in which to place the Coattail instance. Defaults to the current directory.',
        defaultOption: true
    }
];

const printHelp = cli => cli.printHelp([
    {
        header: 'Coattail -- New',
        content: 'Creates a new Coattail instance.'
    },
    {
        header: 'Usage',
        content: [
            `$ coattail new [options]`
        ]
    },
    {
        header: 'Options',
        optionList: options
    }
]);

module.exports = async cli => {
    const parameters = commandLineArgs(options, {
        argv: cli.argv,
        stopAtFirstUnknown: true
    });

    if (parameters.help) {
        printHelp(cli);
        return;
    }

    let directory = process.cwd();
    if (parameters.dir) {
        directory = path.resolve(parameters.dir);
    }

    if (!fs.existsSync(directory)) {
        cli.error(`Directory '${chalk.hex('#e6d74e')(directory)}' does not exist.`);
        return;
    }

    if(!fs.lstatSync(directory).isDirectory()) {
        cli.error(`Path '${chalk.hex('#e6d74e')(directory)}' is not a directory.`);
        return;
    }

    if(fs.readdirSync(directory).length > 0) {
        cli.error(`Directory '${chalk.hex('#e6d74e')(directory)}' is not empty.`);
        return;
    }

    const configPath = path.join(directory, 'config.yml');
    const actionsPath = path.join(directory, 'actions');
    const schemasPath = path.join(directory, 'schemas');
    const dbPath = path.join(directory, 'data.db');
    const keysPath = path.join(directory, 'keys');
    const logPath = path.join(directory, 'service.log');
    const privateKeyPath = path.join(keysPath, 'key.pem');
    const publicKeyPath = path.join(keysPath, 'key.pub');


    cli.waiting(`Creating new Coattail Instance in ${chalk.hex('#4e88e6')(directory)}...`)

    const lines = [];

    const printFailed = (action, err) => {
        try {
            const files = fs.readdirSync(directory);
            for (const file of files) {
                fs.unlinkSync(path.join(directory, file));
            }
        } catch (_) {}
        let stack = `${action}\n\n${err.stack || err}`;
        cli.error(`Error while generating Coattail Instance`, stack);
    };

    try {
        templates.create('config', configPath, 'yml', {
            '{root}': directory,
            '{dbfile}': dbPath,
            '{install}': path.resolve(path.join(__dirname, '..', '..'))
        });
        lines.push(`${chalk.hex('#4e88e6')(configPath)}   : ${chalk.hex('#6ce64e')(`Success!`)}`);
    } catch (err) {
        printFailed(err);
        return;
    }

    try {
        fs.mkdirSync(actionsPath);
        lines.push(`${chalk.hex('#4e88e6')(actionsPath)}      : ${chalk.hex('#6ce64e')(`Success!`)}`);
    } catch (err) {
        printFailed(chalk.hex('#4e88e6')(actionsPath), err);
        return;
    }

    try {
        fs.mkdirSync(schemasPath);
        lines.push(`${chalk.hex('#4e88e6')(schemasPath)}      : ${chalk.hex('#6ce64e')(`Success!`)}`);
    } catch (err) {
        printFailed(chalk.hex('#4e88e6')(schemasPath), err);
        return;
    }

    try {
        fs.closeSync(fs.openSync(logPath, 'w'));
        lines.push(`${chalk.hex('#4e88e6')(logPath)}  : ${chalk.hex('#6ce64e')(`Success!`)}`);
    } catch (err) {
        printFailed(chalk.hex('#4e88e6')(logPath), err);
        return;
    }

    let keys;
    try {
        fs.mkdirSync(keysPath);

        keys = generateKeyPairSync('rsa', {
            modulusLength: 4096,
            publicKeyEncoding: {
                type: 'spki',
                format: 'pem'
            },
            privateKeyEncoding: {
                type: 'pkcs8',
                format: 'pem'
            }
        });
        lines.push(`${chalk.hex('#4e88e6')(keysPath)}         : ${chalk.hex('#6ce64e')(`Success!`)}`);
    } catch (err) {
        printFailed(chalk.hex('#4e88e6')(keysPath), err);
        return;
    }

    try {
        fs.writeFileSync(publicKeyPath, keys.publicKey);
        lines.push(`${chalk.hex('#4e88e6')(publicKeyPath)} : ${chalk.hex('#6ce64e')(`Success!`)}`);
    } catch (err) {
        printFailed(chalk.hex('#4e88e6')(publicKeyPath), err);
        return;
    }

    try {
        fs.writeFileSync(privateKeyPath, keys.privateKey);
        lines.push(`${chalk.hex('#4e88e6')(privateKeyPath)} : ${chalk.hex('#6ce64e')(`Success!`)}`);
    } catch (err) {
        printFailed(chalk.hex('#4e88e6')(privateKeyPath), err);
        return;
    }

    try {
        fs.closeSync(fs.openSync(dbPath, 'w'));
        lines.push(`${chalk.hex('#4e88e6')(dbPath)}      : ${chalk.hex('#6ce64e')(`Success!`)}`);
    } catch (err) {
        printFailed(chalk.hex('#4e88e6')(dbPath), err);
        return;
    }

    lines.push('');
    lines.push(chalk.hex('#e6d74e')(`Run the following commands to finalize the setup.`));
    lines.push('');
    lines.push(` - Setup Database : '${chalk.hex('#4e88e6')(`coattail data migrate latest -i ${directory}`)}'`);
    cli.success(`Coattail Instance Created`, lines);
};