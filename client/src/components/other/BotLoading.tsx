import React from 'react';

const BotLoading = () => {
  return (
    <div className="flex items-center gap-2 py-1">
      {/* Il pallino pulsante */}
      <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
      
      {/* Il testo pulsante */}
      <span className="text-sm font-medium text-neutral-500 animate-pulse">
        Elaborazione in corso...
      </span>
    </div>
  );
};

export default BotLoading;