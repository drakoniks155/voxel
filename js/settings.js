// ===== ОТКРЫТЬ НАСТРОЙКИ =====
document.getElementById('settings-btn').addEventListener('click', () => {
    const user = auth.currentUser;
    if (!user) return;
    
    // Загружаем текущие данные
    db.ref('users/' + user.uid).once('value', snapshot => {
        const data = snapshot.val();
        if (!data) return;
        
        document.getElementById('settings-username').value = data.username || '';
        document.getElementById('settings-bio').value = data.bio || '';
        document.getElementById('settings-gender').value = data.gender || 'unspecified';
        document.getElementById('settings-status').value = data.status || 'online';
    });
    
    document.getElementById('settings-modal').style.display = 'flex';
});

// ===== ЗАКРЫТЬ НАСТРОЙКИ =====
document.getElementById('close-settings').addEventListener('click', () => {
    document.getElementById('settings-modal').style.display = 'none';
});

// ===== СОХРАНЕНИЕ ПРОФИЛЯ =====
document.getElementById('settings-username').addEventListener('change', function() {
    const user = auth.currentUser;
    if (!user) return;
    db.ref('users/' + user.uid + '/username').set(this.value);
});

document.getElementById('settings-bio').addEventListener('change', function() {
    const user = auth.currentUser;
    if (!user) return;
    db.ref('users/' + user.uid + '/bio').set(this.value);
});

document.getElementById('settings-gender').addEventListener('change', function() {
    const user = auth.currentUser;
    if (!user) return;
    db.ref('users/' + user.uid + '/gender').set(this.value);
});

document.getElementById('settings-status').addEventListener('change', function() {
    const user = auth.currentUser;
    if (!user) return;
    db.ref('presence/' + user.uid + '/status').set(this.value);
});

// ===== ЗАГРУЗКА АВАТАРКИ =====
document.getElementById('avatar-upload').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (!file) return;
    
    const user = auth.currentUser;
    if (!user) return;
    
    const storageRef = storage.ref('avatars/' + user.uid + '.jpg');
    const uploadTask = storageRef.put(file);
    
    uploadTask.on('state_changed',
        null,
        (error) => console.error('Ошибка загрузки:', error),
        async () => {
            const url = await storageRef.getDownloadURL();
            await db.ref('users/' + user.uid + '/avatar').set(url);
            document.getElementById('current-avatar').src = url;
        }
    );
});

// ===== ТЕМЫ =====
document.querySelectorAll('.theme-btn').forEach(btn => {
    btn.addEventListener('click', function() {
        const theme = this.dataset.theme;
        document.body.className = theme + '-theme';
        localStorage.setItem('voxel-theme', theme);
    });
});

// Загружаем сохранённую тему
const savedTheme = localStorage.getItem('voxel-theme') || 'dark';
document.body.className = savedTheme + '-theme';

// ===== ВЫХОД =====
document.getElementById('logout-btn').addEventListener('click', () => {
    auth.signOut();
});