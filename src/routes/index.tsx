import React from 'react';

export default function GameRoute() {
  return (
    <div style={{ width: '100vw', height: '100vh', margin: 0, padding: 0, overflow: 'hidden', backgroundColor: '#0b0a09' }}>
      <iframe
        src="/public/game/index.html"
        title="Sadhanam Kayyilundo?"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          outline: 'none'
        }}
        allow="camera; microphone; autoplay; fullscreen"
      />
    </div>
  );
}
