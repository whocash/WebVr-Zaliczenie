const express = require('express');
const cors = require('cors');
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Lista planet z ich fizycznymi parametrami do ułożenia na orbitach wokół Słońca
let planety = [
    { 
        id: "merkury", 
        nazwa: "Merkury", 
        kolor: "#888888", 
        promienOrbity: 6, // odległość od Słońca
        rozmiar: 0.3, 
        predkosc: 12000, // czas pełnego obiegu w ms
        opisy: [
            "Najmniejsza planeta układu.",
            "Nie posiada żadnego księżyca.",
            "Doba trwa tu aż 176 ziemskich dni!"
        ]
    },
    { 
        id: "wenus", 
        nazwa: "Wenus", 
        kolor: "#E3BB76", 
        promienOrbity: 9, 
        rozmiar: 0.7, 
        predkosc: 18000, 
        opisy: [
            "Najgorętsza planeta w Układzie Słonecznym.",
            "Obraca się w przeciwną stronę niż większość planet.",
            "Jej ciśnienie zmiażdżyłoby człowieka w sekundę."
        ]
    },
    { 
        id: "ziemia", 
        nazwa: "Ziemia", 
        kolor: "#2E8B57", 
        promienOrbity: 12, 
        rozmiar: 0.8, 
        predkosc: 24000, 
        opisy: [
            "Jedyna planeta z potwierdzonym życiem.",
            "Woda pokrywa ponad 70% jej powierzchni.",
            "Posiada silne pole magnetyczne."
        ]
    },
    { 
        id: "mars", 
        nazwa: "Mars", 
        kolor: "#B22222", 
        promienOrbity: 15, 
        rozmiar: 0.5, 
        predkosc: 30000, 
        opisy: [
            "Nazywany Czerwoną Planetą przez tlenek żelaza.",
            "Znajduje się tu najwyższa góra układu - Olympus Mons.",
            "Posiada dwa maleńkie księżyce: Fobos i Deimos."
        ]
    },
    { 
        id: "jowisz", 
        nazwa: "Jowisz", 
        kolor: "#D4A373", 
        promienOrbity: 19, 
        rozmiar: 1.8, 
        predkosc: 40000, 
        opisy: [
            "Największa planeta, potężny gazowy olbrzym.",
            "Jego Wielka Czerwona Plama to gigantyczny huragan.",
            "Posiada ponad 90 odkrytych księżyców."
        ]
    }
];

// Endpoint GET: Zwraca wszystkie planety
app.get('/api/planets', (req, res) => {
    res.json(planety);
});

// Endpoint POST: Obsługa interakcji (losowy krótki opis)
app.post('/api/planets/:id/interact', (req, res) => {
    const { id } = req.params;
    const planeta = planety.find(p => p.id === id);
    
    if (planeta) {
        // Losujemy jeden z trzech krótkich opisów
        const losowyIndeks = Math.floor(Math.random() * planeta.opisy.length);
        const wylosowanyOpis = planeta.opisy[losowyIndeks];
        
        res.json({ 
            nazwa: planeta.nazwa, 
            opis: wylosowanyOpis 
        });
    } else {
        res.status(404).json({ error: "Nie znaleziono planety" });
    }
});

app.get('/health', (req, res) => {
    res.json({ status: "UP", timestamp: new Date() });
});

app.listen(PORT, () => {
    console.log(`Serwer działa na http://localhost:${PORT}`);
});