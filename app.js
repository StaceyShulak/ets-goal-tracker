// ETC Goal Tracker - Firebase Realtime Database
const $ = (id) => document.getElementById(id);
let db = null;
let goals = [];
let editingId = null;

function initFirebase() {
  if (!window.firebaseConfig) {
    alert('Firebase config missing');
    return;
  }
  firebase.initializeApp(window.firebaseConfig);
  db = firebase.database();
  loadGoals();
}

function loadGoals() {
  if (!db) return;
  db.ref('goals').on('value', (snapshot) => {
    const data = snapshot.val();
    goals = data ? (Array.isArray(data) ? data : Object.values(data)) : [];
    render();
  });
}

function saveGoal(goal) {
  if (!db) return;
  const id = goal.id || 'g' + Date.now();
  goal.id = id;
  db.ref('goals/' + id).set(goal).then(() => {
    showToast('Goal saved!');
  }).catch((error) => {
    showToast('Save failed: ' + error.message);
  });
}

function deleteGoal(id) {
  if (!db || !confirm('Delete this goal?')) return;
  db.ref('goals/' + id).remove().then(() => {
    showToast('Goal deleted');
  }).catch((error) => {
    showToast('Delete failed');
  });
}

function render() {
  const list = $('goalList');
  const dash = $('dash');

  if (!goals.length) {
    list.innerHTML = '<div class="empty"><h2>No goals yet</h2><p>Create your first goal to get started</p></div>';
    dash.innerHTML = '<div class="card"><div class="num">0</div><div class="lbl">Total Goals</div></div>' +
      '<div class="card"><div class="num">0</div><div class="lbl">In Progress</div></div>' +
      '<div class="card"><div class="num">0</div><div class="lbl">Completed</div></div>' +
      '<div class="card"><div class="num">0</div><div class="lbl">At Risk</div></div>';
    return;
  }

  const total = goals.length;
  const inProgress = goals.filter(g => g.status === 'in-progress').length;
  const completed = goals.filter(g => g.status === 'completed').length;
  const atRisk = goals.filter(g => g.status === 'at-risk').length;

  dash.innerHTML = `
    <div class="card"><div class="num">${total}</div><div class="lbl">Total Goals</div></div>
    <div class="card"><div class="num">${inProgress}</div><div class="lbl">In Progress</div></div>
    <div class="card"><div class="num">${completed}</div><div class="lbl">Completed</div></div>
    <div class="card"><div class="num">${atRisk}</div><div class="lbl">At Risk</div></div>
  `;

  list.innerHTML = goals.map(goal => `
    <div class="goal-card">
      <div class="goal-header">
        <div>
          <div class="goal-title">${escapeHtml(goal.name)}</div>
          <div class="goal-meta">${goal.category} • ${goal.frequency}</div>
          <span class="goal-status ${goal.status}">${goal.status}</span>
        </div>
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

function editGoal(id) {
  const goal = goals.find(g => g.id === id);
  if (!goal) return;
  editingId = id;
  $('modalTitle').textContent = 'Edit Goal';
  $('f_goal').value = goal.name;
  $('f_category').value = goal.category;
  $('f_frequency').value = goal.frequency;
  $('f_status').value = goal.status;
  $('f_priority').value = goal.priority;
  $('f_deadline').value = goal.deadline || '';
  $('f_notes').value = goal.notes || '';
  $('overlay').classList.add('show');
}

function showModal() {
  editingId = null;
  $('modalTitle').textContent = 'Add Goal';
  $('f_goal').value = '';
  $('f_category').value = 'Health';
  $('f_frequency').value = 'Daily';
  $('f_status').value = 'in-progress';
  $('f_priority').value = 'medium';
  $('f_deadline').value = '';
  $('f_notes').value = '';
  $('overlay').classList.add('show');
}

function hideModal() {
  $('overlay').classList.remove('show');
}

function showToast(msg) {
  const t = $('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 1800);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

$('addBtn').onclick = showModal;
$('cancelBtn').onclick = hideModal;
$('saveBtn').onclick = () => {
  const goal = {
    id: editingId,
    name: $('f_goal').value,
    category: $('f_category').value,
    frequency: $('f_frequency').value,
    status: $('f_status').value,
    priority: $('f_priority').value,
    deadline: $('f_deadline').value,
    notes: $('f_notes').value,
    created: editingId ? undefined : new Date().toISOString()
  };
  if (!goal.name) {
    showToast('Goal name required');
    return;
  }
  saveGoal(goal);
  hideModal();
};

window.addEventListener('DOMContentLoaded', initFirebase);
