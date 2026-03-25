const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json');

// Inicializa o Firebase Admin
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount)
});

const db = admin.firestore();

async function listarBacias() {
  try {
    console.log('\n🔍 Buscando bacias no Firebase...\n');
    
    const snapshot = await db.collection('bacias').orderBy('id_bacia').get();
    
    if (snapshot.empty) {
      console.log('❌ Nenhuma bacia encontrada no banco de dados!');
      process.exit(0);
    }

    const bacias = [];
    console.log(`✅ Total de bacias encontradas: ${snapshot.size}\n`);
    console.log('=' .repeat(80));

    snapshot.forEach((doc) => {
      const bacia = doc.data();
      bacias.push(bacia);
      
      console.log(`\n📍 ID: ${bacia.id_bacia || doc.id}`);
      console.log(`   Nome: ${bacia.nome}`);
      console.log(`   Dados completos:`, JSON.stringify(bacia, null, 2));
    });

    console.log('\n' + '='.repeat(80));
    console.log('\n📋 JSON formatado para copiar direto no bacias.json:\n');
    
    const baciasFormatado = bacias.map((bacia, index) => ({
      id: index + 1,
      nome: bacia.nome,
      id_bacia: bacia.id_bacia || index + 1,
      coordenadas: bacia.coordenadas || {
        x: 0,
        y: 0,
        width: 100,
        height: 100
      }
    }));

    console.log(JSON.stringify(baciasFormatado, null, 2));
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Erro ao buscar bacias:', error);
    process.exit(1);
  }
}

listarBacias();
