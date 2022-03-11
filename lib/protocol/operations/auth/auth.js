const Operation = require("../../operation");
const Peer = require(`../../../peer`);

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
                sessionId: session.id
            }).send(session).catch(_ => { /* discarded */ });
        } catch (error) {
            session.logger.error(error);
            this.chain.op('auth.response', {
                authenticated: false,
                sessionId: ''
            }).send(session, () => {
                session.socket.end();
            }).catch(_ => { /* discarded */ });
        }
    }
};