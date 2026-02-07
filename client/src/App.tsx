import { AuthProvider } from './context/AuthContext';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import ProtectedRoute from './components/ProtectedRoute'; // Importalo!
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';

// Placeholder
const Documents = () => <div><h1>Documenti</h1></div>;
const Chat = () => <div><h1>Chat</h1></div>;
const Calendar = () => <div><h1>Calendar</h1></div>;

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          {/* ROTTE PUBBLICHE */}
          <Route path='/' element={<LandingPage />} />
          <Route path='/login' element={<LoginPage />} />

          {/* ROTTE PROTETTE (Layout + Guard) */}
          {/* Il ProtectedRoute avvolge tutto ciò che deve essere privato */}
          <Route element={<ProtectedRoute />}>
            
            {/* Se passi il controllo, entri nel Layout */}
            <Route path='/app' element={<AppLayout />}>
              <Route index element={<Navigate to="/app/chat" replace />} />
              <Route path='documents' element={<Documents />} />
              <Route path='chat' element={<Chat />} />
              <Route path='calendar' element={<Calendar />} />
            </Route>

          </Route>

          {/* 404 */}
          <Route path='*' element={<Navigate to="/404" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;