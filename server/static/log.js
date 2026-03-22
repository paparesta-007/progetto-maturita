/**
 * Log Dashboard Functionality
 */

const logBody = document.getElementById('log-body');
const totalRequestsEl = document.getElementById('total-requests');
const successRateEl = document.getElementById('success-rate');
const errorCountEl = document.getElementById('error-count');
const refreshBtn = document.getElementById('refresh-btn');
const liveClockEl = document.getElementById('live-clock');

let allLogs = [];

/**
 * Fetch logs from the server
 */
async function fetchLogs() {
    try {
        const response = await fetch('/api/logs');
        if (!response.ok) throw new Error('Failed to fetch logs');
        
        const logs = await response.json();
        allLogs = logs;
        renderLogs();
        updateStats(logs);
    } catch (error) {
        console.error('Error fetching logs:', error);
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
 * Render logs into the table
 */
function renderLogs() {
    // Get filter values
    const methodCbs = Array.from(document.querySelectorAll('.method-cb:checked')).map(cb => cb.value.toUpperCase());
    const statusCbs = Array.from(document.querySelectorAll('.status-cb:checked')).map(cb => cb.value);

    // Filter logs
    const filteredLogs = allLogs.filter(log => {
        // Method filter
        const matchMethod = methodCbs.includes(log.method.toUpperCase());

        // Status filter
        let matchStatus = false;
        const s = log.status || 0;
        if (s >= 200 && s < 300 && statusCbs.includes('2xx')) matchStatus = true;
        else if (s >= 400 && s < 500 && statusCbs.includes('4xx')) matchStatus = true;
        else if (s >= 500 && s < 600 && statusCbs.includes('5xx')) matchStatus = true;
        else if (s < 200 || s >= 600) matchStatus = true; // Fallback for weird statuses if unchecked

        return matchMethod && matchStatus;
    });

    if (!filteredLogs || filteredLogs.length === 0) {
        logBody.innerHTML = '<tr><td colspan="5" style="text-align: center; padding: 3rem; color: var(--text-secondary);">No logs match the current filters.</td></tr>';
        return;
    }

    logBody.innerHTML = filteredLogs.map((log, index) => `
        <tr class="audit-row" data-index="${index}" onclick="toggleDetails(${index})">
            <td>
                <div class="txt-mono" style="font-size: 0.65rem; color: var(--text-secondary);">${log.date || ''}</div>
                <div class="txt-mono" style="font-size: 0.75rem;">${log.timestamp}</div>
            </td>
            <td><span class="method-badge" style="color: ${getMethodColor(log.method)}; border-color: ${getMethodColor(log.method)};">${log.method}</span></td>
            <td><div class="url-text txt-mono" style="font-size: 0.75rem; word-break: break-all;">${log.url}</div></td>
            <td>
                <span class="status-badge ${log.error ? 'status-error' : 'status-success'}">
                    ${log.status}
                </span>
            </td>
            <td><span class="txt-mono" style="color: var(--text-secondary);">${log.durationMs !== undefined ? log.durationMs + 'ms' : '-'}</span></td>
            <td><span class="txt-mono" style="color: var(--text-primary);">${log.clientIp || '-'}</span></td>
        </tr>
        <tr class="audit-details" id="details-${index}">
            <td colspan="6" style="padding: 0;">
                <div class="details-container">
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
                        
                        ${(!log.params || Object.keys(log.params).length === 0) && log.response === undefined ? `
                         <div class="detail-section"><span class="txt-mono" style="color: var(--text-secondary); font-size: 0.75rem;">No payload or response recorded.</span></div>
                        ` : ''}
                    </div>
                </div>
            </td>
        </tr>
    `).join('');
}

window.toggleDetails = function(index) {
    const detailsRow = document.getElementById(`details-${index}`);
    if (detailsRow) {
        detailsRow.classList.toggle('expanded');
    }
};

/**
 * Update dashboard statistics
 */
function updateStats(logs) {
    const total = logs.length;
    const errors = logs.filter(l => l.error).length;
    const successRate = total > 0 ? (((total - errors) / total) * 100).toFixed(1) : 0;

    totalRequestsEl.textContent = total;
    successRateEl.textContent = `${successRate}%`;
    errorCountEl.textContent = errors;
}

// Event Listeners
refreshBtn.addEventListener('click', () => {
    refreshBtn.disabled = true;
    fetchLogs().finally(() => {
        setTimeout(() => refreshBtn.disabled = false, 500);
    });
});

document.querySelectorAll('.filter-cb').forEach(cb => {
    cb.addEventListener('change', renderLogs);
});

// Clock function
function updateClock() {
    const now = new Date();
    // Use it-IT locale for DD/MM/YYYY formatting, followed by 24h time with seconds
    liveClockEl.textContent = now.toLocaleString('it-IT', { 
        year: 'numeric', month: '2-digit', day: '2-digit',
        hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' 
    });
}

// Initial calls
fetchLogs();
updateClock();

// Intervals
setInterval(updateClock, 1000);
setInterval(fetchLogs, 5000);
