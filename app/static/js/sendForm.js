
/**
 * Przełącza menu hamburger na małych ekranach
 */
function hamburgerMenu() {
    var x = document.getElementById("myTopnav");
    if (x.className === "topnav") {
      x.className += " responsive";
    } else {
      x.className = "topnav";
    }
  }



// Po załadowaniu całego dokumentu...
document.addEventListener("DOMContentLoaded", function () {
    const koloSelect = document.getElementById("kolo");
    const regionInput = document.getElementById("region");

    // Pobierz listę kół z serwera
    fetch("/get_circles")
        .then(response => {
            if (!response.ok) {
                throw new Error("Błąd podczas pobierania danych kół.");
            }
            return response.json();
        })
        .then(data => {
            // Dodaj każde koło jako opcję do selecta
            data.forEach(circle => {
                const option = document.createElement("option");
                option.value = circle.name;
                option.textContent = circle.name;
                option.dataset.region = circle.region; // Przechowuj region w atrybucie data
                koloSelect.appendChild(option);
            });
        })
        .catch(error => {
            console.error("Błąd:", error); // Wyświetl błąd pobierania kół
        });

    // Automatyczne ustawianie regionu na podstawie wybranego koła
    koloSelect.addEventListener("change", function () {
        const selectedOption = koloSelect.options[koloSelect.selectedIndex];
        const region = selectedOption.dataset.region || "";
        regionInput.value = region;
    });
});

// Obsługa formularza rejestracyjnego
document.getElementById("membershipForm").addEventListener("submit", function (event) {
    event.preventDefault(); // Zapobiega przeładowaniu strony po kliknięciu "Wyślij"

    const formData = new FormData(this); // Pobranie danych formularza

    console.log("Intercepted form submit"); // Debug

    // Wysłanie danych formularza do backendu
    fetch("/register_user", {
        method: "POST",
        body: formData
    })
    .then(response => {
        console.log("Odpowiedź serwera:", response);
        if (!response.ok) {
            // Jeśli odpowiedź to błąd — zwróć szczegóły
            return response.json().then(err => Promise.reject(err));
        }
        return response.json();
    })
    .then(data => {
        console.log("Sukces:", data);
        alert(data.message || "Rejestracja zakończona sukcesem!"); // Komunikat sukcesu
        this.reset(); // Wyczyść formularz po udanej rejestracji
    })
    .catch(error => {
        console.error("Błąd:", error);
        alert(error.error || "Wystąpił błąd podczas rejestracji."); // Komunikat błędu
    });
});
