import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client'; // Trocamos mqtt por socket.io-client

function App() {
  const [baciaAtiva, setBaciaAtiva] = useState(null);
  const [conectado, setConectado] = useState(false);
  const [dadosBacias, setDadosBacias] = useState([]);

  // 1. Carregar os dados direto do Backend (PostgreSQL) ao iniciar
  useEffect(() => {
    // Usando a rota HTTP que criamos no Node.js
    fetch('http://localhost:3001/api/bacias')
      .then(res => res.json())
      .then(data => {
        setDadosBacias(data);
        console.log("Bacias carregadas do banco:", data);
      })
      .catch(err => console.error("Erro ao carregar do backend:", err));
  }, []);

  // 2. Configuração da conexão WebSocket (Socket.io)
  useEffect(() => {
    // Conecta no Node.js (que está rodando na porta 3001)
    const socket = io('http://localhost:3001');

    socket.on('connect', () => {
      setConectado(true);
      console.log('✅ Conectado ao Backend via WebSocket!');
    });

    // Escuta exatamente o evento que o Node.js emite
    socket.on('baciaAtualizada', (bacia) => {
      console.log("Nova bacia recebida do Node.js:", bacia);
      // O banco de dados retorna a coluna 'id_bacia'
      setBaciaAtiva(bacia.id_bacia);
    });

    socket.on('disconnect', () => {
      console.log("❌ Desconectado do Backend");
      setConectado(false);
    });

    return () => socket.disconnect();
  }, []);

  // 3. Lógica para renderizar a imagem correta
  const getImagemUrl = () => {
    if (baciaAtiva) {
      return `/bacia_${baciaAtiva}.png.jpeg`;
    }
    return "/mapa_parana_page_1.png";
  };

  // Alterado b.id para b.id_bacia (nome exato da coluna no seu PostgreSQL)
  const infoBacia = dadosBacias.find(b => b.id_bacia === baciaAtiva);

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f0f2f5' }}>
      <header style={{ padding: '15px 25px', backgroundColor: '#1a252f', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Monitoramento de Bacias Hidrográficas</h2>
        <div style={{ padding: '5px 12px', borderRadius: '4px', background: conectado ? '#2ecc71' : '#e74c3c', fontSize: '14px', fontWeight: 'bold' }}>
          {conectado ? 'BACKEND ATIVO' : 'OFFLINE'}
        </div>
      </header>

      <main style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px' }}>
        <img 
          src={getImagemUrl()} 
          alt="Mapa Bacia" 
          style={{ maxWidth: '95%', maxHeight: '90%', borderRadius: '15px', boxShadow: '0 8px 25px rgba(0,0,0,0.2)' }} 
        />
      </main>

      {infoBacia && (
        <footer style={{ padding: '20px', background: 'white', borderTop: '4px solid #3498db', textAlign: 'center' }}>
          <h3 style={{ margin: 0 }}>{infoBacia.nome}</h3>
          {/* Mostrando dados ricos que vêm do banco! */}
          <p style={{ margin: '5px 0 0', color: '#666' }}>
            Área: {infoBacia.area_km2} km² | Rios Principais: {infoBacia.principais_rios}
          </p>
        </footer>
      )}
    </div>
  );
}

export default App;