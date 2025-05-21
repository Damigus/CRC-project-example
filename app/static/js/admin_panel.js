/**
 * Panel Administratora - główny skrypt JavaScript
 * 
 * Główne funkcjonalności:
 * - Zarządzanie widocznością sekcji (rozwijanie/zwijanie)
 * - Wyszukiwanie użytkowników w tabelach
 * - Zarządzanie kołami (dodawanie, usuwanie)
 * - Zarządzanie użytkownikami (trwałe usuwanie, odbanowywanie)
 * - Sortowanie tabel z uwzględnieniem różnych typów danych
 * - Dostosowywanie szerokości kolumn w tabelach
 */

document.addEventListener('DOMContentLoaded', initializeAdminPanel);

/**
 * Inicjalizuje wszystkie komponenty panelu administratora
 */
function initializeAdminPanel() {
    // Referencje do elementów DOM
    const elements = {
        toggleCirclesBtn: document.getElementById('toggleCirclesBtn'),
        toggleDeletedBtn: document.getElementById('toggleDeletedBtn'),
        toggleBannedBtn: document.getElementById('toggleBannedBtn'),
        circleManagerWrapper: document.getElementById('circleManagerWrapper'),
        deletedWrapper: document.getElementById('deletedTableWrapper'),
        bannedWrapper: document.getElementById('bannedTableWrapper'),
        deletedTable: document.getElementById('deletedTable'),
        bannedTable: document.getElementById('bannedTable'),
        searchInput: document.getElementById('searchInput')
    };

    // Inicjalizacja poszczególnych modułów funkcjonalnych
    initSectionToggling(elements);
    initSearchFunctionality(elements);
    initActionButtons();
    initSortableTables();

    // Załaduj listę kół przy starcie
    fetchCircles();
}

/**
 * Inicjalizuje funkcjonalność pokazywania/ukrywania sekcji
 * @param {Object} elements - Referencje do elementów DOM
 */
function initSectionToggling(elements) {
    // Przełączanie widoczności sekcji z kołami
    elements.toggleCirclesBtn?.addEventListener('click', function() {
        elements.circleManagerWrapper.classList.toggle('hidden-table');
    });

    // Przełączanie widoczności sekcji z usuniętymi użytkownikami
    elements.toggleDeletedBtn?.addEventListener('click', function() {
        elements.deletedWrapper.classList.toggle('hidden-table');
        if (!elements.deletedWrapper.classList.contains('hidden-table')) {
            // Po pokazaniu odczekaj i dostosuj kolumny
            setTimeout(() => freezeTableColumns(elements.deletedTable), 10);
        }
    });

    // Przełączanie widoczności sekcji z zbanowanymi użytkownikami
    elements.toggleBannedBtn?.addEventListener('click', function() {
        elements.bannedWrapper.classList.toggle('hidden-table');
        if (!elements.bannedWrapper.classList.contains('hidden-table')) {
            setTimeout(() => freezeTableColumns(elements.bannedTable), 10);
        }
    });
}

/**
 * Inicjalizuje funkcjonalność wyszukiwania w tabelach
 * @param {Object} elements - Referencje do elementów DOM
 */
function initSearchFunctionality(elements) {
    elements.searchInput?.addEventListener('input', function() {
        const query = this.value.toLowerCase().trim();
        const queryWords = query.split(' ');

        // Przeszukaj wszystkie tabele
        [elements.deletedTable, elements.bannedTable].forEach(table => {
            if (!table) return;
            
            const rows = table.querySelectorAll('tbody tr');
            rows.forEach(row => {
                const cells = row.querySelectorAll('td');
                const fullName = (cells[0]?.textContent + ' ' + cells[1]?.textContent).toLowerCase();
                const fullNameWords = fullName.split(' ');

                // Sprawdź czy wszystkie słowa z zapytania pasują do części imienia/nazwiska
                let match = queryWords.every(word =>
                    fullNameWords.some(namePart => namePart.startsWith(word))
                );

                // Jeśli nie pasuje po imieniu i nazwisku, sprawdź pozostałe komórki
                if (!match) {
                    cells.forEach(cell => {
                        if (cell.textContent.toLowerCase().includes(query)) {
                            match = true;
                        }
                    });
                }

                row.style.display = match ? '' : 'none';
            });
        });
    });
}

/**
 * Inicjalizuje przyciski akcji dla zarządzania użytkownikami
 */
