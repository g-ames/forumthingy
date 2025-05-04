let friendly = document.getElementById("friendly");
let username = sessionStorage.getItem("username");

if(username != null) {
    friendly.textContent = `Hi there, ${username}! -- here are the latest threads:`;
} else {
    friendly.innerHTML = `Hi there! Would you care to sign up? <a href="/signup">Click here!</a>`
}

(async function() {
    let threadsList = document.getElementById("threads-list");
    let theLatest = await api.getLatestThreads();
    theLatest.forEach(element => {
        let anchor = document.createElement("a");
        anchor.href = `/thread?id=${element.id}`;
        anchor.innerText = `${element.name} | ${element.User.username} | ${localDT(element.createdAt)}`
        threadsList.appendChild(anchor);
    });
})();