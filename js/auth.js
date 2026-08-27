// ===== ВХОД =====
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    try {
        await auth.signInWithEmailAndPassword(email, password);
    } catch (error) {
        document.getElementById('auth-error').textContent = error.message;
    }
});

// ===== РЕГИСТРАЦИЯ =====
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('reg-username').value.trim();
    const email = document.getElementById('reg-email').value;
    const password = document.getElementById('reg-password').value;
    
    if (username.length < 2) {
        document.getElementById('auth-error').textContent = 'Имя слишком короткое!';
        return;
    }
    
    try {
        const userCredential = await auth.createUserWithEmailAndPassword(email, password);
        const user = userCredential.user;
        
        // Генерируем 4-значный ID
        const tag = String(Math.floor(1000 + Math.random() * 9000));
        
        // Создаём профиль в БД
        await db.ref('users/' + user.uid).set({
            username: username,
            email: email,
            tag: tag,
            bio: '',
            gender: 'unspecified',
            status: 'online',
            avatar: 'https://i.pravatar.cc/200?u=' + user.uid,
            friends: {},
            friendRequests: {},
            sentRequests: {},
            createdAt: firebase.database.ServerValue.TIMESTAMP
        });
        
        // Устанавливаем статус онлайн
        await db.ref('presence/' + user.uid).set({
            status: 'online',
            lastSeen: firebase.database.ServerValue.TIMESTAMP,
            isTyping: false,
            typingChannel: null
        });
        
    } catch (error) {
        document.getElementById('auth-error').textContent = error.message;
    }
});

// ===== ВХОД ЧЕРЕЗ GOOGLE =====
document.getElementById('google-btn').addEventListener('click', async () => {
    try {
        const provider = new firebase.auth.GoogleAuthProvider();
        await auth.signInWithPopup(provider);
    } catch (error) {
        document.getElementById('auth-error').textContent = error.message;
    }
});

// ===== ПЕРЕКЛЮЧЕНИЕ ТАБОВ =====
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', function() {
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        
        const tabName = this.dataset.tab;
        document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
        document.getElementById(tabName + '-form').classList.add('active');
    });
});

// ===== СОСТОЯНИЕ АВТОРИЗАЦИИ =====
auth.onAuthStateChanged(async (user) => {
    if (user) {
        document.getElementById('auth-screen').style.display = 'none';
        document.getElementById('main-screen').style.display = 'flex';
        
        // При закрытии вкладки — статус offline
        const statusRef = db.ref('presence/' + user.uid + '/status');
        statusRef.onDisconnect().set('offline');
        
        const lastSeenRef = db.ref('presence/' + user.uid + '/lastSeen');
        lastSeenRef.onDisconnect().set(firebase.database.ServerValue.TIMESTAMP);
        
        // Слушаем изменения профиля
        loadUserProfile(user.uid);
        loadChats(user.uid);
    } else {
        document.getElementById('auth-screen').style.display = 'flex';
        document.getElementById('main-screen').style.display = 'none';
    }
});