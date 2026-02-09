import { useState, useEffect } from 'react';

const BotLoading = () => {
  const [index, setIndex] = useState(0);
  const messages = [
    "Bot is typing...",
    "Crafting ideas...",
    "Thinking deeply...",
    "Gathering data..."
  ];

  useEffect(() => {
    // Cambia testo ogni 5000ms (5 secondi)
    const interval = setInterval(() => {
      setIndex((prevIndex) => (prevIndex + 1) % messages.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [messages.length]);

  return (
    <div className="flex items-center gap-2">
      {/* Il pallino pulsante */}
      <div className="w-2 h-2 opacity-0 rounded-full bg-neutral-500" />
      
      {/* Il testo pulsante */}
      <span className="text-neutral-400 animate-pulse transition-opacity duration-500">
        {messages[index]}
      </span>
    </div>
  );
};

export default BotLoading;