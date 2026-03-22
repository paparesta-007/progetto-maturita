/**
 * Unified Log Dashboard Functionality with AI Debug Assistant
 */

const logBody = document.getElementById('log-body');
const clientLogBody = document.getElementById('client-log-body');
const totalRequestsEl = document.getElementById('total-requests');
const successRateEl = document.getElementById('success-rate');
const avgLatencyEl = document.getElementById('avg-latency');
const errorCountEl = document.getElementById('error-count');
const refreshBtn = document.getElementById('refresh-btn');
const liveClockEl = document.getElementById('live-clock');

const searchInput = document.getElementById('search-input');
const autoRefreshCb = document.getElementById('auto-refresh-cb');
const exportJsonBtn = document.getElementById('export-json-btn');
const exportCsvBtn = document.getElementById('export-csv-btn');
const askAiInsightsBtn = document.getElementById('ask-ai-insights-btn');
const clearLogsBtn = document.getElementById('clear-logs-btn');

const aiAssistant = document.getElementById('ai-assistant');
const aiContent = document.getElementById('ai-content');
const closeAiBtn = document.getElementById('close-ai');

let allServerLogs = [];
let allClientLogs = [];
let isAiLoading = false;

/**
 * Fetch logs from the server
 */
async function fetchLogs() {
    try {
        const [serverRes, clientRes] = await Promise.all([
            fetch('/api/logs'),
            fetch('/api/client-logs')
        ]);
        
        if (serverRes.ok) {
            allServerLogs = await serverRes.json();
            renderServerLogs();
        }
        
        if (clientRes.ok) {
            allClientLogs = await clientRes.json();
            renderClientLogs();
        }
        
        updateStats(allServerLogs, allClientLogs);
    } catch (error) {
        console.error('Error fetching logs:', error);
    }
}

function getLevelColor(level) {
    switch (level) {
        case 'INFO': return 'var(--success-color)';
        case 'WARN': return '#eab308';
        case 'ERROR': return 'var(--error-color)';
        case 'CRITICAL': return '#7f1d1d';
        default: return 'var(--text-secondary)';
    }
}

function getMethodColor(method) {
    if (!method) return 'var(--method-default)';
    switch (method.toUpperCase()) {
        case 'GET': return 'var(--method-get)';
        case 'POST': return 'var(--method-post)';
        case 'PUT': return 'var(--method-put)';
        case 'DELETE': return 'var(--method-delete)';
        default: return 'var(--method-default)';
    }
}

function syntaxHighlight(json) {
    if (typeof json !== 'string') {
         json = JSON.stringify(json, undefined, 2);
    }
    json = json.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    return json.replace(/("(\\u[a-zA-Z0-9]{4}|\\[^u]|[^\\"])*"(\s*:)?|\b(true|false|null)\b|-?\d+(?:\.\d*)?(?:[eE][+\-]?\d+)?)/g, function (match) {
        let cls = 'json-number';
        if (/^"/.test(match)) {
            if (/:$/.test(match)) {
                cls = 'json-key';
            } else {
                cls = 'json-string';
            }
        } else if (/true|false/.test(match)) {
            cls = 'json-boolean';
        } else if (/null/.test(match)) {
            cls = 'json-null';
        }
        return '<span class="' + cls + '">' + match + '</span>';
    });
}

/**
 * Render Server Logs
 */
