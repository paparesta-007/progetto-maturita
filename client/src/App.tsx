import './App.css'
import { AuthProvider } from './context/AuthContext'
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom'
import AppLayout from './layouts/AppLayout'
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';

// Componenti Placeholder (da creare poi)
const Documents = () => <div><h1>Gestione PDF & RAG</h1><p>Qui carichi i file...</p></div>;
const Chat = () => <div><h1>Chatbot AI</h1><p>Analizza i tuoi PDF qui.</p></div>;
const Calendar = () => <div><h1>Integrazione Google Calendar</h1><p>Gestisci i tuoi appuntamenti.</p></div>;

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* Rotta Home / Landing */}
          <Route path='/' element={<LandingPage />} />
          <Route path='/login' element={<LoginPage/>} />

          {/* Rotta Base /app con Layout e Figli */}
          <Route path='/app' element={<AppLayout />}>
            {/* Quando vai su /app, ti reindirizza automaticamente alla chat o ai documenti */}
            <Route index element={<Navigate to="/app/chat" />} />
            
            <Route path='documents' element={<Documents />} />
            <Route path='chat' element={<Chat />} />
            <Route path='calendar' element={<Calendar />} />
          </Route>

          {/* Fallback per rotte inesistenti */}
          <Route path='*' element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  )
}

export default App