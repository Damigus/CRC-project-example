
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

/**
 * Inicjalizacja wszystkich funkcji obsługujących tabelę użytkowników
 */
document.addEventListener("DOMContentLoaded", function () {
  initUserManagement();
  initSearchFunctionality();
  initImportExportFunctions();
});

/**
 * Inicjalizacja funkcji zarządzania użytkownikami (edycja, usuwanie, banowanie)
 */
function initUserManagement() {
  const deleteButtons = document.querySelectorAll('.deleteUserBtn');
  const banButtons = document.querySelectorAll('.banUserBtn');
  const editButtons = document.querySelectorAll(".editUserBtn");
  const saveButtons = document.querySelectorAll(".saveUserBtn");
  const cancelButtons = document.querySelectorAll(".cancelUserBtn");
  const unBanButtons = document.querySelectorAll(".unBanUserBtn");
  
  // Przypisanie event listenerów do wszystkich przycisków
  initDeleteButtons(deleteButtons);
  initBanButtons(banButtons);
  initUnbanButtons(unBanButtons);
  initEditButtons(editButtons);
  initSaveButtons(saveButtons);
  initCancelButtons(cancelButtons);
}

/**
 * Inicjalizacja funkcji usuwania użytkowników
 * @param {NodeList} deleteButtons - Lista przycisków usuwania użytkowników
 */
function initDeleteButtons(deleteButtons) {
  deleteButtons.forEach(button => {
    button.addEventListener('click', function () {
      const userId = this.getAttribute('data-user-id');
      const row = this.closest("tr");
      
      // Najpierw pytamy o potwierdzenie
      const confirmDeletion = confirm("Czy na pewno chcesz usunąć tego użytkownika?");
      
      if (confirmDeletion) {
        // Po potwierdzeniu, pytamy o powód usunięcia
        const reason = prompt("Podaj powód usunięcia użytkownika:", "");
        
        // Jeśli użytkownik anulował prompt, przerywamy operację
        if (reason === null) {
          return;
        }
        
        // Przygotowanie danych do wysłania
        const requestData = {
          reason: reason
        };
        
        // Wysyłanie żądania DELETE do serwera z powodem usunięcia
        fetch(`/delete_user/${userId}`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`
          },
          body: JSON.stringify(requestData)
        })
        .then(response => response.json())
        .then(data => {
          if (data.message) {
            alert(data.message);
            // Usunięcie wiersza z tabeli po pomyślnym usunięciu z bazy
            row.remove();
          } else if (data.error) {
            alert(data.error);
          }
        })
        .catch(error => {
          console.error('Błąd podczas usuwania użytkownika:', error);
          alert('Wystąpił błąd przy usuwaniu użytkownika.');
        });
      }
    });
  });
}

/**
 * Inicjalizacja funkcji banowania użytkowników
 * @param {NodeList} banButtons - Lista przycisków banowania użytkowników
 */
function initBanButtons(banButtons) {
  banButtons.forEach(button => {
    button.addEventListener('click', function () {
      const userId = this.getAttribute('data-user-id');
      const row = this.closest("tr");
      const confirmBan = confirm("Czy na pewno chcesz zbanować tego użytkownika?");
      
      if (confirmBan) {
        // Po potwierdzeniu, pytamy o powód banowania
        const reason = prompt("Podaj powód banowania użytkownika:", "");
        
        // Jeśli użytkownik anulował prompt, przerywamy operację
        if (reason === null) {
          return;
        }
        
        // Przygotowanie danych do wysłania
        const requestData = {
          reason: reason
        };
        
        // Wysyłanie żądania POST do zbanowania użytkownika
        fetch(`/ban_user/${userId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`
          },
          body: JSON.stringify(requestData)
        })
        .then(response => response.json())
        .then(data => {
          if (data.message) {
            alert(data.message);
            // Oznaczenie wiersza jako zbanowany i aktualizacja UI
            row.classList.add("banned");
            row.remove();
            // Ukrycie przycisku banowania i pokazanie przycisku odbanowania
            this.style.display = "none";
            const unbanBtn = row.querySelector(".unBanUserBtn");
            if (unbanBtn) {
              unbanBtn.style.display = "inline-block";
            }
          } else if (data.error) {
            alert(data.error);
          }
        })
        .catch(error => {
          console.error('Błąd podczas banowania użytkownika:', error);
          alert('Wystąpił błąd przy banowaniu użytkownika.');
        });
      }
    });
  });
}

/**
 * Inicjalizacja funkcji odbanowania użytkowników
 * @param {NodeList} unBanButtons - Lista przycisków odbanowania użytkowników
 */
function initUnbanButtons(unBanButtons) {
  unBanButtons.forEach(button => {
    button.addEventListener('click', function () {
      const userId = this.getAttribute('data-user-id');
      const row = this.closest("tr");
      const confirmUnBan = confirm("Czy na pewno chcesz odbanować tego użytkownika?");
      
      if (confirmUnBan) {
        // Wysyłanie żądania POST do odbanowania użytkownika
        fetch(`/unban_user/${userId}`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`
          }
        })
        .then(response => response.json())
        .then(data => {
          if (data.message) {
            alert(data.message);
            // Usunięcie klasy banned z wiersza i aktualizacja UI
            row.classList.remove("banned");
            // Ukrycie przycisku odbanowania i pokazanie przycisku banowania
            this.style.display = "none";
            const banBtn = row.querySelector(".banUserBtn");
            if (banBtn) {
              banBtn.style.display = "inline-block";
            }
          } else if (data.error) {
            alert(data.error);
          }
        })
        .catch(error => {
          console.error('Błąd podczas odbanowywania użytkownika:', error);
          alert('Wystąpił błąd przy odbanowywaniu użytkownika.');
        });
      }
    });
  });
}