function renderServerLogs() {
    const methodCbs = Array.from(document.querySelectorAll('.method-cb:checked')).map(cb => cb.value.toUpperCase());
    const statusCbs = Array.from(document.querySelectorAll('.status-cb:checked')).map(cb => cb.value);
    const systemChecked = document.querySelector('.system-cb').checked;
    const searchQuery = searchInput ? searchInput.value.toLowerCase() : '';

    const filteredLogs = allServerLogs.map((log, originalIndex) => ({ ...log, originalIndex })).filter(log => {
        if (log.type === 'SYSTEM') {
            if (!systemChecked) return false;
        } else {
            const matchMethod = methodCbs.includes(log.method.toUpperCase());
            let matchStatus = false;
            const s = log.status || 0;
            if (s >= 200 && s < 300 && statusCbs.includes('2xx')) matchStatus = true;
            else if (s >= 400 && s < 500 && statusCbs.includes('4xx')) matchStatus = true;
            else if (s >= 500 && s < 600 && statusCbs.includes('5xx')) matchStatus = true;
            else if (s < 200 || s >= 600) matchStatus = true;
            if (!matchMethod || !matchStatus) return false;
        }

        if (searchQuery) {
            const searchable = `${log.url || ''} ${log.message || ''} ${log.clientIp || ''} ${log.requestId || ''} ${log.type || ''}`.toLowerCase();
            if (!searchable.includes(searchQuery)) return false;
        }
        
        return true;
    }).slice(0, 500); // Pagination / Limit

    logBody.innerHTML = filteredLogs.map((log) => {
        const isHttp = log.type === 'HTTP';
        const isError = isHttp ? log.error : (log.level === 'ERROR' || log.level === 'CRITICAL');
        
        return `
        <tr class="audit-row" data-index="${log.originalIndex}" onclick="toggleDetails(${log.originalIndex})">
            <td>
                <div class="txt-mono" style="font-size: 0.65rem; color: var(--text-secondary);">${log.date || ''}</div>
                <div class="txt-mono" style="font-size: 0.75rem;">${log.timestamp}</div>
            </td>
            <td>
                ${isHttp 
                    ? `<span class="method-badge" style="color: ${getMethodColor(log.method)}; border-color: ${getMethodColor(log.method)};">${log.method}</span>`
                    : `<span class="status-badge" style="background: rgba(255,255,255,0.05); color: ${getLevelColor(log.level)}; border-color: ${getLevelColor(log.level)}">${log.level}</span>`
                }
            </td>
            <td>
                <div class="url-text txt-mono" style="font-size: 0.75rem; word-break: break-all; color: ${isHttp ? 'var(--text-primary)' : getLevelColor(log.level)}">
                    ${isHttp ? log.url : log.message.split('\n')[0]}
                </div>
            </td>
            <td>
                ${isHttp ? `
                    <span class="status-badge ${log.error ? 'status-error' : 'status-success'}">
                        ${log.status}
                    </span>` : '-'
                }
            </td>
            <td><span class="txt-mono" style="color: var(--text-secondary);">${isHttp && log.durationMs !== undefined ? log.durationMs + 'ms' : '-'}</span></td>
            <td><span class="txt-mono" style="color: var(--text-primary); font-size: 0.65rem;">${isHttp ? (log.clientIp || '-') : 'INTERNAL'}</span></td>
            <td>
                ${isError ? `<div class="help-btn" onclick="askAIDebug(event, ${log.originalIndex})">?</div>` : ''}
            </td>
        </tr>
        <tr class="audit-details" id="details-${log.originalIndex}">
            <td colspan="7" style="padding: 0;">
                <div class="details-container">
                    ${isHttp ? `
                    <div style="width: 100%; display: flex; gap: 2rem; margin-bottom: 1.5rem; flex-wrap: wrap; background: #050505; border: 1px solid var(--border-color); padding: 0.75rem; border-radius: 0.5rem;">
                        <span class="txt-mono" style="color: var(--text-secondary); font-size: 0.70rem;">Req ID: <span style="color: var(--text-primary);">${log.requestId || '-'}</span></span>
                        <span class="txt-mono" style="color: var(--text-secondary); font-size: 0.70rem;">User Agent: <span style="color: var(--text-primary);">${log.userAgent || '-'}</span></span>
                    </div>
                    <div style="display: flex; gap: 2rem; width: 100%;">
                        ${log.params && Object.keys(log.params).length > 0 ? `
                        <div class="detail-section">
                            <h4>Request Payload</h4>
                            <pre class="params-well" style="max-width: none; width: 100%;">${syntaxHighlight(log.params)}</pre>
                        </div>` : ''}
                        ${log.response !== undefined ? `
                        <div class="detail-section">
                            <h4>Response Output</h4>
                            <pre class="params-well" style="max-width: none; width: 100%;">${syntaxHighlight(log.response)}</pre>
                        </div>` : ''}
                    </div>` : `
                    <div class="detail-section">
                        <h4>Full System Message</h4>
                        <pre class="params-well" style="max-width: none; width: 100%; white-space: pre-wrap;">${log.message}</pre>
                    </div>
                    `}
                </div>
            </td>
        </tr>
    `}).join('');
}

