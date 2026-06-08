"use strict";

let currentTicket = null;
let quill = null;

document.addEventListener("DOMContentLoaded", function () {
    const mainContent = document.getElementById('mainContent');
    const btnLogs = document.getElementById('btnLogs');
    const btnSupport = document.getElementById('btnSupport');
    const replyModal = document.getElementById('replyModal');
    const sendReplyBtn = document.getElementById('sendReplyBtn');
    const btnText = document.getElementById('btnText');
    const statusSelect = document.getElementById('statusSelect');

    // Initialize Quill
    quill = new Quill('#editor', {
        theme: 'snow',
        placeholder: 'Compose your reply...',
        modules: {
            toolbar: [
                ['bold', 'italic', 'underline'],
                [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                ['link', 'clean']
            ]
        }
    });

    // Navigation
    btnLogs.addEventListener('click', () => {
        window.location.href = "/logs";
    });

    btnSupport.addEventListener('click', () => {
        loadSupportTickets();
        btnSupport.classList.add('active');
        btnLogs.classList.remove('active');
    });

    // Initial Load
    loadSupportTickets();

    async function loadSupportTickets() {
        mainContent.innerHTML = '<div class="empty-state"><div class="loading-spinner" style="border-top-color: var(--primary)"></div><br>Loading tickets...</div>';
        
        try {
            const res = await fetch('/api/support/admin/tickets');
            const data = await res.json();

            if (data.success && data.tickets) {
                renderTickets(data.tickets);
            } else {
                mainContent.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-circle"></i><br>Error loading tickets: ${data.error}</div>`;
            }
        } catch (err) {
            mainContent.innerHTML = `<div class="empty-state"><i class="fas fa-exclamation-circle"></i><br>Network error: ${err.message}</div>`;
        }
    }

    function renderTickets(tickets) {
        if (tickets.length === 0) {
            mainContent.innerHTML = '<div class="empty-state"><i class="fas fa-inbox"></i><br>No support tickets found</div>';
            return;
        }

        const list = document.createElement('div');
        list.className = 'ticket-list';

        // Header for the list
        const header = document.createElement('div');
        header.className = 'ticket-card';
        header.style.background = 'transparent';
        header.style.border = 'none';
        header.style.cursor = 'default';
        header.style.fontWeight = '800';
        header.style.fontSize = '0.7rem';
        header.style.color = 'var(--text-muted)';
        header.style.textTransform = 'uppercase';
        header.style.letterSpacing = '1px';
        header.innerHTML = `
            <div>ID Reference</div>
            <div>Subject & Customer</div>
            <div>Category</div>
            <div>Current Status</div>
            <div style="text-align:center">Action</div>
        `;
        list.appendChild(header);

        tickets.forEach(ticket => {
            const card = document.createElement('div');
            card.className = 'ticket-card';
            
            const typeTag = ticket.problem_type === 'technical' ? 'tag-tech' : 
                           ticket.problem_type === 'billing' ? 'tag-billing' : 'tag-tech';
            
            const statusTag = ticket.status === 'resolved' ? 'tag-resolved' : 
                             ticket.status === 'in-progress' ? 'tag-progress' : 'tag-open';
            
            card.innerHTML = `
                <div class="ticket-id">#${ticket.id.substring(0, 8)}</div>
                <div>
                    <div class="ticket-subject">${ticket.subject}</div>
                    <div class="ticket-email">${ticket.email} • ${new Date(ticket.created_at).toLocaleDateString()}</div>
                </div>
                <div><span class="tag ${typeTag}">${ticket.problem_type || 'General'}</span></div>
                <div><span class="tag ${statusTag}">${ticket.status || 'Open'}</span></div>
                <div class="link-cell">
                    ${ticket.admin_reply ? 
                        `<a href="#" class="btn-view" onclick="event.stopPropagation(); showReply(${JSON.stringify(ticket.admin_reply)})">View Reply</a>` : 
                        `<span style="color:#eee">No reply</span>`}
                </div>
            `;

            card.addEventListener('click', () => openReplyModal(ticket));
            list.appendChild(card);
        });

        mainContent.innerHTML = '';
        mainContent.appendChild(list);
    }

    window.showReply = (reply) => {
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = reply;
        alert('Last Reply Content:\n' + tempDiv.innerText);
    };

    function openReplyModal(ticket) {
        currentTicket = ticket;
        document.getElementById('modalTitle').innerText = `REPLYING TO: ${ticket.email.toUpperCase()}`;
        document.getElementById('originalSubject').innerText = ticket.subject;
        document.getElementById('originalMsg').innerText = ticket.message;
        
        // Set Quill content
        quill.root.innerHTML = ticket.admin_reply || '';
        
        // Set current status in select
        statusSelect.value = ticket.status || 'open';
        
        replyModal.style.display = 'flex';
        quill.focus();
    }

    window.closeModal = () => {
        replyModal.style.display = 'none';
        currentTicket = null;
    };

    sendReplyBtn.addEventListener('click', async () => {
        const replyHtml = quill.root.innerHTML;
        const replyText = quill.getText().trim();
        const selectedStatus = statusSelect.value;

        if (!replyText || !currentTicket) return;

        sendReplyBtn.disabled = true;
        btnText.innerText = 'Sending...';

        try {
            const res = await fetch('/api/support/admin/reply', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ticketId: currentTicket.id,
                    reply: replyHtml,
                    email: currentTicket.email,
                    subject: currentTicket.subject,
                    status: selectedStatus,
                    originalMessage: currentTicket.message
                })
            });

            const data = await res.json();

            if (data.success) {
                closeModal();
                loadSupportTickets(); // Refresh list
            } else {
                alert('Error: ' + data.error);
            }
        } catch (err) {
            alert('Network error: ' + err.message);
        } finally {
            sendReplyBtn.disabled = false;
            btnText.innerText = 'Send Email';
        }
    });
});
