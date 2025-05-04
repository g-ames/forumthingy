let elements = {
    username: document.getElementById("username"),
    password: document.getElementById("password"),
    signin: document.getElementById("signin")
}

elements.signin.onclick = async function() {
    let result = await api.authenticate(
        elements.username.value,
        elements.password.value
    );

    sessionStorage.setItem("token", result);
    sessionStorage.setItem("username", elements.username.value);
    window.location.href = "/";
}