/**
 * Inicjalizacja przycisków edycji użytkownika
 * @param {NodeList} editButtons - Lista przycisków edycji użytkowników
 */
function initEditButtons(editButtons) {
  editButtons.forEach(button => {
    button.addEventListener("click", async function () {
      const row = this.closest("tr");
      const editableCells = row.querySelectorAll("[contenteditable]");
      
      // Pobieranie kół dla selecta
      const circlesData = await fetchCircles();
      
      // Zapisanie oryginalnych wartości i włączenie edycji
      editableCells.forEach(cell => {
        const fieldName = cell.getAttribute("data-field");
        const originalValue = cell.innerText.trim();
        cell.setAttribute("data-original", originalValue);
        
        // Obsługa specjalnych pól
        if (fieldName === "data_urodzenia" || 
            fieldName === "data_przystapienia_do_organizacji" || 
            fieldName === "data_przystapienia_do_kola") {
          // Tworzenie pola input typu date dla dat
          const dateInput = document.createElement("input");
          dateInput.type = "date";
          dateInput.value = originalValue; // Format YYYY-MM-DD
          dateInput.className = "date-editor";
          
          // Ukrycie oryginalnego tekstu i dodanie inputa
          cell.innerText = "";
          cell.appendChild(dateInput);
          cell.setAttribute("contenteditable", "false"); // Wyłączenie edytowalności dla komórki
        } 
        else if (fieldName === "skladka") {
          // Tworzenie pola typu number dla składki
          const numberInput = document.createElement("input");
          numberInput.type = "number";
          numberInput.min = "0";
          numberInput.step = "1";
          numberInput.value = originalValue === "Brak" ? "0" : originalValue;
          numberInput.className = "number-editor";
          
          // Ukrycie oryginalnego tekstu i dodanie inputa
          cell.innerText = "";
          cell.appendChild(numberInput);
          cell.setAttribute("contenteditable", "false"); // Wyłączenie edytowalności dla komórki
        }
        else if (fieldName === "kolo") {
          // Tworzenie selecta dla koła
          const selectElement = document.createElement("select");
          selectElement.className = "circle-editor";
          
          // Zapisanie aktualnego koła
          const currentCircleName = originalValue;
          let currentCircleRegion = "";
          
          // Wypełnienie opcji selecta dostępnymi kołami
          circlesData.forEach(circle => {
            const option = document.createElement("option");
            option.value = circle.name;
            option.text = circle.name;
            option.setAttribute("data-region", circle.region);
            
            // Zapisanie regionu dla aktualnego koła
            if (circle.name === currentCircleName) {
              currentCircleRegion = circle.region;
            }
            
            selectElement.appendChild(option);
          });
          
          // Ustawienie aktualnego koła jako wybranego
          selectElement.value = currentCircleName;
          
          // Ukrycie oryginalnego tekstu i dodanie selecta
          cell.innerText = "";
          cell.appendChild(selectElement);
          cell.setAttribute("contenteditable", "false"); // Wyłączenie edytowalności dla komórki
          
          // Aktualizacja regionu przy zmianie koła
          selectElement.addEventListener("change", function() {
            const selectedOption = this.options[this.selectedIndex];
            const region = selectedOption.getAttribute("data-region");
            const regionCell = row.querySelector("[data-field='region']");
            if (regionCell) {
              regionCell.innerText = region;
            }
          });
          
          // Aktualizacja regionu na początku edycji
          const regionCell = row.querySelector("[data-field='region']");
          if (regionCell) {
            regionCell.innerText = currentCircleRegion;
            regionCell.setAttribute("data-original", currentCircleRegion);
            regionCell.setAttribute("contenteditable", "false");
          }
        }
        else if (fieldName === "region") {
          // Pole region nie powinno być edytowalne
          cell.setAttribute("contenteditable", "false");
        }
        else {
          // Standardowa obsługa pozostałych pól
          cell.setAttribute("contenteditable", "true");
          cell.classList.add("editing");
          
          // Dodanie fokusa i zaznaczenia zawartości przy kliknięciu w komórkę
          cell.addEventListener("click", function() {
            if (this.getAttribute("contenteditable") === "true") {
              const selection = window.getSelection();
              const range = document.createRange();
              range.selectNodeContents(this);
              selection.removeAllRanges();
              selection.addRange(range);
            }
          });
        }
      });

      // Obsługa deklaracji, jeśli istnieje
      const declarationCell = row.querySelector(".declaration-cell");
      if (declarationCell) {
        const declarationView = declarationCell.querySelector(".declaration-view");
        const declarationEdit = declarationCell.querySelector(".declaration-edit");
        
        if (declarationView && declarationEdit) {
          // Zapisanie oryginalnego HTML komórek
          if (!declarationCell.hasAttribute("data-original-html")) {
            declarationCell.setAttribute("data-original-html", declarationCell.innerHTML);
          }
          
          // Pokazanie formularza edycji deklaracji, ukrycie widoku deklaracji
          declarationView.style.display = "none";
          declarationEdit.style.display = "block";
        }
      }

      // Zmiana widoczności przycisków
      const saveButton = row.querySelector(".saveUserBtn");
      const cancelButton = row.querySelector(".cancelUserBtn");
      
      if (saveButton) saveButton.style.display = "inline-block";
      if (cancelButton) cancelButton.style.display = "inline-block";
      this.style.display = "none";
    });
  });
}

