// Carrega as variáveis do arquivo .env logo na primeira linha
require('dotenv').config();

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mqtt = require('mqtt');
const { Pool } = require('pg');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// 1. Configuração do Servidor HTTP e WebSocket
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// 2. Configuração do Banco de Dados
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// 3. Conexão MQTT e Estado
const mqttClient = mqtt.connect(process.env.MQTT_BROKER);
let idBaciaAtual = null;

mqttClient.on('connect', () => {
    console.log('🔌 Conectado ao Broker MQTT!');
    mqttClient.subscribe('bacias/comando');
});

// =========================================================
// 4. O CÉREBRO DA APLICAÇÃO: OUVINDO GESTOS MQTT
// =========================================================
mqttClient.on('message', async (topic, message) => {
    if (topic === 'bacias/comando') {
        const comando = message.toString();
        console.log(`📡 Gesto detectado: [${comando}]`);

        if (comando === 'proxima' || comando === 'anterior') {
            await navegarBacia(comando);
        } 
        else if (comando === 'home') {
            idBaciaAtual = null; 
            io.emit('baciaAtualizada', null); // Manda null para o Front voltar ao Mapa Geral
            console.log('🏠 Retornando ao Mapa Geral (Home)');
        } 
        else if (comando === 'info') {
            if (idBaciaAtual) {
                io.emit('mostrarDetalhes'); // Avisa o Front para abrir pop-up/modal de info
                console.log('ℹ️ Exibindo detalhes da bacia atual');
            }
        }
    }
});

// Lógica de Navegação
async function navegarBacia(direcao) {
    try {
        const { rows: listaBacias } = await pool.query('SELECT * FROM bacias_hidrograficas ORDER BY id_bacia ASC');
        if (listaBacias.length === 0) return null;

        let proximaBacia;

        if (!idBaciaAtual && direcao !== 'home') {
            proximaBacia = listaBacias[0]; // Se estava no mapa, vai pra primeira
        } else {
            const indexAtual = listaBacias.findIndex(b => b.id_bacia === idBaciaAtual);
            let novoIndex = indexAtual;

            if (direcao === 'proxima') novoIndex = (indexAtual + 1) % listaBacias.length;
            else if (direcao === 'anterior') novoIndex = (indexAtual - 1 + listaBacias.length) % listaBacias.length;

            proximaBacia = listaBacias[novoIndex];
        }

        idBaciaAtual = proximaBacia.id_bacia;
        console.log(`✅ Bacia ativa: ${proximaBacia.nome}`);

        // O backend dita o que o front deve mostrar
        io.emit('baciaAtualizada', proximaBacia);

    } catch (error) {
        console.error("Erro na navegação:", error);
    }
}

// =========================================================
// ROTAS PARA O FRONTEND (Apenas Leitura)
// =========================================================
// O front ainda precisa dessa rota ao iniciar para desenhar o mapa ou carregar imagens
app.get('/api/bacias', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM bacias_hidrograficas ORDER BY id_bacia ASC');
        res.status(200).json(rows);
    } catch (error) {
        res.status(500).json({ erro: "Erro ao buscar dados" });
    }
});

// =========================================================
// GESTÃO DO WEBSOCKET (Sincronização)
// =========================================================
io.on('connection', (socket) => {
    console.log('💻 Frontend conectado via WebSocket');
    
    // Se o front reiniciar (F5), mandamos a bacia que estava ativa na memória
    if (idBaciaAtual) {
        pool.query('SELECT * FROM bacias_hidrograficas WHERE id_bacia = $1', [idBaciaAtual])
            .then(result => { if (result.rows.length > 0) socket.emit('baciaAtualizada', result.rows[0]); })
            .catch(err => console.error("Erro no sync:", err));
    }
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 Backend rodando na porta ${PORT} | Controle 100% via MQTT`);
});