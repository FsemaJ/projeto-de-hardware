import React, { useState, useEffect } from 'react';
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
  const [bacia, setBacia] = useState(null);
  const [conectado, setConectado] = useState(false);

  useEffect(() => {
    const docRef = doc(db, "monitoramento", "status_atual");
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      setConectado(true);
      if (snapshot.exists()) {
        setBacia(snapshot.data());
      }
    }, (error) => {
      console.error(error);
      setConectado(false);
    });
    return () => unsubscribe();
  }, []);

  return (
    <div style={{ 
      textAlign: 'center', 
      fontFamily: 'sans-serif', 
      backgroundColor: '#ffffff', // Fundo Branco
      color: '#000000',           // Texto Preto Sólido
      minHeight: '100vh', 
      padding: '40px' 
    }}>
      <h1 style={{ color: '#000000', marginBottom: '10px' }}>Painel de Controle de Projeção</h1>
      
      <div style={{ marginBottom: '30px' }}>
        <span style={{
          padding: '10px 20px',
          borderRadius: '5px',
          border: '2px solid #000000',
          backgroundColor: conectado ? '#d1ffd1' : '#ffd1d1',
          fontWeight: 'bold',
          color: '#000000'
        }}>
          Status: {conectado ? 'Sincronizado com o Banco' : 'Erro de Conexão'}
        </span>
      </div>
      
      {bacia ? (
        <div style={{ 
          padding: '30px', 
          border: '3px solid #000000', 
          textAlign: 'left',
          maxWidth: '800px',
          margin: '0 auto',
          lineHeight: '1.6'
        }}>
          <h2 style={{ borderBottom: '2px solid #000000', paddingBottom: '10px' }}>{bacia.nome}</h2>
          
          <p style={{ fontSize: '18px' }}><strong>Resumo:</strong> {bacia.resumo}</p>
          <p style={{ fontSize: '18px' }}><strong>Cidades Polo:</strong> {bacia.cidades_polo}</p>
          <p style={{ fontSize: '18px' }}><strong>Principais Rios:</strong> {bacia.principais_rios}</p>
          <p style={{ fontSize: '18px' }}><strong>Uso Predominante:</strong> {bacia.uso_predominante}</p>
          
          <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#eeeeee', border: '1px solid #000000' }}>
            <h4 style={{ margin: '0 0 10px 0' }}>Coordenadas Pan-Tilt</h4>
            <strong>Ângulo X:</strong> {bacia.projecao?.angulo_x ?? 'Não definido'}° | 
            <strong> Ângulo Y:</strong> {bacia.projecao?.angulo_y ?? 'Não definido'}°
          </div>
        </div>
      ) : (
        <h3 style={{ marginTop: '50px' }}>Aguardando interação na maquete...</h3>
      )}
    </div>
  );
}

export default App;