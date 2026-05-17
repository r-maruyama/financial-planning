// ============================================
// MEU PLANO FINANCEIRO — App JS
// Data persists in localStorage
// ============================================

// ---- STATE ----
const DEFAULT_STATE = {
  income: { salary: 2800, extra: 0 },
  expenses: [
    { name: '🏠 Essencial (aluguel, luz, água)', amount: 1400, category: 'essential' },
    { name: '🍕 Lazer e alimentação fora', amount: 420, category: 'leisure' },
    { name: '💳 Pagamento de dívidas', amount: 520, category: 'debt' },
  ],
  debts: [
    { name: 'Cartão Nubank', total: 1840, interest: 12.5, minimum: 92, paid: 360, priority: 1, tip: 'Cartão de crédito cobra os maiores juros do Brasil. Pague o máximo que puder aqui antes das outras dívidas.' },
    { name: 'Empréstimo Banco do Brasil', total: 3200, interest: 3.2, minimum: 280, paid: 800, priority: 2, tip: 'Juros menores que cartão, mas ainda pesado. Pague o mínimo aqui enquanto ataca o cartão.' },
    { name: 'Conta de água atrasada', total: 340, interest: 2, minimum: 340, paid: 0, priority: 3, tip: 'Menor juros — mas não deixe acumular. Tente negociar parcelamento direto com a concessionária.' },
  ],
  goals: [
    { name: 'Reserva de emergência', emoji: '🛡️', target: 1400, saved: 200, monthly: 200, tip: 'Esse é o colchão que impede você de se endividar de novo em emergências.' },
    { name: 'Celular novo', emoji: '📱', target: 1200, saved: 150, monthly: 150, tip: '' },
    { name: 'Viagem com o casal', emoji: '🌍', target: 4000, saved: 0, monthly: 0, tip: 'Começa depois de quitar o cartão 🙂' },
  ],
  score: {
    value: 542,
    actions: [
      { id: 1, icon: '⚠️', iconClass: 'r', title: 'Cartão Nubank em atraso', desc: 'Dívida em aberto reduz pontos todo mês. Prioridade máxima.', done: false },
      { id: 2, icon: '⚠️', iconClass: 'r', title: 'Conta de água negativada no Serasa', desc: 'Negativação ativa derruba score em até 100 pts. Quite logo.', done: false },
      { id: 3, icon: '✅', iconClass: 'g', title: 'Pagar contas em dia todo mês', desc: 'Cada mês sem atraso sobe o score. Automatize o débito.', done: true },
      { id: 4, icon: '📋', iconClass: 'y', title: 'Atualizar cadastro no Serasa', desc: 'Cadastro completo e atualizado vale até +50 pts. Grátis.', done: false },
      { id: 5, icon: '💳', iconClass: 'g', title: 'Usar menos de 30% do limite do cartão', desc: 'Uso alto do limite sinaliza risco. Mantenha abaixo de 30%.', done: false },
      { id: 6, icon: '🤝', iconClass: 'y', title: 'Negociar e quitar dívida em atraso', desc: 'Score sobe em até 90 dias após quitação. Negocie agora.', done: false },
    ]
  }
};

// Load state from localStorage or use defaults
let state = JSON.parse(localStorage.getItem('meuPlanoState')) || JSON.parse(JSON.stringify(DEFAULT_STATE));

function saveState() {
  localStorage.setItem('meuPlanoState', JSON.stringify(state));
}

// ---- NAVIGATION ----
function navigate(page) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-item, .mobile-nav-item').forEach(n => n.classList.remove('active'));
  document.getElementById('page-' + page).classList.add('active');
  document.querySelectorAll(`[data-page="${page}"]`).forEach(n => n.classList.add('active'));
  renderPage(page);
}

function renderPage(page) {
  if (page === 'overview') renderOverview();
  if (page === 'debts') renderDebts();
  if (page === 'goals') renderGoals();
  if (page === 'score') renderScore();
}

