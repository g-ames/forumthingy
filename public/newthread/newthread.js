(function() {
    if(sessionStorage.getItem("username") == null) {
        window.location.href = "/signin";
        return;
    }

    let elements = {
        title: document.getElementById("title"),
        content: document.getElementById("content"),
        newthread: document.getElementById("newthread")
    }
    
    elements.newthread.onclick = async function() {
        console.log(elements.content.value);

        let response = await api.newThread(elements.title.value, elements.content.value);

        if(response == "INVALID_TOKEN") {
            window.location.href = "/signin";
        } else {
            window.location.href = `/thread?id=${response}`
        }
    }
})();