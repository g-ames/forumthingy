function getRelativeTime(utcTimestamp) {
    const date = new Date(utcTimestamp);
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: 'numeric',
        second: 'numeric',
        timeZoneName: 'short'
    };
    return date.toLocaleTimeString(undefined, options);
}

var app = {};

app.newLocalName = function() {
    app.localName = prompt("Display Name > ");
    localStorage.setItem("localname", app.localName);
}

app.currentThread = null;
app.localName = localStorage.getItem("localname");

if (app.localName == null) {
    app.newLocalName();
}

app.container = document.getElementById("thread-main");
app.footer = document.getElementById("thread-footer");

app.clear = function () {
    app.container.innerHTML = "";
}

app.go = function (state) {
    if (state != "in-thread") {
        app.currentThread = null;
    }

    if (state == "in-thread" || state == "new-post") {
        if (app.input == undefined || app.input == null) {
            app.input = document.createElement(state == "in-thread" ? "input" : "input");
            app.submit = document.createElement("button");
            
            app.input.onchange = function() {
                app.submit.onclick();
            }

            app.footer.appendChild(app.input);
            app.footer.appendChild(app.submit);
        }

        app.submit.textContent = state == "in-thread" ? "Comment" : "Create post";
        app.input.placeholder = state == "in-thread" ? "Type what you want to comment here!" : "Type the name of your new post.";
    } else {
        app.footer.innerHTML = "";
        app.input = undefined;
        app.submit = undefined;
    }

    if (app.state != state) {
        app.state = state;
        app.clear();
        app.container.classList = state;
    }
}

async function JSONFetch(url) {
    return await (await fetch(url)).json();
}

app.getThreadById = async function (id) {
    return await JSONFetch(`/threads/contents?id=${id}`);
}

app.loadThread = async function (element, contents) {
    if(app.lastThreadContents == contents) {
        return;
    }

    app.lastThreadContents = contents;

    app.comment("Anon-OP", getRelativeTime(element.createdAt), `[CREATED POST] ${element.title}`);
    console.log(contents.comments);
    contents.comments.forEach(comment => {
        if (comment.content == undefined) {
            return;
        }

        if (!comment.content.includes("->")) {
            return;
        }

        let sname = comment.content.split("->")[0];
        let aftername = comment.content.split("->").splice(1).join("->");
        app.comment(sname, getRelativeTime(comment.createdAt), aftername);
    });

    let onclick_callback = async function () {
        const inputText = app.input.value;
        app.input.value = "";
        let fixedInput = `${app.localName}->${inputText}`;
        await JSONFetch(`/threads/comment/add?id=${element.id}&content=${encodeURIComponent(fixedInput)}`);
        app.comment(app.localName, getRelativeTime((new Date()).toISOString()), inputText);
    }

    if(app.submit.onclick != onclick_callback) {
        app.submit.onclick = onclick_callback;
    }
}

app.getThreads = async function () {
    app.go("list-threads");

    localStorage.setItem("lastFetchedThreads", +Date.now());
    var list = await JSONFetch("/threads/all");

    list.forEach(async element => {
        let button = document.createElement("button");

        button.textContent = `${element.title} | ${getRelativeTime(element.createdAt)}`;

        let contents;
        button.addEventListener("mouseenter", async function () {
            if (contents != undefined && contents != null) {
                console.log("Already pre-fetched!");
                return;
            }

            console.log("Pre-fetching...");
            contents = await app.getThreadById(element.id);
            console.log("Done.");
        });

        button.onclick = function () {
            app.loadThread(element, contents);
            app.currentThread = element.id;
            app.currentThreadElement = element;
        }

        app.container.appendChild(button);
    });
}

app.comment = function (name, time, message) {
    app.go("in-thread");

    if (app.container == null || app.container == undefined) {
        app.container = document.createElement('div');
        app.container.id = "thread";
        document.body.appendChild(app.container);
    }

    const commentDiv = document.createElement('div');
    commentDiv.className = 'comment';

    const nameElement = document.createElement('i');
    const strongElement = document.createElement('strong');
    strongElement.textContent = name;
    nameElement.appendChild(strongElement);
    commentDiv.appendChild(nameElement);

    const timeElement = document.createElement('i');
    timeElement.textContent = ` | ${time}`;
    commentDiv.appendChild(timeElement);

    const messageParagraph = document.createElement('p');
    messageParagraph.textContent = message;
    commentDiv.appendChild(messageParagraph);

    app.container.appendChild(commentDiv);

    return commentDiv;
}

app.newPost = function () {
    app.go("new-post");

    app.submit.onclick = async function () {
        let red = `${app.input.value} | OP: ${app.localName}`;
        let res = await JSONFetch(`/threads/new?title=${encodeURIComponent(red)}`);
        
        app.go("loading")

        setTimeout(async function() {
            app.currentThread = res.id;
            let dupe = await app.getThreadById(res.id);
            app.currentThreadElement = dupe;
            await app.loadThread(dupe, dupe);
        }, 100);
    }
}

setInterval(async function () {
    if (app.currentThread != null) {
        // Load the contents before you load the thread to prevent screen-flashing
        let contents = await app.getThreadById(app.currentThread);
        app.clear();
        await app.loadThread(app.currentThreadElement, contents);
    }
}, 5000);