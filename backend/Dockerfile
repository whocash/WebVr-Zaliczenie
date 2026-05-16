# Wybieramy oficjalny, lekki obraz Node.js
FROM node:18-alpine

# Ustalamy folder roboczy wewnątrz kontenera
WORKDIR /app

# Kopiujemy pliki opisujące zależności
COPY package*.json ./

# Instalujemy biblioteki wewnątrz kontenera
RUN npm install

# Kopiujemy całą resztę kodu backendu
COPY . .

# Informujemy, że kontener będzie działać na porcie 3000
EXPOSE 3000

# Komenda, która odpala nasz serwer
CMD ["node", "server.js"]