function renderClientLogs() {
    const searchQuery = searchInput ? searchInput.value.toLowerCase() : '';
    
    const filteredLogs = allClientLogs.map((log, originalIndex) => ({ ...log, originalIndex })).filter(log => {
        if (searchQuery) {
            const searchable = `${log.url || ''} ${log.message || ''} ${log.clientIp || ''} ${log.type || ''}`.toLowerCase();
            if (!searchable.includes(searchQuery)) return false;
        }
        return true;
    }).slice(0, 500);

    clientLogBody.innerHTML = filteredLogs.map((log) => {
        const dateObj = new Date(log.timestamp);
        const logDate = dateObj.toLocaleDateString('it-IT');
        const logTime = dateObj.toLocaleTimeString('it-IT', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        let typeClass = (log.type === 'CONSOLE_ERROR') ? 'status-console' : (log.type === 'VITE_BUILD_ERROR' ? 'status-vite' : 'status-error');

        return `
        <tr class="audit-row" data-index="${log.originalIndex}" onclick="toggleClientDetails(${log.originalIndex})">
            <td>
                <div class="txt-mono" style="font-size: 0.65rem; color: var(--text-secondary);">${logDate || ''}</div>
                <div class="txt-mono" style="font-size: 0.75rem;">${logTime}</div>
            </td>
            <td><span class="status-badge ${typeClass}">${log.type}</span></td>
            <td>
                <div class="url-text" style="font-size: 0.8rem; font-weight: 600; color: #ef4444;">${log.message.substring(0, 100)}${log.message.length > 100 ? '...' : ''}</div>
            </td>
            <td><div class="url-text txt-mono" style="font-size: 0.70rem; word-break: break-all;">${log.url}</div></td>
            <td><span class="txt-mono" style="color: var(--text-primary);">${log.clientIp || '-'}</span></td>
            <td><div class="help-btn" onclick="askAIClientDebug(event, ${log.originalIndex})">?</div></td>
        </tr>
        <tr class="audit-details" id="client-details-${log.originalIndex}">
            <td colspan="6" style="padding: 0;">
                <!-- Full details here as before -->
                <div class="details-container">
                    <pre class="params-well" style="max-width: none; width: 100%;">${log.message}\n\n${log.stack || ''}</pre>
                </div>
            </td>
        </tr>
    `}).join('');
}

window.toggleDetails = (index) => {
    const detailsRow = document.getElementById(`details-${index}`);
    if (detailsRow) detailsRow.classList.toggle('expanded');
};

window.toggleClientDetails = (index) => {
    const detailsRow = document.getElementById(`client-details-${index}`);
    if (detailsRow) detailsRow.classList.toggle('expanded');
};

/**
 * AI Debug Logic
 */
async function askAIDebug(event, index) {
    if (event) event.stopPropagation();
    if (isAiLoading) return;
    
    const log = allServerLogs[index];
    const context = log.type === 'HTTP' 
        ? `Richiesta ${log.method} su ${log.url} ha restituito status ${log.status}. Payload: ${JSON.stringify(log.params)}. Risposta: ${JSON.stringify(log.response)}`
        : `Errore di sistema: ${log.message}`;
    
    startAiAnalysis(context);
}

async function askAIClientDebug(event, index) {
    if (event) event.stopPropagation();
    if (isAiLoading) return;
    
    const log = allClientLogs[index];
    const context = `Errore Client (${log.type}) su ${log.url}. Messaggio: ${log.message}. Stack: ${log.stack}`;
    
    startAiAnalysis(context);
}

async function startAiAnalysis(errorContext, isInsight = false) {
    aiAssistant.classList.add('visible');
    aiContent.innerHTML = '<div id="ai-text"><h3>Analisi in corso...</h3></div>';
    const textTarget = document.getElementById('ai-text');
    isAiLoading = true;
    let fullContent = ""; // Spostato fuori per renderlo sicuro nel blocco finally

    const fullPrompt = isInsight 
    ? `Sei un DevOps senior responsabile della salute e sicurezza di un server. Analizza questo gruppo di log recenti (sia server che client).
Rispondi con una sintesi chiara della salute del sistema e individua eventuali problemi ricorrenti.

Struttura SEMPRE la tua risposta utilizzando esattamente questo formato Markdown:
### 📊 Status del Sistema
[Riassunto in 2-3 frasi della salute del server in base ai log forniti]

### 🚨 Anomalie/Pattern
[Elenca se ci sono stati timeout frequenti, errori client ricorrenti o comportamenti sospetti. Seleziona i 2 più gravi.]

### 💡 Consigli e Fix
[Azioni pratiche da intraprendere per migliorare la struttura o risolvere i problemi citati. Se non ci sono problemi gravi scrivi buone pratiche generali.]

Log aggregati da analizzare:
${errorContext}` 
    : `Sei un ingegnere software senior specializzato in debugging e analisi dei log. 
Il tuo compito è analizzare il seguente errore e fornire una diagnosi professionale, dritta al punto e azionabile. 

Struttura SEMPRE la tua risposta utilizzando esattamente questo formato Markdown:

### 🚨 TL;DR
[Una o due frasi massime che riassumono la causa principale dell'errore]

### 🔍 Analisi Dettagliata
[Spiegazione tecnica di cosa è andato storto basata sul log]

### 🛠️ Come Risolvere
[Passaggi chiari e codice per correggere il problema]

Log da analizzare:
${errorContext}`;

    try {
        const response = await fetch('/api/streamingOutput', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                message: fullPrompt, 
                history: [], 
                modelName: "openai/gpt-oss-20b:nitro",
                reasoning: false 
            })
        });

        if (!response.ok) throw new Error(`API Error: ${response.status}`);

        const reader = response.body.getReader();
        const decoder = new TextDecoder();

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value, { stream: true });
            const lines = chunk.split('\n');
            
            for (const line of lines) {
                if (!line.trim()) continue;
                try {
                    const data = JSON.parse(line);
                    if (data.type === 'text') {
                        fullContent += data.content;
                        // Rendering continuo con cursore
                        textTarget.innerHTML = marked.parse(fullContent) + '<span class="ai-cursor"></span>';
                        aiContent.scrollTop = aiContent.scrollHeight;
                    }
                } catch (e) { 
                    // Ignora i chunk parziali finché non sono completi
                }
            }
        }
    } catch (err) {
        fullContent = "Errore durante l'analisi AI: " + err.message;
        textTarget.innerHTML = fullContent;
    } finally {
        isAiLoading = false;
        // Rendering finale senza cursore per pulire la UI
        if (fullContent) {
            textTarget.innerHTML = marked.parse(fullContent); 
        }
    }
}

