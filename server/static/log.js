/**
 * Unified Log Dashboard Functionality with AI Debug Assistant
 */

const logBody = document.getElementById('log-body');
const clientLogBody = document.getElementById('client-log-body');
const totalRequestsEl = document.getElementById('total-requests');
const successRateEl = document.getElementById('success-rate');
const errorCountEl = document.getElementById('error-count');
const refreshBtn = document.getElementById('refresh-btn');
const liveClockEl = document.getElementById('live-clock');

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

    const filteredLogs = allServerLogs.filter(log => {
        if (log.type === 'SYSTEM') return systemChecked;
        const matchMethod = methodCbs.includes(log.method.toUpperCase());
        let matchStatus = false;
        const s = log.status || 0;
        if (s >= 200 && s < 300 && statusCbs.includes('2xx')) matchStatus = true;
        else if (s >= 400 && s < 500 && statusCbs.includes('4xx')) matchStatus = true;
        else if (s >= 500 && s < 600 && statusCbs.includes('5xx')) matchStatus = true;
        else if (s < 200 || s >= 600) matchStatus = true;
        return matchMethod && matchStatus;
    });

    logBody.innerHTML = filteredLogs.map((log, index) => {
        const isHttp = log.type === 'HTTP';
        const isError = isHttp ? log.error : (log.level === 'ERROR' || log.level === 'CRITICAL');
        
        return `
        <tr class="audit-row" data-index="${index}" onclick="toggleDetails(${index})">
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
                ${isError ? `<div class="help-btn" onclick="askAIDebug(event, ${index})">?</div>` : ''}
            </td>
        </tr>
        <tr class="audit-details" id="details-${index}">
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
    clientLogBody.innerHTML = allClientLogs.map((log, index) => {
        const dateObj = new Date(log.timestamp);
        const logDate = dateObj.toLocaleDateString('it-IT');
        const logTime = dateObj.toLocaleTimeString('it-IT', { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' });
        let typeClass = (log.type === 'CONSOLE_ERROR') ? 'status-console' : (log.type === 'VITE_BUILD_ERROR' ? 'status-vite' : 'status-error');

        return `
        <tr class="audit-row" data-index="${index}" onclick="toggleClientDetails(${index})">
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
            <td><div class="help-btn" onclick="askAIClientDebug(event, ${index})">?</div></td>
        </tr>
        <tr class="audit-details" id="client-details-${index}">
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

async function startAiAnalysis(errorContext) {
    aiAssistant.classList.add('visible');
    aiContent.innerHTML = '<div id="ai-text"><h3>Analisi in corso...</h3></div>';
    const textTarget = document.getElementById('ai-text');
    let isAiLoading = true;
    let fullContent = ""; // Spostato fuori per renderlo sicuro nel blocco finally

    const fullPrompt = `Sei un ingegnere software senior specializzato in debugging e analisi dei log. 
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
    const httpErrors = httpLogs.filter(l => l.error).length;
    const clientErrors = clientLogs.length;
    const successRate = total > 0 ? (((total - httpErrors) / total) * 100).toFixed(1) : 0;
    totalRequestsEl.textContent = total;
    successRateEl.textContent = `${successRate}%`;
    errorCountEl.textContent = httpErrors + clientErrors;
}

// Event Listeners
refreshBtn.addEventListener('click', () => {
    refreshBtn.disabled = true;
    fetchLogs().finally(() => setTimeout(() => refreshBtn.disabled = false, 500));
});

document.querySelectorAll('.filter-cb').forEach(cb => cb.addEventListener('change', renderServerLogs));

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
setInterval(fetchLogs, 5000);
