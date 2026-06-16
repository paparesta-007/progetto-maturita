import React, { useState, useEffect } from 'react';

const BotLoading = () => {
  const [time, setTime] = useState(0);

  useEffect(() => {
    const start = Date.now();
    const interval = setInterval(() => {
      const elapsed = Date.now() - start;
      setTime(elapsed / 1000);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 py-1">
      {/* Il pallino pulsante */}
      <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
      
      {/* Il testo pulsante */}
      <span className="text-sm font-medium text-neutral-500 animate-pulse">
        Elaborazione in corso... ({time.toFixed(1)}s)
      </span>
    </div>
  );
};

export default BotLoading;