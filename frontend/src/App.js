import React, { useState, useEffect } from 'react';
import axios from 'axios';

function App() {
  const [user, setUser] = useState(null);
  const [credentials, setCredentials] = useState({ email: '', password: '' });
  const [data, setData] = useState({ workItems: [], dependencies: [], users: [] });

  const refresh = () => axios.get('http://localhost:5000/all-data').then(res => setData(res.data));
  
  useEffect(() => { 
    if (user) refresh(); 
  }, [user]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post('http://localhost:5000/login', credentials);
      setUser(res.data);
    } catch (err) { 
      alert("Unauthorized: Access Denied."); 
    }
  };

  if (!user) return (
    <div style={loginWrapper}>
      <div style={loginCard}>
        <h2 style={{ color: '#0984e3', marginBottom: '10px' }}>NestUp Portal</h2>
        <p style={{ color: '#636e72', fontSize: '14px', marginBottom: '25px' }}>Work Management System Login [cite: 17]</p>
        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
          <input type="email" placeholder="Email" style={inputStyle} onChange={e => setCredentials({...credentials, email: e.target.value})} required />
          <input type="password" placeholder="Password" style={inputStyle} onChange={e => setCredentials({...credentials, password: e.target.value})} required />
          <button type="submit" style={primaryBtnStyle}>Sign In</button>
        </form>
      </div>
    </div>
  );

  return (
    <div style={{ backgroundColor: '#f5f6fa', minHeight: '100vh', padding: '20px' }}>
      <nav style={navStyle}>
        <div>
          <span style={{ fontWeight: 'bold', color: '#2d3436' }}>{user.name}</span>
          <span style={roleBadge}>{user.role.toUpperCase()}</span>
        </div>
        <button onClick={() => setUser(null)} style={logoutBtn}>Logout</button>
      </nav>

      {user.role === 'admin' ? (
        <AdminDashboard data={data} refresh={refresh} />
      ) : (
        <MemberDashboard user={user} data={data} refresh={refresh} />
      )}
    </div>
  );
}

