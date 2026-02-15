import { User } from "@phosphor-icons/react";
import React, { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import Tooltip from "./Tooltip";
import selectUserDetails from "../../services/supabase/User/SelectuserDetails";

const UserMessage = ({ i, htmlContent }: { i: number, htmlContent: string }) => {
    const { user, theme } = useAuth() || { user: { id: null }, theme: 'light' };
    const [userDetails, setUserDetails] = useState<{ full_name: string | null, avatar_url: string | null } | null>(null);
    const isDark = theme === 'dark';

    useEffect(() => {
        const fetchDetails = async () => {
            if (user?.id) {
                const data = await selectUserDetails(user.id);
                setUserDetails(data);
            }
        }
        fetchDetails();
    }, [user]);

    // Stili dinamici
    const styles = {
        avatarContainer: `flex-shrink-0 rounded-full text-[10px] font-bold flex items-center justify-center w-8 h-8 overflow-hidden ${
            isDark ? "bg-neutral-800 text-neutral-200 border border-neutral-700" : "bg-neutral-800 text-white"
        }`,
        messageBubble: `rounded-2xl rounded-tr-none px-4 py-2 border transition-colors ${
            isDark 
                ? "bg-neutral-900 border-neutral-800 text-neutral-200" 
                : "bg-white border-neutral-200 text-neutral-800"
        }`
    };

    return (
        <div key={i} className="flex flex-row-reverse gap-3 items-start justify-start my-6">
            {/* Avatar a destra */}
            <div className={styles.avatarContainer}>
                {userDetails?.avatar_url ? (
                    <img src={userDetails.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                    <span>{userDetails?.full_name ? userDetails.full_name.charAt(0).toUpperCase() : <User size={16} />}</span>
                )}
            </div>

            {/* Bolla del messaggio */}
            <div className="flex flex-col items-end max-w-[80%]">
                <div 
                    dangerouslySetInnerHTML={{ __html: htmlContent }} 
                    className={styles.messageBubble}
                />
                <Tooltip content="Number of input tokens used" position="right">
                    <span className="text-[10px] text-neutral-400 mt-1 mr-1 cursor-help">13 tokens</span>
                </Tooltip>
            </div>
        </div>
    );
};

export default UserMessage;