closeAiBtn.onclick = () => {
    aiAssistant.classList.remove('visible');
};

function updateStats(serverLogs, clientLogs) {
    const httpLogs = serverLogs.filter(l => l.type === 'HTTP');
    const total = httpLogs.length;
    let totalLatency = 0;
    let latencyCount = 0;
    httpLogs.forEach(l => {
        if (l.durationMs !== undefined) {
            totalLatency += l.durationMs;
            latencyCount++;
        }
    });
    const avgLatency = latencyCount > 0 ? (totalLatency / latencyCount).toFixed(0) : 0;
    
    const httpErrors = httpLogs.filter(l => l.error).length;
    const clientErrors = clientLogs.length;
    const successRate = total > 0 ? (((total - httpErrors) / total) * 100).toFixed(1) : 0;
    
    totalRequestsEl.textContent = total;
    successRateEl.textContent = `${successRate}%`;
    avgLatencyEl.textContent = `${avgLatency}ms`;
    errorCountEl.textContent = httpErrors + clientErrors;
}

// Event Listeners
refreshBtn.addEventListener('click', () => {
    refreshBtn.disabled = true;
    fetchLogs().finally(() => setTimeout(() => refreshBtn.disabled = false, 500));
});

document.querySelectorAll('.filter-cb').forEach(cb => cb.addEventListener('change', renderServerLogs));

if (searchInput) {
    searchInput.addEventListener('input', () => {
        renderServerLogs();
        renderClientLogs();
    });
}

function downloadFile(dataStr, filename) {
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", filename);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
}

if (exportJsonBtn) {
    exportJsonBtn.addEventListener('click', () => {
        const data = { serverLogs: allServerLogs, clientLogs: allClientLogs };
        const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
        downloadFile(dataStr, `audit_logs_${new Date().toISOString()}.json`);
    });
}

