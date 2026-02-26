// server.js
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" } // Permite que o React (na porta 5173 ou 3000) conecte
});

// Endpoint que o ESP32 vai chamar
app.post('/update', (req, res) => {
    const { bacia } = req.body;
    console.log("ESP32 enviou:", bacia);
    
    // "Grita" para o React atualizar o texto
    io.emit('atualizar-texto', bacia);
    
    res.status(200).json({ status: 'ok' });
});

server.listen(3001, () => {
    console.log('Servidor rodando na porta 3001');
});