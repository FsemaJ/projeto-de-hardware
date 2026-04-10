import React from 'react';

function MapaEstatico({ onVoltar }) {
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
        justifyContent: 'center'
      }}>
        <h1 style={{ margin: '0' }}>Mapa do Paraná</h1>
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

export default MapaEstatico;
