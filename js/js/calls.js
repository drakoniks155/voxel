// ===== ИНИЦИАЛИЗАЦИЯ ЗВОНКОВ =====
let localStream;
let remoteStream;
let peerConnection;

const servers = {
    iceServers: [
        { urls: 'stun:stun.l.google.com:19302' }
    ]
};

// ===== АУДИОЗВОНОК =====
document.getElementById('call-btn').addEventListener('click', async () => {
    if (!window.currentChat) {
        alert('Выберите чат для звонка!');
        return;
    }
    
    await startCall('audio');
});

// ===== ВИДЕОЗВОНОК =====
document.getElementById('video-call-btn').addEventListener('click', async () => {
    if (!window.currentChat) {
        alert('Выберите чат для звонка!');
        return;
    }
    
    await startCall('video');
});

// ===== НАЧАТЬ ЗВОНОК =====
async function startCall(type) {
    const user = auth.currentUser;
    if (!user) return;
    
    const friendUid = window.currentChat;
    const callId = [user.uid, friendUid].sort().join('_');
    
    try {
        // Получаем медиа-поток
        const constraints = {
            audio: true,
            video: type === 'video'
        };
        
        localStream = await navigator.mediaDevices.getUserMedia(constraints);
        document.getElementById('local-video').srcObject = localStream;
        
        // Создаём PeerConnection
        peerConnection = new RTCPeerConnection(servers);
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });
        
        peerConnection.ontrack = (event) => {
            remoteStream = event.streams[0];
            document.getElementById('remote-video').srcObject = remoteStream;
        };
        
        // Создаём offer
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        
        // Отправляем offer в Firebase
        await db.ref('calls/' + callId).set({
            offer: offer,
            caller: user.uid,
            type: type,
            timestamp: firebase.database.ServerValue.TIMESTAMP
        });
        
        // Открываем модалку звонка
        document.getElementById('call-modal').style.display = 'flex';
        document.getElementById('call-status').textContent = '📞 Идёт вызов...';
        
        // Слушаем ответ
        db.ref('calls/' + callId + '/answer').on('value', async snapshot => {
            const answer = snapshot.val();
            if (answer) {
                await peerConnection.setRemoteDescription(answer);
                document.getElementById('call-status').textContent = '🟢 В эфире!';
            }
        });
        
        // Слушаем ICE-кандидаты
        db.ref('calls/' + callId + '/candidate').on('value', snapshot => {
            const candidate = snapshot.val();
            if (candidate) {
                peerConnection.addIceCandidate(candidate);
            }
        });
        
    } catch (error) {
        console.error('Ошибка звонка:', error);
        alert('Не удалось начать звонок: ' + error.message);
    }
}

// ===== СЛУШАЕМ ВХОДЯЩИЕ ЗВОНКИ =====
function listenIncomingCalls() {
    const user = auth.currentUser;
    if (!user) return;
    
    db.ref('calls').orderByChild('timestamp').limitToLast(5).on('child_added', snapshot => {
        const data = snapshot.val();
        if (data.caller === user.uid) return; // Исходящий звонок
        
        // Проверяем, есть ли уже ответ
        if (data.answer) return;
        
        // Показываем уведомление о входящем звонке
        showIncomingCallNotification(data.caller, snapshot.key);
    });
}

// ===== ПРИНЯТЬ ЗВОНОК =====
async function acceptCall(callId, callerUid) {
    const user = auth.currentUser;
    if (!user) return;
    
    try {
        const constraints = { audio: true, video: true };
        localStream = await navigator.mediaDevices.getUserMedia(constraints);
        document.getElementById('local-video').srcObject = localStream;
        
        peerConnection = new RTCPeerConnection(servers);
        localStream.getTracks().forEach(track => {
            peerConnection.addTrack(track, localStream);
        });
        
        peerConnection.ontrack = (event) => {
            remoteStream = event.streams[0];
            document.getElementById('remote-video').srcObject = remoteStream;
        };
        
        // Получаем offer
        const callSnap = await db.ref('calls/' + callId).once('value');
        const data = callSnap.val();
        await peerConnection.setRemoteDescription(data.offer);
        
        const answer = await peerConnection.createAnswer();
        await peerConnection.setLocalDescription(answer);
        
        await db.ref('calls/' + callId + '/answer').set(answer);
        document.getElementById('call-modal').style.display = 'flex';
        document.getElementById('call-status').textContent = '🟢 В эфире!';
        
    } catch (error) {
        console.error('Ошибка принятия звонка:', error);
    }
}

// ===== ЗАВЕРШИТЬ ЗВОНОК =====
document.getElementById('end-call-btn').addEventListener('click', endCall);

function endCall() {
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    if (peerConnection) {
        peerConnection.close();
    }
    document.getElementById('call-modal').style.display = 'none';
    document.getElementById('call-status').textContent = 'Звонок завершён';
}