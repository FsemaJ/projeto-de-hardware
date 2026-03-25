import React, { useState, useEffect, useRef } from 'react';
import { initializeApp } from "firebase/app";
import { getFirestore, doc, onSnapshot } from "firebase/firestore";

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FB_API_KEY,
  authDomain: import.meta.env.VITE_FB_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FB_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FB_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FB_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FB_APP_ID
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

function App() {
  const [conectado, setConectado] = useState(false);
  const [bacias, setBacias] = useState([]);
  const [baciaAtiva, setBaciaAtiva] = useState(null);
  const canvasRef = useRef(null);
  const imageRef = useRef(null);

  // Carregar dados das bacias
  useEffect(() => {
    fetch('/bacias.json')
      .then(response => response.json())
      .then(data => setBacias(data))
      .catch(error => console.error('Erro ao carregar bacias:', error));
  }, []);

  // Conectar ao Firebase
  useEffect(() => {
    const docRef = doc(db, "monitoramento", "status_atual");
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      setConectado(true);
      if (snapshot.exists()) {
        const data = snapshot.data();
        // Encontra o ID da bacia ativa
        const baciaEncontrada = bacias.find(b => b.nome === data.nome);
        if (baciaEncontrada) {
          setBaciaAtiva(baciaEncontrada.id);
        }
      }
    }, (error) => {
      console.error(error);
      setConectado(false);
    });
    return () => unsubscribe();
  }, [bacias]);

  // Desenhar overlay nas bacias não selecionadas
  useEffect(() => {
    if (!imageRef.current || !canvasRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const img = imageRef.current;

    if (!img.complete) {
      img.onload = () => desenharMapa();
    } else {
      desenharMapa();
    }

    function desenharMapa() {
      // Ajustar canvas para o tamanho da imagem
      canvas.width = img.width;
      canvas.height = img.height;

      // Desenhar apenas a imagem base (sem overlay)
      ctx.drawImage(img, 0, 0);

      // Se houver uma bacia ativa, desenhar uma borda ao redor dela
      if (baciaAtiva) {
        const baciaAtual = bacias.find(b => b.id === baciaAtiva);
        if (baciaAtual) {
          const coords = baciaAtual.coordenadas;
          
          // Desenhar borda em volta da bacia
          ctx.strokeStyle = '#FFD700'; // Ouro
          ctx.lineWidth = 8;
          ctx.shadowColor = 'rgba(255, 215, 0, 0.8)';
          ctx.shadowBlur = 20;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 0;
          
          ctx.strokeRect(coords.x - 4, coords.y - 4, coords.width + 8, coords.height + 8);
          
          // Limpar shadow
          ctx.shadowColor = 'transparent';
        }
      }
    }
  }, [bacias, baciaAtiva]);

  return (
    <div style={{ 
      width: '100vw', 
      height: '100vh', 
      padding: 0, 
      margin: 0,
      display: 'flex',
      flexDirection: 'column',
      fontFamily: 'sans-serif',
      backgroundColor: '#f5f5f5'
    }}>
      <div style={{
        padding: '15px',
        backgroundColor: '#2c3e50',
        color: 'white',
        textAlign: 'center',
        boxShadow: '0 2px 5px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '15px'
      }}>
        <div style={{ flex: 1 }}></div>
        
        <h1 style={{ margin: '0', flex: 1, textAlign: 'center' }}>
          Mapa do Paraná {baciaAtiva && `- ${bacias.find(b => b.id === baciaAtiva)?.nome || 'Carregando...'}`}
        </h1>
        
        <div style={{
          display: 'inline-block',
          padding: '8px 15px',
          backgroundColor: conectado ? '#27ae60' : '#e74c3c',
          borderRadius: '5px',
          fontWeight: 'bold'
        }}>
          {conectado ? '✓ Conectado' : '✗ Desconectado'}
        </div>
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'auto',
        padding: '20px',
        position: 'relative'
      }}>
        {/* Imagem base (oculta) */}
        <img 
          ref={imageRef}
          src="/mapa_parana_page_1.png" 
          alt="Mapa do Estado do Paraná"
          style={{
            display: 'none'
          }}
        />
        
        {/* Canvas para overlay */}
        <canvas
          ref={canvasRef}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
            borderRadius: '8px'
          }}
        />
      </div>

      {/* Info adicional */}
      {baciaAtiva && (
        <div style={{
          padding: '15px',
          backgroundColor: '#ecf0f1',
          textAlign: 'center',
          borderTop: '1px solid #bdc3c7'
        }}>
          <p style={{ margin: 0, fontWeight: 'bold', color: '#2c3e50' }}>
            Bacia Selecionada: {bacias.find(b => b.id === baciaAtiva)?.nome}
          </p>
        </div>
      )}
    </div>
  );
}

export default App;