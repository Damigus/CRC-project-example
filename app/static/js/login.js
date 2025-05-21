document.addEventListener("DOMContentLoaded", function () {
    fetch("/protected_area")
        .then(response => response.json())
        .then(data => {
            if (!data.logged_in) {
                window.location.href = "/login";
            }
        })
        .catch(error => console.error("Błąd sprawdzania logowania:", error));
});


document.getElementById("loginButton").addEventListener("click", function() {
    window.location.href = "/login"; // Przekierowanie po kliknięciu
});