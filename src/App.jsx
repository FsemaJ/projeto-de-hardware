import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client'; // Trocamos mqtt por socket.io-client
import MapaEstatico from './MapaEstatico';

function App() {
  const [baciaAtiva, setBaciaAtiva] = useState(null);
  const [conectado, setConectado] = useState(false);
  const [dadosBacias, setDadosBacias] = useState([]);

  // 1. Carregar os dados direto do Backend (PostgreSQL) ao iniciar
  useEffect(() => {
    // Usando a rota HTTP que criamos no Node.js
    fetch('http://192.168.1.8:3001/api/bacias')
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
    const socket = io('http://192.168.1.8:3001');

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

  // Se não houver bacia ativa, mostra o mapa estático
  if (!baciaAtiva) {
    return <MapaEstatico onVoltar={() => {}} />;
  }

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f0f2f5' }}>
      <header style={{ padding: '15px 25px', backgroundColor: '#1a252f', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={() => setBaciaAtiva(null)}
          style={{
            padding: '8px 15px',
            backgroundColor: '#e74c3c',
            color: 'white',
            border: 'none',
            borderRadius: '5px',
            cursor: 'pointer',
            fontWeight: 'bold',
            fontSize: '14px'
          }}
        >
          ← Voltar ao Mapa Inicial
        </button>
        <h2 style={{ margin: 0, flex: 1, textAlign: 'center' }}>Monitoramento de Bacias Hidrográficas</h2>
        <div style={{ padding: '5px 12px', borderRadius: '4px', background: conectado ? '#2ecc71' : '#e74c3c', fontSize: '14px', fontWeight: 'bold' }}>
          {conectado ? 'BACKEND ATIVO' : 'OFFLINE'}
        </div>
      </header>

      <main style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', gap: '20px' }}>
        <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
          <img 
            src={getImagemUrl()} 
            alt="Mapa Bacia" 
            style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '15px', boxShadow: '0 8px 25px rgba(0,0,0,0.2)' }} 
          />
        </div>

        {infoBacia && (
          <div style={{ 
            flex: 0.4, 
            background: 'white', 
            padding: '30px', 
            borderRadius: '15px', 
            boxShadow: '0 8px 25px rgba(0,0,0,0.1)', 
            display: 'flex', 
            flexDirection: 'column', 
            justifyContent: 'flex-start',
            borderLeft: '4px solid #3498db',
            overflowY: 'auto'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#1a252f', fontSize: '24px' }}>
              {infoBacia.nome}
            </h3>
            <div style={{ color: '#666', fontSize: '14px', lineHeight: '1.9' }}>
              {Object.entries(infoBacia).map(([chave, valor]) => {
                // Pula o id_bacia e nome (já mostrado como título)
                if (chave === 'id_bacia' || chave === 'nome') return null;
                
                // Pula campos com "projeção" ou "ângulo"
                if (chave.toLowerCase().includes('projeção') || 
                    chave.toLowerCase().includes('angulo') ||
                    chave.toLowerCase().includes('angle') ||
                    chave.toLowerCase().includes('projection')) return null;
                
                // Formata o nome da chave (snake_case para Título)
                const nomeCampo = chave
                  .replace(/_/g, ' ')
                  .split(' ')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ');
                
                return (
                  <p key={chave} style={{ margin: '0 0 12px 0' }}>
                    <strong>{nomeCampo}:</strong> {valor || 'N/A'}
                  </p>
                );
              })}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;