// utils/convertLatexInMarkdown.js
import katex from "katex";
import "katex/dist/katex.min.css";

export  function convertLatexInMarkdown(text: string): string {
  if (!text) return "";

  let processed = text;

  processed = processed.replace(
    /\$\$([^$]+)\$\$/g,
    (match: any, formula: string) => {
      try {
        return katex.renderToString(formula, {
          throwOnError: false,
          displayMode: true,
        });
      } catch (err) {
        console.error("Errore KaTeX:", err);
        return match; // fallback originale
      }
    }
  );

  // 2️⃣ Inline $...$
  processed = processed.replace(
    /\$([^$]+)\$/g,
    (match: any, formula: string) => {
      try {
        return katex.renderToString(formula, {
          throwOnError: false,
          displayMode: false,
        });
      } catch (err) {
        console.error("Errore KaTeX inline:", err);
        return match;
      }
    }
  );

  return processed;
}
export function cleanLatexText(text: string): string {
  return text
    // Rimuove path SVG
    .replace(/([MmLlHhVvCcSsQqTtAaZz][^A-Za-z\n]*)/g, "")
    // Rimuove simboli di controllo Unicode o invisibili
    .replace(/[\u200B-\u200F\uFEFF]/g, "")
    // Rimuove lettere singole isolate tra spazi (es. " x " o " c ")
    .replace(/\s[a-zA-Z]\s/g, " ")
    // Normalizza spazi multipli
    .replace(/\s{2,}/g, " ")
    .trim();
}