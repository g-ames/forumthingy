(async function() {
    let elements = {
        title: document.getElementById("thread-title"),
        info: document.getElementById("extra-info"),
        contents: document.getElementById("thread-contents"),
        comments: document.getElementById("comments"),
        textarea: document.getElementById("comment-textarea"),
        comment: document.getElementById("comment-button")
    }

    const params = new URLSearchParams(window.location.search);

    async function loadThread() {
        let thread = await api.getThread(params.get("id"));

        elements.title.innerText = thread.name;
        elements.contents.innerText = thread.description;
        elements.info.innerText = `Created: ${localDT(thread.createdAt)}, Last updated: ${localDT(thread.updatedAt)}, created by ${thread.User.username}`;

        let frag = new DocumentFragment();
        
        thread["Comments"].forEach(element => {
            let commentDiv = document.createElement("div");
            commentDiv.classList = "g-comment";

            let commentInfo = document.createElement("i");
            commentInfo.innerText = `${element['User'].username} | ${element['createdAt']}`;

            let commentText = document.createElement("p");
            commentText.innerText = element.text;

            commentDiv.appendChild(commentInfo);
            commentDiv.appendChild(commentText);
            frag.appendChild(commentDiv);
        });

        elements.comments.innerHTML = "";
        elements.comments.append(frag);
    }

    elements.comment.onclick = async function() {
        let response = await api.newComment(elements.textarea.value, parseInt(params.get("id")));
        elements.textarea.value = "";
    }
    
    setInterval(async function() {
        console.log("Loading thread...");
        await loadThread();
        console.log("Loaded!");
    }, 5000);

    loadThread();
})();