import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { getDatabase, ref, onValue, remove } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js';

const firebaseConfig = {
    apiKey: "AIzaSyChdYY6AdKToEyv194bJOdAIx00ykRCtDE",
    authDomain: "geminiapiformedbot.firebaseapp.com",
    databaseURL: "https://geminiapiformedbot-default-rtdb.firebaseio.com",
    projectId: "geminiapiformedbot",
    storageBucket: "geminiapiformedbot.firebasestorage.app",
    messagingSenderId: "520520790517",
    appId: "1:520520790517:web:24f30bf0b9999dafdbb0bc",
    measurementId: "G-BCJJ36CS4S"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getDatabase(app);
const provider = new GoogleAuthProvider();

const loginBtn = document.getElementById('login-btn');
const logoutBtn = document.getElementById('logout-btn');
const loginSection = document.getElementById('login-section');
const contentSection = document.getElementById('content-section');
const tableBody = document.getElementById('reports-table-body');
const detailPre = document.getElementById('detail');

loginBtn.addEventListener('click', () => {
  signInWithPopup(auth, provider).catch(err => console.error('登入失敗', err));
});

logoutBtn.addEventListener('click', () => {
  signOut(auth).catch(err => console.error('登出失敗', err));
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    loginSection.style.display = 'none';
    contentSection.style.display = 'block';
    logoutBtn.style.display = 'inline-block';
    loadReports();
  } else {
    loginSection.style.display = 'flex';
    contentSection.style.display = 'none';
    logoutBtn.style.display = 'none';
    tableBody.innerHTML = '';
    detailPre.textContent = '';
  }
});

function loadReports() {
  const reportsRef = ref(db, 'medical_reports');
  onValue(reportsRef, (snapshot) => {
    tableBody.innerHTML = '';
    const data = snapshot.val() || {};
    Object.keys(data).forEach(id => {
      const report = data[id];
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${id}</td>
        <td>${report['姓名'] || ''}</td>
        <td>${report['候位號碼'] || ''}</td>
        <td>
          <button class="view-btn" data-id="${id}">查看</button>
          <button class="delete-btn" data-id="${id}">刪除</button>
        </td>
      `;
      tableBody.appendChild(tr);
    });

    tableBody.querySelectorAll('.view-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        const report = data[id];
        detailPre.textContent = JSON.stringify(report, null, 2);
      });
    });

    tableBody.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        if (confirm('確定要刪除這筆資料嗎？')) {
          remove(ref(db, 'medical_reports/' + id));
        }
      });
    });
  });
}
