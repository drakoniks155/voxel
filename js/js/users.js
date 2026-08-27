// ===== ЗАГРУЗКА ПРОФИЛЯ =====
function loadUserProfile(uid) {
    db.ref('users/' + uid).on('value', snapshot => {
        const data = snapshot.val();
        if (!data) return;
        
        document.getElementById('current-username').textContent = data.username;
        document.getElementById('current-avatar').src = data.avatar || 'https://i.pravatar.cc/200';
        
        // Обновляем статус
        updateStatusDisplay(uid);
    });
    
    // Слушаем статус
    db.ref('presence/' + uid).on('value', snapshot => {
        const data = snapshot.val();
        if (data) {
            const dot = document.getElementById('current-status-dot');
            dot.className = 'status-dot ' + data.status;
        }
    });
}

// ===== ОБНОВЛЕНИЕ СТАТУСА =====
function updateStatusDisplay(uid, chatId) {
    const userRef = db.ref('users/' + uid);
    const presenceRef = db.ref('presence/' + uid);
    
    presenceRef.on('value', snapshot => {
        const presence = snapshot.val();
        if (!presence) return;
        
        userRef.once('value', userSnap => {
            const userData = userSnap.val();
            const gender = userData?.gender || 'unspecified';
            
            let statusText = '';
            let statusDot = '';
            
            // Проверяем, печатает ли в этом чате
            if (presence.isTyping && presence.typingChannel === chatId) {
                statusText = 'Печатает...';
                statusDot = 'typing';
                updateChatStatus(statusText, statusDot);
                return;
            }
            
            // Определяем статус
            switch (presence.status) {
                case 'online':
                    statusText = 'Онлайн';
                    statusDot = 'online';
                    break;
                case 'idle':
                    statusText = 'Отошёл';
                    statusDot = 'idle';
                    break;
                case 'dnd':
                    statusText = 'Не беспокоить';
                    statusDot = 'dnd';
                    break;
                case 'offline':
                    const timeAgo = Date.now() - presence.lastSeen;
                    if (timeAgo < 3600000) { // меньше часа
                        statusText = gender === 'male' ? 'Был недавно' : 
                                    gender === 'female' ? 'Была недавно' : 
                                    'Был(а) недавно';
                    } else {
                        statusText = gender === 'male' ? 'Был(а) давно' : 
                                    gender === 'female' ? 'Была давно' : 
                                    'Был(а) давно';
                    }
                    statusDot = 'offline';
                    break;
            }
            
            updateChatStatus(statusText, statusDot);
        });
    });
}

function updateChatStatus(text, dot) {
    document.getElementById('chat-status').textContent = text;
    const dotEl = document.querySelector('.chat-user-info .status-dot');
    if (dotEl) dotEl.className = 'status-dot ' + dot;
}

// ===== СМЕНА СТАТУСА =====
function setStatus(newStatus) {
    const user = auth.currentUser;
    if (!user) return;
    
    db.ref('presence/' + user.uid + '/status').set(newStatus);
    db.ref('presence/' + user.uid + '/lastSeen').set(firebase.database.ServerValue.TIMESTAMP);
}

// ===== ОБНОВЛЕНИЕ ПРОФИЛЯ =====
function updateProfile(uid, data) {
    return db.ref('users/' + uid).update(data);
}