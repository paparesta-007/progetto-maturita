import { Outlet, Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';


const AppLayout = () => {

  return (
    <div className="flex h-screen">
      {/* SIDEBAR FISSA */}
      <Sidebar />

      {/* CONTENITORE DINAMICO (A DESTRA) */}
      <main className="flex-1 ">
        {/* L'Outlet è il buco dove verranno renderizzati i figli (Chat, Documents, ecc.) */}
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;