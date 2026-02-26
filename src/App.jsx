import React, { useState, useEffect } from 'react';
import io from 'socket.io-client';

// Conecta ao servidor Node.js
const socket = io('http://localhost:3001');

function App() {
  const [textoBacia, setTextoBacia] = useState('Nenhuma bacia selecionada');
  const [conectado, setConectado] = useState(false);

  useEffect(() => {
    socket.on('connect', () => setConectado(true));
    socket.on('disconnect', () => setConectado(false));

    // Ouve o evento do servidor
    socket.on('atualizar-texto', (novoTexto) => {
      setTextoBacia(novoTexto);
    });

    return () => {
      socket.off('atualizar-texto');
    };
  }, []);

  return (
    <div style={{ textAlign: 'center', marginTop: '50px', fontFamily: 'Arial' }}>
      <h1>Painel de Controle de Projeção</h1>
      <p>Status do Servidor: {conectado ? '🟢 Online' : '🔴 Offline'}</p>
      
      <div style={{ padding: '20px', border: '2px solid #333', display: 'inline-block', marginTop: '20px' }}>
        <h2>Bacia em Foco:</h2>
        <p style={{ fontSize: '24px', color: '#007bff', fontWeight: 'bold' }}>
          {textoBacia}
        </p>
      </div>
    </div>
  );
}

export default App;