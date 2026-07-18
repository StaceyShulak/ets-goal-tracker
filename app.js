// ETS Goal Tracker - Based on working Message Library structure
let db = null;
let goals = [];

function initFirebase() {
  if (!window.firebaseConfig) {
    console.error('Firebase config missing');
    return;
  }
  firebase.initializeApp(window.firebaseConfig);
  db = firebase.database();
  loadGoals();
}

function loadGoals() {
  if (!db) return;
  db.ref('goals').on('value', (snapshot) => {
    goals = snapshot.val() || [];
    if (!Array.isArray(goals)) {
      goals = Object.keys(goals || {}).map(k => ({...goals[k], id: k}));
    }
    renderGoals();
  });
}

function renderGoals() {
  const container = document.getElementById('goalList');
  const dash = document.getElementById('dash');

  if (!goals || !goals.length) {
    container.innerHTML = '<div class="empty"><h2>No goals yet</h2></div>';
    dash.innerHTML = '<div class="card"><div class="num">0</div><div class="lbl">Total</div></div>' +
      '<div class="card"><div class="num">0</div><div class="lbl">In Progress</div></div>' +
      '<div class="card"><div class="num">0</div><div class="lbl">Completed</div></div>' +
      '<div class="card"><div class="num">0</div><div class="lbl">At Risk</div></div>';
    return;
  }

  const total = goals.length;
  const inProgress = (goals.filter(g => g.status === 'in-progress') || []).length;
  const completed = (goals.filter(g => g.status === 'completed') || []).length;
  const atRisk = (goals.filter(g => g.status === 'at-risk') || []).length;

  dash.innerHTML = `
    <div class="card"><div class="num">${total}</div><div class="lbl">Total</div></div>
    <div class="card"><div class="num">${inProgress}</div><div class="lbl">In Progress</div></div>
    <div class="card"><div class="num">${completed}</div><div class="lbl">Completed</div></div>
    <div class="card"><div class="num">${atRisk}</div><div class="lbl">At Risk</div></div>
  `;

  container.innerHTML = goals.map(goal => `
    <div class="goal-card">
      <div class="goal-header">
        <div class="goal-title">${escapeHtml(goal.name || '')}</div>
        <div class="goal-meta">${goal.category || ''} • ${goal.frequency || ''}</div>
        <span class="goal-status ${goal.status || ''}">${goal.status || 'pending'}</span>
      </div>
      ${goal.notes ? '<div class="notes">' + escapeHtml(goal.notes) + '</div>' : ''}
      <div class="goal-bottom">
        <div class="actions">
          <button class="btn ghost small" onclick="editGoal('${goal.id}')">Edit</button>
          <button class="btn ghost small" onclick="deleteGoal('${goal.id}')">Delete</button>
        </div>
      </div>
    </div>
  `).join('');
}

function saveGoal() {
  const name = document.getElementById('f_goal').value;
  if (!name) {
    showToast('Name required');
    return;
  }

  const goal = {
    id: Date.now().toString(),
    name: name,
    category: document.getElementById('f_category').value,
    frequency: document.getElementById('f_frequency').value,
    status: document.getElementById('f_status').value,
    priority: document.getElementById('f_priority').value,
    deadline: document.getElementById('f_deadline').value,
    notes: document.getElementById('f_notes').value
  };

  if (db) {
    db.ref('goals/' + goal.id).set(goal, (error) => {
      if (error) {
        showToast('Save failed');
      } else {
        showToast('Saved!');
        closeModal();
      }
    });
  }
}

function editGoal(id) {
  const goal = goals.find(g => g.id === id);
  if (!goal) return;

  document.getElementById('modalTitle').textContent = 'Edit Goal';
  document.getElementById('f_goal').value = goal.name || '';
  document.getElementById('f_category').value = goal.category || '';
  document.getElementById('f_frequency').value = goal.frequency || '';
  document.getElementById('f_status').value = goal.status || '';
  document.getElementById('f_priority').value = goal.priority || '';
  document.getElementById('f_deadline').value = goal.deadline || '';
  document.getElementById('f_notes').value = goal.notes || '';
  document.getElementById('overlay').classList.add('show');
}

function deleteGoal(id) {
  if (!confirm('Delete this goal?')) return;
  if (db) {
    db.ref('goals/' + id).remove();
  }
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 1800);
}

function closeModal() {
  document.getElementById('overlay').classList.remove('show');
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

document.getElementById('addBtn').onclick = () => {
  document.getElementById('modalTitle').textContent = 'Add Goal';
  document.getElementById('f_goal').value = '';
  document.getElementById('f_category').value = 'Health';
  document.getElementById('f_frequency').value = 'Daily';
  document.getElementById('f_status').value = 'in-progress';
  document.getElementById('f_priority').value = 'medium';
  document.getElementById('f_deadline').value = '';
  document.getElementById('f_notes').value = '';
  document.getElementById('overlay').classList.add('show');
};

document.getElementById('cancelBtn').onclick = closeModal;
document.getElementById('saveBtn').onclick = saveGoal;

window.addEventListener('DOMContentLoaded', initFirebase);
