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

    sessionStorage.setItem("token", result);
    sessionStorage.setItem("username", elements.username.value);
    window.location.href = "/";
}