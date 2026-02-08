import { BrainIcon } from "@phosphor-icons/react";
import React from "react";

const BotMessage = ({i,htmlContent}: {i: number, htmlContent: string}) => {
    return (
        <div key={i} className="p-4 flex flex-row gap-3 items-start justify-start my-4">
            <div>
                <div className="rounded-full p-1 text-sm text-neutral-700  flex items-center justify-center w-8 h-8">
                    <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/1d/Google_Gemini_icon_2025.svg/1280px-Google_Gemini_icon_2025.svg.png" alt="Bot Avatar" className="w-full h-full object-cover rounded-full" />
                    {/* <BrainIcon size={28} weight="fill" className="bg-neutral-900 text-white rounded-full p-1" /> */}
                </div>
            </div>
            <span dangerouslySetInnerHTML={{ __html: htmlContent }} className="bg-[#fafafa] shadow-sm rounded-lg p-4"/>
        </div>
    )
}
export default BotMessage;