function startApiServer(port) {
    require(`../api`)({port});
}

module.exports = { startApiServer };