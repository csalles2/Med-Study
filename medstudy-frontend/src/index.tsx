import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App'; // Como o App.tsx também está na src, o caminho é ./App

const rootElement = document.getElementById('root');
if (rootElement) {
  const root = ReactDOM.createRoot(rootElement as HTMLElement);
  root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>
  );
}