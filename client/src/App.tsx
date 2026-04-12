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
import { initRemoteLogger } from './utils/remoteLogger';
import QuizPage from './pages/ArtifactsPages/QuizPage';
import KnowledgePage from './pages/static/Knowledge';
import HelpPage from './pages/HelpPage';
import RoutePlaceholderPage from './pages/RoutePlaceholderPage';
initRemoteLogger();

function App() {
  return (
    <AuthProvider>
      <AppProvider>
        <BrowserRouter>
          <Routes>
            {/* ROTTE PUBBLICHE */}
            <Route path='/' element={<LandingPage />} />
            <Route path='/knowledge' element={<KnowledgePage />} />
            <Route path='/help' element={<HelpPage />} />
            <Route path='/roadmap' element={<RoutePlaceholderPage />} />
            <Route path='/resources' element={<RoutePlaceholderPage />} />
            <Route path='/changelog' element={<RoutePlaceholderPage />} />
            <Route path='/login' element={<LoginPage />} />
            <Route path='/reset-password' element={<CreateNewPassword />} />

            {/* ROTTE PROTETTE */}
            <Route element={<ProtectedRoute />}>
              <Route path='/complete-profile' element={<CompleteProfile />} />

              <Route path='/app' element={<AppLayout />}>
                <Route index element={<Navigate to="/app/chat" replace />} />
                <Route path='chat/:conversationId' element={<ChatPage />} />
                <Route path='chat' element={<ChatPage />} />

                <Route path='documents' element={<DocumentLayout />} />
                <Route path='documents/:documentId' element={<DocumentPage />} />

                <Route path='calendar' element={<CalendarProvider><CalendarPage /></CalendarProvider>} />

                {/* --- SEZIONE ARTIFACTS --- */}
                <Route path='artifacts'>
                  <Route index element={<ArtifactsPage />} /> {/* /app/artifacts */}
                  <Route path='quiz' element={<QuizPage />} /> {/* /app/artifacts/quiz */}
                </Route>

              </Route>
            </Route>

            {/* 404 */}
            <Route path='*' element={<Navigate to="/" />} />
          </Routes>
        </BrowserRouter>
      </AppProvider>
    </AuthProvider>
  );
}

export default App;