const fs = require('fs');
const express = require('express');
const bodyParser = require("body-parser")
const router = express.Router();
router.use(bodyParser.urlencoded({ extended: false }));
router.use(bodyParser.json());

let players = [];
let exists = false;
var idVar;

var error101 = "Player already exists in the server.";
var error102 = "Password do not match with the email.";
var error103 = "Player doesn't exist in the server.";

var succes101 = "Your account has been created correctly";
var succes102 = "Player has been deleted correctly";

function ReadJson()
{
    var data = fs.readFileSync('./p_data/players.json', 'UTF8');
    players = JSON.parse(data);
}
function SaveJson()
{
    jsonString = JSON.stringify(players, null, 4);
    fs.writeFileSync('./p_data/players.json', jsonString, 'UTF8', (err) => {
        if (err)
        {
            console.log('error');
        }
        else
        {
            players = JSON.parse(jsonString);
        }
    });
}

function CheckPlayer (index) {
    if (index >= 0) {
        //Player exists
        exists = true;
    } else {
        //Player doesn't exists
        exists = false;
    }
}
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
//Crear jugador
function CreateUser(data)
{
    players.push({
        id: data.id,
        name: data.name,
        email: data.email,
        password: data.password,
        abilities: data.abilities,
        score:data.score,
        cash: data.cash,
        coins: data.coins,
        image: data.image
    });
    SaveJson();
    //jsonData = JSON.stringify(players, null, ' ');
    //fs.writeFileSync('./p_data/players.json', jsonData);
    UpdateRanking();
}
//Crear id para nuevo jugador
function CreateID()
{
    var newIndex;
    min = Math.ceil(1);
    max = Math.floor(1000000000);
    do{
        idVar = Math.floor(Math.random() * (max - min) + min);
        newIndex = players.findIndex(j => j.id === idVar);
    }while(newIndex != -1);
}

router.get('/');

/*router.get('/ranking', function (req, res) {
    UpdateRanking();
    ReadJson();
    res.send(players);
});*/

//LOGIN
router.get('/players/:email/:password', function (req, res) {
    UpdateRanking();
    //Player Search
    var pEmail = req.params.email || "";
    var pPassword = req.params.password || "";
    var index = players.findIndex(j => j.email === pEmail);
    CheckPlayer(index);
    if (exists)
    {
        var email = players[index]['email'];
        var password = players[index]['password'];
        if (email == pEmail && password == pPassword)
        {
            res.send(players[index]);
        }
        else if (email == pEmail && password != pPassword)
        {
            res.send(error102);
        }
    }
    else
    {
        res.send(error103);
    }
});
//REGISTER
router.post('/players/:email', function (req, res) {
    ReadJson();
    var name = req.body.name || null;
    var email = req.body.email || null;
    var password = req.body.password || null;
    var image = req.body.image || null;
    var index = players.findIndex(j => j.email === email);
    CheckPlayer(index);
    CreateID();
    //Si no existe, lo crea en el JSON
    if (!exists)
    {
        CreateUser({
            id: idVar,
            name: name,
            email: email,
            password: password,
            abilities:
            {
                1:0,
                2:0,
                3:0,
                4:0,
                5:0
            },
            score:0,
            cash:0,
            coins:0,
            image: parseInt(image)
        });
        res.send(succes101);
    }
    else
    {
        res.send(error101);
    }
});
//DELETE PLAYER
router.delete('/players/:email/', function (req, res) {
    ReadJson();
    var pEmail = req.params.email || null;
    var index = players.findIndex(j => j.email === pEmail);
    players.splice(index, 1);
    SaveJson();
    UpdateRanking();
    res.send(succes102);
});

module.exports = router;