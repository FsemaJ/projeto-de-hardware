import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import MapaEstatico from './MapaEstatico';

function App() {
  const [baciaAtiva, setBaciaAtiva] = useState(null);
  const [conectado, setConectado] = useState(false);
  const [dadosBacias, setDadosBacias] = useState([]);
  
  const [detalhesVisiveis, setDetalhesVisiveis] = useState(false);

  useEffect(() => {
    fetch('http://192.168.1.8:3001/api/bacias')
      .then(res => res.json())
      .then(data => {
        setDadosBacias(data);
        console.log("Bacias carregadas do banco:", data);
      })
      .catch(err => console.error("Erro ao carregar do backend:", err));
  }, []);

  useEffect(() => {
    const socket = io('http://192.168.1.8:3001');

    socket.on('connect', () => {
      setConectado(true);
      console.log('✅ Conectado ao Backend via WebSocket!');
    });

    socket.on('baciaAtualizada', (bacia) => {
      console.log("Nova instrução de bacia recebida:", bacia);
      if (bacia) {
        setBaciaAtiva(bacia.id_bacia);
        setDetalhesVisiveis(false); 
      } else {
        setBaciaAtiva(null); 
        setDetalhesVisiveis(false); 
      }
    });

    socket.on('mostrarDetalhes', () => {
      console.log("Gesto para Cima detectado! Mostrando painel...");
      setDetalhesVisiveis(true);
    });

    socket.on('disconnect', () => {
      console.log("❌ Desconectado do Backend");
      setConectado(false);
    });

    return () => socket.disconnect();
  }, []);

  const handleVoltarHome = () => {
    fetch('http://192.168.1.8:3001/api/bacia/home', { method: 'POST' })
      .catch(err => console.error("Erro ao resetar bacia no backend:", err));
  };

  const getImagemUrl = () => {
    if (baciaAtiva) {
      return `/bacia_${baciaAtiva}.png.jpeg`;
    }
    return "/mapa_parana_page_1.png";
  };

  const infoBacia = dadosBacias.find(b => b.id_bacia === baciaAtiva);

  if (!baciaAtiva) {
    return <MapaEstatico onVoltar={() => {}} />;
  }

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f0f2f5' }}>
      <header style={{ padding: '15px 25px', backgroundColor: '#1a252f', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button
          onClick={handleVoltarHome}
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
        
        {/* CONTAINER DO MAPA */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          
          {/* Título flutuante quando o painel lateral está FECHADO */}
          {infoBacia && !detalhesVisiveis && (
            <h2 style={{ 
              margin: '0 0 20px 0', 
              padding: '10px 30px', 
              backgroundColor: '#3498db', 
              color: 'white', 
              borderRadius: '30px', 
              boxShadow: '0 4px 15px rgba(0,0,0,0.1)', 
              fontSize: '28px' 
            }}>
              {infoBacia.nome}
            </h2>
          )}

          <img 
            src={getImagemUrl()} 
            alt="Mapa Bacia" 
            style={{ 
              // Se os detalhes estão visíveis, usa 100% do espaço da div. Se não, encolhe para 75%
              maxWidth: detalhesVisiveis ? '100%' : '75%', 
              maxHeight: detalhesVisiveis ? '100%' : '70vh', 
              borderRadius: '15px', 
              boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
              objectFit: 'contain',
              transition: 'all 0.4s ease-in-out' // Animação suave no redimensionamento
            }} 
          />

          {/* Dica visual de navegação */}
          {infoBacia && !detalhesVisiveis && (
            <p style={{ color: '#7f8c8d', marginTop: '20px', fontWeight: '600', fontSize: '16px' }}>
              ⬆️ Passe a mão para cima no sensor para ver os dados técnicos
            </p>
          )}
        </div>

        {/* PAINEL LATERAL DE INFORMAÇÕES (Abre no Gesto para Cima) */}
        {infoBacia && detalhesVisiveis && (
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
            overflowY: 'auto',
            animation: 'fadeIn 0.5s ease-in-out' // Suaviza a entrada do painel
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: '#1a252f', fontSize: '24px' }}>
              {infoBacia.nome}
            </h3>
            <div style={{ color: '#666', fontSize: '14px', lineHeight: '1.9' }}>
              {Object.entries(infoBacia).map(([chave, valor]) => {
                if (chave === 'id_bacia' || chave === 'nome') return null;
                
                if (chave.toLowerCase().includes('projeção') || 
                    chave.toLowerCase().includes('angulo') ||
                    chave.toLowerCase().includes('angle') ||
                    chave.toLowerCase().includes('projection')) return null;
                
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