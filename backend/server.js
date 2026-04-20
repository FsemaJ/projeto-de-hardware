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

// 3. Conexão com o Broker MQTT (Mosquitto local) - Mantido para compatibilidade
const mqttClient = mqtt.connect(process.env.MQTT_BROKER);

mqttClient.on('connect', () => {
    console.log('🔌 Conectado ao Broker MQTT!');
    mqttClient.subscribe('bacias/comando/proxima');
});

// Variável em memória para guardar o ID da bacia atual
let idBaciaAtual = null;

// 4. Escuta as mensagens MQTT (se ainda for usar algum botão físico)
mqttClient.on('message', async (topic, message) => {
    if (topic === 'bacias/comando/proxima') {
        console.log('📡 Sinal MQTT recebido! Trocando bacia...');
        await navegarBacia('proxima');
    }
});

// =========================================================
// LÓGICA DE NAVEGAÇÃO CENTRALIZADA
// =========================================================
async function navegarBacia(direcao) {
    try {
        const { rows: listaBacias } = await pool.query('SELECT * FROM bacias_hidrograficas ORDER BY id_bacia ASC');
        
        if (listaBacias.length === 0) {
            console.log("⚠️ Nenhuma bacia encontrada no banco de dados.");
            return null;
        }

        let proximaBacia;

        if (!idBaciaAtual && direcao !== 'home') {
            // Se estava na tela inicial e fez um gesto, vai para a primeira
            proximaBacia = listaBacias[0];
        } else {
            const indexAtual = listaBacias.findIndex(b => b.id_bacia === idBaciaAtual);
            let novoIndex = indexAtual;

            if (direcao === 'proxima') {
                novoIndex = (indexAtual + 1) % listaBacias.length;
            } else if (direcao === 'anterior') {
                novoIndex = (indexAtual - 1 + listaBacias.length) % listaBacias.length;
            }

            proximaBacia = listaBacias[novoIndex];
        }

        idBaciaAtual = proximaBacia.id_bacia;
        console.log(`✅ Nova bacia ativa: ${proximaBacia.nome} (ID: ${idBaciaAtual})`);

        // Envia o objeto completo da bacia para o frontend
        io.emit('baciaAtualizada', proximaBacia);
        return proximaBacia;

    } catch (error) {
        console.error("Erro ao processar navegação de bacia:", error);
        return null;
    }
}

// =========================================================
// ROTAS HTTP (API REST PARA ESP32 E REACT)
// =========================================================

// Rota para o React carregar TODAS as bacias ao iniciar
app.get('/api/bacias', async (req, res) => {
    try {
        const { rows } = await pool.query('SELECT * FROM bacias_hidrograficas ORDER BY id_bacia ASC');
        res.status(200).json(rows);
    } catch (error) {
        console.error("Erro ao buscar bacias:", error);
        res.status(500).json({ erro: "Erro ao buscar dados no banco" });
    }
});

// Rotas chamadas pelo ESP32 (Gestos APDS-9960)
app.post('/api/bacia/proxima', async (req, res) => {
    const bacia = await navegarBacia('proxima');
    res.json(bacia);
});

app.post('/api/bacia/anterior', async (req, res) => {
    const bacia = await navegarBacia('anterior');
    res.json(bacia);
});

app.post('/api/bacia/home', (req, res) => {
    idBaciaAtual = null; // Reseta o estado
    io.emit('baciaAtualizada', null); // Avisa o React para voltar ao mapa principal
    console.log('🏠 Retornando ao Mapa Geral (Home)');
    res.send("Home");
});

app.post('/api/bacia/info', async (req, res) => {
    if (idBaciaAtual) {
        // Em vez de enviar os dados de novo (o React já tem), 
        // emitimos um evento específico para abrir a aba de detalhes
        io.emit('mostrarDetalhes');
        console.log('ℹ️ Gesto CIMA recebido: Exibindo detalhes no Front');
    }
    res.send("Info acionada");
});

// Rota para ativar uma bacia específica clicando pelo frontend
app.post('/api/bacia/ativar', async (req, res) => {
    const { id_bacia } = req.body;
    try {
        const { rows } = await pool.query('SELECT * FROM bacias_hidrograficas WHERE id_bacia = $1', [id_bacia]);
        if (rows.length === 0) return res.status(404).send('Bacia não encontrada');

        const baciaAtivada = rows[0];
        idBaciaAtual = baciaAtivada.id_bacia;
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
    
    // Sincroniza o frontend caso ele conecte no meio da apresentação
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
    📡 Escutando MQTT e API HTTP
    🏠 Porta ${PORT}
    `);
});