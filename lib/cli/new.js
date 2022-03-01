const templates = require(`../templates`);
const path = require(`path`);
const fs = require(`fs`);
const chalk = require(`chalk`);
const childProcess = require(`child_process`);
const { generateKeyPairSync } = require(`crypto`);
const commandLineArgs = require(`command-line-args`);
const { stream } = require("npmlog");

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
        console.error(`${chalk.hex('#e64e4e')('Error')}: Directory '${chalk.hex('#e6d74e')(directory)}' does not exist.`);
        return;
    }

    if(!fs.lstatSync(directory).isDirectory()) {
        console.error(`${chalk.hex('#e64e4e')('Error')}: Path '${chalk.hex('#e6d74e')(directory)}' is not a directory.`);
        return;
    }

    if(fs.readdirSync(directory).length > 0) {
        console.error(`${chalk.hex('#e64e4e')('Error')}: Directory '${chalk.hex('#e6d74e')(directory)}' is not empty.`);
        return;
    }

    const configPath = path.join(directory, 'config.yml');
    const tasksPath = path.join(directory, 'tasks');
    const schemasPath = path.join(directory, 'schemas');
    const dbPath = path.join(directory, 'data.db');
    const keysPath = path.join(directory, 'keys');
    const privateKeyPath = path.join(keysPath, 'key.pem');
    const publicKeyPath = path.join(keysPath, 'key.pub');

    console.log('');

    console.log(` ${chalk.hex('#6ce64e')(`Creating new Coattail Instance in ${chalk.hex('#4e88e6')(directory)}...`)}`);

    console.log('');

    try {
        templates.create('config', configPath, 'yml', {
            '{root}': directory,
            '{dbfile}': dbPath,
            '{install}': path.resolve(path.join(__dirname, '..', '..'))
        });
        console.log(` ${chalk.hex('#4e88e6')(configPath)}   : ${chalk.hex('#6ce64e')(`Success!`)}`);
    } catch (err) {
        console.log(` ${chalk.hex('#4e88e6')(configPath)}   : ${chalk.hex('#e64e4e')(`${err}`)}`);
        console.log('');
        return;
    }

    try {
        fs.mkdirSync(tasksPath);
        console.log(` ${chalk.hex('#4e88e6')(tasksPath)}        : ${chalk.hex('#6ce64e')(`Success!`)}`);
    } catch (err) {
        console.log(` ${chalk.hex('#4e88e6')(tasksPath)}        : ${chalk.hex('#e64e4e')(`${err}`)}`);
        console.log('');
        return;
    }

    try {
        fs.mkdirSync(schemasPath);
        console.log(` ${chalk.hex('#4e88e6')(schemasPath)}      : ${chalk.hex('#6ce64e')(`Success!`)}`);
    } catch (err) {
        console.log(` ${chalk.hex('#4e88e6')(schemasPath)}      : ${chalk.hex('#e64e4e')(`${err}`)}`);
        console.log('');
        return;
    }

    try {
        fs.closeSync(fs.openSync(dbPath, 'w'));
        console.log(` ${chalk.hex('#4e88e6')(dbPath)}      : ${chalk.hex('#6ce64e')(`Success!`)}`);
    } catch (err) {
        console.log(` ${chalk.hex('#4e88e6')(dbPath)}      : ${chalk.hex('#e64e4e')(`${err}`)}`);
        console.log('');
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
        console.log(` ${chalk.hex('#4e88e6')(keysPath)}         : ${chalk.hex('#6ce64e')(`Success!`)}`);
    } catch (err) {
        console.log(` ${chalk.hex('#4e88e6')(keysPath)}         : ${chalk.hex('#e64e4e')(`${err}`)}`);
        console.log('');
        return;
    }

    try {
        fs.writeFileSync(publicKeyPath, keys.publicKey);
        console.log(` ${chalk.hex('#4e88e6')(publicKeyPath)} : ${chalk.hex('#6ce64e')(`Success!`)}`);
    } catch (err) {
        console.log(` ${chalk.hex('#4e88e6')(publicKeyPath)} : ${chalk.hex('#e64e4e')(`${err}`)}`);
        console.log('');
        return;
    }

    try {
        fs.writeFileSync(privateKeyPath, keys.privateKey);
        console.log(` ${chalk.hex('#4e88e6')(privateKeyPath)} : ${chalk.hex('#6ce64e')(`Success!`)}`);
    } catch (err) {
        console.log(` ${chalk.hex('#4e88e6')(privateKeyPath)} : ${chalk.hex('#e64e4e')(`${err}`)}`);
        console.log('');
        return;
    }

    console.log('');

    console.log(` ${chalk.hex('#4e88e6')('Attempting to run database migrations...')}`);

    const proc = childProcess.spawn('node', [path.join(__dirname, '..', '..', 'bin', 'index.js'), 'data', 'migrate', 'latest'], {
        cwd: directory,
        detached: true,
        stdio: ['inherit', 'pipe', 'pipe']
    });
    
    let stdOutLine = '';
    proc.stdout.on('data', function(chunk) {
        stdOutLine += chunk;
        const lines = stdOutLine.split('\n');
        while (lines.length > 1) {
            const line = lines.shift();
            console.log(` ${chalk.hex('#6ce64e')(line.trimEnd())}`);
        }
        stdOutLine = lines.shift();
    });
    proc.stdout.on('data', function() {
        console.log(` ${chalk.hex('#6ce64e')(stdOutLine.trimEnd())}`);
    });

    let stdErrLine = '';
    proc.stderr.on('data', function(chunk) {
        stdErrLine += chunk;
        const lines = stdErrLine.split('\n');
        while (lines.length > 1) {
            const line = lines.shift();
            console.error(` ${chalk.hex('#e64e4e')(line.trimEnd())}`);
        }
        stdErrLine = lines.shift();
    });
    proc.stderr.on('data', function() {
        console.error(` ${chalk.hex('#e64e4e')(stdErrLine.trimEnd())}`);
    });

    console.log('')
};