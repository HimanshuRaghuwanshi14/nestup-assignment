const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// --- 1. DATA MODELS [cite: 11, 15] ---
let users = [
    { 
      id: 1, 
      email: "admin@nestup.com", 
      password: "admin123", 
      name: "Admin Manager", 
      role: "admin", 
      skills: ["Management", "System Design"] 
    },
    { 
      id: 2, 
      email: "himanshu@nestup.com", 
      password: "password123", 
      name: "Himanshu", 
      role: "member", 
      skills: ["React", "Node", "MongoDB"] 
    }
];
let workItems = []; 
let dependencies = []; 

// --- 2. ALGORITHM: CIRCULAR DETECTION (DFS) [cite: 16, 31] ---
// Prevents Task A -> Task B -> Task A loops.
const isCircular = (predId, succId) => {
    let visited = new Set();
    let stack = [predId];
    while (stack.length > 0) {
        let curr = stack.pop();
        if (curr === succId) return true; // Cycle found!
        dependencies.filter(d => d.successorId === curr)
                    .forEach(d => stack.push(d.predecessorId));
    }
    return false;
};


const updateSystemStatus = () => {
    workItems.forEach(item => {
        const blockers = dependencies.filter(d => d.successorId === item.id);
        let blockedReason = null;

        for (let dep of blockers) {
            const pred = workItems.find(i => i.id === dep.predecessorId);
            if (!pred) continue;

            if (dep.type === 'full' && pred.progress < 100) {
                blockedReason = `Waiting for ${pred.title} to reach 100%`;
                break;
            }
            if (dep.type === 'partial' && pred.progress < dep.threshold) {
                blockedReason = `Waiting for ${pred.title} to reach ${dep.threshold}%`;
                break;
            }
        }

        if (blockedReason) {
            item.status = 'blocked';
            item.reason = blockedReason;
        } else {
            item.status = item.progress === 100 ? 'done' : 'in-progress';
            item.reason = null;
        }
    });
};

// --- 4. ROUTES [cite: 17, 27] ---

// Auth Route: Email/Password login
app.post('/login', (req, res) => {
    const { email, password } = req.body;
    const user = users.find(u => u.email === email && u.password === password);
    if (user) {
        res.json(user);
    } else {
        res.status(401).json({ message: "Invalid email or password" });
    }
});

app.post('/work-items', (req, res) => {
    const item = { id: Date.now(), ...req.body, progress: 0, status: 'in-progress' };
    workItems.push(item);
    updateSystemStatus();
    res.json(item);
});

app.post('/dependencies', (req, res) => {
    const { predecessorId, successorId, type, threshold } = req.body;
    if (isCircular(predecessorId, successorId)) {
        return res.status(400).json({ message: "Circular Dependency Detected! Action Blocked." });
    }
    dependencies.push({ predecessorId, successorId, type, threshold: Number(threshold) });
    updateSystemStatus();
    res.json({ message: "Dependency Linked Successfully" });
});

app.patch('/work-items/:id', (req, res) => {
    const item = workItems.find(i => i.id == req.params.id);
    if (item) {
        item.progress = Number(req.body.progress);
        updateSystemStatus();
    }
    res.json(item);
});

app.get('/all-data', (req, res) => res.json({ workItems, dependencies, users }));

app.listen(5000, () => console.log("NestUp Backend running on Port 5000"));
