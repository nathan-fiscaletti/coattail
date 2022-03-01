const fs = require(`fs`);
const path = require(`path`);

function create(templateName, destination, ext='js', replacements={}) {
    let contents = fs.readFileSync(
        path.join(
            __dirname, '..', 'templates',
            `${templateName}.template.${ext}`
        )
    ).toString();

    for (const repKey of Object.keys(replacements)) {
        contents = contents.replaceAll(repKey, replacements[repKey]);
    }

    fs.writeFileSync(
        destination,
        Buffer.from(contents, 'utf8')
    );
}

module.exports = { create };