async function sha256(message) {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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

api.authenticate = async function (username, password) {
    return await (await fetch(`/api/users/authenticate`, {
        method: "POST",
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ username, password: await sha256(password) })
    })).text();
}