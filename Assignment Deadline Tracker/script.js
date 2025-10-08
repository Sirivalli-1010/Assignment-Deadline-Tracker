// DOM Elements
const assignmentForm = document.getElementById('assignmentForm');
const assignmentsContainer = document.getElementById('assignmentsContainer');
const studySchedule = document.getElementById('studySchedule');
const calendarView = document.getElementById('calendarView');
const filterButtons = document.querySelectorAll('.filter-btn');
const totalCount = document.getElementById('totalCount');
const pendingCount = document.getElementById('pendingCount');
const completedCount = document.getElementById('completedCount');
const badgesContainer = document.getElementById('badges');

let currentFilter = 'all';
let assignments = [];

// Load assignments from LocalStorage
function loadAssignments() {
    const data = localStorage.getItem('assignments');
    assignments = data ? JSON.parse(data) : [];
    updateAssignments();
    checkNotifications();
}

// Save assignments to LocalStorage
function saveAssignments() {
    localStorage.setItem('assignments', JSON.stringify(assignments));
}

// Add Assignment
assignmentForm.addEventListener('submit', e => {
    e.preventDefault();
    const subject = document.getElementById('subject').value.trim();
    const description = document.getElementById('description').value.trim();
    const deadline = document.getElementById('deadline').value;
    const priority = document.getElementById('priority').value;

    if (!subject || !description || !deadline) return;

    assignments.push({
        id: Date.now(),
        subject,
        description,
        deadline,
        priority,
        completed: false
    });

    saveAssignments();
    assignmentForm.reset();
    updateAssignments();
    checkNotifications();
});

// Update assignments display
function updateAssignments() {
    displayAssignments();
    updateStats();
    generateStudySchedule();
    generateCalendar();
    updateBadges();
}

// Filter & display assignments
function displayAssignments() {
    assignmentsContainer.innerHTML = '';
    let filtered = assignments;
    if (currentFilter === 'pending') filtered = assignments.filter(a => !a.completed);
    if (currentFilter === 'completed') filtered = assignments.filter(a => a.completed);

    if (filtered.length === 0) {
        assignmentsContainer.innerHTML = '<p>No assignments to display</p>';
        return;
    }

    filtered.forEach(a => {
        const card = document.createElement('div');
        card.className = 'assignment-card ' + (a.completed ? 'completed' : '');
        card.innerHTML = `
            <div class="assignment-header">
                <div>${a.subject}</div>
                <div class="priority-${a.priority}">${a.priority.toUpperCase()}</div>
            </div>
            <div>${a.description}</div>
            <div>Due: ${new Date(a.deadline).toLocaleString()}</div>
            <div class="assignment-actions">
                <button onclick="toggleComplete(${a.id})">${a.completed ? '↶ Incomplete' : '✓ Complete'}</button>
                <button onclick="deleteAssignment(${a.id})">🗑 Delete</button>
            </div>
        `;
        assignmentsContainer.appendChild(card);
    });
}

// Toggle completion
function toggleComplete(id) {
    assignments = assignments.map(a => a.id === id ? {...a, completed: !a.completed} : a);
    saveAssignments();
    updateAssignments();
}

// Delete assignment
function deleteAssignment(id) {
    assignments = assignments.filter(a => a.id !== id);
    saveAssignments();
    updateAssignments();
}

// Update stats
function updateStats() {
    totalCount.textContent = assignments.length;
    pendingCount.textContent = assignments.filter(a => !a.completed).length;
    completedCount.textContent = assignments.filter(a => a.completed).length;
}

// Filter buttons
filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
        currentFilter = btn.dataset.filter;
        filterButtons.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        displayAssignments();
    });
});

// Generate simple study schedule
function generateStudySchedule() {
    studySchedule.innerHTML = '';
    const pending = assignments.filter(a => !a.completed);
    if (pending.length === 0) {
        studySchedule.innerHTML = '<p>No pending assignments. Relax or review!</p>';
        return;
    }

    pending.forEach(a => {
        const block = document.createElement('div');
        block.className = 'study-block';
        block.innerHTML = <strong>${a.subject}</strong> - Study before ${new Date(a.deadline).toLocaleString()};
        studySchedule.appendChild(block);
    });
}

// Generate Calendar
function generateCalendar() {
    calendarView.innerHTML = '';
    const today = new Date();
    const month = today.getMonth();
    const year = today.getFullYear();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    const days = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
    days.forEach(d => {
        const dayHeader = document.createElement('div');
        dayHeader.textContent = d;
        calendarView.appendChild(dayHeader);
    });

    for(let i=0;i<firstDay.getDay();i++){
        const empty = document.createElement('div');
        calendarView.appendChild(empty);
    }

    for(let day=1;day<=lastDay.getDate();day++){
        const dateDiv = document.createElement('div');
        const date = new Date(year, month, day);
        const assignmentsOnDay = assignments.filter(a => {
            const aDate = new Date(a.deadline);
            return aDate.getFullYear()===date.getFullYear() &&
                   aDate.getMonth()===date.getMonth() &&
                   aDate.getDate()===date.getDate();
        });
        dateDiv.textContent = day;
        if(assignmentsOnDay.length>0) dateDiv.style.background = '#ffe3e3';
        if(day===today.getDate()) dateDiv.style.border = '2px solid #4361ee';
        calendarView.appendChild(dateDiv);
    }
}

// Update badges
function updateBadges() {
    badgesContainer.innerHTML = '';
    const completed = assignments.filter(a => a.completed).length;
    if(completed>=5){
        const badge = document.createElement('div');
        badge.className = 'badge';
        badge.textContent = '🏆 5 Assignments Completed!';
        badgesContainer.appendChild(badge);
    }
}

// 🔔 Notification Reminders
function checkNotifications() {
    if (!("Notification" in window)) return;

    if (Notification.permission === "default") {
        Notification.requestPermission();
    }

    if (Notification.permission === "granted") {
        const now = new Date();
        const soon = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        const upcoming = assignments.filter(a => {
            const deadline = new Date(a.deadline);
            return !a.completed && deadline > now && deadline <= soon;
        });

        upcoming.forEach(a => {
            new Notification("📚 Upcoming Assignment", {
                body: ${a.subject} is due by ${new Date(a.deadline).toLocaleString()},
                icon: "https://cdn-icons-png.flaticon.com/512/2917/2917995.png"
            });
        });
    }
}

// Initial load
loadAssignments();