// ===== ВСПЛЫВАЮЩИЕ УВЕДОМЛЕНИЯ =====
function showNotification(title, body, avatar) {
    // Проверяем браузерные уведомления
    if (Notification.permission === 'granted') {
        new Notification(title, {
            body: body,
            icon: avatar || 'https://i.pravatar.cc/200'
        });
    }
    
    // Создаём HTML-уведомление
    const container = document.getElementById('notification-container') || createContainer();
    
    const notif = document.createElement('div');
    notif.className = 'notification slide-in';
    notif.innerHTML = `
        <img src="${avatar || 'https://i.pravatar.cc/200'}" alt="avatar" />
        <div>
            <strong>${title}</strong>
            <p>${body}</p>
        </div>
        <span class="notif-close" onclick="this.parentElement.remove()">✕</span>
    `;
    
    container.prepend(notif);
    
    setTimeout(() => {
        notif.classList.remove('slide-in');
        notif.classList.add('slide-out');
        setTimeout(() => notif.remove(), 500);
    }, 5000);
}

function createContainer() {
    const container = document.createElement('div');
    container.id = 'notification-container';
    container.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 10px;
        max-width: 400px;
    `;
    document.body.appendChild(container);
    return container;
}

// ===== УВЕДОМЛЕНИЕ О ВХОДЯЩЕМ ЗВОНКЕ =====
function showIncomingCallNotification(callerUid, callId) {
    const container = document.getElementById('notification-container') || createContainer();
    
    const notif = document.createElement('div');
    notif.className = 'notification call-notification slide-in';
    notif.style.borderLeftColor = '#667eea';
    notif.innerHTML = `
        <div style="flex:1;">
            <strong>📞 Входящий звонок!</strong>
            <p>${callerUid} звонит вам</p>
            <div style="display:flex;gap:10px;margin-top:10px;">
                <button onclick="acceptCall('${callId}', '${callerUid}')" class="auth-btn" style="padding:5px 20px;background:#4CAF50;">Ответить</button>
                <button onclick="this.closest('.notification').remove()" class="auth-btn" style="padding:5px 20px;background:#f44336;">Отклонить</button>
            </div>
        </div>
    `;
    
    container.prepend(notif);
}

// ===== ЗАПРОС РАЗРЕШЕНИЯ НА УВЕДОМЛЕНИЯ =====
function requestNotificationPermission() {
    if ('Notification' in window && Notification.permission === 'default') {
        Notification.requestPermission();
    }
}

// Запрашиваем разрешение при загрузке
document.addEventListener('DOMContentLoaded', requestNotificationPermission);