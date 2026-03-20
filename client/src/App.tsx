import { AuthProvider } from './context/AuthContext';
import { AppProvider } from './context/AppContext';
import { BrowserRouter, Route, Routes, Navigate } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import ProtectedRoute from './components/ProtectedRoute'; // Importalo!
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import CreateNewPassword from './pages/CreateNewPassword';
import ChatPage from './pages/ChatPage';
import CompleteProfile from './pages/CompleteProfilePage';
import DocumentPage from './layouts/DocumentLayout';
import DocumentLayout from './layouts/DocumentLayout';
import CalendarPage from './pages/CalendarPage/CalendarPage';
import { CalendarProvider } from './context/CalendarContext';
import ArtifactsPage from './pages/ArtifactsPage';


function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
        <Routes>
          {/* ROTTE PUBBLICHE */}
          <Route path='/' element={<LandingPage />} />
          <Route path='/login' element={<LoginPage />} />
          <Route path='/reset-password' element={<CreateNewPassword />} />

          {/* ROTTE PROTETTE (Layout + Guard) */}
          {/* Il ProtectedRoute avvolge tutto ciò che deve essere privato */}
          <Route element={<ProtectedRoute />}>
            <Route path='/complete-profile' element={<CompleteProfile/>} />
            {/* Se passi il controllo, entri nel Layout */}
            <Route path='/app' element={<AppLayout />}>
              <Route index element={<Navigate to="/app/chat" replace />} />
              <Route path='chat/:conversationId' element={<ChatPage />} />
              <Route path='documents' element={<DocumentLayout />} />
              <Route path='documents/:documentId' element={<DocumentPage />} />
              <Route path='chat' element={<ChatPage />} />
              <Route path='calendar' element={<CalendarProvider><CalendarPage /></CalendarProvider>} />
              <Route path='artifacts' element={<ArtifactsPage />} />
            </Route>

          </Route>

          {/* 404 */}
          <Route path='*' element={<Navigate to="/404" />} />
        </Routes>
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;