const express = require('express');
const RedisSMQ = require('rsmq');
const app = express();
const PORT = 8001;
const rsmq = new RedisSMQ({
	host: "127.0.0.1",
	port: 63790, ns: 'rsmq',
})


rsmq.createQueue({ qname: 'webhook-queue'}, (err, resp) => {
	
	if(resp === 1) 
	rsmq.sendMessage({
		qname: 'webhook-queue',
		message: 'Hello World',
	  }, (err, resp) => {
		if (resp) console.log('Message sent. ID:', resp);
	});
});



app.listen( PORT, () => {
	console.log(`Running on ${PORT}`);
})
