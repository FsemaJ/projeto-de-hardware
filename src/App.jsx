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
  const [conectado, setConectado] = useState(false);

  // Conectar ao Firebase
  useEffect(() => {
    const docRef = doc(db, "monitoramento", "status_atual");
    const unsubscribe = onSnapshot(docRef, (snapshot) => {
      setConectado(true);
    }, (error) => {
      console.error(error);
      setConectado(false);
    });
    return () => unsubscribe();
  }, []);

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
        
        <h1 style={{ margin: '0', flex: 1, textAlign: 'center' }}>Mapa do Paraná</h1>
        
        <div style={{
          display: 'inline-block',
          padding: '8px 15px',
          backgroundColor: conectado ? '#27ae60' : '#e74c3c',
          borderRadius: '5px',
          fontWeight: 'bold'
        }}>
          {conectado ? '✓ Conectado ao Firebase' : '✗ Desconectado'}
        </div>
      </div>

      <div style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'auto',
        padding: '20px'
      }}>
        <img 
          src="/mapa_parana_page_1.png" 
          alt="Mapa do Estado do Paraná"
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain',
            boxShadow: '0 4px 10px rgba(0,0,0,0.1)',
            borderRadius: '8px'
          }}
        />
      </div>
    </div>
  );
}

export default App;