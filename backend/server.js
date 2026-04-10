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

// 1. Configuração do Servidor HTTP e WebSocket (Socket.io)
const server = http.createServer(app);
const io = new Server(server, {
    cors: { origin: "*" } // Permite que o React conecte de qualquer IP/Porta
});

// 2. Configuração do Banco de Dados PostgreSQL
const pool = new Pool({
    user: process.env.DB_USER,
    host: process.env.DB_HOST,
    database: process.env.DB_NAME,
    password: process.env.DB_PASSWORD,
    port: process.env.DB_PORT,
});

// 3. Conexão com o Broker MQTT (Mosquitto local)
const mqttClient = mqtt.connect(process.env.MQTT_BROKER);

mqttClient.on('connect', () => {
    console.log('🔌 Conectado ao Broker MQTT!');
    // Assina o tópico que o ESP32 usa para enviar o clique do botão
    mqttClient.subscribe('bacias/comando/proxima');
});

// Variável em memória para guardar o ID da bacia atual
let idBaciaAtual = null;

// 4. Escuta as mensagens MQTT vindas do ESP32
mqttClient.on('message', async (topic, message) => {
    if (topic === 'bacias/comando/proxima') {
        console.log('📡 Sinal MQTT recebido do ESP32! Trocando bacia...');
        await avancaParaProximaBacia();
    }
});

// Lógica principal: Busca a próxima bacia e avisa o React
async function avancaParaProximaBacia() {
    try {
        // Busca todas as bacias na tabela correta
        const { rows: listaBacias } = await pool.query('SELECT * FROM bacias_hidrograficas ORDER BY id_bacia ASC');
        
        if (listaBacias.length === 0) {
            console.log("⚠️ Nenhuma bacia encontrada no banco de dados.");
            return;
        }

        let proximaBacia;

        if (!idBaciaAtual) {
            proximaBacia = listaBacias[0];
        } else {
            const indexAtual = listaBacias.findIndex(b => b.id_bacia === idBaciaAtual);
            const proximoIndex = (indexAtual + 1) % listaBacias.length;
            proximaBacia = listaBacias[proximoIndex];
        }

        idBaciaAtual = proximaBacia.id_bacia;
        console.log(`✅ Nova bacia ativa: ${proximaBacia.nome} (ID: ${idBaciaAtual})`);

        // 🔥 Envia o objeto completo da bacia para o frontend via WebSocket
        io.emit('baciaAtualizada', proximaBacia);

    } catch (error) {
        console.error("Erro ao processar próxima bacia:", error);
    }
}

// =========================================================
// ROTAS HTTP (API REST PARA O REACT)
// =========================================================

// Rota para o React carregar TODAS as bacias ao iniciar (montar menus, rodapé, etc)
app.get('/api/bacias', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM bacias_hidrograficas ORDER BY id_bacia ASC');
        res.status(200).json(rows);
    } catch (error) {
        console.error("Erro ao buscar bacias:", error);
        res.status(500).json({ erro: "Erro ao buscar dados no banco" });
    }
});

// Rota para ativar uma bacia específica clicando pelo frontend
app.post('/api/bacia/ativar', async (req, res) => {
    const { id_bacia } = req.body;
    try {
        const { rows } = await pool.query('SELECT * FROM bacias_hidrograficas WHERE id_bacia = $1', [id_bacia]);
        
        if (rows.length === 0) {
            return res.status(404).send('Bacia não encontrada');
        }

        const baciaAtivada = rows[0];
        idBaciaAtual = baciaAtivada.id_bacia;
        
        // Avisa todas as telas abertas que a bacia mudou
        io.emit('baciaAtualizada', baciaAtivada);
        res.status(200).json(baciaAtivada);
    } catch (error) {
        console.error(error);
        res.status(500).send("Erro interno ao ativar bacia");
    }
});

// =========================================================
// GESTÃO DE CONEXÕES FRONTEND
// =========================================================

io.on('connection', (socket) => {
    console.log('💻 Frontend React conectado via WebSocket');
    
    // Bônus: Se o React conectar depois que o ESP32 já trocou algumas bacias,
    // envia o estado atual imediatamente para a tela não ficar vazia!
    if (idBaciaAtual) {
        pool.query('SELECT * FROM bacias_hidrograficas WHERE id_bacia = $1', [idBaciaAtual])
            .then(result => {
                if (result.rows.length > 0) {
                    socket.emit('baciaAtualizada', result.rows[0]);
                }
            })
            .catch(err => console.error("Erro ao enviar estado inicial pro React:", err));
    }

    socket.on('disconnect', () => {
        console.log('❌ Frontend desconectado');
    });
});

// Inicia o servidor
const PORT = process.env.PORT || 3001;
server.listen(PORT, '0.0.0.0', () => {
    console.log(`
    🚀 Backend rodando perfeitamente!
    📡 Escutando Mosquitto (MQTT)
    🏠 API e WebSockets rodando na porta ${PORT}
    `);
});