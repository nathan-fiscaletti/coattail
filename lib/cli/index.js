const fs = require(`fs`);
const path = require(`path`);

const SuperCli = require('super-cli');

module.exports = () => {
    const cli = new SuperCli();

    fs.readdirSync(path.join(__dirname, 'commands')).forEach(commandFile => {
        const commandName = commandFile.replace('.js', '');
        const command = require(`.${path.sep}${path.join('commands', commandName)}`);
        cli.on(commandName, command);
    });
}