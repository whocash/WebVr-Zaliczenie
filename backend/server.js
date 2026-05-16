const express = require('express');
const cors = require('cors');
const { Pool } = require('pg'); // Importujemy sterownik PostgreSQL

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Konfiguracja połączenia z bazą danych
const pool = new Pool({
    user: 'student',
    host: process.env.DB_HOST || 'localhost', // <-- TA LINIA POZWOLI DZIAŁAĆ I TU, I W DOCKERZE
    database: 'kosmos_db',
    password: 'super_tajne_haslo123',
    port: 5432,
});

// Funkcja inicjalizująca bazę danych (tworzy tabelę i dodaje planety na start)
async function initDatabase() {
    try {
        // 1. Tworzymy tabelę planet, jeśli jeszcze nie istnieje
        await pool.query(`
            CREATE TABLE IF NOT EXISTS planety (
                id VARCHAR(50) PRIMARY KEY,
                nazwa VARCHAR(50) NOT NULL,
                kolor VARCHAR(10) NOT NULL,
                promien_orbity REAL NOT NULL,
                rozmiar REAL NOT NULL,
                predkosc INT NOT NULL,
                opisy TEXT[] NOT NULL
            );
        `);

        // 2. Sprawdzamy, czy tabela jest pusta
        const res = await pool.query('SELECT COUNT(*) FROM planety');
        if (parseInt(res.rows[0].count) === 0) {
            console.log("Baza danych jest pusta. Dodaję planety startowe...");
            
            const startowePlanety = [
                ['merkury', 'Merkury', '#888888', 6, 0.3, 12000, ['Najmniejsza planeta.', 'Nie ma ksiezycow.']],
                ['wenus', 'Wenus', '#E3BB76', 9, 0.7, 18000, ['Najgoretsza planeta.', 'Gesta atmosfera.']],
                ['ziemia', 'Ziemia', '#2E8B57', 12, 0.8, 24000, ['Nasza planeta. Wykryto zycie.', 'Ma jeden ksiezyc.']],
                ['mars', 'Mars', '#B22222', 15, 0.5, 30000, ['Czerwona Planeta.', 'Ma dwa ksiezyce.']],
                ['jowisz', 'Jowisz', '#D4A373', 19, 1.8, 40000, ['Najwiekszy gazowy olbrzym.', 'Potezny huragan.']]
            ];

            for (const p of startowePlanety) {
                await pool.query(
                    'INSERT INTO planety (id, nazwa, kolor, promien_orbity, rozmiar, predkosc, opisy) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                    p
                );
            }
            console.log("Planety pomyślnie dodane do PostgreSQL!");
        }
    } catch (err) {
        console.error("Błąd podczas inicjalizacji bazy danych:", err);
    }
}

// Uruchamiamy inicjalizację bazy danych
initDatabase();

// Endpoint GET: Pobiera planety prosto z bazy PostgreSQL
app.get('/api/planets', async (req, res) => {
    try {
        const wynik = await pool.query('SELECT id, nazwa, kolor, promien_orbity AS "promienOrbity", rozmiar, predkosc, opisy FROM planety');
        res.json(wynik.rows);
    } catch (err) {
        res.status(500).json({ error: "Blad bazy danych przy pobieraniu planet" });
    }
});

// Endpoint POST: Losuje opis dla planety z bazy danych
app.post('/api/planets/:id/interact', async (req, res) => {
    const { id } = req.params;
    try {
        const wynik = await pool.query('SELECT nazwa, opisy FROM planety WHERE id = $1', [id]);
        
        if (wynik.rows.length > 0) {
            const planeta = wynik.rows[0];
            const losowyIndeks = Math.floor(Math.random() * planeta.opisy.length);
            const wylosowanyOpis = planeta.opisy[losowyIndeks];
            
            res.json({ 
                nazwa: planeta.nazwa, 
                opis: wylosowanyOpis 
            });
        } else {
            res.status(404).json({ error: "Nie znaleziono planety w bazie" });
        }
    } catch (err) {
        res.status(500).json({ error: "Blad bazy danych przy interakcji" });
    }
});

// Endpoint monitoringu dla profesora
app.get('/health', async (req, res) => {
    try {
        await pool.query('SELECT 1'); // Szybki test czy baza odpowiada
        res.json({ status: "UP", database: "CONNECTED", timestamp: new Date() });
    } catch (err) {
        res.status(500).json({ status: "DOWN", database: "DISCONNECTED" });
    }
});
const Docker = require('dockerode');
const fs = require('fs');
const path = require('path');

// Łączymy się z Docker Socket (zadziała wewnątrz kontenera dzięki konfiguracji z docker-compose)
const docker = new Docker({ socketPath: '/var/run/docker.sock' });

app.get('/api/dashboard-status', async (req, res) => {
    let dbStatus = "UNKNOWN";
    let backendStatus = "UNKNOWN";
    let testStatus = { status: "BRAK DANYCH", time: "-" };

    // 1. Pobieranie statusów z Dockera
    try {
        const containers = await docker.listContainers({ all: true });
        
        const pgContainer = containers.find(c => c.Names.includes('/vr_postgres_db'));
        const nodeContainer = containers.find(c => c.Names.includes('/vr_node_backend'));

        if (pgContainer) dbStatus = pgContainer.Status; // Zwróci np. "Up 2 minutes (healthy)"
        if (nodeContainer) backendStatus = nodeContainer.Status;
    } catch (err) {
        console.error("Błąd Dockera:", err.message);
        // Jeśli testujesz lokalnie poza Dockerem, ustawiamy stan na "Działa lokalnie"
        backendStatus = "Up (Running lokalnie)";
        dbStatus = "Up (Uruchomiony)";
    }

    // 2. Pobieranie wyników ostatnich testów z pliku JSON
    const testFilePath = path.join(__dirname, 'test-result.json');
    if (fs.existsSync(testFilePath)) {
        try {
            const rawData = fs.readFileSync(testFilePath);
            const testData = JSON.parse(rawData);
            
            testStatus.status = testData.numFailedTests > 0 ? "FAILED" : "SUCCESS";
            testStatus.passed = testData.numPassedTests;
            testStatus.total = testData.numTotalTests;
            
            // Pobieramy czas modyfikacji pliku jako czas wykonania testu
            const stats = fs.statSync(testFilePath);
            testStatus.time = stats.mtime.toLocaleTimeString('pl-PL');
        } catch (e) {
            console.error("Błąd czytania pliku testów:", e);
        }
    }

    // 3. Wysyłamy gotowy raport na frontend
    res.json({
        appGlowna: "DZIAŁA (API OK)",
        kontenery: {
            bazaDanych: dbStatus,
            backend: backendStatus
        },
        ostatnieTesty: testStatus
    });
});

if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
        console.log(`Serwer backendowy rozmawia z PostgreSQL na porcie ${PORT}`);
    });
}

module.exports = { app, pool }