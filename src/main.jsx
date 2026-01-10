import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './app.jsx'
import './index.css'

console.log('Main.jsx is executing...');

const rootElement = document.getElementById('root');

if (rootElement) {
  try {
    ReactDOM.createRoot(rootElement).render(
      <React.StrictMode>
        <App />
      </React.StrictMode>
    );
    console.log('React app render initiated.');
  } catch (err) {
    console.error('CRITICAL ERROR during React mount:', err);
    rootElement.innerHTML = `<div style="color:red"><h1>Failed to mount React App</h1><p>${err.message}</p></div>`;
  }
} else {
  console.error("Root element 'root' not found in document.");
}