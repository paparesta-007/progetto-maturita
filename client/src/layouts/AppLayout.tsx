import { Outlet, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';


const AppLayout = () => {

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      {/* SIDEBAR FISSA */}
      <Sidebar />

      {/* CONTENITORE DINAMICO (A DESTRA) */}
      <main style={{ flex: 1, padding: '20px', overflowY: 'auto' }}>
        {/* L'Outlet è il buco dove verranno renderizzati i figli (Chat, Documents, ecc.) */}
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;