import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { ListIcon } from "@phosphor-icons/react";
// IMPORTA IL PROVIDER QUI
import { ChatProvider } from "../context/ChatContext"; 

const AppLayout = () => {
  const [isMinimized, setIsMinimized] = useState(false);

  return (
    // AVVOLGI TUTTO IL LAYOUT NEL PROVIDER
    <ChatProvider>
      <div className="flex h-screen w-full relative">
        {isMinimized && (
          <button 
            className='fixed top-4 left-4 z-50'
            onClick={() => setIsMinimized(false)}
          >
            <ListIcon size={32} />
          </button>
        )}

        {!isMinimized && <Sidebar />}

        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
      </div>
    </ChatProvider>
  );
};

export default AppLayout;