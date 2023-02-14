const package = require('../../package.json');

module.exports = async cli => {
    cli.raw(`Coattail v${package.version}`);
};