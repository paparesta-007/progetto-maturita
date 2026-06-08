import express from "express";
import { embed, embedMany } from "ai";
import { createOpenAI } from "@ai-sdk/openai";
import { normalizeText, splitTextIntoChunks, validateChunks } from "../utils/textProcessing.js";
import { PDFParse } from "pdf-parse";
import { supabase } from "../services/supabase.js";
import { logSupabaseAction } from "../middleware/logging.js";
import { OPENROUTER_KEY } from "../config/enviroments.js";
import { requireAuth } from "../middleware/auth.js";
import crypto from "crypto";
import multer from 'multer';

const upload = multer({ storage: multer.memoryStorage() });
const router = express.Router();

// ────────────────────────────────────────────────────────────────
// CONFIGURATION
// ────────────────────────────────────────────────────────────────

const openrouterEmbeddings = createOpenAI({
    apiKey: OPENROUTER_KEY,
    baseURL: "https://openrouter.ai/api/v1",
});

// ────────────────────────────────────────────────────────────────
// INGESTION LOGIC
// ────────────────────────────────────────────────────────────────

/**
 * Gestisce l'ingestione di un file PDF: estrazione testo, chunking, embedding e salvataggio su Supabase.
 */
router.post("/ingest", requireAuth, upload.single('file'), async (req: express.Request, res: express.Response) => {
    res.setHeader("Content-Type", "application/x-ndjson");
    res.setHeader("Transfer-Encoding", "chunked");

    const sendLog = (msg: string) => {
        console.log(msg);
        res.write(JSON.stringify({ type: "log", content: msg }) + "\n");
    };

    try {
        sendLog("📂 [1/6] Ricevuta richiesta ingestione...");

        if (!req.file) throw new Error("Nessun file caricato");

        const { user_id, category, title } = req.body;
        if (!user_id) throw new Error("User ID mancante");

        sendLog(`👤 [2/6] Utente: ${user_id}, File: ${req.file.originalname}`);
        let text = "";
        let parser = null;
        try {
            const dataBuffer = req.file.buffer;
            parser = new PDFParse({ data: dataBuffer });
            // Usiamo pageJoiner per inserire i marker di pagina nel testo estratto
            const result = await parser.getText({
                pageJoiner: '[[PAGE_BREAK:page_number]]'
            });
            text = result.text;
        } catch (pdfError: any) {
            console.error("❌ Errore durante il parsing del PDF:", pdfError);
            throw new Error("Il file PDF è corrotto o illegibile.");
        } finally {
            if (parser) {
                await parser.destroy();
            }
        }

        sendLog(`📄 [3/6] Testo estratto: ${text.length} caratteri`);

        text = normalizeText(text);
        sendLog(`🧹 [3/6] Testo normalizzato e pulito`);

        const chunks = splitTextIntoChunks(text, 1500, 300, {
            respectSentences: true,
            respectParagraphs: true,
            minChunkSize: 100
        });
        const date = new Date().toISOString();
        const validation = validateChunks(chunks);
        if (!validation.isValid) {
            console.warn("⚠️  Detected gaps in chunks:", validation.gaps);
        }

        sendLog(`🧩 [4/6] Generati ${chunks.length} frammenti di testo`);
        if (chunks.length === 0) throw new Error("Nessun testo estraibile dal PDF");

        sendLog("🤖 [5/6] Richiesta embedding a OpenRouter (modello small)...");

        const filename = req.file?.originalname || 'sconosciuto';
        const { embeddings } = await embedMany({
            model: openrouterEmbeddings.embedding("openai/text-embedding-3-small"),
            values: chunks.map(chunk => {
                const heading = chunk.metadata.sectionHeading ? ` | Sezione: ${chunk.metadata.sectionHeading}` : '';
                return `[Documento: ${filename}${heading}] ${chunk.content}`;
            }),
        });

        sendLog(`✨ [5/6] Ricevuti ${embeddings.length} vettori con successo`);
        const docId = crypto.randomUUID();
        
        const documentsToInsert = chunks.map((chunkData) => ({
            user_id: user_id,
            content: chunkData.content,
            embedding: embeddings[chunkData.metadata.order],
            metadata: {
                ...chunkData.metadata,
                source: req.file?.originalname,
                title: title,
                category: category,
                document_id: docId
            },
            document_id: docId,
            created_at: date
        }));

        sendLog("💾 [6/6] Salvataggio dei vettori nel database...");
        logSupabaseAction("insert_documents_chunks", user_id);
        const { error } = await supabase
            .from('documents')
            .insert(documentsToInsert);

        if (error) {
            console.error("❌ Errore Supabase:", JSON.stringify(error, null, 2));
            throw new Error(`Errore DB: ${error.message}`);
        }

        sendLog("✅ [6/6] Ingestione completata con successo!");

        res.write(JSON.stringify({
            type: "result",
            success: true,
            message: `Processati ${chunks.length} frammenti`,
            filename: req.file.originalname,
            documentId: docId
        }) + "\n");
        res.end();

    } catch (error: any) {
        console.error("❌ ERRORE CRITICO NELLA ROTTA INGEST:", error);
        res.write(JSON.stringify({
            type: "error",
            success: false,
            error: error.message || "Errore sconosciuto durante l'ingestione"
        }) + "\n");
        res.end();
    }
});