/**
 * Pobieranie listy kół z serwera
 * @returns {Promise<Array>} - Tablica obiektów kół
 */
async function fetchCircles() {
  try {
    const response = await fetch('/get_circles', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Problem z pobraniem listy kół');
    }
    
    return await response.json();
  } catch (error) {
    console.error('Błąd podczas pobierania kół:', error);
    return []; // Zwracamy pustą tablicę w przypadku błędu
  }
}

/**
 * Inicjalizacja przycisków zapisywania edycji użytkownika
 * @param {NodeList} saveButtons - Lista przycisków zapisywania edycji
 */
function initSaveButtons(saveButtons) {
  saveButtons.forEach(button => {
    button.addEventListener("click", function () {
      const row = this.closest("tr");
      const userId = row.getAttribute("data-user-id");
      const editableCells = row.querySelectorAll("[data-field]"); // Pobieramy wszystkie komórki z data-field
      const data = {};
      let newPesel = null;

      // Zbieranie danych z edytowalnych komórek
      editableCells.forEach(cell => {
        const key = cell.getAttribute("data-field");
        
        // Zapisujemy wartość PESEL-u, jeśli jest edytowany
        if (key === "pesel") {
          // Sprawdzenie czy jest input lub nowa wartość tekstowa
          const peselInput = cell.querySelector("input");
          if (peselInput) {
            newPesel = peselInput.value.trim();
          } else {
            newPesel = cell.innerText.trim();
          }
        }
        
        // Jeśli pole ma specjalny input (data, składka, koło)
        const dateInput = cell.querySelector("input[type='date']");
        const numberInput = cell.querySelector("input[type='number']");
        const circleSelect = cell.querySelector("select.circle-editor");
        
        if (dateInput) {
          data[key] = dateInput.value;
        } else if (numberInput) {
          data[key] = numberInput.value;
        } else if (circleSelect) {
          data[key] = circleSelect.value;
        } else {
          // Standardowe pole
          data[key] = cell.innerText.trim();
        }
      });

      // Sprawdzenie czy jest nowy plik deklaracji
      const declarationFileInput = row.querySelector(".declaration-file-input");
      const formData = new FormData();
      let hasFile = false;

      // Dodanie pliku do formData, jeśli został wybrany
      if (declarationFileInput && declarationFileInput.files.length > 0) {
        formData.append("declaration_file", declarationFileInput.files[0]);
        hasFile = true;
      }

      // Dodanie pozostałych danych do formData
      for (const key in data) {
        formData.append(key, data[key]);
      }

      if (confirm("Czy na pewno chcesz zapisać zmiany?")) {
        // Jeśli jest nowy plik, używamy osobnego endpointu do aktualizacji deklaracji
        if (hasFile) {
          handleDeclarationUpdate(userId, formData, row);
        }

        // Wywołanie istniejącej funkcjonalności edycji innych pól
        handleUserDataUpdate(userId, data, row, editableCells, hasFile, newPesel);
      }
    });
  });
}

