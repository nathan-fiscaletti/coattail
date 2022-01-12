const fs = require(`fs`);
const path = require(`path`);

function create(templateName, destination) {
    fs.writeFileSync(
        destination,
        fs.readFileSync(
            path.join(
                __dirname, '..', 'templates',
                `${templateName}.template.js`
            )
        )
    );
}

module.exports = { create };