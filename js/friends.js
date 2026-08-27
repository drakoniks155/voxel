// ===== ПОИСК ДРУГА ПО ID =====
document.getElementById('search-friend-btn').addEventListener('click', async () => {
    const input = document.getElementById('friend-id-input').value.trim();
    const tag = input.replace('#', '');
    
    if (!/^\d{4}$/.test(tag)) {
        document.getElementById('friend-search-result').innerHTML = '❌ Введите 4 цифры (например, 4281)';
        return;
    }
    
    // Ищем пользователя с таким тегом
    const snapshot = await db.ref('users').orderByChild('tag').equalTo(tag).once('value');
    const users = snapshot.val();
    
    if (!users) {
        document.getElementById('friend-search-result').innerHTML = '❌ Пользователь не найден';
        return;
    }
    
    const uid = Object.keys(users)[0];
    const userData = users[uid];
    const currentUser = auth.currentUser;
    
    if (uid === currentUser.uid) {
        document.getElementById('friend-search-result').innerHTML = '😄 Это вы!';
        return;
    }
    
    // Проверяем, уже друзья
    const friendsSnapshot = await db.ref('users/' + currentUser.uid + '/friends/' + uid).once('value');
    if (friendsSnapshot.exists()) {
        document.getElementById('friend-search-result').innerHTML = '✅ Уже в друзьях!';
        return;
    }
    
    // Проверяем, есть ли заявка
    const requestSnapshot = await db.ref('users/' + currentUser.uid + '/sentRequests/' + uid).once('value');
    if (requestSnapshot.exists()) {
        document.getElementById('friend-search-result').innerHTML = '⏳ Заявка уже отправлена';
        return;
    }
    
    // Показываем результат
    document.getElementById('friend-search-result').innerHTML = `
        <div class="friend-result">
            <img src="${userData.avatar}" alt="avatar" class="friend-avatar" />
            <div>
                <strong>${userData.username}</strong>
                <span class="friend-tag">#${userData.tag}</span>
            </div>
            <button class="auth-btn" onclick="sendFriendRequest('${uid}')">➕ Добавить</button>
        </div>
    `;
});

// ===== ОТПРАВКА ЗАЯВКИ =====
async function sendFriendRequest(targetUid) {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    
    // Отправляем заявку
    await db.ref('users/' + targetUid + '/friendRequests/' + currentUser.uid).set({
        username: currentUser.displayName || currentUser.email,
        avatar: currentUser.photoURL || 'https://i.pravatar.cc/200',
        timestamp: firebase.database.ServerValue.TIMESTAMP
    });
    
    // Добавляем в исходящие
    await db.ref('users/' + currentUser.uid + '/sentRequests/' + targetUid).set(true);
    
    document.getElementById('friend-search-result').innerHTML = '✅ Заявка отправлена!';
}

// ===== ПРИНЯТЬ ЗАЯВКУ =====
async function acceptFriendRequest(requestUid) {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    
    // Добавляем друг друга
    await db.ref('users/' + currentUser.uid + '/friends/' + requestUid).set(true);
    await db.ref('users/' + requestUid + '/friends/' + currentUser.uid).set(true);
    
    // Удаляем заявку
    await db.ref('users/' + currentUser.uid + '/friendRequests/' + requestUid).remove();
    await db.ref('users/' + requestUid + '/sentRequests/' + currentUser.uid).remove();
    
    // Обновляем список чатов
    loadChats(currentUser.uid);
}

// ===== ЗАГРУЗКА ЗАЯВОК =====
function loadFriendRequests() {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    
    db.ref('users/' + currentUser.uid + '/friendRequests').on('value', snapshot => {
        const requests = snapshot.val();
        // Здесь можно показывать уведомления о заявках
        console.log('Заявки:', requests);
    });
}