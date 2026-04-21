import React, { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import MapaEstatico from './MapaEstatico';

function App() {
  const [baciaAtiva, setBaciaAtiva] = useState(null);
  const [conectado, setConectado] = useState(false);
  const [dadosBacias, setDadosBacias] = useState([]);
  
  const [detalhesVisiveis, setDetalhesVisiveis] = useState(false);

  // 1. Carrega os dados iniciais do banco
  useEffect(() => {
    fetch('http://192.168.1.8:3001/api/bacias')
      .then(res => res.json())
      .then(data => {
        setDadosBacias(data);
        console.log("Bacias carregadas do banco:", data);
      })
      .catch(err => console.error("Erro ao carregar do backend:", err));
  }, []);

  // 2. Conecta ao WebSocket para escutar os gestos
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
        setDetalhesVisiveis(false); // Fecha o painel de info ao trocar de bacia
      } else {
        setBaciaAtiva(null); // Null significa que o backend mandou voltar para Home
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

  const getImagemUrl = () => {
    if (baciaAtiva) {
      return `/bacia_${baciaAtiva}.png.jpeg`;
    }
    return "/mapa_parana_page_1.png";
  };

  const infoBacia = dadosBacias.find(b => b.id_bacia === baciaAtiva);

  // Se não tem bacia ativa, mostra o mapa inicial
  if (!baciaAtiva) {
    // Como não há mais cliques, não passamos função de voltar
    return <MapaEstatico />; 
  }

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f0f2f5' }}>
      
      {/* CABEÇALHO */}
      <header style={{ padding: '15px 25px', backgroundColor: '#1a252f', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        
        {/* Nova Legenda de Gestos para orientar o usuário */}
        <div style={{ flex: 1, display: 'flex', gap: '10px' }}>
          <span style={{ fontSize: '13px', background: '#34495e', padding: '6px 12px', borderRadius: '5px' }}>⬅️ ➡️ Navegar</span>
          <span style={{ fontSize: '13px', background: '#34495e', padding: '6px 12px', borderRadius: '5px' }}>⬆️ Detalhes</span>
          <span style={{ fontSize: '13px', background: '#34495e', padding: '6px 12px', borderRadius: '5px' }}>⬇️ Início</span>
        </div>

        <h2 style={{ margin: 0, flex: 1, textAlign: 'center', fontSize: '22px' }}>Monitoramento de Bacias Hidrográficas</h2>
        
        <div style={{ flex: 1, display: 'flex', justifyContent: 'flex-end' }}>
          <div style={{ padding: '5px 12px', borderRadius: '4px', background: conectado ? '#2ecc71' : '#e74c3c', fontSize: '14px', fontWeight: 'bold' }}>
            {conectado ? 'SISTEMA ATIVO' : 'OFFLINE'}
          </div>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'center', padding: '20px', gap: '20px' }}>
        
        {/* CONTAINER DA IMAGEM */}
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
              fontSize: '28px',
              animation: 'fadeIn 0.5s ease-in-out'
            }}>
              {infoBacia.nome}
            </h2>
          )}

          <img 
            src={getImagemUrl()} 
            alt="Mapa Bacia" 
            style={{ 
              maxWidth: detalhesVisiveis ? '100%' : '75%', 
              maxHeight: detalhesVisiveis ? '100%' : '70vh', 
              borderRadius: '15px', 
              boxShadow: '0 8px 25px rgba(0,0,0,0.2)',
              objectFit: 'contain',
              transition: 'all 0.4s ease-in-out' 
            }} 
          />
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
            maxHeight: '80vh',
            animation: 'fadeIn 0.4s ease-in-out' 
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
                  <p key={chave} style={{ margin: '0 0 12px 0', borderBottom: '1px solid #f0f0f0', paddingBottom: '8px' }}>
                    <strong style={{ color: '#2c3e50' }}>{nomeCampo}:</strong> {valor || 'N/A'}
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