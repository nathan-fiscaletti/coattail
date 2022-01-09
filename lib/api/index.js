const express = require(`express`);
const path = require(`path`);
const fs = require(`fs`);
const http = require(`http`);
const https = require(`https`);

function serve(config) {
    const app = express();
    app.use(express.json());

    // Register endpoints
    require(`./endpoints/subscribe`).register(app);

    let server;

    if (config.server.https.enabled) {
        console.log('https enabled');
        const privateKey = fs.readFileSync(config.server.https.private_key, 'utf8');
        const certificate = fs.readFileSync(config.server.https.certificate, 'utf8');

        const credentials = {key: privateKey, cert: certificate};

        server = https.createServer(credentials, app);
    } else {
        server = http.createServer(app);
    }

    server.listen(config.server.port, config.server.host, () => {
        var host = server.address().address
        var port = server.address().port
        console.log(`coattail api listening at ${config.server.https.enabled ? 'https' : 'http'}://${host}:${port}`)
    });
}

module.exports = {
    serve
};