function initActionButtons() {
    // Obsługa przycisków trwałego usunięcia
    document.querySelectorAll('.deleteUserBtn').forEach(button => {
        button.addEventListener('click', function() {
            const userId = this.getAttribute('data-user-id');
            const row = this.closest("tr");
            const confirmDeletion = confirm("Czy na pewno chcesz usunąć tego użytkownika?");
            
            if (confirmDeletion) {
                fetch(`/permanently_delete_from_archive/${userId}`, {
                    method: 'DELETE',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`
                    }
                })
                .then(response => response.json())
                .then(data => {
                    if (data.message) {
                        alert(data.message);
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

    // Obsługa przycisków odbanowania
    document.querySelectorAll(".unBanUserBtn").forEach(button => {
        button.addEventListener('click', function() {
            const userId = this.getAttribute('data-user-id');
            const row = this.closest("tr");
            const confirmUnBan = confirm("Czy na pewno chcesz odbanować tego użytkownika?");
            
            if (confirmUnBan) {
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
                        row.remove();
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
 * Inicjalizuje sortowanie dla wszystkich tabel w panelu administratora
 */
function initSortableTables() {
    const tables = [
        document.getElementById('deletedTable'),
        document.getElementById('bannedTable'),
        document.querySelector('.circle-table')
    ];

    tables.forEach(table => {
        if (!table) return;
        
        const headerCells = table.querySelectorAll('thead th');
        headerCells.forEach((th, index) => {
            // Pomijamy kolumnę z akcjami
            if (th.textContent.trim().toLowerCase() === 'akcje') return;
            
            th.classList.add('sortable');
            th.style.cursor = 'pointer';
            
            // Dodaj ikonę sortowania
            th.innerHTML = `
                ${th.textContent} 
                <span class="sort-icon">
                    <i class="fas fa-sort"></i>
                </span>
            `;
            
            // Dodaj obsługę kliknięcia
            th.addEventListener('click', () => {
                sortTable(table, index);
                
                // Aktualizuj ikony dla wszystkich kolumn
                headerCells.forEach(cell => {
                    const icon = cell.querySelector('.sort-icon');
                    if (icon) {
                        icon.innerHTML = '<i class="fas fa-sort"></i>';
                    }
                });
                
                // Ustaw odpowiednią ikonę dla aktualnie sortowanej kolumny
                const currentIcon = th.querySelector('.sort-icon');
                const sortDirection = th.getAttribute('data-sort') === 'asc' ? 'desc' : 'asc';
                th.setAttribute('data-sort', sortDirection);
                
                if (currentIcon) {
                    currentIcon.innerHTML = sortDirection === 'asc' 
                        ? '<i class="fas fa-sort-up"></i>' 
                        : '<i class="fas fa-sort-down"></i>';
                }
            });
        });
    });
}

/**
 * Sortuje tabelę według wybranej kolumny
 * @param {HTMLElement} table - Element tabeli do posortowania
 * @param {number} colIndex - Indeks kolumny do sortowania
 */
function sortTable(table, colIndex) {
    const tbody = table.querySelector('tbody');
    const rows = Array.from(tbody.querySelectorAll('tr'));
    const header = table.querySelector('thead th:nth-child(' + (colIndex + 1) + ')');
    const sortDirection = header.getAttribute('data-sort') === 'asc' ? 'desc' : 'asc';
    
    // Funkcja do określenia typu danych w kolumnie
    const detectDataType = (value) => {
        // Sprawdź czy to data w formacie YYYY-MM-DD
        if (/^\d{4}-\d{2}-\d{2}$/.test(value.trim())) {
            return 'date';
        }
        // Sprawdź czy to liczba
        else if (!isNaN(value) && value.trim() !== '') {
            return 'number';
        }
        // Domyślnie tekst
        return 'text';
    };

    // Posortuj wiersze
    rows.sort((a, b) => {
        const cellA = a.querySelector(`td:nth-child(${colIndex + 1})`);
        const cellB = b.querySelector(`td:nth-child(${colIndex + 1})`);
        
        if (!cellA || !cellB) return 0;
        
        const valueA = cellA.textContent.trim();
        const valueB = cellB.textContent.trim();
        
        // Określ typ danych do sortowania
        const dataType = detectDataType(valueA || valueB);
        
        let comparison = 0;
        
        // Sortuj według typu danych
        switch (dataType) {
            case 'date':
                // Dla dat - konwersja na obiekty Date
                const dateA = valueA ? new Date(valueA) : new Date(0);
                const dateB = valueB ? new Date(valueB) : new Date(0);
                comparison = dateA - dateB;
                break;
                
            case 'number':
                // Dla liczb - konwersja na wartości liczbowe
                const numA = parseFloat(valueA) || 0;
                const numB = parseFloat(valueB) || 0;
                comparison = numA - numB;
                break;
                
            default:
                // Dla tekstu - porównanie alfabetyczne z obsługą polskich znaków
                comparison = valueA.localeCompare(valueB, 'pl');
        }
        
        // Odwróć kierunek sortowania, jeśli jest ustawiony na malejący
        return sortDirection === 'asc' ? comparison : -comparison;
    });
    
    // Umieść posortowane wiersze z powrotem w tabeli
    rows.forEach(row => tbody.appendChild(row));
}

/**
 * Ustawia stałe szerokości kolumn w jednej lub wielu tabelach
 * @param {HTMLElement|NodeList|HTMLElement[]} tables - Pojedyncza tabela lub lista tabel
 */
function freezeTableColumns(tables) {
    // Zamień pojedynczy element na tablicę
    const tableArray = tables instanceof HTMLElement ? [tables] : Array.from(tables);

    tableArray.forEach(table => {
        if (!table) return;
        const headerCells = table.querySelectorAll("thead th");

        headerCells.forEach((th, colIndex) => {
            const width = th.offsetWidth + "px";

            th.style.width = width;
            th.style.minWidth = width;
            th.style.maxWidth = width;

            const columnCells = table.querySelectorAll(`tbody td:nth-child(${colIndex + 1})`);
            columnCells.forEach(td => {
                td.style.width = width;
                td.style.minWidth = width;
                td.style.maxWidth = width;
            });
        });

        table.style.tableLayout = "fixed";
    });
}

// Inicjalizacja ustalania szerokości kolumn po załadowaniu strony
window.addEventListener("load", freezeTableColumns);

/**
 * Przełącza menu mobilne
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
 * Zarządzanie kołami - funkcje API
 */

/**
 * Pobiera listę kół z serwera i aktualizuje tabelę
 */
async function fetchCircles() {
    try {
        const res = await fetch("/get_circles");
        const data = await res.json();
        const table = document.getElementById("circleTableBody");
        
        if (!table) return;
        table.innerHTML = "";

        data.forEach(circle => {
            const row = document.createElement("tr");
            row.innerHTML = `
                <td>${circle.name}</td>
                <td>${circle.region}</td>
                <td><button class="action-btn delete-btn" onclick="deleteCircle(${circle.id})">Usuń</button></td>
            `;
            table.appendChild(row);
        });
    } catch (error) {
        console.error("Błąd podczas pobierania kół:", error);
        alert("Wystąpił błąd podczas pobierania kół");
    }
}

/**
 * Tworzy nowe koło w systemie
 */
async function createCircle() {
    const name = document.getElementById("circleName").value;
    const region = document.getElementById("circleRegion").value;

    if (!name || !region) {
        alert("Wypełnij wszystkie pola!");
        return;
    }

    try {
        const res = await fetch("/create_circle", {
            method: "POST",
            headers: { 
                "Content-Type": "application/json",
                'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`
            },
            body: JSON.stringify({ name, region })
        });

        const result = await res.json();
        alert(result.message || result.error);
        
        // Wyczyść pola formularza
        document.getElementById("circleName").value = "";
        document.getElementById("circleRegion").value = "";
        
        // Odśwież listę kół
        fetchCircles();
    } catch (error) {
        console.error("Błąd podczas tworzenia koła:", error);
        alert("Wystąpił błąd podczas tworzenia koła");
    }
}

/**
 * Usuwa koło z systemu
 * @param {number} id - ID koła do usunięcia
 */
async function deleteCircle(id) {
    if (!confirm("Czy na pewno chcesz usunąć to koło?")) return;

    try {
        const res = await fetch(`/delete_circle/${id}`, {
            method: "DELETE",
            headers: {
                'Authorization': `Bearer ${sessionStorage.getItem('auth_token')}`
            }
        });

        const result = await res.json();
        alert(result.message || result.error);
        
        // Odśwież listę kół
        fetchCircles();
    } catch (error) {
        console.error("Błąd podczas usuwania koła:", error);
        alert("Wystąpił błąd podczas usuwania koła");
    }
}