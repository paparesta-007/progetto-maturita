"use strict";

document.addEventListener("DOMContentLoaded", function () {
    const playground = document.getElementById('playground');

    document.getElementById('generateText').addEventListener('click', async () => {
        playground.textContent = "Caricamento...";
        try {
            const res = await fetch('/api/gemini/generate?prompt=' + encodeURIComponent(document.getElementById('promptInput').value));
            const data = await res.json();
            playground.textContent = data.text || JSON.stringify(data, null, 2);
            const usage = data.usage;
            const totalTime = data.totaltime;
            showAdvancedUsage(usage, totalTime);
        } catch (err) {
            playground.textContent = "Errore: " + err.message;
        }
    });

    document.getElementById('generateQuiz').addEventListener('click', async () => {
        playground.textContent = "Caricamento...";
        try {
            const res = await fetch('/api/gemini/structured-output?prompt=' + encodeURIComponent(document.getElementById('promptInput').value));
            const data = await res.json();
            playground.textContent = JSON.stringify(data, null, 2);
            const usage = data.usage;
            const totalTime = data.totaltime;
            showAdvancedUsage(usage, totalTime);
        } catch (err) {
            playground.textContent = "Errore: " + err.message;
        }
    });


    document.getElementById('generateStream').addEventListener('click', async () => {
        document.getElementById('generateStream').disabled = true;
        playground.textContent = "";
        try {
            
            const res = await fetch('/api/gemini/stream?prompt=' + encodeURIComponent(document.getElementById('promptInput').value));
            const reader = res.body.getReader();
            const decoder = new TextDecoder();
            let buffer = "";

            // async function animateWords(text) {
            //     const words = text.split(/(\s+)/);
            //     for (const word of words) {
            //         playground.textContent += word;
            //         await new Promise(r => setTimeout(r, 20));
            //     }
            // }
            async function animateLetters(text) {
                for (const letter of text) {
                    playground.textContent += letter;
                    await new Promise(r => setTimeout(r, 1));
                }
            }
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buffer += decoder.decode(value);

                // split by newlines (NDJSON)
                let lines = buffer.split('\n');
                buffer = lines.pop(); // incomplete line left for next chunk

                for (const line of lines) {
                    if (!line.trim()) continue;
                    const obj = JSON.parse(line);

                    // Animate/display text chunks
                    if ('text' in obj && !('usage' in obj)) {
                        await animateLetters(obj.text);
                    }

                    // Show usage and stats at end
                    if ('usage' in obj || 'totalUsage' in obj) {
                        // obj.usage, obj.totalUsage, obj.steps, obj.finishReason, etc.
                        // Show usage/totals to user
                        console.log('Usage stats:', obj.time, obj.totalUsage);
                        showAdvancedUsage(obj.totalUsage, obj.time);
                    }
                }
            }
            document.getElementById('generateStream').disabled = false;
        } catch (error) {
            playground.textContent = "Errore: " + error.message;
            document.getElementById('generateStream').disabled = false;
        }
    });


    function showAdvancedUsage(usage, totalTime) {
        if (usage && totalTime) {
            console.log("Usage data:", usage);
            document.getElementById('totalTokens').textContent = usage.totalTokens;
            document.getElementById('inputTokens').textContent = usage.inputTokens;
            document.getElementById('outputTokens').textContent = usage.outputTokens;
            document.getElementById('totalTime').textContent = totalTime;
        }
    }
})