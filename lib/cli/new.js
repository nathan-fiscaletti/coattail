const templates = require(`../templates`);
const path = require(`path`);
const fs = require(`fs`);
const chalk = require(`chalk`);
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
    const receiversPath = path.join(directory, 'receivers');
    const dbPath = path.join(directory, 'data.db');
    const keysPath = path.join(directory, 'keys');
    const logPath = path.join(directory, 'service.log');
    const packagePath = path.join(directory, 'package.json');
    const authPrivateKeyPath = path.join(keysPath, 'auth-key.pem');
    const authPublicKeyPath = path.join(keysPath, 'auth-key.pub');
    const vtPrivateKeyPath = path.join(keysPath, 'vt-key.pem');
    const vtPublicKeyPath = path.join(keysPath, 'vt-key.pub');


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
        templates.create('package', packagePath, 'json');
        lines.push(`${chalk.hex('#4e88e6')(packagePath)}      : ${chalk.hex('#6ce64e')(`Success!`)}`);
    } catch (err) {
        printFailed(chalk.hex('#4e88e6')(packagePath), err);
        return;
    }

    try {
        templates.create('config', configPath, 'yml', {
            '{root}': directory,
            '{dbfile}': dbPath,
            '{install}': path.resolve(path.join(__dirname, '..', '..'))
        });
        lines.push(`${chalk.hex('#4e88e6')(configPath)}        : ${chalk.hex('#6ce64e')(`Success!`)}`);
    } catch (err) {
        printFailed(chalk.hex('#4e88e6')(configPath), err);
        return;
    }

    try {
        fs.mkdirSync(actionsPath);
        lines.push(`${chalk.hex('#4e88e6')(actionsPath)}           : ${chalk.hex('#6ce64e')(`Success!`)}`);
    } catch (err) {
        printFailed(chalk.hex('#4e88e6')(actionsPath), err);
        return;
    }

    try {
        fs.mkdirSync(receiversPath);
        lines.push(`${chalk.hex('#4e88e6')(receiversPath)}         : ${chalk.hex('#6ce64e')(`Success!`)}`);
    } catch (err) {
        printFailed(chalk.hex('#4e88e6')(receiversPath), err);
        return;
    }

    try {
        fs.closeSync(fs.openSync(logPath, 'w'));
        lines.push(`${chalk.hex('#4e88e6')(logPath)}       : ${chalk.hex('#6ce64e')(`Success!`)}`);
    } catch (err) {
        printFailed(chalk.hex('#4e88e6')(logPath), err);
        return;
    }

    let authKeys;
    let vtKeys;
    try {
        fs.mkdirSync(keysPath);

        authKeys = generateKeyPairSync('rsa', {
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

        vtKeys = generateKeyPairSync('rsa', {
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
        lines.push(`${chalk.hex('#4e88e6')(keysPath)}              : ${chalk.hex('#6ce64e')(`Success!`)}`);
    } catch (err) {
        printFailed(chalk.hex('#4e88e6')(keysPath), err);
        return;
    }

    try {
        fs.writeFileSync(authPublicKeyPath, authKeys.publicKey);
        lines.push(`${chalk.hex('#4e88e6')(authPublicKeyPath)} : ${chalk.hex('#6ce64e')(`Success!`)}`);
    } catch (err) {
        printFailed(chalk.hex('#4e88e6')(authPublicKeyPath), err);
        return;
    }

    try {
        fs.writeFileSync(authPrivateKeyPath, authKeys.privateKey);
        lines.push(`${chalk.hex('#4e88e6')(authPrivateKeyPath)} : ${chalk.hex('#6ce64e')(`Success!`)}`);
    } catch (err) {
        printFailed(chalk.hex('#4e88e6')(authPrivateKeyPath), err);
        return;
    }

    try {
        fs.writeFileSync(vtPublicKeyPath, vtKeys.publicKey);
        lines.push(`${chalk.hex('#4e88e6')(vtPublicKeyPath)}   : ${chalk.hex('#6ce64e')(`Success!`)}`);
    } catch (err) {
        printFailed(chalk.hex('#4e88e6')(vtPublicKeyPath), err);
        return;
    }

    try {
        fs.writeFileSync(vtPrivateKeyPath, vtKeys.privateKey);
        lines.push(`${chalk.hex('#4e88e6')(vtPrivateKeyPath)}   : ${chalk.hex('#6ce64e')(`Success!`)}`);
    } catch (err) {
        printFailed(chalk.hex('#4e88e6')(vtPrivateKeyPath), err);
        return;
    }

    try {
        fs.closeSync(fs.openSync(dbPath, 'w'));
        lines.push(`${chalk.hex('#4e88e6')(dbPath)}           : ${chalk.hex('#6ce64e')(`Success!`)}`);
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