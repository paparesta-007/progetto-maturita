import React, { useState } from "react";

const Tooltip = ({
  content,
  position = 'top',
  children,
  background = 'light'
}: React.PropsWithChildren<{
  content: React.ReactNode;
  position?: 'top' | 'bottom' | 'left' | 'right' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  background?: 'dark' | 'light';
}>) => {
  const [isVisible, setIsVisible] = useState(false);

  // Configurazione posizioni e animazioni
  const positionConfig = {
    top: {
      classes: "bottom-full left-1/2 -translate-x-1/2 mb-2",
      animation: isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 translate-y-2 scale-95",
      arrow: "bottom-[-5px] left-1/2 -translate-x-1/2 border-b border-r"
    },
    bottom: {
      classes: "top-full left-1/2 -translate-x-1/2 mt-2",
      animation: isVisible ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-2 scale-95",
      arrow: "top-[-5px] left-1/2 -translate-x-1/2 border-t border-l"
    },
    left: {
      classes: "right-full top-1/2 -translate-y-1/2 mr-2",
      animation: isVisible ? "opacity-100 translate-x-0 scale-100" : "opacity-0 translate-x-2 scale-95",
      arrow: "right-[-5px] top-1/2 -translate-y-1/2 border-t border-r"
    },
    right: {
      classes: "left-full top-1/2 -translate-y-1/2 ml-2",
      animation: isVisible ? "opacity-100 translate-x-0 scale-100" : "opacity-0 -translate-x-2 scale-95",
      arrow: "left-[-5px] top-1/2 -translate-y-1/2 border-b border-l"
    },
    'top-left': {
      classes: "bottom-full right-full mb-1 mr-1",
      animation: isVisible ? "opacity-100 translate-x-0 translate-y-0 scale-100" : "opacity-0 translate-x-4 translate-y-4 scale-90"
    },
    'top-right': {
      classes: "bottom-full left-full mb-1 ml-1",
      animation: isVisible ? "opacity-100 translate-x-0 translate-y-0 scale-100" : "opacity-0 -translate-x-4 translate-y-4 scale-90"
    },
    'bottom-left': {
      classes: "top-full right-full mt-1 mr-1",
      animation: isVisible ? "opacity-100 translate-x-0 translate-y-0 scale-100" : "opacity-0 translate-x-4 -translate-y-4 scale-90"
    },
    'bottom-right': {
      classes: "top-full left-full mt-1 ml-1",
      animation: isVisible ? "opacity-100 translate-x-0 translate-y-0 scale-100" : "opacity-0 -translate-x-4 -translate-y-4 scale-90"
    }
  };

  const currentPos = positionConfig[position] || positionConfig.top;
  const isForcedDark = background === 'dark';

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
      onFocus={() => setIsVisible(true)}
      onBlur={() => setIsVisible(false)}
    >
      {children}
      
      <div
        className={`
          absolute z-50 px-3 py-2
          text-xs font-medium rounded-lg shadow-xl
          pointer-events-none min-w-max
          transition-all duration-300 ease-out transform
          ${currentPos.classes}
          ${currentPos.animation}
          
          /* Logica Colori: Default Light, supporta classe .dark o prop background="dark" */
          ${isForcedDark 
            ? 'bg-neutral-800 text-white border border-neutral-700' 
            : 'bg-white text-neutral-800 border border-neutral-200 dark:bg-neutral-800 dark:text-neutral-100 dark:border-neutral-700'
          }
        `}
      >
        <div className="leading-relaxed">
          {content}
        </div>

        {/* Freccia */}
        {!position.includes('-') && (
          <div className={`
            absolute w-2.5 h-2.5 transform rotate-45
            ${currentPos.arrow}
            
            /* Logica Colori Freccia */
            ${isForcedDark 
              ? 'bg-neutral-800 border-neutral-700' 
              : 'bg-white border-neutral-200 dark:bg-neutral-800 dark:border-neutral-700'
            }
          `} />
        )}
      </div>
    </div>
  );
};

export default Tooltip;