import { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import {
  ChartPolarIcon,
  FadersHorizontalIcon,
  ListIcon,
  CreditCardIcon,
  UserCircleIcon,
  XIcon
} from "@phosphor-icons/react";
import { ChatProvider, useChat } from "../context/ChatContext";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext"; // Importa per il tema
import { AnimatePresence, motion } from "framer-motion";
import GeneralSettingPage from "../pages/SettingPages/GeneralSettingPage";
import InstructionsSettingPage from "../pages/SettingPages/InstructionsSettingPage";
import BillingSettingPage from "../pages/SettingPages/BilingSettingPage";
import { DocumentProvider } from "../context/DocumentContext";

const AppLayout = () => {
  const [isMinimized, setIsMinimized] = useState(false);
  const { isSettingOpen, setIsSettingOpen, setSettingPage, settingPage } = useApp();
  const { theme, setTheme } = useAuth(); // Estrai il tema globale
  const isDark = theme === 'dark';

  // --- Palette dinamica ---
  const style = {
    layoutContainer: `flex h-screen w-full relative transition-colors duration-300 ${isDark ? "bg-neutral-950 text-white" : "bg-white text-neutral-900"}`,
    modalOverlay: "fixed inset-0 bg-black/60  z-40",
    modalContent: `fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 rounded-xl shadow-2xl w-[95vw] max-w-[680px] h-[85vh] max-h-[540px] flex flex-col md:flex-row overflow-hidden border transition-colors duration-300 ${isDark ? "bg-neutral-900 border-neutral-800" : "bg-white border-neutral-200"
      }`,
    modalSidebar: `flex md:flex-col gap-1 md:w-[200px] md:min-w-[200px] border-b md:border-b-0 md:border-r p-3 overflow-x-auto md:overflow-visible transition-colors ${isDark ? "bg-neutral-900/50 border-neutral-800" : "bg-neutral-50 border-neutral-200"
      }`,
    navButton: (active: boolean) => `
      flex items-center gap-2 whitespace-nowrap px-3 py-2 rounded-lg transition-all text-sm
      ${active
        ? (isDark ? "bg-neutral-800 text-white shadow-sm" : "bg-neutral-200/80 text-neutral-900 shadow-sm")
        : (isDark ? "text-neutral-400 hover:bg-neutral-800/50 hover:text-neutral-200" : "text-neutral-500 hover:bg-neutral-200/60 hover:text-neutral-900")
      }
    `,
    divider: `md:my-2 ${isDark ? "border-neutral-800" : "border-neutral-200"}`,
    closeBtn: `absolute top-4 right-4 transition-colors ${isDark ? "text-neutral-500 hover:text-neutral-300" : "text-neutral-400 hover:text-neutral-600"}`
  };

  const menuItems = [
    { label: "Generale", Icon: FadersHorizontalIcon, id: "generale" },
    { label: "Istruzioni", Icon: ChartPolarIcon, id: "istruzioni" },
    { label: "Fatturazione", Icon: CreditCardIcon, id: "fatturazione" },
  ];
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Ctrl+Shift+L → event.code === 'KeyL'
      if (event.ctrlKey && event.shiftKey && event.code === 'KeyL') {
        event.preventDefault(); // blocca eventuali default del browser
        setTheme(prev => (prev === 'dark' ? 'light' : 'dark'));
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setTheme]);


  return (
    <ChatProvider>
      <DocumentProvider>
        <div className={style.layoutContainer}>
          {/* Toggle per Sidebar minimizzata */}
          {isMinimized && (
            <button
              className={`fixed top-4 left-4 z-50 p-2 rounded-lg transition-colors ${isDark ? "bg-neutral-900 text-white hover:bg-neutral-800" : "bg-white text-neutral-900 hover:bg-neutral-100 shadow-md"}`}
              onClick={() => setIsMinimized(false)}
            >
              <ListIcon size={24} />
            </button>
          )}

          {!isMinimized && <Sidebar />}

          <main className="flex-1 overflow-auto relative">
            <Outlet />
          </main>

          {/* MODALE IMPOSTAZIONI */}
          <AnimatePresence>
            {isSettingOpen && (
              <>
                {/* Overlay */}
                <motion.div
                  className={style.modalOverlay}
                  onClick={() => setIsSettingOpen(false)}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />

                {/* Popup Animato */}
                <motion.div
                  role="dialog"
                  aria-modal="true"
                  className={style.modalContent}
                  initial={{ opacity: 0, scale: 0.95, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95, y: 20 }}
                  transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
                >
                  {/* Menu laterale del modale */}
                  <div className={style.modalSidebar}>
                    <div className="flex md:flex-col gap-1 flex-1">
                      <p className={`hidden md:block px-3 text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? "text-neutral-500" : "text-neutral-400"}`}>
                        Impostazioni
                      </p>
                      {menuItems.map(({ label, Icon, id }) => (
                        <button
                          key={id}
                          onClick={() => setSettingPage(id)}
                          className={style.navButton(settingPage === id)}
                        >
                          <Icon size={18} weight={settingPage === id ? "fill" : "regular"} />
                          {label}
                        </button>
                      ))}
                    </div>

                    <hr className={style.divider} />

                    <button className={style.navButton(false)}>
                      <UserCircleIcon size={18} weight="regular" />
                      Account
                    </button>
                  </div>

                  {/* Contenuto dinamico delle pagine di impostazione */}
                  <div className="flex flex-col flex-1 relative overflow-y-auto">
                    <div className="p-3 md:p-4 h-full">
                      {settingPage === "generale" && <GeneralSettingPage />}
                      {settingPage === "istruzioni" && <InstructionsSettingPage />}
                      {settingPage === "fatturazione" && <BillingSettingPage />}
                    </div>

                    {/* Tasto Chiudi */}
                    <button
                      className={style.closeBtn}
                      onClick={() => setIsSettingOpen(false)}
                    >
                      <XIcon size={22} weight="bold" />
                    </button>
                  </div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </div>
      </DocumentProvider>

    </ChatProvider>
  );
};

export default AppLayout;