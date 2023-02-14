const package = require('../../package.json');

module.exports = async (cli) => {
    cli.printHelp([
        {
            header: `Coattail v${package.version}`,
            content: `Coattail is a secure peer-to-peer remote execution and data publication service. It's intention is to provide a generic publication mechanism in which subscribers can utilize the publication data in anyway they see fit by means of implementing receivers in small code modules.`
        },
        {
            header: 'Usage',
            content: [
                `$ coattail <command> [options]`
            ]
        },
        {
            header: 'Options',
            optionList: [
                {
                    name: 'help',
                    alias: 'h',
                    description: 'Shows this help message.',
                    type: Boolean
                }
            ]
        },
        {
            header: 'Commands',
            content: [
                {
                    name: 'new',
                    summary: 'Creates a new Coattail instance.'
                },
                {
                    name: 'version',
                    summary: 'Prints the version of Coattail.'
                },
                {
                    name: 'service',
                    summary: 'Manage the primary service for this Coattail instance.'
                },
                {
                    name: 'peer',
                    summary: 'Manage peers registered on this Coattail instance.'
                },
                {
                    name: 'token',
                    summary: 'Manage tokens issued by this Coattail instance.'
                },
                {
                    name: 'action',
                    summary: 'Manage actions on either this Coattail instance or a peer.'
                },
                {
                    name: 'data',
                    summary: 'Manage the data for this Coattail instance.'
                },
                {
                    name: 'validation',
                    summary: 'Manage validation tokens.'
                },
                {
                    name: 'subscribers',
                    summary: 'Manage subscribers to this Coattail instance.'
                }
            ]
        },
        {
            content: "Run any command with --help at the end for more information."
        }
    ]);
};