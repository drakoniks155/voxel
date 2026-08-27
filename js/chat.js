// ===== ЗАГРУЗКА ЧАТОВ =====
function loadChats(uid) {
    const chatsList = document.getElementById('chats-list');
    chatsList.innerHTML = '<div style="text-align:center;color:#888;padding:20px;">Загрузка...</div>';
    
    // Получаем друзей
    db.ref('users/' + uid + '/friends').on('value', async snapshot => {
        const friends = snapshot.val();
        if (!friends) {
            chatsList.innerHTML = `
                <div style="text-align:center;color:#888;padding:20px;">
                    <p>👋 У вас пока нет друзей</p>
                    <button onclick="openFriendModal()" class="auth-btn" style="padding:8px 20px;">➕ Добавить по ID</button>
                </div>
            `;
            return;
        }
        
        let html = '';
        for (const friendUid in friends) {
            const userSnap = await db.ref('users/' + friendUid).once('value');
            const userData = userSnap.val();
            if (!userData) continue;
            
            html += `
                <div class="chat-item" onclick="openChat('${friendUid}')">
                    <img src="${userData.avatar || 'https://i.pravatar.cc/200'}" alt="avatar" />
                    <div>
                        <strong>${userData.username}</strong>
                        <span class="chat-item-status" id="chat-item-status-${friendUid}">Загрузка...</span>
                    </div>
                </div>
            `;
        }
        
        chatsList.innerHTML = html || '<p style="text-align:center;color:#888;padding:20px;">Друзей пока нет</p>';
        
        // Загружаем статусы для всех друзей
        for (const friendUid in friends) {
            loadFriendStatus(friendUid);
        }
    });
}

// ===== СТАТУС ДРУГА =====
function loadFriendStatus(friendUid) {
    db.ref('presence/' + friendUid).on('value', snapshot => {
        const data = snapshot.val();
        if (!data) return;
        
        const statusEl = document.getElementById('chat-item-status-' + friendUid);
        if (!statusEl) return;
        
        if (data.status === 'online') {
            statusEl.textContent = '🟢 Онлайн';
        } else if (data.status === 'idle') {
            statusEl.textContent = '🌙 Отошёл';
        } else {
            statusEl.textContent = '⚫ Не в сети';
        }
    });
}

// ===== ОТКРЫТЬ ЧАТ =====
function openChat(friendUid) {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    
    window.currentChat = friendUid;
    
    db.ref('users/' + friendUid).on('value', snapshot => {
        const data = snapshot.val();
        if (!data) return;
        
        document.getElementById('chat-username').textContent = data.username;
        document.getElementById('chat-avatar').src = data.avatar || 'https://i.pravatar.cc/200';
    });
    
    // Обновляем статус собеседника
    updateStatusDisplay(friendUid, friendUid);
    
    // Загружаем сообщения
    loadMessages(currentUser.uid, friendUid);
}

// ===== ЗАГРУЗКА СООБЩЕНИЙ =====
function loadMessages(myUid, friendUid) {
    const container = document.getElementById('messages-container');
    const chatId = [myUid, friendUid].sort().join('_');
    
    db.ref('messages/' + chatId).orderByChild('timestamp').limitToLast(100).on('value', snapshot => {
        const messages = snapshot.val();
        container.innerHTML = '';
        
        if (!messages) {
            container.innerHTML = '<div style="text-align:center;color:#888;padding:40px;">Сообщений пока нет</div>';
            return;
        }
        
        let html = '';
        for (const key in messages) {
            const msg = messages[key];
            const isMine = msg.uid === myUid;
            
            html += `
                <div class="message ${isMine ? 'my' : 'other'}">
                    <img src="${msg.avatar || 'https://i.pravatar.cc/200'}" alt="avatar" />
                    <div>
                        <div class="message-text">${msg.text}</div>
                        <span class="message-time">${new Date(msg.timestamp).toLocaleTimeString()}</span>
                    </div>
                </div>
            `;
        }
        
        container.innerHTML = html;
        container.scrollTop = container.scrollHeight;
    });
}

// ===== ОТПРАВКА СООБЩЕНИЯ =====
document.getElementById('send-btn').addEventListener('click', sendMessage);
document.getElementById('message-input').addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
        e.preventDefault();
        sendMessage();
    }
});

async function sendMessage() {
    const input = document.getElementById('message-input');
    const text = input.value.trim();
    
    if (!text || !window.currentChat) return;
    
    const user = auth.currentUser;
    if (!user) return;
    
    const chatId = [user.uid, window.currentChat].sort().join('_');
    
    // Получаем данные пользователя
    const userSnap = await db.ref('users/' + user.uid).once('value');
    const userData = userSnap.val();
    
    await db.ref('messages/' + chatId).push({
        uid: user.uid,
        username: userData.username,
        avatar: userData.avatar || 'https://i.pravatar.cc/200',
        text: text,
        timestamp: firebase.database.ServerValue.TIMESTAMP
    });
    
    input.value = '';
    
    // Отправляем уведомление собеседнику
    sendNotification(window.currentChat, userData.username, text);
}

// ===== ПЕЧАТАЕТ... =====
let typingTimeout;

document.getElementById('message-input').addEventListener('input', function() {
    if (!window.currentChat) return;
    
    const user = auth.currentUser;
    if (!user) return;
    
    clearTimeout(typingTimeout);
    
    db.ref('presence/' + user.uid).update({
        isTyping: true,
        typingChannel: window.currentChat
    });
    
    typingTimeout = setTimeout(() => {
        db.ref('presence/' + user.uid).update({
            isTyping: false,
            typingChannel: null
        });
    }, 5000);
});