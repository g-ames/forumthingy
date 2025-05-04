let elements = {
    username: document.getElementById("username"),
    password: document.getElementById("password"),
    signup: document.getElementById("signup")
}

elements.signup.onclick = async function() {
    let result = await api.newUser(
        elements.username.value,
        elements.password.value
    );

    if(result == "USERNAME_EXISTS") {
        alert(`Sorry, '${elements.username.value}' already exists!`);
        return;
    }

    sessionStorage.setItem("token", result);
    sessionStorage.setItem("username", elements.username.value);

    window.location.href = "/";
}