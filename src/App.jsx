import React, { useState, useEffect } from 'react';
import mqtt from 'mqtt';

function App() {
  const [baciaAtiva, setBaciaAtiva] = useState(null);
  const [conectado, setConectado] = useState(false);
  const [dadosBacias, setDadosBacias] = useState([]);

  // 1. Carregar os dados do seu arquivo JSON local
  useEffect(() => {
    fetch('/bacias.json')
      .then(res => res.json())
      .then(data => setDadosBacias(data))
      .catch(err => console.error("Erro ao carregar bacias.json:", err));
  }, []);

  // 2. Configuração da conexão MQTT
  useEffect(() => {
    // IMPORTANTE: Se o broker é local, use o IP da máquina do seu colega ou 'localhost'
    // A porta de WebSockets geralmente é a 9001
    const host = 'localhost'; 
    const port = '9001';
    const clientId = `mqtt_${Math.random().toString(16).slice(3)}`;
    const url = `ws://${host}:${port}/mqtt`;

    const client = mqtt.connect(url, {
      clientId,
      clean: true,
      connectTimeout: 4000,
      reconnectPeriod: 1000,
    });

    client.on('connect', () => {
      setConectado(true);
      console.log('Conectado ao Broker Local!');
      client.subscribe('projeto/bacias/comando'); 
    });

    client.on('message', (topic, message) => {
      try {
        const payload = JSON.parse(message.toString());
        // O colega deve enviar no Postgres o ID (ex: 1 a 16)
        if (payload.id_bacia) {
          setBaciaAtiva(payload.id_bacia);
        }
      } catch (e) {
        console.error("Erro ao processar mensagem:", e);
      }
    });

    client.on('error', (err) => {
      console.error("Erro de conexão:", err);
      setConectado(false);
    });

    return () => client.end();
  }, []);

  // 3. Lógica para renderizar a imagem correta
  const getImagemUrl = () => {
    if (baciaAtiva) {
      // Mantendo a extensão dupla que vi no seu VS Code (.png.jpeg)
      return `/bacia_${baciaAtiva}.png.jpeg`;
    }
    return "/mapa_parana_page_1.png";
  };

  const infoBacia = dadosBacias.find(b => b.id === baciaAtiva);

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#f0f2f5' }}>
      <header style={{ padding: '15px 25px', backgroundColor: '#1a252f', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h2 style={{ margin: 0 }}>Monitoramento de Bacias Hidrográficas</h2>
        <div style={{ padding: '5px 12px', borderRadius: '4px', background: conectado ? '#2ecc71' : '#e74c3c', fontSize: '14px', fontWeight: 'bold' }}>
          {conectado ? 'BROKER LOCAL ATIVO' : 'OFFLINE'}
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
          <p style={{ margin: '5px 0 0', color: '#666' }}>Bacia ID {baciaAtiva} selecionada via hardware.</p>
        </footer>
      )}
    </div>
  );
}

export default App;