/**
 * Obsługa aktualizacji pliku deklaracji użytkownika
 * @param {string} userId - ID użytkownika
 * @param {FormData} formData - Dane formularza z plikiem
 * @param {HTMLElement} row - Wiersz tabeli z danymi użytkownika
 */
function handleDeclarationUpdate(userId, formData, row) {
  fetch(`/update_declaration/${userId}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${sessionStorage.getItem("auth_token")}`
    },
    body: formData
  })
  .then(response => response.json())
  .then(responseData => {
    if (responseData.message) {
      alert("Zapisano nową deklarację!");
      
      // Aktualizacja widoku deklaracji
      const declarationCell = row.querySelector(".declaration-cell");
      const declarationView = declarationCell.querySelector(".declaration-view");
      
      if (responseData.filename) {
        declarationView.innerHTML = `
          <a href="/uploads/${responseData.filename}" target="_blank">
            <button>Wyświetl</button>
          </a>
        `;
      }
      
      // Przywrócenie widoku, ukrycie edycji
      declarationView.style.display = "block";
      declarationCell.querySelector(".declaration-edit").style.display = "none";
    } else {
      alert(responseData.error || "Wystąpił błąd.");
    }
  })
  .catch(error => {
    console.error("Błąd:", error);
    alert("Wystąpił błąd przy zapisywaniu deklaracji.");
  });
}

