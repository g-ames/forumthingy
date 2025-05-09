function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

const HTTPHASHES = window.crypto.subtle === undefined;
let hashesReady = Promise.resolve();

if (HTTPHASHES) {
    console.warn("WARNING: HTTP env: including httphashes.js! Please run under HTTPS under prod env!");

    hashesReady = new Promise((resolve, reject) => {
        const script = document.createElement("script");
        script.src = "/httphashes.js";
        script.onload = () => {
            console.info("httphashes.js loaded!");
            resolve();
        };
        script.onerror = () => reject(new Error("Failed to load httphashes.js"));
        document.body.appendChild(script);
    });
}

async function sha256(message) {
    // HTTP fallback
    if (HTTPHASHES) {
        await hashesReady;
        return (new Hashes.SHA256()).hex(message);
    }

    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

const today = new Date();
const thisDate = `${today.getMonth() + 1}/${today.getDate()}/${today.getFullYear()}`;

function localDT(createdAt) {
    const date = new Date(createdAt);
    const options = {
        year: 'numeric',
        month: 'numeric',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric'
    };
    const thisDate = new Date().toLocaleDateString();
    const formatted = date.toLocaleString(undefined, options);
    return formatted.replace(thisDate, "Today");
}

var api = {};

api.newUser = async function (username, password) {
    return await (await fetch(`/api/users/new`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password: await sha256(password) })
    })).text();
}

api.newThread = async function (title, content) {
    return await (await fetch(`/api/thread/new`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title, content, token: sessionStorage.getItem("token"), username: sessionStorage.getItem("username") })
    })).text();
}

api.authenticate = async function (username, password) {
    return await (await fetch(`/api/users/authenticate`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password: await sha256(password) })
    })).text();
}

api.about = async function (username) {
    return await (await fetch(`/api/users/about?username=${username}`)).json();
}

api.getLatestThreads = async function () {
    return await (await fetch(`/api/threads/latest`)).json();
}

api.initialGetThread = true;
api.gettingThread = false;
api.getThread = async function (id, failTimeout) {
    if(api.gettingThread) { 
        return;
    }
    api.gettingThread = true;

    try {
        let res = await (await fetch(`/api/thread?id=${id}&init=${api.initialGetThread ? "p" : "q"}`)).json();
        api.initialGetThread = false;
        api.gettingThread = false;
        console.log(res);
        return res;
    } catch (e) {
        failTimeout = failTimeout == undefined ? 500 : failTimeout; 
        await delay(failTimeout);
        api.gettingThread = false;
        return api.getThread(id, failTimeout * 2);
    }
}

api.tokenValid = async function (username, token) {
    return await (await fetch(`/api/token/valid`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, token })
    })).text();
}

api.commentItalicizedSuffix = "";
api.newComment = async function (text, thread) {
    italicized = api.commentItalicizedSuffix;
    if (italicized == undefined) {
        italicized = "";
    }
    await checkValid();
    return await (await fetch(`/api/comments/new`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            username: sessionStorage.getItem("username"),
            token: sessionStorage.getItem("token"),
            text,
            thread,
            italicized
        })
    })).text();
}

async function checkValid() {
    let cusername = sessionStorage.getItem("username");
    let ctoken = sessionStorage.getItem("token");

    if (cusername == undefined || cusername == null || ctoken == undefined || ctoken == null) {
        if (window.location.href.includes("sign")) {
            Array.from(document.getElementsByTagName("a")).forEach(tag => {
                if (!tag.href.toLowerCase().includes("sign")) {
                    tag.remove();
                }
            });
            return;
        }

        window.location.href = "/signup";
        return;
    }

    let valid = await api.tokenValid(cusername, ctoken);

    if (valid == false || JSON.parse(valid) == false) {
        window.location.href = "/signin";
    }
}

let controller = document.getElementById("controller");
if (sessionStorage.getItem("username") != null) {
    let aboutMe = document.createElement("a");
    aboutMe.href = `/user?username=${sessionStorage.getItem("username")}`
    aboutMe.innerText = "About Me";
    controller.appendChild(aboutMe);
}

api.replyCallback = async function () { };
function createCommentFrag(comments, asQuotes) {
    if (asQuotes == undefined) {
        asQuotes = false;
    }

    let frag = new DocumentFragment();

    comments.forEach(element => {
        let commentDiv = document.createElement("div");
        commentDiv.classList = "g-comment";

        let commentInfo = document.createElement("i");

        if (!asQuotes) {
            commentInfo.innerText = `${element['User'].username} | ${localDT(element['createdAt'])} ${element.italicizedConcatinatedText}`;
        } else {
            commentInfo.innerText = ` - ${element['User'].username}`;
        }

        if (asQuotes) {
            let commentText = document.createElement("a");
            commentText.innerText = element.text;
            commentDiv.classList = "g-comment q-comment";
            let quoteContainer = document.createElement("span");
            let bigQuoteSymbol = document.createElement("h1");
            bigQuoteSymbol.innerText = "“";
            commentText.href = `/thread?id=${element["Thread"].id}`;
            quoteContainer.appendChild(bigQuoteSymbol);
            quoteContainer.appendChild(commentText);
            commentDiv.appendChild(quoteContainer);
            commentDiv.appendChild(commentInfo);
        } else {
            let commentText = document.createElement("p");
            let innerCommentDiv = document.createElement("div");
            commentText.innerText = element.text;
            innerCommentDiv.appendChild(commentInfo);
            innerCommentDiv.appendChild(commentText);
            commentDiv.appendChild(innerCommentDiv);
        }


        let commentReply = document.createElement("button");
        commentReply.innerText = "⮪";
        commentReply.onclick = function () {
            api.commentItalicizedSuffix = ` | @${element['User'].username} ${element.text.slice(0, 30)} ⮯`;
            api.replyCallback(api.commentItalicizedSuffix);
        }
        commentDiv.appendChild(commentReply);

        frag.appendChild(commentDiv);
    });

    return frag;
}

api.setPfp = async function (file) {
    await checkValid();

    const formData = new FormData();
    formData.append("image", file);
    formData.append("username", sessionStorage.getItem("username"));
    formData.append("token", sessionStorage.getItem("token"));

    const res = await fetch('/api/users/pfp/set', {
        method: "POST",
        body: formData // DO NOT set Content-Type
    });

    return await res.json();
};