// ---- HELPERS ----
function fmt(n) {
  return 'R$' + Number(n).toLocaleString('pt-BR', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function pct(part, total) {
  return total === 0 ? 0 : Math.min(100, Math.round((part / total) * 100));
}

function barFill(container, percent, colorClass) {
  container.innerHTML = `<div class="bar-fill ${colorClass}" style="width:${percent}%"></div>`;
}

// ---- OVERVIEW ----
function renderOverview() {
  const totalIncome = state.income.salary + state.income.extra;
  const totalExpenses = state.expenses.reduce((s, e) => s + e.amount, 0);
  const balance = totalIncome - totalExpenses;

  document.getElementById('ov-income').textContent = fmt(totalIncome);
  document.getElementById('ov-expense').textContent = fmt(totalExpenses);
  document.getElementById('ov-balance').textContent = fmt(balance);
  document.getElementById('ov-balance-label').textContent = balance >= 0 ? 'sobrando' : 'faltando';

  document.getElementById('in-salary').value = state.income.salary;
  document.getElementById('in-extra').value = state.income.extra;

  // Expense bars
  const barsEl = document.getElementById('expense-bars');
  const catColors = { essential: 'c-green', leisure: 'c-yellow', debt: 'c-red', saving: 'c-blue' };
  const catTips = {
    essential: 'Limite recomendado: 50% da renda',
    leisure: 'Limite recomendado: 15% da renda',
    debt: 'Acima de 15%? Tente renegociar',
    saving: 'Quanto mais, melhor!'
  };
  barsEl.innerHTML = state.expenses.map(e => {
    const p = pct(e.amount, totalIncome);
    return `<div class="bar-row">
      <div class="bar-meta"><span class="bar-name">${e.name}</span><span class="bar-amount">${fmt(e.amount)}</span></div>
      <div class="bar-track"><div class="bar-fill ${catColors[e.category] || 'c-green'}" style="width:${p}%"></div></div>
      <div class="bar-tip">${p}% da renda — ${catTips[e.category] || ''}</div>
    </div>`;
  }).join('');
}

function updateIncome(field, val) {
  const n = parseFloat(val.replace(/[^\d,\.]/g, '').replace(',', '.')) || 0;
  state.income[field] = n;
  saveState();
  renderOverview();
}

// ---- DEBTS ----
function renderDebts() {
  const sorted = [...state.debts].sort((a, b) => a.priority - b.priority);
  const el = document.getElementById('debt-list');
  const badgeClass = ['', 'p1', 'p2', 'p3'];
  const badgeLabel = ['', '🔴 Prioridade 1', '🟡 Prioridade 2', '🟢 Prioridade 3'];

  el.innerHTML = sorted.map((d, i) => {
    const p = pct(d.paid, d.total);
    return `<div class="debt-item">
      <div class="debt-header">
        <div class="debt-name">${d.name}</div>
        <div class="badge ${badgeClass[d.priority]}">${badgeLabel[d.priority]}</div>
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

function addDebt() {
  const name = prompt('Nome da dívida (ex: Cartão Itaú):');
  if (!name) return;
  const total = parseFloat(prompt('Valor total devido (R$):')) || 0;
  const interest = parseFloat(prompt('Juros ao mês (%):')) || 0;
  const minimum = parseFloat(prompt('Pagamento mínimo mensal (R$):')) || 0;
  const paid = parseFloat(prompt('Quanto já foi pago (R$):')) || 0;

  state.debts.push({ name, total, interest, minimum, paid, priority: state.debts.length + 1, tip: '' });

  // Re-sort by interest rate (highest = priority 1)
  state.debts.sort((a, b) => b.interest - a.interest);
  state.debts.forEach((d, i) => d.priority = i + 1);

  saveState();
  renderDebts();
}

// ---- GOALS ----
function renderGoals() {
  const el = document.getElementById('goal-list');
  el.innerHTML = state.goals.map((g, i) => {
    const p = pct(g.saved, g.target);
    const monthsLeft = g.monthly > 0 ? Math.ceil((g.target - g.saved) / g.monthly) : '—';
    return `<div class="goal-item">
      <div class="goal-header"><div class="goal-name">${g.name}</div><div class="goal-emoji">${g.emoji}</div></div>
      <div class="goal-meta"><span>Meta: ${fmt(g.target)}</span><span class="goal-months">${monthsLeft !== '—' ? `~${monthsLeft} meses` : 'Define o valor mensal'}</span></div>
      <div class="goal-values"><div class="goal-saved">${fmt(g.saved)}</div><div class="goal-target">/ ${fmt(g.target)}</div></div>
      <div class="bar-track"><div class="bar-fill c-green" style="width:${p}%"></div></div>
      <div class="bar-tip" style="margin-top:4px">${p}% concluído${g.monthly > 0 ? ` · Guardando ${fmt(g.monthly)}/mês` : ''}</div>
      ${g.tip ? `<div class="goal-tip">💡 ${g.tip}</div>` : ''}
    </div>`;
  }).join('');
}

function addGoal() {
  const name = prompt('Nome da meta (ex: Viagem para Portugal):');
  if (!name) return;
  const emoji = prompt('Emoji para a meta (ex: ✈️):') || '🎯';
  const target = parseFloat(prompt('Valor total da meta (R$):')) || 0;
  const saved = parseFloat(prompt('Quanto já foi guardado (R$):')) || 0;
  const monthly = parseFloat(prompt('Quanto vai guardar por mês (R$):')) || 0;

  state.goals.push({ name, emoji, target, saved, monthly, tip: '' });
  saveState();
  renderGoals();
}

// ---- SCORE ----
function renderScore() {
  const score = state.score.value;
  const fillPct = Math.round((score / 1000) * 100);
  document.getElementById('score-number').textContent = score;
  document.getElementById('score-bar-fill').style.width = fillPct + '%';

  const labels = [[0,'Ruim'],[300,'Regular'],[700,'Bom'],[850,'Ótimo'],[1000,'Excelente']];
  const current = labels.filter(l => score >= l[0]).pop();
  document.getElementById('score-status').textContent = current ? current[1] + ' — mas melhorando 📈' : '';

  const negative = state.score.actions.filter(a => a.icon === '⚠️');
  const positive = state.score.actions.filter(a => a.icon !== '⚠️');

  document.getElementById('score-negative').innerHTML = renderActions(negative);
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

function toggleAction(id) {
  const action = state.score.actions.find(a => a.id === id);
  if (action) {
    action.done = !action.done;
    if (action.done) state.score.value = Math.min(1000, state.score.value + 15);
    else state.score.value = Math.max(0, state.score.value - 15);
    saveState();
    renderScore();
    // Update score chip in topbar
    document.getElementById('topbar-score').textContent = 'Score ' + state.score.value;
  }
}

function updateScore(val) {
  state.score.value = parseInt(val) || 0;
  saveState();
  renderScore();
  document.getElementById('topbar-score').textContent = 'Score ' + state.score.value;
}

// ---- RESET ----
function resetData() {
  if (confirm('Apagar todos os dados e voltar ao exemplo? Isso não pode ser desfeito.')) {
    localStorage.removeItem('meuPlanoState');
    state = JSON.parse(JSON.stringify(DEFAULT_STATE));
    saveState();
    navigate('overview');
  }
}

// ---- INIT ----
document.addEventListener('DOMContentLoaded', () => {
  navigate('overview');
  document.getElementById('topbar-score').textContent = 'Score ' + state.score.value;
});