/**
 * Obsługa aktualizacji danych użytkownika
 * @param {string} userId - ID użytkownika
 * @param {object} data - Dane użytkownika do aktualizacji
 * @param {HTMLElement} row - Wiersz tabeli z danymi użytkownika
 * @param {NodeList} editableCells - Lista edytowalnych komórek
 * @param {boolean} hasFile - Flaga czy był aktualizowany plik deklaracji
 * @param {string} newPesel - Nowa wartość pola PESEL (jeśli była zmieniona)
 */
function handleUserDataUpdate(userId, data, row, editableCells, hasFile, newPesel) {
  fetch(`/edit_user/${userId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${sessionStorage.getItem("auth_token")}`
    },
    body: JSON.stringify(data)
  })
  .then(response => response.json())
  .then(responseData => {
    if (responseData.message) {
      if (!hasFile) alert("Zapisano zmiany!");
      
      // Wyłączenie trybu edycji i aktualizacja wyświetlanych wartości
      editableCells.forEach(cell => {
        const key = cell.getAttribute("data-field");
        
        // Usunięcie kontrolek specjalnych i wyświetlenie wartości
        const dateInput = cell.querySelector("input[type='date']");
        const numberInput = cell.querySelector("input[type='number']");
        const circleSelect = cell.querySelector("select.circle-editor");
        
        if (dateInput) {
          cell.innerText = dateInput.value;
        } else if (numberInput) {
          const value = numberInput.value;
          cell.innerText = value ? value : "Brak";
        } else if (circleSelect) {
          cell.innerText = circleSelect.value;
        }
        
        // Wyłączenie trybu edycji dla wszystkich komórek
        cell.setAttribute("contenteditable", "false");
        cell.classList.remove("editing");
        cell.removeAttribute("data-original");
      });
      
      // Aktualizacja linku do deklaracji, jeśli PESEL został zmieniony
      if (newPesel) {
        const declarationCell = row.querySelector(".declaration-cell");
        if (declarationCell) {
          const declarationView = declarationCell.querySelector(".declaration-view");
          const declarationLink = declarationView.querySelector("a");
          
          if (declarationLink) {
            // Pobieramy aktualny URL
            const currentUrl = declarationLink.getAttribute("href");
            
            // Pobieramy rozszerzenie pliku z aktualnego URL
            const fileExtension = currentUrl.split('.').pop();
            
            // Tworzymy nową ścieżkę do pliku: /uploads/[newPesel].[extension]
            const newUrl = `/uploads/${newPesel}.${fileExtension}`;
            
            // Aktualizujemy atrybut href linku
            declarationLink.setAttribute("href", newUrl);
          }
        }
      }
      
      // Przywrócenie domyślnej widoczności przycisków
      row.querySelector(".editUserBtn").style.display = "inline-block";
      row.querySelector(".saveUserBtn").style.display = "none";
      row.querySelector(".cancelUserBtn").style.display = "none";
      
      // Przywrócenie widoku deklaracji, jeśli nie było nowego pliku
      if (!hasFile) {
        const declarationCell = row.querySelector(".declaration-cell");
        if (declarationCell) {
          const declarationView = declarationCell.querySelector(".declaration-view");
          const declarationEdit = declarationCell.querySelector(".declaration-edit");
          
          declarationView.style.display = "block";
          declarationEdit.style.display = "none";
        }
      }
    } else {
      if (!hasFile) alert(responseData.error || "Wystąpił błąd.");
    }
  })
  .catch(error => {
    console.error("Błąd:", error);
    if (!hasFile) alert("Wystąpił błąd przy edycji.");
  });
}

/**
 * Inicjalizacja przycisków anulowania edycji użytkownika
 * @param {NodeList} cancelButtons - Lista przycisków anulowania edycji
 */
