// ===== ГЛОБАЛЬНЫЕ ПЕРЕМЕННЫЕ =====
window.currentChat = null;

// ===== ОТКРЫТИЕ МОДАЛКИ ДРУЗЕЙ =====
function openFriendModal() {
    document.getElementById('friend-modal').style.display = 'flex';
}

document.getElementById('close-friend-modal').addEventListener('click', () => {
    document.getElementById('friend-modal').style.display = 'none';
});

// ===== СЛУШАЕМ ВХОДЯЩИЕ ЗВОНКИ =====
setTimeout(listenIncomingCalls, 2000);

// ===== ЗАГРУЗКА ЗАЯВОК В ДРУЗЬЯ =====
setTimeout(loadFriendRequests, 3000);

// ===== ЗАКРЫТИЕ МОДАЛОК ПО КЛИКУ ВНЕ =====
window.addEventListener('click', (e) => {
    if (e.target.classList.contains('modal')) {
        e.target.style.display = 'none';
    }
});

console.log('🚀 VOXEL запущен!');