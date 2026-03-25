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

// Rota para o ESP32-S3
app.post('/api/bacia/ativar', async (req, res) => {
    const { id_bacia } = req.body;

    try {
        console.log(`Recebido sinal para ID: ${id_bacia}`);

        // 1. Busca os detalhes da bacia no banco
        const snapshot = await db.collection('bacias')
                                 .where('id_bacia', '==', id_bacia)
                                 .get();

        if (snapshot.empty) {
            return res.status(404).send('Bacia não encontrada');
        }

        const baciaDados = snapshot.docs[0].data();

        // 2. Atualiza o documento de monitoramento que o React está vigiando
        // Isso substitui o antigo socket.emit
        await db.collection('monitoramento').doc('status_atual').set({
            ...baciaDados,
            ultima_atualizacao: admin.firestore.FieldValue.serverTimestamp()
        });

        console.log(`Firestore atualizado: ${baciaDados.nome}`);
        res.status(200).json(baciaDados);

    } catch (error) {
        console.error(error);
        res.status(500).send("Erro interno");
    }
});

app.listen(3001, '0.0.0.0', () => {
    console.log('🚀 Backend rodando em http://192.168.1.8:3001');
});