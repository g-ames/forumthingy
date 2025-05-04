var db;
(async function () {
    db = await (require("./src/db")());
})();

const express = require('express');
const app = express();
const port = 3000;

function generateToken() {
    const length = 256; 
    let result = '';
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

var tokens = {};

app.use(express.json());
// app.use(express.urlencoded({ extended: true }));

app.use(express.static("public"));

app.post("/api/users/new", async (req, res) => {
    try {
        const user = await db.User.create({
            username: req.body.username,
            password: req.body.password
        });
    
        tokens[req.username] = generateToken();
        res.status(201).send(tokens[req.username]);
    } catch(e) {
        res.status(400).send(e.errors[0].message);
    }
});

app.post("/api/users/authenticate", async (req, res) => {
    let found = await db.User.findOne({
        where: { 
            username: req.body.username, 
            password: req.body.password 
        } 
    });
    
    if(found == null) {
        res.status(400).send(null);
        return;
    }

    let token = tokens[req.body.username];
    if(token == undefined || token == null) {
        token = generateToken();
        tokens[req.body.username] = token;
    }

    res.status(200).send(token)
});

app.listen(port, () => {
    console.log("goose!")
});