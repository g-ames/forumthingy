var elements = {
    title: document.getElementById("thread-title"),
    info: document.getElementById("extra-info"),
    contents: document.getElementById("thread-contents"),
    comments: document.getElementById("comments"),
    textarea: document.getElementById("comment-textarea"),
    comment: document.getElementById("comment-button")
}

var polling = false;
async function go() {
    api.replyCallback = function(x) {
        elements.textarea.value = "";
        elements.textarea.placeholder = x.replace(" | ", "");
    }    

    const params = new URLSearchParams(window.location.search);

    async function loadThread() {
        let thread = await api.getThread(params.get("id"));

        elements.title.innerText = thread.name;
        elements.contents.innerText = thread.description;
        elements.info.innerText = `Created: ${localDT(thread.createdAt)}, Last updated: ${localDT(thread.updatedAt)}, created by ${thread.User.username}`;

        let frag = createCommentFrag(thread["Comments"]);

        elements.comments.innerHTML = "";
        elements.comments.append(frag);
    }

    elements.comment.onclick = async function () {
        let response = await api.newComment(elements.textarea.value, parseInt(params.get("id")));
        elements.textarea.value = "";
        api.commentItalicizedSuffix = "";
        setTimeout(function() {
            window.scrollTo(0, 99999999999999);
        }, 100);
    }

    setInterval(async function () {
        if(!polling) {
            polling = true;
            await loadThread();
            polling = false;
        }
    }, 50);

    loadThread();
}

go();