// --- ADMIN DASHBOARD ---
function AdminDashboard({ data, refresh }) {
  const [task, setTask] = useState({ title: '', priority: 'medium', assignedTo: '', skillsRequired: [] });
  const [dep, setDep] = useState({ pred: '', succ: '', type: 'full', threshold: 0 });

  const handleCreateTask = async (e) => {
    e.preventDefault();
    if (!task.title || !task.assignedTo) return alert("Task definition incomplete.");
    await axios.post('http://localhost:5000/work-items', task);
    setTask({ title: '', priority: 'medium', assignedTo: '', skillsRequired: [] });
    refresh();
  };

  const linkTasks = async () => {
    try {
      await axios.post('http://localhost:5000/dependencies', {
        predecessorId: Number(dep.pred), 
        successorId: Number(dep.succ),
        type: dep.type, 
        threshold: dep.threshold
      });
      refresh();
    } catch (e) { 
      alert(e.response.data.message); 
    }
  };

  return (
    <div style={containerStyle}>
      {/* TEAM SKILLS DIRECTORY */}
      <section style={{ ...panelStyle, marginBottom: '30px', borderLeft: '5px solid #6c5ce7' }}>
        <h4 style={panelHeader}>👥 Team Resource Directory</h4>
        <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
          {data.users.filter(u => u.role === 'member').map(member => (
            <div key={member.id} style={memberResourceCard}>
              <div style={{ fontWeight: 'bold', marginBottom: '5px' }}>{member.name}</div>
              <div style={tagCloud}>
                {member.skills?.map(s => <span key={s} style={memberSkillTag}>{s}</span>)}
              </div>
            </div>
          ))}
        </div>
      </section>

      <div style={gridTwoCol}>
        {/* CREATE TASK - Removed [cite: 17, 29] */}
        <section style={panelStyle}>
          <h4 style={panelHeader}>📝 Initialize New Task</h4>
          <form onSubmit={handleCreateTask} style={formVertical}>
            <input style={inputStyle} placeholder="Task Name" value={task.title} onChange={e => setTask({...task, title: e.target.value})} />
            <input style={inputStyle} placeholder="Required Skills (React, Node...)" value={task.skillsRequired.join(', ')} onChange={e => setTask({...task, skillsRequired: e.target.value.split(',').map(s => s.trim())})} />
            <div style={{ display: 'flex', gap: '10px' }}>
              <select style={selectStyle} value={task.priority} onChange={e => setTask({...task, priority: e.target.value})}>
                <option value="low">Low Priority</option>
                <option value="medium">Medium Priority</option>
                <option value="high">High Priority</option>
                <option value="critical">Critical Path</option>
              </select>
              <select style={selectStyle} value={task.assignedTo} onChange={e => setTask({...task, assignedTo: e.target.value})}>
                <option value="">Assign To...</option>
                {data.users.map(u => <option key={u.id} value={u.name}>{u.name}</option>)}
              </select>
            </div>
            <button type="submit" style={primaryBtnStyle}>Deploy Task</button>
          </form>
        </section>

        {/* LINK WORKFLOW - Removed [cite: 9, 30] */}
        <section style={{ ...panelStyle, backgroundColor: '#f8f9fa', borderStyle: 'dashed' }}>
          <h4 style={panelHeader}>🔗 Map Operational Flow</h4>
          <div style={formVertical}>
            <div style={{ display: 'flex', gap: '10px' }}>
              <select style={selectStyle} onChange={e => setDep({...dep, pred: e.target.value})}>
                 <option>Foundational Task...</option>
                 {data.workItems.map(i => <option key={i.id} value={i.id}>{i.title}</option>)}
              </select>
              <select style={selectStyle} onChange={e => setDep({...dep, succ: e.target.value})}>
                 <option>Dependent Task...</option>
                 {data.workItems.map(i => <option key={i.id} value={i.id}>{i.title}</option>)}
              </select>
            </div>
            <select style={selectStyle} onChange={e => setDep({...dep, type: e.target.value})}>
                <option value="full">Sequential (100%)</option>
                <option value="partial">Pipelined (%)</option>
            </select>
            {dep.type === 'partial' && <input type="number" placeholder="Gate %" style={inputStyle} onChange={e => setDep({...dep, threshold: e.target.value})} />}
            <button onClick={linkTasks} style={darkBtnStyle}>Authorize Sequence</button>
          </div>
        </section>
      </div>

      <h4 style={{ marginBottom: '20px' }}>📊 Live System Flow & Bottlenecks</h4>
      <div style={gridThreeCol}>
        {data.workItems.map(item => (
          <div key={item.id} style={cardStyle(item.status)}>
            <div style={statusBar(item.status)} />
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
              <span style={priorityLabel}>{item.priority}</span>
              <span style={userBadge}>{item.assignedTo}</span>
            </div>
            <h5 style={{ margin: '0 0 10px 0' }}>{item.title}</h5>
            <div style={tagCloud}>{item.skillsRequired?.map(s => <span key={s} style={skillTag}>#{s}</span>)}</div>
            {item.status === 'blocked' ? <div style={blockerAlert}>⚠️ {item.reason}</div> : <div style={statusText(item.status)}>{item.status.toUpperCase()}</div>}
            <div style={progressBg}><div style={progressBar(item.progress)} /></div>
            <div style={progressLabel}>{item.progress}%</div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- MEMBER DASHBOARD ---
function MemberDashboard({ data, user, refresh }) {
  const myTasks = data.workItems.filter(i => i.assignedTo === user.name);
  return (
    <div style={containerStyle}>
      <div style={memberProfileHeader}>
        <h2 style={{ margin: 0 }}>{user.name}'s Workspace</h2>
        <div style={tagCloud}>{user.skills?.map(s => <span key={s} style={profileSkillTag}>{s}</span>)}</div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {myTasks.length === 0 ? <div style={emptyState}>Queue Empty</div> : myTasks.map(item => (
          <div key={item.id} style={memberTaskCard}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <h3>{item.title}</h3>
              <span style={statusBadge(item.status)}>{item.status.toUpperCase()}</span>
            </div>
            <div style={{ marginTop: '20px' }}>
              {item.status === 'blocked' ? <div style={blockerAlert}>🚫 {item.reason}</div> : (
                <div>
                  <input type="range" style={rangeSlider} value={item.progress} onChange={async (e) => {
                    await axios.patch(`http://localhost:5000/work-items/${item.id}`, { progress: e.target.value });
                    refresh();
                  }} />
                  <div style={{ textAlign: 'right' }}>{item.progress}%</div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- STYLES ---
const loginWrapper = { display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', backgroundColor: '#f1f2f6' };
const loginCard = { background: 'white', padding: '40px', borderRadius: '15px', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', textAlign: 'center', width: '350px' };
const navStyle = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '15px 30px', backgroundColor: 'white', borderRadius: '12px', marginBottom: '30px' };
const containerStyle = { maxWidth: '1200px', margin: '0 auto' };
const gridTwoCol = { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', marginBottom: '40px' };
const gridThreeCol = { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' };
const panelStyle = { backgroundColor: 'white', padding: '25px', borderRadius: '12px', border: '1px solid #e1e4e8' };
const panelHeader = { marginTop: 0, marginBottom: '15px', color: '#2d3436' };
const formVertical = { display: 'flex', flexDirection: 'column', gap: '12px' };
const inputStyle = { padding: '10px', borderRadius: '6px', border: '1px solid #dfe6e9' };
const selectStyle = { padding: '10px', borderRadius: '6px', border: '1px solid #dfe6e9', backgroundColor: 'white', flex: 1 };
const primaryBtnStyle = { padding: '12px', backgroundColor: '#0984e3', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };
const darkBtnStyle = { padding: '12px', backgroundColor: '#2d3436', color: 'white', border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' };
const logoutBtn = { backgroundColor: '#fab1a0', color: '#d63031', border: 'none', padding: '8px 15px', borderRadius: '8px', cursor: 'pointer' };
const roleBadge = { fontSize: '10px', backgroundColor: '#dfe6e9', padding: '2px 8px', borderRadius: '10px', marginLeft: '10px' };
const cardStyle = (status) => ({ backgroundColor: 'white', borderRadius: '12px', padding: '20px', position: 'relative', overflow: 'hidden', border: '1px solid #e1e4e8' });
const statusBar = (status) => ({ position: 'absolute', top: 0, left: 0, right: 0, height: '4px', backgroundColor: status === 'blocked' ? '#ff7675' : (status === 'done' ? '#55efc4' : '#74b9ff') });
const priorityLabel = { fontSize: '10px', fontWeight: 'bold', color: '#b2bec3' };
const userBadge = { fontSize: '11px', backgroundColor: '#f1f2f6', padding: '2px 10px', borderRadius: '12px' };
const tagCloud = { display: 'flex', gap: '5px', flexWrap: 'wrap', marginBottom: '10px' };
const skillTag = { backgroundColor: '#e8f4fd', color: '#0984e3', padding: '2px 6px', borderRadius: '4px', fontSize: '10px' };
const memberResourceCard = { background: '#f9f9f9', padding: '15px', borderRadius: '10px', border: '1px solid #eee', minWidth: '200px' };
const memberSkillTag = { backgroundColor: '#6c5ce7', color: 'white', padding: '2px 8px', borderRadius: '4px', fontSize: '10px' };
const profileSkillTag = { backgroundColor: 'rgba(255,255,255,0.2)', padding: '5px 12px', borderRadius: '20px', fontSize: '12px', border: '1px solid rgba(255,255,255,0.3)' };
const blockerAlert = { backgroundColor: '#fff5f5', color: '#d63031', padding: '10px', borderRadius: '8px', fontSize: '12px', marginBottom: '10px' };
const statusText = (status) => ({ fontSize: '12px', fontWeight: 'bold', color: status === 'done' ? '#00b894' : '#0984e3', marginBottom: '10px' });
const progressBg = { backgroundColor: '#f1f2f6', height: '6px', borderRadius: '3px' };
const progressBar = (p) => ({ width: `${p}%`, height: '100%', backgroundColor: '#0984e3', borderRadius: '3px' });
const progressLabel = { textAlign: 'right', fontSize: '10px', color: '#636e72' };
const memberProfileHeader = { backgroundColor: '#6c5ce7', padding: '30px', borderRadius: '15px', color: 'white', marginBottom: '30px' };
const memberTaskCard = { backgroundColor: 'white', borderRadius: '15px', padding: '25px', border: '1px solid #e1e4e8' };
const emptyState = { textAlign: 'center', padding: '40px', color: '#b2bec3' };
const rangeSlider = { width: '100%', accentColor: '#6c5ce7' };
const statusBadge = (status) => ({ backgroundColor: status === 'blocked' ? '#fff5f5' : '#e8fdf5', color: status === 'blocked' ? '#d63031' : '#00b894', padding: '5px 12px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' });

export default App;