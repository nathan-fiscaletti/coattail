const calvin = require(`calvin-di`);

module.exports = (config) => {
    const container = calvin();

    // General Dependencies
    const express = require(`express`);
    container.register(`express`, () => express);

    const fs = require(`fs`);
    container.register(`fs`, fs);

    // Controllers
    const SubscribeController = require(`./controllers/subscribe`);
    container.register(`SubscribeController`, SubscribeController);

    container.register(`Config`, config);

    // Server
    const server = require(`./services/server`);
    container.register(`Server`, server, { startable: true }, ['express', 'Config', 'SubscribeController']);
    container.startAll();
};