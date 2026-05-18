// ============================================
// FIREBASE CONFIG + AUTH + FIRESTORE
// ============================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { getAuth, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import { getFirestore, doc, getDoc, setDoc } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDZGdL0swwEYH5AFcjs9ip6g_uXKoPc2iY",
  authDomain: "financial-planning-58994.firebaseapp.com",
  projectId: "financial-planning-58994",
  storageBucket: "financial-planning-58994.firebasestorage.app",
  messagingSenderId: "595489487607",
  appId: "1:595489487607:web:7c3f6adb069ed9427b71f2"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// ---- DEFAULT DATA for new users ----
export const DEFAULT_STATE = {
  income: { salary: 0, extra: 0 },
  expenses: [
    { name: '🏠 Essencial (aluguel, luz, água)', amount: 0, category: 'essential' },
    { name: '🍕 Lazer e alimentação fora', amount: 0, category: 'leisure' },
    { name: '💳 Pagamento de dívidas', amount: 0, category: 'debt' },
  ],
  debts: [],
  goals: [
    { name: 'Reserva de emergência', emoji: '🛡️', target: 1400, saved: 0, monthly: 0, tip: 'Comece por aqui. É o colchão que impede você de se endividar de novo.' },
  ],
  score: {
    value: 0,
    actions: [
      { id: 1, icon: '✅', iconClass: 'g', title: 'Pagar contas em dia todo mês', desc: 'Cada mês sem atraso sobe o score. Automatize o débito.', done: false },
      { id: 2, icon: '📋', iconClass: 'y', title: 'Atualizar cadastro no Serasa', desc: 'Cadastro completo vale até +50 pts. Grátis.', done: false },
      { id: 3, icon: '💳', iconClass: 'g', title: 'Usar menos de 30% do limite do cartão', desc: 'Uso alto do limite sinaliza risco. Mantenha abaixo de 30%.', done: false },
      { id: 4, icon: '🤝', iconClass: 'y', title: 'Negociar e quitar dívida em atraso', desc: 'Score sobe em até 90 dias após quitação.', done: false },
    ]
  }
};

// ---- SAVE user data to Firestore ----
export async function saveUserData(uid, data) {
  try {
    await setDoc(doc(db, 'users', uid), data, { merge: true });
  } catch (e) {
    console.error('Error saving data:', e);
  }
}

// ---- LOAD user data from Firestore ----
export async function loadUserData(uid) {
  try {
    const snap = await getDoc(doc(db, 'users', uid));
    if (snap.exists()) return snap.data();
    // First time — save defaults
    await saveUserData(uid, DEFAULT_STATE);
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  } catch (e) {
    console.error('Error loading data:', e);
    return JSON.parse(JSON.stringify(DEFAULT_STATE));
  }
}

// ---- GOOGLE LOGIN ----
export async function loginWithGoogle() {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    return { user: result.user, error: null };
  } catch (e) {
    return { user: null, error: e.message };
  }
}

// ---- EMAIL LOGIN ----
export async function loginWithEmail(email, password) {
  try {
    const result = await signInWithEmailAndPassword(auth, email, password);
    return { user: result.user, error: null };
  } catch (e) {
    const messages = {
      'auth/user-not-found': 'E-mail não encontrado. Crie uma conta.',
      'auth/wrong-password': 'Senha incorreta. Tente novamente.',
      'auth/invalid-email': 'E-mail inválido.',
      'auth/too-many-requests': 'Muitas tentativas. Aguarde alguns minutos.',
    };
    return { user: null, error: messages[e.code] || 'Erro ao entrar. Tente novamente.' };
  }
}

// ---- EMAIL SIGNUP ----
export async function signupWithEmail(email, password) {
  try {
    const result = await createUserWithEmailAndPassword(auth, email, password);
    return { user: result.user, error: null };
  } catch (e) {
    const messages = {
      'auth/email-already-in-use': 'E-mail já cadastrado. Faça login.',
      'auth/weak-password': 'Senha fraca. Use pelo menos 6 caracteres.',
      'auth/invalid-email': 'E-mail inválido.',
    };
    return { user: null, error: messages[e.code] || 'Erro ao criar conta.' };
  }
}

// ---- LOGOUT ----
export async function logout() {
  await signOut(auth);
  window.location.href = '../pages/login.html';
}

// ---- AUTH STATE WATCHER ----
export function watchAuthState(onLoggedIn, onLoggedOut) {
  onAuthStateChanged(auth, user => {
    if (user) onLoggedIn(user);
    else onLoggedOut();
  });
}