function initCancelButtons(cancelButtons) {
  cancelButtons.forEach(button => {
    button.addEventListener("click", function () {
      const row = this.closest("tr");
      const editableCells = row.querySelectorAll("[data-field]");

      // Przywrócenie oryginalnych wartości
      editableCells.forEach(cell => {
        const originalValue = cell.getAttribute("data-original");
        if (originalValue !== null) {
          // Usunięcie kontrolek specjalnych
          const dateInput = cell.querySelector("input[type='date']");
          const numberInput = cell.querySelector("input[type='number']");
          const circleSelect = cell.querySelector("select.circle-editor");
          
          if (dateInput || numberInput || circleSelect) {
            cell.innerHTML = ''; // Usunięcie kontrolek
          }
          
          cell.innerText = originalValue;
          cell.removeAttribute("data-original");
        }
        cell.setAttribute("contenteditable", "false");
        cell.classList.remove("editing");
      });

      // Przywrócenie oryginalnego stanu deklaracji
      const declarationCell = row.querySelector(".declaration-cell");
      if (declarationCell && declarationCell.hasAttribute("data-original-html")) {
        // Przywracamy cały oryginalny HTML komórki deklaracji
        declarationCell.innerHTML = declarationCell.getAttribute("data-original-html");
        
        // Resetujemy plik wejściowy jeśli istnieje
        const fileInput = declarationCell.querySelector(".declaration-file-input");
        if (fileInput) fileInput.value = "";
        
        // Upewniamy się, że widok jest widoczny, a edycja ukryta
        const declarationView = declarationCell.querySelector(".declaration-view");
        const declarationEdit = declarationCell.querySelector(".declaration-edit");
        
        if (declarationView) declarationView.style.display = "block";
        if (declarationEdit) declarationEdit.style.display = "none";
      }

      // Przywrócenie domyślnej widoczności przycisków
      const editButton = row.querySelector(".editUserBtn");
      const saveButton = row.querySelector(".saveUserBtn");
      
      if (editButton) editButton.style.display = "inline-block";
      if (saveButton) saveButton.style.display = "none";
      this.style.display = "none";
    });
  });
}


/**
 * Inicjalizacja funkcji wyszukiwania użytkowników
 */
function initSearchFunctionality() {
  const searchInput = document.getElementById('searchInput');
  if (!searchInput) return;
  
  const table = document.querySelector('table');
  const rows = table.querySelectorAll('tbody tr');

  searchInput.addEventListener('input', function () {
    const query = this.value.toLowerCase().trim();

    rows.forEach(row => {
      const cells = row.querySelectorAll('td');
      let match = false;

      // Wyszukiwanie zaawansowane po imieniu i nazwisku
      if (cells.length >= 2) {
        const fullName = (cells[0].textContent + ' ' + cells[1].textContent).toLowerCase();

        // Sprawdzenie czy każde słowo wpisane w wyszukiwarce występuje w imieniu lub nazwisku
        const queryWords = query.split(' ').filter(word => word.length > 0);
        
        if (queryWords.length > 0) {
          // Sprawdzenie czy wszystkie słowa z zapytania pasują do imienia lub nazwiska
          const nameMatches = queryWords.every(word =>
            fullName.includes(word)
          );

          if (nameMatches) {
            match = true;
          } else {
            // Sprawdzenie innych komórek w wierszu
            for (let i = 0; i < cells.length; i++) {
              if (cells[i].textContent.toLowerCase().includes(query)) {
                match = true;
                break;
              }
            }
          }
        } else {
          // Pusty string zapytania - pokazanie wszystkich wierszy
          match = true;
        }
      }

      row.style.display = match ? '' : 'none';
    });
  });
}

/**
 * Inicjalizacja funkcji importowania i eksportowania danych
 */
