
import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { ListIcon } from "@phosphor-icons/react";
const AppLayout = () => {
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    <div className="flex h-screen w-full relative">
      {/* Icona di riapertura sempre sopra tutto */}
      {isMinimized && (
        <button 
          className='fixed top-4 left-4 z-50'
          onClick={() => setIsMinimized(false)}
        >
          <ListIcon size={32} 
            
          />
        </button>
      )}

      {/* Sidebar */}
      {!isMinimized && <Sidebar />}

      {/* Contenuto Principale */}
      <main className="flex-1 overflow-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default AppLayout;