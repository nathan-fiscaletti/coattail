const Peer = require(`./lib/peer`);

Peer.load({id: '3d18c12b-fcc2-4d7d-bb35-cef219f2c8d8'}).then(peer => {
    peer.subscribeTo('example').then(
        sub => console.log(`sub: ${sub}`),
        error => console.log(`err: ${error}`)
    );
    // peer.performAction({
    //     name: 'example',
    //     data: { name: 'nathan' }
    // }).then(
    //     res => console.log(res),
    //     errors => {
    //         for (const error of errors) {
    //             console.log(error);
    //         }
    //     }
    // );
});