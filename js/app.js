// ============================================
// MEU PLANO FINANCEIRO — App JS
// Data saved to Firestore per user
// ============================================

import { auth, db, loadUserData, saveUserData, logout, watchAuthState, DEFAULT_STATE } from './firebase.js';

let state = null;
let currentUser = null;
let saveTimeout = null;

// ---- AUTH GUARD ----
watchAuthState(
  async (user) => {
    currentUser = user;
    // Set avatar
    const avatarEl = document.getElementById('user-avatar');
    if (user.photoURL) {
      avatarEl.innerHTML = `<img src="${user.photoURL}" alt="avatar">`;
    } else {
      avatarEl.textContent = (user.email || user.displayName || '?')[0].toUpperCase();
    }
    // Load data from Firestore
    state = await loadUserData(user.uid);
    // Show app
    document.getElementById('auth-loading').style.display = 'none';
    document.getElementById('app-shell').style.display = 'flex';
    document.getElementById('topbar-score').textContent = 'Score ' + (state.score?.value || 0);
    navigate('overview');
  },
  () => {
    // Not logged in — redirect to login
    window.location.href = 'login.html';
  }
);

// ---- SAVE (debounced — saves 1.5s after last change) ----
function scheduleSave() {
  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    if (currentUser && state) {
      await saveUserData(currentUser.uid, state);
    }
  }, 1500);
}

// ---- LOGOUT ----
window.handleLogout = async function() {
  await logout();
};

// ---- NAVIGATION ----
window.navigate = function(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.querySelectorAll(`[data-page="${page}"]`).forEach(n => n.classList.add('active'));
  renderPage(page);
};

function renderPage(page) {
  if (!state) return;
  if (page === 'overview') renderOverview();
  if (page === 'debts') renderDebts();
  if (page === 'goals') renderGoals();
  if (page === 'score') renderScore();
}

// ---- HELPERS ----
function fmt(n) {
  return 'R$' + Number(n || 0).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}
function pct(part, total) {
  return total === 0 ? 0 : Math.min(100, Math.round((part / total) * 100));
}

// ---- OVERVIEW ----
function renderOverview() {
  const totalIncome = (state.income?.salary || 0) + (state.income?.extra || 0);
  const totalExpenses = (state.expenses || []).reduce((s, e) => s + (e.amount || 0), 0);
  const balance = totalIncome - totalExpenses;

  document.getElementById('ov-income').textContent = fmt(totalIncome);
  document.getElementById('ov-expense').textContent = fmt(totalExpenses);
  document.getElementById('ov-balance').textContent = fmt(Math.abs(balance));
  document.getElementById('ov-balance-label').textContent = balance >= 0 ? 'sobrando' : 'faltando';
  document.getElementById('in-salary').value = state.income?.salary || '';
  document.getElementById('in-extra').value = state.income?.extra || '';

  const catColors = { essential: 'c-green', leisure: 'c-yellow', debt: 'c-red', saving: 'c-blue' };
  const catTips = {
    essential: 'Limite recomendado: 50% da renda',
    leisure: 'Limite recomendado: 15% da renda',
    debt: 'Acima de 15%? Tente renegociar',
    saving: 'Quanto mais, melhor!'
  };
  document.getElementById('expense-bars').innerHTML = (state.expenses || []).map(e => {
    const p = pct(e.amount, totalIncome);
    return `<div class="bar-row">
      <div class="bar-meta"><span class="bar-name">${e.name}</span><span class="bar-amount">${fmt(e.amount)}</span></div>
      <div class="bar-track"><div class="bar-fill ${catColors[e.category] || 'c-green'}" style="width:${p}%"></div></div>
      <div class="bar-tip">${p}% da renda — ${catTips[e.category] || ''}</div>
    </div>`;
  }).join('');
}

window.updateIncome = function(field, val) {
  if (!state.income) state.income = {};
  state.income[field] = parseFloat(val) || 0;
  scheduleSave();
  renderOverview();
};

// ---- DEBTS ----
function renderDebts() {
  const sorted = [...(state.debts || [])].sort((a, b) => a.priority - b.priority);
  const badgeClass = ['', 'p1', 'p2', 'p3'];
  const badgeLabel = ['', '🔴 Prioridade 1', '🟡 Prioridade 2', '🟢 Prioridade 3'];

  if (sorted.length === 0) {
    document.getElementById('debt-list').innerHTML = `<div style="text-align:center;padding:24px;color:var(--text-2);font-size:13px;">Nenhuma dívida cadastrada. Clique em "Adicionar" abaixo.</div>`;
    return;
  }

  document.getElementById('debt-list').innerHTML = sorted.map((d) => {
    const p = pct(d.paid, d.total);
    const pr = Math.min(d.priority, 3);
    return `<div class="debt-item">
      <div class="debt-header">
        <div class="debt-name">${d.name}</div>
        <div class="badge ${badgeClass[pr]}">${badgeLabel[pr]}</div>
      </div>
      <div class="debt-grid">
        <div class="debt-stat"><div class="debt-stat-label">Total devido</div><div class="debt-stat-value">${fmt(d.total)}</div></div>
        <div class="debt-stat"><div class="debt-stat-label">Juros/mês</div><div class="debt-stat-value">${d.interest}%</div></div>
        <div class="debt-stat"><div class="debt-stat-label">Mínimo mensal</div><div class="debt-stat-value">${fmt(d.minimum)}</div></div>
      </div>
      <div class="progress-label"><span>Pago até agora</span><span>${fmt(d.paid)} / ${fmt(d.total)}</span></div>
      <div class="bar-track"><div class="bar-fill c-red" style="width:${p}%"></div></div>
      ${d.tip ? `<div class="debt-tip">💡 ${d.tip}</div>` : ''}
    </div>`;
  }).join('');
}