function initImportExportFunctions() {
  // Inicjalizacja przycisku eksportu
  const exportBtn = document.getElementById('export-btn');
  if (exportBtn) {
    exportBtn.addEventListener('click', function() {
      // Wysłanie żądania GET do serwera, aby pobrać plik CSV
      window.location.href = '/export_members';
    });
  }

  // Inicjalizacja przycisku importu
  const importBtn = document.getElementById("importBtn");
  const fileInput = document.getElementById("csv-file");
  const importForm = document.getElementById("import-form");

  if (importBtn && fileInput && importForm) {
    importBtn.addEventListener("click", function () {
      fileInput.click(); // Kliknięcie ukrytego inputa typu file
    });

    fileInput.addEventListener("change", function () {
      if (!fileInput.files.length) return;

      const formData = new FormData(importForm);

      fetch("/import_members", {
        method: "POST",
        body: formData
      })
      .then(async (response) => {
        const result = await response.json();
        if (response.ok) {
          alert(`${result.message}\n\n${result.errors.length ? "Błędy:\n" + result.errors.join("\n") : "Brak błędów."}`);
        } else {
          alert(`Błąd: ${result.error || "Nieznany problem podczas importu"}`);
        }
      })
      .catch((error) => {
        console.error("Błąd importu:", error);
        alert("Wystąpił błąd podczas wysyłania pliku.");
      });
    });
  }
}

/**
 * Sortowanie tabeli po wybranej kolumnie
 * @param {number} columnIndex - Indeks kolumny do sortowania
 */
function sortTable(columnIndex) {
  const table = document.getElementById("membersTable");
  const tbody = table.querySelector("tbody");
  const rows = Array.from(tbody.querySelectorAll("tr"));
  const currentDir = table.getAttribute("data-sort-dir") || "asc";
  const newDir = currentDir === "asc" ? "desc" : "asc";
  
  // Aktualizacja atrybutu kierunku sortowania w tabeli
  table.setAttribute("data-sort-dir", newDir);
  
  // Aktualizacja ikony sortowania w nagłówku
  const headers = table.querySelectorAll("th");
  headers.forEach(header => {
    header.classList.remove("sorted-asc", "sorted-desc");
  });
  headers[columnIndex].classList.add(newDir === "asc" ? "sorted-asc" : "sorted-desc");
  
  // Sortowanie wierszy
  rows.sort((a, b) => {
    let aValue = a.cells[columnIndex].textContent.trim();
    let bValue = b.cells[columnIndex].textContent.trim();
    
    // Sprawdzenie czy to są daty (kolumny 2, 4, 5)
    if (columnIndex === 2 || columnIndex === 4 || columnIndex === 5) {
      aValue = new Date(aValue);
      bValue = new Date(bValue);
      
      if (isNaN(aValue)) aValue = new Date(0); // Dla nieprawidłowych dat
      if (isNaN(bValue)) bValue = new Date(0);
      
      return newDir === "asc" ? aValue - bValue : bValue - aValue;
    }
    
    // Sortowanie standardowe dla tekstu
    if (newDir === "asc") {
      return aValue.localeCompare(bValue, undefined, {numeric: true});
    } else {
      return bValue.localeCompare(aValue, undefined, {numeric: true});
    }
  });
  
  // Dodanie posortowanych wierszy z powrotem do tabeli
  rows.forEach(row => tbody.appendChild(row));
}

/**
 * Dostosowanie szerokości kolumn tabeli, aby zapewnić stałą szerokość
 */
function freezeTableColumns() {
  const table = document.querySelector("table");
  if (!table) return;

  const headerCells = table.querySelectorAll("thead th");

  headerCells.forEach((th, colIndex) => {
    const width = th.offsetWidth + "px";

    // Nadanie szerokości nagłówkowi
    th.style.width = width;
    th.style.minWidth = width;
    th.style.maxWidth = width;

    // Nadanie szerokości wszystkim komórkom w tej kolumnie
    const columnCells = table.querySelectorAll(`tbody td:nth-child(${colIndex + 1})`);
    columnCells.forEach(td => {
      td.style.width = width;
      td.style.minWidth = width;
      td.style.maxWidth = width;
    });
  });

  table.style.tableLayout = "fixed";
}

/**
 * Inicjalizacja formatowania tabeli po pełnym załadowaniu strony
 */
window.addEventListener("load", function() {
  freezeTableColumns();
  
  // Dodanie klasy do dokumentu, która zwiększy rozmiar czcionki w tabeli
  document.documentElement.classList.add('larger-table-font');
});