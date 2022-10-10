const path = require('path');
const express = require('express');
const app = express();
const fs = require('fs');
const apijs = require('./p_data/api');
const bodyParser = require("body-parser");
const port = process.env.PORT || 3000;
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

// static files
app.use(express.static(path.join(__dirname, 'p_data')));
app.use('/', apijs);

// start the server
const server = app.listen(port, () => {
    console.log('Server up on port', port);
});

// websockets
const io = require('socket.io')(server);

let players = [];

//Leer JSON
function ReadJson()
{
    var data = fs.readFileSync('./p_data/players.json', 'UTF8');
    players = JSON.parse(data);
}
//Save JSON
function SaveJson()
{
    jsonString = JSON.stringify(players, null, 4);
    fs.writeFileSync('./p_data/players.json', jsonString, 'UTF8', (err) => {
        if (err)
        {
            console.log('error', err);
        }
        else
        {
            players = JSON.parse(jsonString);
        }
    });
}
//Update ranking
function UpdateRanking() {
    ReadJson();
    //Order the ranking
    players.sort((a, b) => (a.score <= b.score) ? 1 : -1);

    //Position Update
    for (var x = 0; x < players.length; x++) {
        players[x].position = x + 1;
    }
    SaveJson();
};

//WEBSOCKETS!! Connexió bidireccional servidor-client oberta
io.on('connection', (socket) => {
    //comprovant de nova connexió amb id únic
    console.log('new connection', socket.id);
    ReadJson();
    //escolta el client, espera rebre 'coin'
    socket.on('coinReceived', (data) => {
        ReadJson();
        var index = players.findIndex(j => j.email === data.emailSent);
        players[index]['coins'] += data.coinSent;
        if (players[index]['coins'] > 10000000)
        {
            players[index]['coins'] = 9999999;
        }
        SaveJson();
        socket.emit('coinSent', players[index]);
    });
    socket.on('cashReceived', (data) => {
        ReadJson();
        var index = players.findIndex(j => j.email === data.emailSent);
        players[index]['cash'] += data.cashSent;
        if (players[index]['cash'] > 9999999)
        {
            players[index]['cash'] = 9999999;
        }
        SaveJson();
        socket.emit('cashSent', players[index]);
    });
    socket.on('levelUpAbility', (data) => {
        ReadJson();
        var index = players.findIndex(j => j.email === data.emailSent);
        players[index]['abilities'][data.numAbility] += 1;
        SaveJson();
        socket.emit('abilitySent', players[index]);
    });
    socket.on('scoreReceived', (data) => {
        ReadJson();
        var index = players.findIndex(j => j.email === data.emailSent);
        players[index]['score'] += data.scoreSent;
        SaveJson();
        UpdateRanking();
        socket.emit('scoreSent', players[index]);
    });
    socket.on('rankUpdateReceived', (data) => {
        UpdateRanking();
        ReadJson();
        var index = players.findIndex(j => j.email === data.emailSent);
        socket.emit('rankUpdate', players[index]);
        io.sockets.emit('sendRanking', ranking = {
            p1:players[0],
            p2:players[1],
            p3:players[2],
            p4:players[3],
            p5:players[4]
        });
    });
    socket.on('imageReceived', (data) => {
        ReadJson();
        var index = players.findIndex(j => j.email === data.emailSent);
        players[index]['image'] = data.numImage;
        SaveJson();
        ReadJson();
        socket.emit('imageSent', players[index]);
    });
});

app.use(express.urlencoded({ extended: false }));
module.exports = app;