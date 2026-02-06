import { Outlet, NavLink } from 'react-router-dom';

export default function AppLayout() {
  return (
    <div style={{ display: 'flex', height: '100-vh', width: '100vw' }}>
      {/* SIDEBAR FISSA */}
      <aside style={{ 
        width: '250px', 
        backgroundColor: '#1a1a1a', 
        color: 'white', 
        display: 'flex', 
        flexDirection: 'column',
        padding: '20px',
        borderRight: '1px solid #333'
      }}>
        <h2>AI SaaS</h2>
        <nav style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginTop: '30px' }}>
          <NavLink to="/app/documents" style={navStyle}>📄 Documenti (RAG)</NavLink>
          <NavLink to="/app/chat" style={navStyle}>💬 Chat AI</NavLink>
          <NavLink to="/app/calendar" style={navStyle}>📅 Calendario</NavLink>
        </nav>
      </aside>

      {/* CONTENUTO DINAMICO (A DESTRA) */}
      <main style={{ flex: 1, overflowY: 'auto', padding: '20px', backgroundColor: '#f9f9f9' }}>
        <Outlet /> 
      </main>
    </div>
  );
}

const navStyle = ({ isActive }: { isActive: boolean }) => ({
  color: 'white',
  textDecoration: 'none',
  padding: '10px',
  borderRadius: '5px',
  backgroundColor: isActive ? '#333' : 'transparent',
});