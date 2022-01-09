const yargs = require("yargs");

function process() {
    const options = yargs
        .usage("Usage: -n <name>")
        .option("n", { alias: "name", describe: "Your name", type: "string", demandOption: true })
        .argv;

    console.log(`hello ${options.name}`);
}

module.exports = {
    process
}