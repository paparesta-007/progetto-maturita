import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import { ChartPolarIcon, FadersHorizontalIcon, ListIcon, CreditCardIcon, UserCircleIcon, XIcon } from "@phosphor-icons/react";
// IMPORTA IL PROVIDER QUI
import { ChatProvider } from "../context/ChatContext";
import { useApp } from "../context/AppContext";
import { AnimatePresence, motion } from "framer-motion";
import GeneralSettingPage from "../pages/SettingPages/GeneralSettingPage";
import InstructionsSettingPage from "../pages/SettingPages/InstructionsSettingPage";
import BillingSettingPage from "../pages/SettingPages/BilingSettingPage";
const AppLayout = () => {
  const [isMinimized, setIsMinimized] = useState(false);
  const toggleMinimize = () => {
    setIsMinimized(!isMinimized);
  }

  const { isSettingOpen, setIsSettingOpen, setSettingPage, settingPage } = useApp()
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
        {isSettingOpen && (
          <>
            {/* Overlay */}
            <motion.div
              className="fixed inset-0 bg-black/55  z-40"
              onClick={() => setIsSettingOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />

            <AnimatePresence>
              <motion.div
                role="dialog"
                aria-modal="true"
                className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 
                          bg-white z-50 rounded-xl shadow-xl 
                          w-[95vw] max-w-[650px] h-[85vh] max-h-[500px]
                          flex flex-col md:flex-row overflow-hidden"

                initial={{ opacity: 0, scale: 0.92, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.92, y: 10 }}
                transition={{ duration: 0.18, ease: "easeOut" }}
              >
                {/* Menu laterale */}
                <div className="
                  flex md:flex-col gap-1
                  md:w-[180px] md:min-w-[180px]
                  border-b md:border-b-0 md:border-r
                  border-neutral-200 justify-start md:justify-between
                  p-3 bg-neutral-100
                  overflow-x-auto md:overflow-visible
                  ">
                  <div className="flex md:flex-col gap-1 flex-1">
                  {[
                    { label: "Generale", Icon: FadersHorizontalIcon },
                    { label: "Istruzioni", Icon: ChartPolarIcon },
                    { label: "Fatturazione", Icon: CreditCardIcon },
                    
                  ].map(({ label, Icon }) => (
                    <button
                    key={label}
                    onClick={() => setSettingPage(label.toLowerCase())}
                    className={`
                          flex items-center gap-2 whitespace-nowrap
                          text-neutral-500 hover:text-neutral-900
                          hover:bg-neutral-200/80 px-3 py-2 rounded-lg
                          transition-colors text-sm 
                          ${settingPage === label.toLowerCase() ? "bg-neutral-200/80 text-neutral-900" : ""}
                        `}
                    >
                    <Icon size={18} weight="regular" />
                    {label}
                    </button>
                  ))}
                  </div>
                  <hr className="md:my-2 border-neutral-300" />
                  <button className="flex items-center gap-2 whitespace-nowrap text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200/70 px-3 py-2 rounded-lg transition-colors text-sm">
                  <UserCircleIcon size={18} weight="light" />
                  Account
                  </button>
                </div>


                {/* Azioni / contenuto */}
                <div className="flex flex-col justify-between flex-1">
                  {settingPage === "generale" && (<GeneralSettingPage />)}
                  {settingPage === "istruzioni" && (<InstructionsSettingPage />)}
                  {settingPage === "fatturazione" && (<BillingSettingPage />)}
                  <div className="flex justify-end">
                    <button
                      className="absolute top-3 right-3 text-neutral-400 hover:text-neutral-600 transition-colors"
                      onClick={() => setIsSettingOpen(false)}
                    >
                      <XIcon size={20} />
                    </button>
                  </div>
                </div>
              </motion.div>
            </AnimatePresence>
          </>

        )}
      </div>
    </ChatProvider>
  );
};

export default AppLayout;