// ВСТАВЬ СВОЙ КОНФИГ СЮДА
const firebaseConfig = {
    apiKey: "AIzaSyDxrtT1chrVOFwM7ti8uHFTz9sI16SVezU",
    authDomain: "voxel-efa9f.firebaseapp.com",
    projectId: "voxel-efa9f",
    storageBucket: "voxel-efa9f.firebasestorage.app",
    messagingSenderId: "773085039700",
    appId: "1:773085039700:web:6937b4022c9d0503c3f1c1",
    measurementId: "G-3Q37BFB67P"
};

firebase.initializeApp(firebaseConfig);

const db = firebase.database();
const auth = firebase.auth();
const storage = firebase.storage();

console.log('🔥 Firebase инициализирован!');