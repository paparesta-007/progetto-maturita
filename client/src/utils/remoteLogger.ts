// client/src/utils/remoteLogger.ts

// Rileva l'indirizzo IP del server (usa localhost se sei sul PC, o l'IP se sei su LAN)
const SERVER_IP = window.location.hostname === 'localhost' ? 'localhost' : window.location.hostname;
const LOG_ENDPOINT = `http://${SERVER_IP}:3000/logs`;

export const initRemoteLogger = () => {
  const sendLog = async (type: string, data: any) => {
    try {
      // Usiamo 'navigator.sendBeacon' se disponibile (più affidabile per i log di chiusura pagina)
      // altrimenti il classico fetch
      await fetch(LOG_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          message: data.message || data,
          stack: data.stack || null,
          source: data.source || null,
          lineno: data.lineno || null,
          colno: data.colno || null,
          url: window.location.href,
          timestamp: new Date().toISOString()
        }),
      });
    } catch (e) {
      // Non logghiamo l'errore del log per evitare loop infiniti
    }
  };

  // Cattura errori globali (JS crash)
  window.onerror = (message, source, lineno, colno, error) => {
    sendLog('CRASH', { 
      message, 
      stack: error?.stack,
      source,
      lineno,
      colno
    });
  };

  // Cattura Promise fallite
  window.onunhandledrejection = (event) => {
    sendLog('PROMISE_ERROR', { 
      message: event.reason?.message || event.reason,
      stack: event.reason?.stack 
    });
  };

  // Intercettazione console.error (utile per errori React o warning critici)
  const originalConsoleError = console.error;
  console.error = function(...args: any[]) {
    originalConsoleError.apply(console, args);
    const message = args.map(arg => {
      try { return typeof arg === 'object' ? JSON.stringify(arg) : String(arg); }
      catch(e) { return String(arg); }
    }).join(' ');
    
    if (message.includes(LOG_ENDPOINT)) return;
    sendLog('CONSOLE_ERROR', { message });
  };

  // Cattura errori di compilazione/HMR di Vite (solo in sviluppo)
  window.addEventListener('vite:error', (event: any) => {
    const error = event.detail;
    sendLog('VITE_BUILD_ERROR', { 
       message: error.message,
       stack: error.stack,
       source: error.id || null,
       lineno: error.loc?.line || null,
       colno: error.loc?.column || null
    });
  });

  console.log("🚀 Remote Logger inizializzato su:", LOG_ENDPOINT);
};