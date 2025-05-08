var db;
(async function () {
    db = await (require("./src/db")());
})();

const multer = require('multer');
const express = require('express');
const app = express();
const port = 3000;

require('./src/makemini')(app);

const upload = multer({ dest: './uploads/' });

app.use('/uploads', express.static('uploads'));

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

function tokenValid(req, res, next) {
    if (tokens[req.body.username] != req.body.token) {
        return res.send("INVALID_TOKEN");
    }

    next();
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
        res.send(tokens[req.body.username]);
    } catch (e) {
        var errors = JSON.stringify(e);
        if (errors.includes("username must be unique")) {
            res.send("USERNAME_EXISTS");
        }
    }
});

app.post("/api/users/authenticate", async (req, res) => {
    let found = await db.User.findOne({
        where: {
            username: req.body.username,
            password: req.body.password
        }
    });

    if (found == null) {
        res.status(400).send(null);
        return;
    }

    let token = tokens[req.body.username];
    if (token == undefined || token == null) {
        token = generateToken();
        tokens[req.body.username] = token;
    }

    res.status(200).send(token)
});

app.post("/api/thread/new", tokenValid, async (req, res) => {
    let found = await db.User.findOne({
        where: {
            username: req.body.username
        }
    });

    if (found == null) {
        res.status(400).send(null);
        return;
    }

    const thread = await db.Thread.create({
        name: req.body.title,
        description: req.body.content,
        UserId: found.id
    });

    res.send(thread.id);
});

var longPollingCallbacks = {};

app.post("/api/comments/new", tokenValid, async (req, res) => {
    if(req.body.text.trim() == "") {
        res.status(500).send();
        return;
    }

    let found = await db.User.findOne({
        where: {
            username: req.body.username
        }
    });

    const comment = await db.Comment.create({
        ThreadId: req.body.thread,
        UserId: found.id,
        text: req.body.text,
        italicizedConcatinatedText: req.body.italicized
    });

    res.send(comment);

    longPollingCallbacks[req.body.thread].forEach(element => {
        element();
    });

    longPollingCallbacks[req.body.thread] = [];
});

app.post("/api/users/pfp/set", tokenValid, upload.single('image'), async (req, res) => {
    let found = await db.User.findOne({
        where: {
            username: req.body.username
        }
    });

    found.set("profilePicture", req.file.filename);

    await user.save(); // sorry user ur gunna have tu wait

    res.send("SUCCESS", req.file.filename);
});

async function returnThreadInformation(req, res) {
    let result = await db.Thread.findByPk(req.query.id, {
        include: [
            {
                model: db.User,
                attributes: { exclude: ['password'] }
            },
            {
                model: db.Comment,
                include: [{
                    model: db.User,
                    attributes: { exclude: ['password'] }
                }]
            }
        ]
    });

    if (result == null || result == undefined) {
        return res.status(404).send({ error: "Thread not found" });
    }

    res.send(result);
}

app.get("/api/thread", async (req, res) => {
    if(req.query.init == "p") {
        returnThreadInformation(req, res);
        return;
    }

    if(longPollingCallbacks[req.query.id] == null || longPollingCallbacks[req.query.id] == undefined) {
        longPollingCallbacks[req.query.id] = [];
    }

    longPollingCallbacks[req.query.id].push(async function() {
        returnThreadInformation(req, res);
    });
});

app.get("/api/threads/latest", async (req, res) => {
    let result = await db.Thread.findAll({
        limit: 20,
        order: [['id', 'DESC']], // Order by id descending, thanks that totally makes sense
        include: [{
            model: db.User,
            attributes: { exclude: ['password'] }
        }]
    });

    res.send(result);
});

app.get("/api/users/about", async (req, res) => {
    try {
        let username = req.query.username;

        const user = await db.User.findOne({
            where: { username },
            attributes: { exclude: ['password'] },  // Exclude the user's password
            include: [
                {
                    model: db.Thread,
                    attributes: ['id', 'name', 'description'],  // Fields to retrieve for threads
                },
                {
                    model: db.Comment,
                    attributes: ['id', 'text'],  // Fields to retrieve for comments
                    include: [
                        {
                            model: db.Thread,
                            attributes: ['id', 'name', 'description'],  // Include thread info in comments
                        }
                    ]
                }
            ]
        });

        if (!user) {
            throw new Error('User not found');
        }

        res.send(user);
    } catch (error) {
        console.error('Error fetching user threads and comments:', error);
        res.status(500).send("Internal server error... Sorry! :(");
    }
});

app.post("/api/token/valid", async (req, res) => {
    res.send(tokens[req.body.username] == req.body.token);
});

const hostname = "50.106.73.183";

app.listen(port, hostname, () => {
    console.log(hostname)
});
