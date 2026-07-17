const $ = (id) => document.getElementById(id);
let db = null;
let goals = [];

function initFirebase() {
  if (!window.firebaseConfig) return;
  firebase.initializeApp(window.firebaseConfig);
  db = firebase.database();
  loadGoals();
}

function loadGoals() {
  if (!db) return;
  db.ref('goals').on('value', (snapshot) => {
    const data = snapshot.val();
    if (data && typeof data === 'object' && !Array.isArray(data)) {
      goals = Object.values(data);
    } else if (Array.isArray(data)) {
      goals = data;
    } else {
      goals = [];
    }
    render();
  });
}

function render() {
  const list = $('goalList');
  const dash = $('dash');

  if (!goals || !goals.length) {
    dash.innerHTML = '<div class="card"><div class="num">0</div><div class="lbl">Total</div></div><div class="card"><div class="num">0</div><div class="lbl">In Progress</div></div><div class="card"><div class="num">0</div><div class="lbl">Completed</div></div><div class="card"><div class="num">0</div><div class="lbl">At Risk</div></div>';
    list.innerHTML = '<div class="empty"><h2>No goals</h2></div>';
    return;
  }

  const total = goals.length;
  const inProgress = goals.filter(g => g.status === 'in-progress').length;
  const completed = goals.filter(g => g.status === 'completed').length;
  const atRisk = goals.filter(g => g.status === 'at-risk').length;

  dash.innerHTML = `<div class="card"><div class="num">${total}</div><div class="lbl">Total</div></div><div class="card"><div class="num">${inProgress}</div><div class="lbl">In Progress</div></div><div class="card"><div class="num">${completed}</div><div class="lbl">Completed</div></div><div class="card"><div class="num">${atRisk}</div><div class="lbl">At Risk</div></div>`;

  list.innerHTML = goals.map(g => `
    <div class="goal-card">
      <div class="goal-title">${escapeHtml(g.name)}</div>
      <div class="goal-meta">${g.category} • ${g.frequency}</div>
      <span class="goal-status ${g.status}">${g.status}</span>
      ${g.notes ? '<div class="notes">' + escapeHtml(g.notes) + '</div>' : ''}
      <div class="goal-bottom">
        <button class="btn ghost small" onclick="editGoal('${g.id}')">Edit</button>
        <button class="btn ghost small" onclick="deleteGoal('${g.id}')">Delete</button>
      </div>
    </div>
  `).join('');
}

function saveGoal(goal) {
  if (!db) return;
  const id = goal.id || 'g' + Date.now();
  goal.id = id;
  db.ref('goals/' + id).set(goal);
  showToast('Saved!');
}

function deleteGoal(id) {
  if (!db || !confirm('Delete?')) return;
  db.ref('goals/' + id).remove();
}

function editGoal(id) {
  const goal = goals.find(g => g.id === id);
  if (!goal) return;
  $('modalTitle').textContent = 'Edit';
  $('f_goal').value = goal.name;
  $('f_category').value = goal.category;
  $('f_frequency').value = goal.frequency;
  $('f_status').value = goal.status;
  $('f_priority').value = goal.priority;
  $('f_deadline').value = goal.deadline || '';
  $('f_notes').value = goal.notes || '';
  $('overlay').classList.add('show');
}

$('addBtn').onclick = () => {
  $('modalTitle').textContent = 'Add Goal';
  $('f_goal').value = '';
  $('f_category').value = 'Health';
  $('f_frequency').value = 'Daily';
  $('f_status').value = 'in-progress';
  $('f_priority').value = 'medium';
  $('f_deadline').value = '';
  $('f_notes').value = '';
  $('overlay').classList.add('show');
};

$('cancelBtn').onclick = () => $('overlay').classList.remove('show');

$('saveBtn').onclick = () => {
  const name = $('f_goal').value;
  if (!name) return alert('Name required');
  const goal = {
    id: Math.random().toString(36).substr(2, 9),
    name: name,
    category: $('f_category').value,
    frequency: $('f_frequency').value,
    status: $('f_status').value,
    priority: $('f_priority').value,
    deadline: $('f_deadline').value,
    notes: $('f_notes').value
  };
  saveGoal(goal);
  $('overlay').classList.remove('show');
};

function showToast(msg) {
  $('toast').textContent = msg;
  $('toast').classList.add('show');
  setTimeout(() => $('toast').classList.remove('show'), 1500);
}

function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

window.addEventListener('DOMContentLoaded', initFirebase);