if (exportCsvBtn) {
    exportCsvBtn.addEventListener('click', () => {
        let csvContent = "data:text/csv;charset=utf-8,Type,Timestamp,Method,Status,DurationMs,URL,ClientIP,Message\n";
        allServerLogs.forEach(log => {
            const row = [
                log.type || '',
                log.timestamp || '',
                log.method || '',
                log.status || '',
                log.durationMs !== undefined ? log.durationMs : '',
                log.url || '',
                log.clientIp || '',
                `"${(log.message || '').replace(/"/g, '""')}"`
            ].join(',');
            csvContent += row + "\n";
        });
        downloadFile(csvContent, `server_audit_logs_${new Date().toISOString()}.csv`);
    });
}

let refreshIntervalTimer;

function setupAutoRefresh() {
    if (refreshIntervalTimer) clearInterval(refreshIntervalTimer);
    if (autoRefreshCb && autoRefreshCb.checked) {
        refreshIntervalTimer = setInterval(fetchLogs, 5000);
    }
}

if (autoRefreshCb) {
    autoRefreshCb.addEventListener('change', setupAutoRefresh);
}

if (clearLogsBtn) {
    clearLogsBtn.addEventListener('click', async () => {
        if (!confirm('Sei sicuro di voler ripulire tutti i log di server e client da questa sessione?')) return;
        try {
            const res = await fetch('/api/logs', { method: 'DELETE' });
            if (res.ok) {
                allServerLogs = [];
                allClientLogs = [];
                renderServerLogs();
                renderClientLogs();
                updateStats([], []);
            }
        } catch (err) {
            console.error('Error clearing logs', err);
        }
    });
}

if (askAiInsightsBtn) {
    askAiInsightsBtn.addEventListener('click', () => {
        if (isAiLoading) return;
        
        const methodCbs = Array.from(document.querySelectorAll('.method-cb:checked')).map(cb => cb.value.toUpperCase());
        const statusCbs = Array.from(document.querySelectorAll('.status-cb:checked')).map(cb => cb.value);
        const systemChecked = document.querySelector('.system-cb').checked;
        const searchQuery = searchInput ? searchInput.value.toLowerCase() : '';

        const filteredServerLogs = allServerLogs.filter(log => {
            if (log.type === 'SYSTEM') {
                if (!systemChecked) return false;
            } else {
                const matchMethod = methodCbs.includes(log.method.toUpperCase());
                let matchStatus = false;
                const s = log.status || 0;
                if (s >= 200 && s < 300 && statusCbs.includes('2xx')) matchStatus = true;
                else if (s >= 400 && s < 500 && statusCbs.includes('4xx')) matchStatus = true;
                else if (s >= 500 && s < 600 && statusCbs.includes('5xx')) matchStatus = true;
                else if (s < 200 || s >= 600) matchStatus = true;
                if (!matchMethod || !matchStatus) return false;
            }
            if (searchQuery) {
                const searchable = `${log.url || ''} ${log.message || ''} ${log.clientIp || ''} ${log.type || ''}`.toLowerCase();
                if (!searchable.includes(searchQuery)) return false;
            }
            return true;
        });

        const recentServerLogs = filteredServerLogs.slice(0, 30).map(l => `[SERVER] ${l.type} - ${l.method || ''} ${l.url || l.message} (Stato: ${l.status || '-'}, Latenza: ${l.durationMs || '-'}ms)`);
        
        const filteredClientLogs = allClientLogs.filter(log => {
            if (searchQuery) {
                const searchable = `${log.url || ''} ${log.message || ''} ${log.clientIp || ''} ${log.type || ''}`.toLowerCase();
                if (!searchable.includes(searchQuery)) return false;
            }
            return true;
        });
        const recentClientLogs = filteredClientLogs.slice(0, 20).map(l => `[CLIENT] ${l.type} - ${l.message} su ${l.url}`);
        
        const contextLines = [...recentServerLogs, ...recentClientLogs];
        
        if (contextLines.length === 0) {
            alert("Nessun log disponibile per l'analisi. Riduci i filtri o attendi nuovi log.");
            return;
        }

        const context = `Ecco gli ultimi log registrati nel sistema:\n\n${contextLines.join('\n')}`;
        
        startAiAnalysis(context, true);
    });
}

function updateClock() {
    const now = new Date();
    liveClockEl.textContent = now.toLocaleString('it-IT', { 
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' 
    });
}

fetchLogs();
updateClock();
setInterval(updateClock, 1000);
setupAutoRefresh();