window.addDebt = function() {
  const name = prompt('Nome da dívida (ex: Cartão Nubank):');
  if (!name) return;
  const total = parseFloat(prompt('Valor total devido (R$):')) || 0;
  const interest = parseFloat(prompt('Juros ao mês (%):')) || 0;
  const minimum = parseFloat(prompt('Pagamento mínimo mensal (R$):')) || 0;
  const paid = parseFloat(prompt('Quanto já foi pago (R$):')) || 0;

  if (!state.debts) state.debts = [];
  state.debts.push({ name, total, interest, minimum, paid, priority: state.debts.length + 1, tip: '' });
  state.debts.sort((a, b) => b.interest - a.interest);
  state.debts.forEach((d, i) => d.priority = i + 1);

  scheduleSave();
  renderDebts();
};

// ---- GOALS ----
function renderGoals() {
  if ((state.goals || []).length === 0) {
    document.getElementById('goal-list').innerHTML = `<div style="text-align:center;padding:24px;color:var(--text-2);font-size:13px;">Nenhuma meta cadastrada ainda.</div>`;
    return;
  }
  document.getElementById('goal-list').innerHTML = (state.goals || []).map((g) => {
    const p = pct(g.saved, g.target);
    const monthsLeft = g.monthly > 0 ? Math.ceil((g.target - g.saved) / g.monthly) : '—';
    return `<div class="goal-item">
      <div class="goal-header"><div class="goal-name">${g.name}</div><div class="goal-emoji">${g.emoji}</div></div>
      <div class="goal-meta"><span>Meta: ${fmt(g.target)}</span><span class="goal-months">${monthsLeft !== '—' ? `~${monthsLeft} meses` : 'Defina o valor mensal'}</span></div>
      <div class="goal-values"><div class="goal-saved">${fmt(g.saved)}</div><div class="goal-target">/ ${fmt(g.target)}</div></div>
      <div class="bar-track"><div class="bar-fill c-green" style="width:${p}%"></div></div>
      <div class="bar-tip" style="margin-top:4px">${p}% concluído${g.monthly > 0 ? ` · Guardando ${fmt(g.monthly)}/mês` : ''}</div>
      ${g.tip ? `<div class="goal-tip">💡 ${g.tip}</div>` : ''}
    </div>`;
  }).join('');
}

window.addGoal = function() {
  const name = prompt('Nome da meta (ex: Viagem para Portugal):');
  if (!name) return;
  const emoji = prompt('Emoji (ex: ✈️):') || '🎯';
  const target = parseFloat(prompt('Valor total da meta (R$):')) || 0;
  const saved = parseFloat(prompt('Quanto já foi guardado (R$):')) || 0;
  const monthly = parseFloat(prompt('Quanto vai guardar por mês (R$):')) || 0;

  if (!state.goals) state.goals = [];
  state.goals.push({ name, emoji, target, saved, monthly, tip: '' });
  scheduleSave();
  renderGoals();
};

// ---- SCORE ----
function renderScore() {
  const score = state.score?.value || 0;
  document.getElementById('score-number').textContent = score;
  document.getElementById('score-bar-fill').style.width = Math.round((score / 1000) * 100) + '%';
  const labels = [[0,'Ruim'],[300,'Regular'],[700,'Bom'],[850,'Ótimo'],[1000,'Excelente']];
  const current = labels.filter(l => score >= l[0]).pop();
  document.getElementById('score-status').textContent = current ? current[1] + (score < 700 ? ' — mas melhorando 📈' : ' 🎉') : '';

  const negative = (state.score?.actions || []).filter(a => a.icon === '⚠️');
  const positive = (state.score?.actions || []).filter(a => a.icon !== '⚠️');
  document.getElementById('score-negative').innerHTML = negative.length
    ? renderActions(negative)
    : `<div style="padding:12px;font-size:13px;color:var(--text-2)">Nenhuma negativação detectada. Ótimo! ✅</div>`;
  document.getElementById('score-positive').innerHTML = renderActions(positive);
}

function renderActions(actions) {
  return actions.map(a => `
    <div class="action-item">
      <div class="action-icon ${a.iconClass}">${a.icon}</div>
      <div class="action-body">
        <div class="action-title">${a.title}</div>
        <div class="action-desc">${a.desc}</div>
      </div>
      <button class="check-btn ${a.done ? 'done' : ''}" onclick="toggleAction(${a.id})"></button>
    </div>`).join('');
}

window.toggleAction = function(id) {
  const action = state.score?.actions?.find(a => a.id === id);
  if (action) {
    action.done = !action.done;
    if (action.done) state.score.value = Math.min(1000, (state.score.value || 0) + 15);
    else state.score.value = Math.max(0, (state.score.value || 0) - 15);
    document.getElementById('topbar-score').textContent = 'Score ' + state.score.value;
    scheduleSave();
    renderScore();
  }
};

window.updateScore = function(val) {
  if (!state.score) state.score = {};
  state.score.value = parseInt(val) || 0;
  document.getElementById('topbar-score').textContent = 'Score ' + state.score.value;
  scheduleSave();
  renderScore();
};
