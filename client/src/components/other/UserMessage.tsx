import { User } from "@phosphor-icons/react"; // Ho aggiunto un'icona User per coerenza
import React, { useEffect } from "react";
import { useAuth } from "../../context/AuthContext";
import Tooltip from "./Tooltip";
import selectUserDetails from "../../services/supabase/User/SelectuserDetails";

const UserMessage = ({ i, htmlContent }: { i: number, htmlContent: string }) => {
    const { user } = useAuth() || { user: { full_name: "Matteo Rossi", avatar_url: null } };
    const [userDetails, setUserDetails] = React.useState<{ full_name: string | null, avatar_url: string | null } | null>(null);
    useEffect(() => {
        const fetchDetails = async () => {
            const data=await selectUserDetails(user.id);
            setUserDetails(data);
        }
        fetchDetails();
    }, [])
    
    return (
        <div key={i} className="flex flex-row-reverse gap-3 items-start justify-start my-6">
            {/* Avatar a destra */}
            <div className="flex-shrink-0 rounded-full text-[10px] font-bold text-white bg-neutral-800 flex items-center justify-center w-8 h-8">
                {userDetails?.avatar_url ? (
                    <img src={userDetails.avatar_url} alt={userDetails.full_name || "User Avatar"} className="w-full h-full object-cover rounded-full" />
                ) : (
                    <span>{userDetails?.full_name ? userDetails.full_name.charAt(0).toUpperCase() : <User size={16} />}</span>
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