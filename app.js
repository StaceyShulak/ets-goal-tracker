let db = null;
let goals = [];

function initApp() {
  console.log('initApp called');
  if (!window.firebaseConfig) {
    console.error('NO CONFIG FOUND');
    return;
  }
  console.log('config found, initializing firebase');
  firebase.initializeApp(window.firebaseConfig);
  db = firebase.database();
  console.log('firebase initialized, db =', db);
  loadFromFirebase();
}

function loadFromFirebase() {
  console.log('loadFromFirebase called');
  if (!db) {
    console.error('DB NOT INITIALIZED');
    return;
  }

  db.ref('goals').once('value').then(snapshot => {
    console.log('snapshot received:', snapshot.val());
    const data = snapshot.val() || {};
    console.log('data:', data);
    goals = Object.values(data).filter(g => g && typeof g === 'object');
    console.log('parsed goals array:', goals);
    render();

    // Listen for future changes
    db.ref('goals').on('value', snap => {
      console.log('listener fired, new data:', snap.val());
      const d = snap.val() || {};
      goals = Object.values(d).filter(g => g && typeof g === 'object');
      console.log('listener updated goals:', goals);
      render();
    });
  }).catch(err => {
    console.error('loadFromFirebase error:', err);
  });
}

function render() {
  console.log('render() called with goals:', goals);

  const list = document.getElementById('goalList');
  const dash = document.getElementById('dash');

  console.log('list element:', list);
  console.log('dash element:', dash);

  if (!list || !dash) {
    console.error('MISSING ELEMENTS: list=' + !!list + ', dash=' + !!dash);
    return;
  }

  const total = goals.length;
  const inProgress = goals.filter(g => g.status === 'in-progress').length;
  const completed = goals.filter(g => g.status === 'completed').length;
  const atRisk = goals.filter(g => g.status === 'at-risk').length;

  console.log('stats:', { total, inProgress, completed, atRisk });

  dash.innerHTML = `
    <div class="card"><div class="num">${total}</div><div class="lbl">Total Goals</div></div>
    <div class="card"><div class="num">${inProgress}</div><div class="lbl">In Progress</div></div>
    <div class="card"><div class="num">${completed}</div><div class="lbl">Completed</div></div>
    <div class="card"><div class="num">${atRisk}</div><div class="lbl">At Risk</div></div>
  `;

  if (!goals.length) {
    console.log('no goals, showing empty state');
    list.innerHTML = '<div class="empty"><h2>No goals yet</h2><p>Create your first goal to get started</p></div>';
    return;
  }

  console.log('rendering', goals.length, 'goals');
  list.innerHTML = goals.map(g => `
    <div class="goal-card">
      <div class="goal-header">
        <div>
          <div class="goal-title">${escapeHtml(g.name || '')}</div>
          <div class="goal-meta">${g.category || ''} • ${g.frequency || ''}</div>
          <span class="goal-status ${g.status || ''}">${g.status || 'pending'}</span>
        </div>
      </div>
      ${g.notes ? '<div class="notes">' + escapeHtml(g.notes) + '</div>' : ''}
      <div class="goal-bottom">
        <div class="actions">
          <button class="btn ghost small" onclick="editGoal('${g.id || g.name}')">Edit</button>
          <button class="btn ghost small" onclick="deleteGoal('${g.id || g.name}')">Delete</button>
        </div>
      </div>
    </div>
  `).join('');
  console.log('render complete');
}

function saveGoal() {
  console.log('saveGoal called');
  const name = document.getElementById('f_goal').value;
  if (!name) return alert('Goal name required');

  const goal = {
    id: Date.now().toString(),
    name,
    category: document.getElementById('f_category').value,
    frequency: document.getElementById('f_frequency').value,
    status: document.getElementById('f_status').value,
    priority: document.getElementById('f_priority').value,
    deadline: document.getElementById('f_deadline').value || '',
    notes: document.getElementById('f_notes').value || ''
  };

  console.log('saving goal:', goal);
  db.ref('goals/' + goal.id).set(goal).then(() => {
    console.log('save successful');
    closeModal();
    showToast('Saved!');
  }).catch(err => {
    console.error('save error:', err);
  });
}

function editGoal(id) {
  const goal = goals.find(g => (g.id || g.name) === id);
  if (!goal) return;

  document.getElementById('modalTitle').textContent = 'Edit Goal';
  document.getElementById('f_goal').value = goal.name;
  document.getElementById('f_category').value = goal.category || '';
  document.getElementById('f_frequency').value = goal.frequency || '';
  document.getElementById('f_status').value = goal.status || 'in-progress';
  document.getElementById('f_priority').value = goal.priority || 'medium';
  document.getElementById('f_deadline').value = goal.deadline || '';
  document.getElementById('f_notes').value = goal.notes || '';
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

console.log('app.js loaded, waiting for DOMContentLoaded');
window.addEventListener('DOMContentLoaded', initApp);
