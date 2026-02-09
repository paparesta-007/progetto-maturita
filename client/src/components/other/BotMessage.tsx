
import React from "react";
import Tooltip from "./Tooltip";

const BotMessage = ({ i, children, usage }: { i: number; children: React.ReactNode; usage?: any }) => {
    return (
        <div key={i} className="p-4 flex flex-row gap-3 items-start justify-start my-4">
            <div className="flex-shrink-0">
                <div className="rounded-full flex items-center justify-center w-8 h-8 overflow-hidden">
                    <img
                        src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Google_Gemini_icon_2025.svg/1280px-Google_Gemini_icon_2025.svg.png"
                        alt="Bot Avatar"
                        className="w-full h-full object-cover"
                    />
                </div>
            </div>
            {/* Rimuoviamo dangerouslySetInnerHTML da qui e usiamo children */}
            <div className="">
                <div className="bg-[#fafafa] shadow-sm rounded-lg p-4 flex-1 renderChat">
                    {children}
                </div>
                <div className="text-xs text-neutral-400 mt-1">
                    <Tooltip content={
                        <div className="text-left">
                        <b className="block text-neutral-900">Tokens used:</b>
                        <span className="text-neutral-500 font-normal">Total: {usage?.totalTokens || 0}</span>
                        <br />
                        <span className="text-neutral-500 font-normal">Reasoning tokens: {usage?.reasoningTokens || 0}</span>
                    </div>}>
                    {usage ? `${usage.totalTokens} tokens` : "IA response"}</Tooltip>
                </div>
            </div>

        </div>
    );
};
export default BotMessage;