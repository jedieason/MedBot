import { initializeApp } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js';
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-auth.js';
import { getDatabase, ref, onValue, remove, update } from 'https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js';

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
const loginBox = document.getElementById('login-box');
const contentSection = document.getElementById('content-section');
const cardsContainer = document.getElementById('cards-container');
const detailDiv = document.getElementById('detail');
let openedId = null;

function parseId(id) {
  const delimiter = id.includes('|') ? '|' : '｜';
  const [ts] = id.split(delimiter);
  return Number(ts);
}

function formatDate(ts) {
  const d = new Date(ts);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  const h = String(d.getHours()).padStart(2, '0');
  const min = String(d.getMinutes()).padStart(2, '0');
  return `${y}/${m}/${day} ${h}:${min}`;
}

function renderDetails(id, report) {
  const ts = parseId(id);
  let html = `<div class="detail-item"><strong>提交時間：</strong>${formatDate(ts)}</div>`;
  Object.keys(report).forEach(key => {
    if (key === '姓名' || key === '備註') return;
    html += `<div class="detail-item"><strong>${key}：</strong>${report[key]}</div>`;
  });
  html += `
    <div class="note">
      <strong>備註：</strong>
      <textarea id="note-text" rows="4" placeholder="輸入備註...">${report['備註'] || ''}</textarea>
      <button id="save-note-btn" class="save-note-btn">儲存備註</button>
    </div>
  `;
  return html;
}

loginBtn.addEventListener('click', () => {
  signInWithPopup(auth, provider).catch(err => console.error('登入失敗', err));
});

logoutBtn.addEventListener('click', () => {
  signOut(auth).catch(err => console.error('登出失敗', err));
});

onAuthStateChanged(auth, (user) => {
  if (user) {
    loginBox.style.display = 'none';
    contentSection.style.display = 'block';
    logoutBtn.style.display = 'inline-block';
    loadReports();
  } else {
    loginBox.style.display = 'flex';
    contentSection.style.display = 'none';
    logoutBtn.style.display = 'none';
    cardsContainer.innerHTML = '';
    detailDiv.innerHTML = '';
    detailDiv.style.display = 'none';
  }
});

function loadReports() {
  const reportsRef = ref(db, 'medical_reports');
  onValue(reportsRef, (snapshot) => {
    cardsContainer.innerHTML = '';
    const data = snapshot.val() || {};
    Object.keys(data).forEach(id => {
      const report = data[id];
      const card = document.createElement('div');
      card.className = 'report-card';
      card.dataset.id = id;
      const ts = parseId(id);
      card.innerHTML = `
        <div><strong>${report['姓名'] || ''}</strong></div>
        <div class="time">${formatDate(ts)}</div>
        <button class="delete-btn" data-id="${id}" title="刪除">🗑️</button>
      `;
      cardsContainer.appendChild(card);
    });

    cardsContainer.querySelectorAll('.report-card').forEach(card => {
      card.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-btn')) return;
        const id = card.dataset.id;
        const report = data[id];
        if (openedId === id) {
          detailDiv.innerHTML = '';
          detailDiv.style.display = 'none';
          openedId = null;
        } else {
          detailDiv.innerHTML = renderDetails(id, report);
          detailDiv.style.display = 'flex';
          openedId = id;
          attachNoteHandler(id);
        }
      });
    });

    cardsContainer.querySelectorAll('.delete-btn').forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.dataset.id;
        if (confirm('確定要刪除這筆資料嗎？')) {
          remove(ref(db, 'medical_reports/' + id));
        }
      });
    });
  });
}

function attachNoteHandler(id) {
  const saveBtn = document.getElementById('save-note-btn');
  if (!saveBtn) return;
  saveBtn.addEventListener('click', () => {
    const note = document.getElementById('note-text').value;
    update(ref(db, 'medical_reports/' + id), { '備註': note })
      .catch(err => console.error('備註更新失敗', err));
  });
}
