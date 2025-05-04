let friendly = document.getElementById("friendly");
let username = sessionStorage.getItem("username");
friendly.textContent = `Hi there, ${username == null ? 'friend' : username}!`;