// ────────────────────────────────────────────────────────────────
// ASK PDF LOGIC (RAG)
// ────────────────────────────────────────────────────────────────

/**
 * Esegue una query RAG su un documento PDF precedentemente ingerito.
 */
router.post("/ask-pdf", requireAuth, async (req: express.Request, res: express.Response) => {
    res.setHeader("Content-Type", "application/x-ndjson");
    res.setHeader("Transfer-Encoding", "chunked");

    const sendLog = (msg: string) => {
        console.log(msg);
        res.write(JSON.stringify({ type: "log", content: msg }) + "\n");
    };

    try {
        const { question, model, user_id, document_id, reasoning, attachedFiles } = req.body;
        const reasoningEffortMap: Record<string, string> = {
            fast: "minimal",
            standard: "medium",
            accurate: "high"
        };
        const reasoningEffort = reasoning ? reasoningEffortMap[reasoning] || "medium" : "medium";
        
        const startTime = Date.now();
        let stepTime = startTime;

        sendLog(`\n📥 [Fase 1/8] Nuova richiesta /ask-pdf ricevuta.`);
        sendLog(`🔍 Dettagli: Domanda="${question}", Documento=${document_id}, Utente=${user_id}`);

        sendLog("🧠 [Fase 2/8] Generazione dell'embedding per la domanda in corso...");
        const { embedding } = await embed({
            model: openrouterEmbeddings.embedding("openai/text-embedding-3-small"),
            value: `Ricerca nel documento: ${question}`,
        });

        let now = Date.now();
        sendLog(`✅ [Fase 2/8] Embedding generato con successo. (+${now - stepTime}ms)`);
        stepTime = now;

        sendLog("🔎 [Fase 3/8] Ricerca dei chunk semantici su Supabase in corso...");
        logSupabaseAction("rpc_match_documents", user_id);
        const { data: chunks, error } = await supabase
            .rpc('match_documents', {
                query_embedding: embedding,
                match_threshold: 0.5,
                match_count: 8,
                filter_user_id: user_id,
                selected_id: document_id
            });

        if (error) {
            console.error("❌ [Errore Fase 3] Errore ricerca Supabase:", error);
            throw new Error("Errore durante la ricerca nel DB");
        }

        now = Date.now();
        sendLog(`✅ [Fase 3/8] Ricerca completata. Trovati ${chunks?.length || 0} chunk pertinenti. (+${now - stepTime}ms)`);
        stepTime = now;

        if (!chunks || chunks.length === 0) {
            sendLog("⚠️ [Attenzione] Nessun chunk trovato. Interrompo e rispondo al client.");
            res.write(JSON.stringify({
                type: "result",
                answer: "Mi dispiace, non ho trovato informazioni pertinenti nei documenti caricati.",
                sources: [],
                suggested_questions: []
            }) + "\n");
            return res.end();
        }

        sendLog("📄 [Fase 4/8] Costruzione del contesto dai chunk estratti...");
        const contextText = chunks
            .map((chunk: any, index: number) => {
                const section = chunk.metadata?.sectionHeading ? `[Sezione: ${chunk.metadata.sectionHeading}]` : '';
                return `--- [FONTE #${index + 1}] ${chunk.metadata.source} ${section} ---\n${chunk.content}`;
            })
            .join("\n\n");

        now = Date.now();
        sendLog(`✅ [Fase 4/8] Contesto creato (Lunghezza: ${contextText.length} caratteri). (+${now - stepTime}ms)`);
        stepTime = now;

        const staticSystemPrompt = `
        Sei un esperto Analista di Documenti. Il tuo compito è rispondere alle domande dell'utente basandoti ESCLUSIVAMENTE sul CONTESTO fornito qui sotto.
        Il contesto è diviso in blocchi numerati come [FONTE #1], [FONTE #2], ecc.

        ### REGOLE RIGIDE DI RISPOSTA:
        1.  **Fedeltà al Testo**: Rispondi solo utilizzando le informazioni presenti nel CONTESTO. Se la risposta non è contenuta nel testo, dichiara esplicitamente: "Mi dispiace, ma le informazioni fornite nei documenti non mi permettono di rispondere a questa domanda." Non utilizzare conoscenze esterne.
        2.  **Formattazione Markdown**: Usa titolazioni (###), elenchi puntati e grassetti per rendere la risposta professionale e facile da leggere.
        3.  **Formule Matematiche**: Ogni formula, simbolo matematico o equazione DEVE essere scritta in LaTeX utilizzando il delimitatore "$$" per i blocchi (es. $$E = mc^2$$) o "$" per le formule in linea (es. $x = 2$).
        4.  **Lingua**: Rispondi sempre nella lingua della domanda dell'utente (predefinito: Italiano).
        5.  **Attribuzione Rigorosa**: Alla fine della tua risposta, DEVI aggiungere una riga speciale con questo formato esatto: [[FONTI: 1, 2]] elencando i numeri delle fonti che hai EFFETTIVAMENTE utilizzato per generare la risposta. 
        6.  **Niente Allucinazioni di Fonti**: NON citare fonti che non contengono informazioni utili alla risposta. Se non usi alcuna fonte, scrivi [[FONTI: nessuna]].
        7.  **In-text Citations**: Quando possibile, usa i numeri delle fonti nel testo, ad esempio: "Secondo il documento [1], la variabile x è..."
        `;

        const selectedModel = model || "google/gemini-2.5-flash-lite";

        let userContent: any = question;
        if (attachedFiles && attachedFiles.length > 0) {
            userContent = [{ type: "text", text: question || "Immagine in allegato" }];
            attachedFiles.forEach((f: any) => {
                if (f.type === "image_url") {
                    userContent.push({
                        type: "image_url",
                        image_url: { url: f.url }
                    });
                }
            });
        }

        sendLog(`🤖 [Fase 5/8] Chiamata a OpenRouter (Modello: ${selectedModel}) per la risposta principale... effort: ${reasoningEffort}`);
        const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${OPENROUTER_KEY}`,
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:3000/ask-pdf",
                "X-Title": "NomeTuaApp",
                "X-OpenRouter-Cache": "true" 
            },
            body: JSON.stringify({
                model: selectedModel,
                messages: [
                    { 
                        role: 'system', 
                        content: [
                            {
                                type: "text",
                                text: staticSystemPrompt,
                            },
                            {
                                type: "text",
                                text: `\n\n### CONTESTO:\n${contextText}` 
                            }
                        ] 
                    },
                    { role: 'user', content: userContent }
                ],
                stream: true,
                reasoning: { effort: reasoningEffort },
                provider: { allow_fallbacks: false }
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error(`❌ [Errore Fase 5] OpenRouter API Error: ${response.status} - ${errorText}`);
            throw new Error(`OpenRouter API Error: ${response.status} - ${errorText}`);
        }

        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        let fullAnswer = "";

        if (reader) {
            while (true) {
                const { done, value } = await reader.read();
                if (done) break;

                const chunk = decoder.decode(value);
                const lines = chunk.split("\n").filter(line => line.trim() !== "");

                for (const line of lines) {
                    if (line.startsWith("data: ")) {
                        const dataStr = line.slice(6);
                        if (dataStr === "[DONE]") break;

                        try {
                            const parsed = JSON.parse(dataStr);
                            const content = parsed.choices[0]?.delta?.content || "";
                            if (content) {
                                fullAnswer += content;
                                res.write(JSON.stringify({ type: "chunk", content }) + "\n");
                            }
                        } catch (e) {
                            // Ignora errori di parsing su chunk parziali
                        }
                    }
                }
            }
        }

        now = Date.now();
        sendLog(`✅ [Fase 6/8] Streaming completato. (+${now - stepTime}ms)`);
        stepTime = now;

        sendLog("🧹 [Fase 8/8] Invio della risposta finale con fonti filtrate al client...");
        
        // Estraiamo le fonti usate dal testo della risposta
        const sourcesMatch = fullAnswer.match(/\[\[FONTI:\s*(.+?)\]\]/);
        let usedIndices: number[] = [];
        let cleanedAnswer = fullAnswer;

        if (sourcesMatch) {
            const sourcesStr = sourcesMatch[1];
            if (sourcesStr.toLowerCase() !== "nessuna") {
                usedIndices = sourcesStr.split(',').map((s: string) => parseInt(s.trim())).filter((n: number) => !isNaN(n));
            }
            // Rimuoviamo il tag delle fonti dalla risposta visibile all'utente
            cleanedAnswer = fullAnswer.replace(/\[\[FONTI:\s*(.+?)\]\]/, "").trim();
        }

        // Mappiamo i chunk in oggetti fonte strutturati, filtrando se abbiamo gli indici
        const detailedSources = chunks
            .map((c: any, index: number) => ({
                id: index + 1,
                content: c.content,
                page: c.metadata?.page || 1,
                source: c.metadata?.source || "Documento"
            }))
            .filter((source: any) => {
                if (usedIndices.length > 0) {
                    return usedIndices.includes(source.id);
                }
                return false; // Cambiato da true a false per essere più rigorosi se non troviamo indici ma avevamo il tag
            });

        // Se non abbiamo trovato indici ma abbiamo chunk, e non c'era il tag [[FONTI: nessuna]]
        // proviamo a vedere se il modello ha usato i numeri delle fonti nel testo [1], [2]
        if (detailedSources.length === 0 && usedIndices.length === 0 && !fullAnswer.includes("[[FONTI: nessuna]]")) {
            chunks.forEach((c: any, index: number) => {
                const sourceNum = index + 1;
                if (fullAnswer.includes(`[FONTE #${sourceNum}]`) || fullAnswer.includes(`[${sourceNum}]`)) {
                    detailedSources.push({
                        id: sourceNum,
                        content: c.content,
                        page: c.metadata?.page || 1,
                        source: c.metadata?.source || "Documento"
                    });
                }
            });
        }

        res.write(JSON.stringify({
            type: "result",
            answer: cleanedAnswer,
            sources: detailedSources,
        }) + "\n");

        now = Date.now();
        sendLog(`🎉 [Successo] Risposta inviata al client correttamente! (+${now - stepTime}ms)`);
        sendLog(`⏱️  [METRICHE] Tempo Totale /ask-pdf: ${now - startTime}ms\n`);
        res.end();

    } catch (error: any) {
        console.error("\n❌ [ERRORE CRITICO] Errore non gestito in /ask-pdf:");
        console.error(error);
        res.write(JSON.stringify({ type: "error", error: error.message }) + "\n");
        res.end();
    }
});

export default router;
