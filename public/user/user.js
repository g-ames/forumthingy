(async function () {
    const params = new URLSearchParams(window.location.search);
    const comments = document.getElementById("comments");

    let username = params.get("username");
    document.getElementById("about").innerText = `About ${username}`;

    let info = await api.about(username);

    info["Comments"].forEach(element => {
        element["User"] = info;
    });

    comments.append(createCommentFrag(info["Comments"], true));
})();