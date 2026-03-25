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
        } else {
            const baciaAtual = monitorDoc.data();
            // Encontra o índice da bacia atual na lista
            const indexAtual = listaBacias.findIndex(b => b.id_bacia === baciaAtual.id_bacia);
            
            // Calcula o próximo índice (se for a última, volta para a primeira - resto da divisão)
            const proximoIndex = (indexAtual + 1) % listaBacias.length;
            proximaBacia = listaBacias[proximoIndex];
        }

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
    📡 Endpoint para o ESP32: http://192.168.1.8:${PORT}/api/bacia/proxima
    🏠 Endpoint para o React: http://192.168.1.8:${PORT}/api/bacia/ativar
    `);
});