async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

function localDT(createdAt) {
    return (new Date(createdAt)).toLocaleString();
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
    let intermediate = await (await fetch(`/api/users/about?username=${username}`)).json();
    intermediate.createdAt = localDT(intermediate.createdAt);
    return intermediate;
}

api.getLatestThreads = async function () {
    return await (await fetch(`/api/threads/latest`)).json();
}

api.getThread = async function (id) {
    return await (await fetch(`/api/thread?id=${id}`)).json();
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

    if (!valid) {
        window.location.href = "/signin";
    }
}

checkValid();