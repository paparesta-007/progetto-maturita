import { useEffect, useState,useMemo } from "react";
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
import { ChatProvider } from "../context/ChatContext";
import { useApp } from "../context/AppContext";
import { useAuth } from "../context/AuthContext"; // Importa per il tema
import { AnimatePresence, motion } from "framer-motion";
import GeneralSettingPage from "../pages/SettingPages/GeneralSettingPage";
import InstructionsSettingPage from "../pages/SettingPages/InstructionsSettingPage";
import BillingSettingPage from "../pages/SettingPages/BilingSettingPage";
import { DocumentProvider } from "../context/DocumentContext";
import AccountPage from "../pages/SettingPages/AccountPage";
import ShortcutSetting from "../pages/SettingPages/Shortcut";
import PreferencesPage from "../pages/SettingPages/PreferencesPage";
const AppLayout = () => {
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isSettingOpen, setIsSettingOpen, setSettingPage, settingPage, isLivePreview } = useApp();
  const { theme, setTheme } = useAuth(); // Estrai il tema globale
  const isDark = theme === 'dark';
  const effectiveSidebarMinimized = isLivePreview || isMinimized;

  // --- Palette dinamica ---
  const style = useMemo(() => ({
    layoutContainer: `flex h-screen w-full relative transition-colors duration-300 ${isDark ? "bg-[#07070a] text-[#f4f1ea]" : "bg-white text-neutral-900"}`,
    modalOverlay: "fixed inset-0 bg-black/80 backdrop-blur-sm z-40",
    modalContent: `fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 rounded-[2rem] shadow-[0_50px_100px_rgba(0,0,0,0.6)] w-[95vw] max-w-[800px] h-[85vh] max-h-[600px] flex flex-col md:flex-row overflow-hidden border transition-colors duration-300 ${isDark ? "bg-[#07070a] border-white/10" : "bg-white border-neutral-200"}`,
    modalSidebar: `flex md:flex-col gap-1 md:w-[220px] md:min-w-[220px] border-b md:border-b-0 md:border-r p-5 overflow-x-auto md:overflow-visible transition-colors ${isDark ? "bg-white/[0.02] border-white/5 backdrop-blur-2xl" : "bg-neutral-50 border-neutral-200"}`,
    navButton: (active: boolean) => `
      flex items-center gap-3 whitespace-nowrap px-4 py-2.5 rounded-xl transition-all text-[13px] font-semibold
      ${active
        ? (isDark ? "bg-white/10 text-white shadow-[0_0_20px_rgba(255,255,255,0.05)] border border-white/10" : "bg-neutral-200/80 text-neutral-900 shadow-sm")
        : (isDark ? "text-white/40 hover:bg-white/5 hover:text-white/70" : "text-neutral-500 hover:bg-neutral-200/60 hover:text-neutral-900")
      }
    `,
    divider: `md:my-3 ${isDark ? "border-white/5" : "border-neutral-200"}`,
    closeBtn: `absolute top-6 right-6 transition-colors z-50 ${isDark ? "text-white/30 hover:text-white" : "text-neutral-400 hover:text-neutral-900"}`
  }), [isDark]);

  const menuItems = [
    { label: "Generale", Icon: FadersHorizontalIcon, id: "generale" },
    { label: "Istruzioni", Icon: ChartPolarIcon, id: "istruzioni" },
    { label: "Fatturazione", Icon: CreditCardIcon, id: "fatturazione" },
    { label: "Scorciatoie", Icon: ListIcon, id: "shortcuts" },
    { label: "Aspetto", Icon: UserCircleIcon, id: "preferences" }
  ];
  const accountItem = { label: "Account", Icon: UserCircleIcon, id: "account" };
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
          {/* Mobile and Minimized Desktop Toggle */}
          {((isMinimized && !isLivePreview) || !isMobileMenuOpen) && (
            <button
              className={`fixed top-4 left-4 z-50 p-2 rounded-lg transition-all 
                ${isMinimized ? 'hidden md:block' : 'block md:hidden'} 
                ${isDark ? "bg-neutral-900 text-white hover:bg-neutral-800" : "bg-white text-neutral-900 hover:bg-neutral-100 shadow-md"}`}
              onClick={() => {
                if (window.innerWidth < 768) setIsMobileMenuOpen(true);
                else setIsMinimized(false);
              }}
            >
              <ListIcon size={24} />
            </button>
          )}

          <Sidebar
            isMinimized={effectiveSidebarMinimized}
            setIsMinimized={setIsMinimized}
            isLockedMinimized={isLivePreview}
            isMobileOpen={isMobileMenuOpen}
            setIsMobileOpen={setIsMobileMenuOpen}
          />

          <main className={`flex-1 min-w-0 overflow-hidden relative ${isMobileMenuOpen ? 'hidden md:block' : 'block'}`}>
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
                  transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                >
                  {/* Menu laterale del modale */}
                  <div className={style.modalSidebar}>
                    <div className="flex md:flex-col gap-1 flex-1">
                      <p className={`hidden md:block px-3 text-[10px] font-bold uppercase tracking-wider mb-2 ${isDark ? "text-neutral-400" : "text-neutral-600"}`}>
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

                    <button
                      onClick={() => setSettingPage(accountItem.id)}
                      className={style.navButton(settingPage === accountItem.id)}
                    >
                      <accountItem.Icon size={18} weight={settingPage === accountItem.id ? "fill" : "regular"} />
                      {accountItem.label}
                    </button>
                  </div>

                  {/* Contenuto dinamico delle pagine di impostazione */}
                  <div className={`flex flex-col flex-1 relative overflow-y-auto ${isDark ? "bg-transparent" : "bg-neutral-50"}`}>
                    <div className="p-3 md:p-4 h-full">
                      {settingPage === "generale" && <GeneralSettingPage />}
                      {settingPage === "istruzioni" && <InstructionsSettingPage />}
                      {settingPage === "fatturazione" && <BillingSettingPage />}
                      {settingPage === "account" && <AccountPage />}
                      {settingPage === "shortcuts" && <ShortcutSetting />}
                      {settingPage === "preferences" && <PreferencesPage />}
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