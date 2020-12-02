const ws = require('ws');
const express = require('express');
const https = require('https');

const WebSocketServer = ws.Server;
const app = express();
const fs = require('fs');

const pkey = fs.readFileSync('./ssl/key.pem');
const pcert = fs.readFileSync('./ssl/cert.pem');
const options = { key: pkey, cert: pcert, passphrase: '123456789' };

var wss = null, sslSrv = null;

// use express static to deliver resources HTML, CSS, JS, etc)
// from the public folder 
app.use(express.static('client'));

app.use(function (req, res, next) {
    if (req.headers['x-forwarded-proto'] === 'http') {
        return res.redirect(['https://', req.get('Host'), req.url].join(''));
    }
    next();
});

// start server (listen on port 443 - SSL)
sslSrv = https.createServer(options, app).listen(2000);
console.log("The HTTPS server is up and running");

// create the WebSocket server
wss = new WebSocketServer({ server: sslSrv });
console.log("WebSocket Secure server is up and running.");

/** successful connection */
wss.on('connection', function (client) {
    console.log("A new WebSocket client was connected.");
    /** incomming message */
    client.on('message', function (message) {
        /** broadcast message to all clients */
        broadcast(message, client);
    });
});
// broadcasting the message to all WebSocket clients.
function broadcast (data, exclude) {
    var i = 0, n = wss.clients ? wss.clients.length : 0, client = null;
    if (n < 1) return;
    console.log("Broadcasting message to all " + n + " WebSocket clients.");
    for (; i < n; i++) {
        client = wss.clients[i];
        // don't send the message to the sender...
        if (client === exclude) continue;
        if (client.readyState === client.OPEN) client.send(data);
        else console.error('Error: the client state is ' + client.readyState);
    }
};