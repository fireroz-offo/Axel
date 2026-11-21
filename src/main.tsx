import React from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './styles.css';

// Cross-origin isolation shim for static hosting (see public/coi-sw.js). Reloads once after the first install.
if ('serviceWorker' in navigator && window.isSecureContext && !crossOriginIsolated) {
  navigator.serviceWorker
    .register('./coi-sw.js')
    .then((reg) => {
      const reloaded = sessionStorage.getItem('coi-reloaded');
      if (!reloaded && (reg.active || reg.installing || reg.waiting)) {
        const sw = reg.active ?? reg.installing ?? reg.waiting!;
        const go = () => { sessionStorage.setItem('coi-reloaded', '1'); location.reload(); };
        if (sw.state === 'activated') go();
        else sw.addEventListener('statechange', () => sw.state === 'activated' && go());
      }
    })
    .catch((e) => console.warn('coi-sw registration failed', e));
}

createRoot(document.getElementById('root')!).render(<React.StrictMode><App /></React.StrictMode>);
