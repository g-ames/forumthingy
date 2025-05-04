(async function() {
    let elements = {
        title: document.getElementById("thread-title"),
        info: document.getElementById("extra-info"),
        contents: document.getElementById("thread-contents"),
        comments: document.getElementById("comments")
    }

    const params = new URLSearchParams(window.location.search);
    let thread = await api.getThread(params.get("id"));

    elements.title.innerText = thread.name;
    elements.contents.innerText = thread.description;
    elements.info.innerText = `Created: ${localDT(thread.createdAt)}, Last updated: ${localDT(thread.updatedAt)}, created by ${thread.User.username}`;
})();