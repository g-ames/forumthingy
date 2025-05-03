function generateRandomString(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        result += characters[randomIndex];
    }
    return result;
}

module.exports = async function (express, app) {
    var db = await require("./src/db")();

    const manual = app == undefined || app == null;

    // Another nice part about this is that it gives me auto-completions
    if (manual) {
        express = require('express');
        app = express();
    }

    // DB interactions
    app.get("/threads/contents", async (req, res) => {
        res.send(await db.getThreadContents(req.query.id));
    });

    app.get("/threads/new", async (req, res) => {
        res.send(await db.newThread(req.query.title));
    });

    app.get("/threads/all", async (req, res) => {
        res.send(await db.getAllThreads());
    });

    app.get("/threads/comment/add", async (req, res) => {
        res.send(await db.addComment(req.query.id, req.query.content));
    });

    app.use(express.static('public'))

    if(manual) {
        app.listen(3000, () => {
            console.log(`Example app listening on port 3000`)
        })
    }
};