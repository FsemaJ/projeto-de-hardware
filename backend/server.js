const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');
const serviceAccount = require('./serviceAccountKey.json');

// Inicializa o Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();
const app = express();

app.use(cors());
app.use(express.json());

// Rota de teste
app.get('/', (req, res) => {
    res.json({ mensagem: '✅ Backend está rodando!', status: 'ativo' });
});

app.get('/api/test', (req, res) => {
    res.json({ mensagem: '✅ API está funcionando!', status: 'ativo' });
});

/**
 * ROTA 1: Ativa uma bacia específica por ID
 * Útil para cliques manuais na interface React
 */
app.post('/api/bacia/ativar', async (req, res) => {
    const { id_bacia } = req.body;

    try {
        console.log(`Recebido sinal manual para ID: ${id_bacia}`);

        const snapshot = await db.collection('bacias')
                                 .where('id_bacia', '==', id_bacia)
                                 .get();

        if (snapshot.empty) {
            return res.status(404).send('Bacia não encontrada');
        }

        const baciaDados = snapshot.docs[0].data();

        await db.collection('monitoramento').doc('status_atual').set({
            ...baciaDados,
            ultima_atualizacao: admin.firestore.FieldValue.serverTimestamp()
        });

        res.status(200).json(baciaDados);
    } catch (error) {
        console.error(error);
        res.status(500).send("Erro interno");
    }
});

/**
 * ROTA 2: Alterna para a próxima bacia
 * Ideal para o botão físico do ESP32 (GPIO 12)
 */
app.post('/api/bacia/proxima', async (req, res) => {
    try {
        // 1. Pega todas as bacias cadastradas (ordenadas pelo campo id_bacia)
        const baciasSnapshot = await db.collection('bacias').orderBy('id_bacia').get();
        
        if (baciasSnapshot.empty) {
            return res.status(404).send('Nenhuma bacia encontrada no banco de dados.');
        }

        const listaBacias = baciasSnapshot.docs.map(doc => doc.data());

        // 2. Verifica qual bacia está ativa no monitoramento agora
        const monitorDoc = await db.collection('monitoramento').doc('status_atual').get();
        
        let proximaBacia;

        if (!monitorDoc.exists) {
            // Se o monitoramento estiver vazio, começa pela primeira da lista
            proximaBacia = listaBacias[0];
            console.log(`🟢 Primeira bacia: ${proximaBacia.nome}`);
        } else {
            const baciaAtual = monitorDoc.data();
            console.log(`📍 Bacia atual no Firebase: ${baciaAtual.nome} (id: ${baciaAtual.id_bacia})`);
            console.log(`📋 Total de bacias na lista: ${listaBacias.length}`);
            
            // Encontra o índice da bacia atual na lista
            let indexAtual = listaBacias.findIndex(b => b.id_bacia === baciaAtual.id_bacia);
            console.log(`🔍 Índice encontrado: ${indexAtual}`);
            
            // Se não encontrar (retorna -1), assume que é a bacia 16 e vai para 1
            if (indexAtual === -1) {
                console.log(`⚠️ Bacia não encontrada! Assumindo que era a bacia 16, voltando para 1`);
                proximaBacia = listaBacias[0]; // Volta para a primeira bacia
            } else {
                // Calcula o próximo índice (se for a última, volta para a primeira)
                const proximoIndex = (indexAtual + 1) % listaBacias.length;
                proximaBacia = listaBacias[proximoIndex];
                console.log(`➡️ Próximo índice: ${proximoIndex}`);
            }
        }
        
        console.log(`✅ Nova bacia: ${proximaBacia.nome} (id_bacia: ${proximaBacia.id_bacia})`);

        // 3. Atualiza o documento de monitoramento que o React está observando
        await db.collection('monitoramento').doc('status_atual').set({
            ...proximaBacia,
            ultima_atualizacao: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`🔄 Ciclo: Mudando de ${monitorDoc.exists ? monitorDoc.data().nome : 'nenhuma'} para ${proximaBacia.nome}`);
        
        res.status(200).json({
            mensagem: "Bacia alterada com sucesso",
            bacia: proximaBacia.nome
        });

    } catch (error) {
        console.error("Erro ao ciclar bacias:", error);
        res.status(500).send("Erro interno no servidor");
    }
});

// Configuração do Servidor
const PORT = 3001;
const IP_LOCAL = '0.0.0.0'; // Permite conexões externas (como as do ESP32)

app.listen(PORT, IP_LOCAL, () => {
    console.log(`
    🚀 Backend rodando com sucesso!
    📡 Endpoint para o ESP32: http://192.168.1.5:${PORT}/api/bacia/proxima
    🏠 Endpoint para o React: http://192.168.1.5:${PORT}/api/bacia/ativar
    ✅ Teste: http://192.168.1.5:${PORT}/api/test
    `);
});