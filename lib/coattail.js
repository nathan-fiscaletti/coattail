const calvin = require(`calvin-di`);

const container = calvin();

// General Dependencies
const express = require(`express`);
container.register(`express`, () => express);

const fs = require(`fs`);
container.register(`fs`, fs);

const path = require(`path`);
container.register(`path`, path);

const yaml = require(`js-yaml`);
container.register(`yaml`, yaml);

// Controllers
const SubscribeController = require(`./controllers/subscribe`);
container.register(`SubscribeController`, SubscribeController);

// Services
const configPath = path.join(__dirname, '../config');
const config = require(`./services/config`).getLoader(configPath);
container.register(`config`, config, {}, [`fs`, `path`, `yaml`]);

const server = require(`./services/server`);
container.register(`Server`, server, { startable: true }, ['express', 'config', 'SubscribeController']);
container.startAll();


//========================