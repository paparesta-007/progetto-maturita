import { User } from "@phosphor-icons/react"; // Ho aggiunto un'icona User per coerenza
import React from "react";
import { useAuth } from "../../context/AuthContext";
import Tooltip from "./Tooltip";

const UserMessage = ({ i, htmlContent }: { i: number, htmlContent: string }) => {
    const { user } = useAuth() || { user: { displayName: "Matteo Rossi", photoURL: null } };
    
    return (
        <div key={i} className="flex flex-row-reverse gap-3 items-start justify-start my-6">
            {/* Avatar a destra */}
            <div className="flex-shrink-0 rounded-full text-[10px] font-bold text-white bg-neutral-800 flex items-center justify-center w-8 h-8">
                {user?.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || "User Avatar"} className="w-full h-full object-cover rounded-full" />
                ) : (
                    <span>{user?.displayName ? user.displayName.charAt(0).toUpperCase() : <User size={16} />}</span>
                )}
            </div>

            {/* Bolla del messaggio a destra */}
            <div className="flex flex-col items-end max-w-[80%]">
                <div 
                    dangerouslySetInnerHTML={{ __html: htmlContent }} 
                    className="text-neutral-800 rounded-2xl rounded-tr-none px-4 py-2 border border-neutral-200 "
                />
                <Tooltip content="Number of input tokens used" position="right">
                    <span className="text-[10px] text-neutral-400 mt-1 mr-1 cursor-help">13 tokens</span>
                </Tooltip>
            </div>
        </div>
    );
};

export default UserMessage;