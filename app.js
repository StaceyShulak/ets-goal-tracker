let db = null;
let goals = [];

function initApp() {
  if (!window.firebaseConfig) return;
  firebase.initializeApp(window.firebaseConfig);
  db = firebase.database();
  loadFromFirebase();
}

function loadFromFirebase() {
  db.ref('goals').on('value', snapshot => {
    const data = snapshot.val() || {};
    goals = Object.keys(data).map(key => ({...data[key], id: key}));
    render();
  });
}

function render() {
  const list = document.getElementById('goalList');
  const dash = document.getElementById('dash');

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

  if (!goals.length) {
    list.innerHTML = '<div class="empty"><h2>No goals yet</h2><p>Create your first goal to get started</p></div>';
    return;
  }

  list.innerHTML = goals.map(g => `
    <div class="goal-card">
      <div class="goal-header">
        <div>
          <div class="goal-title">${escapeHtml(g.name)}</div>
          <div class="goal-meta">${g.category} • ${g.frequency}</div>
          <span class="goal-status ${g.status}">${g.status}</span>
        </div>
      </div>
      ${g.notes ? '<div class="notes">' + escapeHtml(g.notes) + '</div>' : ''}
      <div class="goal-bottom">
        <div class="actions">
          <button class="btn ghost small" onclick="editGoal('${g.id}')">Edit</button>
          <button class="btn ghost small" onclick="deleteGoal('${g.id}')">Delete</button>
        </div>
      </div>
    </div>
  `).join('');
}

function saveGoal() {
  const name = document.getElementById('f_goal').value;
  if (!name) return alert('Goal name required');

  const goal = {
    name,
    category: document.getElementById('f_category').value,
    frequency: document.getElementById('f_frequency').value,
    status: document.getElementById('f_status').value,
    priority: document.getElementById('f_priority').value,
    deadline: document.getElementById('f_deadline').value || '',
    notes: document.getElementById('f_notes').value || ''
  };

  db.ref('goals/' + Date.now()).set(goal);
  closeModal();
  showToast('Goal saved!');
}

function editGoal(id) {
  const goal = goals.find(g => g.id === id);
  if (!goal) return;

  document.getElementById('modalTitle').textContent = 'Edit Goal';
  document.getElementById('f_goal').value = goal.name;
  document.getElementById('f_category').value = goal.category;
  document.getElementById('f_frequency').value = goal.frequency;
  document.getElementById('f_status').value = goal.status;
  document.getElementById('f_priority').value = goal.priority;
  document.getElementById('f_deadline').value = goal.deadline;
  document.getElementById('f_notes').value = goal.notes;
  document.getElementById('overlay').classList.add('show');
}

function deleteGoal(id) {
  if (!confirm('Delete this goal?')) return;
  db.ref('goals/' + id).remove();
}

function closeModal() {
  document.getElementById('overlay').classList.remove('show');
}

function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  setTimeout(() => t.classList.remove('show'), 1800);
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

window.addEventListener('DOMContentLoaded', initApp);
