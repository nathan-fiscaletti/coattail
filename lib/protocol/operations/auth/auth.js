const Operation = require("../../operation");
const Peer = require(`../../../peer`);
const config = require(`../../../config`);

module.exports = class extends Operation {
    constructor(opCode, chain, data = []) {
        super(
            Operation.TYPE.INITIAL,
            Operation.DIRECTION.CLIENT_TO_HOST,
            {
                authenticatedOnly: false,
                opCode,
                chain,
                data
            }
        );
    }

    //@on-host
    async handle(session) {
        try {
            const { auth: token, signature } = this.data;

            const peer = new Peer({jwt: token});
            await peer.token.tryAuthenticate(
                session.service.database,
                session.socket.remoteAddress,
                signature
            );
            session.notifyAuthenticated(peer.token);

            this.chain.op('auth.response', {
                authenticated: true,
                keepAliveInterval: config.get().service.keep_alive_interval,
                sessionId: session.id
            }).send(session).catch(_ => { /* discarded */ });
        } catch (error) {
            session.logger.error(error);
            this.chain.op('auth.response', {
                authenticated: false, 
                keepAliveInterval: 0, 
                sessionId: ''
            }).send(session, () => {
                session.socket.end();
            }).catch(_ => { /* discarded */ });
        }
    }
};