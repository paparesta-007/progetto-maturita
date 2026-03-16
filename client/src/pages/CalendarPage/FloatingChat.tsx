import React from "react";
import { useCalendar } from "../../context/CalendarContext";

const FloatingChat=()=>{
    const {setIsFloatingChat}=useCalendar()
    return(
        <div className="fixed bottom-4 right-4 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg z-50">
            <h1 className="text-lg font-bold mb-2 text-gray-900 dark:text-gray-100">Chat</h1>
            <p className="text-sm text-gray-700 dark:text-gray-300">Questa è una chat flottante. Puoi posizionarla dove vuoi!</p>
            <input
                type="text"
                placeholder="Scrivi un messaggio..."
                className="mt-2 w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-700"
            />

            <button 
                onClick={() => setIsFloatingChat(false)}
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
                X
            </button>
        </div>
    )
}
export default FloatingChat;