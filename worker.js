const RedisSMQ = require('rsmq');
const rsmq = new RedisSMQ({
    host: "127.0.0.1",
    port: 63790, ns: 'rsmq',
})

rsmq.receiveMessage({
    qname: 'webhook-queue', 
}, (err, resp) => {
    if( !resp.id ) return;
    console.log(resp);
})