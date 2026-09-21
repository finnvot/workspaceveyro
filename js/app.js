const STORAGE_KEY = "my-workspace-v1";

const seed = {
  projects: [
    {id:"p1", name:"Workspace", description:"Das zentrale Projekt für deinen Workspace.", members:1, color:"purple"},
    {id:"p2", name:"Website", description:"Planung und Umsetzung der öffentlichen Website.", members:1, color:"blue"},
    {id:"p3", name:"Interne Tools", description:"Tools und Automatisierungen für das Team.", members:1, color:"green"}
  ],
  tasks: [
    {id:"t1", title:"Workspace-Grundgerüst bauen", description:"Navigation, Dashboard und Grundstruktur.", status:"done", priority:"high", projectId:"p1"},
    {id:"t2", title:"Drag & Drop Kanban", description:"Aufgaben zwischen den Status-Spalten verschieben.", status:"progress", priority:"high", projectId:"p1"},
    {id:"t3", title:"Benutzer- und Rollensystem planen", description:"Später serverseitige Authentifizierung und Berechtigungen.", status:"todo", priority:"normal", projectId:"p1"},
    {id:"t4", title:"Design-System definieren", description:"Abstände, Komponenten und visuelle Regeln festlegen.", status:"todo", priority:"normal", projectId:"p2"},
    {id:"t5", title:"Chat-Konzept", description:"Kanäle, Nachrichten und spätere Echtzeit-Kommunikation.", status:"backlog", priority:"low", projectId:"p3"}
  ],
  notes: [
    {id:"n1", title:"Ideen für den Workspace", body:"Notion + Milanote + Discord als Inspiration. Später kommen Auth, Rollen und echte Server-Persistenz dazu.", updated:"Heute"}
  ],
  messages: [
    {id:"m1", text:"Willkommen im Workspace-Prototyp.", author:"Admin", time:"gerade eben"}
  ],
  activity: [
    {text:"Workspace-Prototyp wurde eingerichtet.", time:"gerade eben"},
    {text:"Kanban-Board mit Drag & Drop ist verfügbar.", time:"gerade eben"},
    {text:"Erste Demo-Projekte wurden angelegt.", time:"gerade eben"}
  ]
};

let state = clone(seed);
let serverUpdatedAt = null;
let draggedTaskId = null;
let syncing = false;

function clone(obj){ return JSON.parse(JSON.stringify(obj)); }

async function loadState(){
  try {
    const response = await fetch("/.netlify/functions/data", { cache: "no-store" });
    if(!response.ok) throw new Error("Daten konnten nicht geladen werden");
    const payload = await response.json();
    if(payload.state){
      state = payload.state;
      serverUpdatedAt = payload.updatedAt || null;
    }
  } catch (error) {
    console.warn("Shared data unavailable, using local fallback:", error);
    const raw = localStorage.getItem(STORAGE_KEY);
    if(raw){
      try { state = JSON.parse(raw); } catch {}
    }
  }
}

async function saveState(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  try {
    const response = await fetch("/.netlify/functions/data", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ state })
    });
    if(!response.ok) throw new Error("Speichern fehlgeschlagen");
    const payload = await response.json();
    serverUpdatedAt = payload.updatedAt || new Date().toISOString();
    return true;
  } catch (error) {
    console.error("Shared save failed:", error);
    return false;
  }
}

async function syncState(){
  if(syncing) return;
  syncing = true;
  try {
    const response = await fetch("/.netlify/functions/data", { cache: "no-store" });
    if(!response.ok) return;
    const payload = await response.json();
    if(payload.state && payload.updatedAt && payload.updatedAt !== serverUpdatedAt){
      state = payload.state;
      serverUpdatedAt = payload.updatedAt;
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      render();
    }
  } catch (error) {
    console.warn("Sync failed:", error);
  } finally {
    syncing = false;
  }
}

const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => [...document.querySelectorAll(sel)];

function escapeHtml(value){
  return String(value ?? "").replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#039;'}[c]));
}

function statusLabel(status){
  return {backlog:"Backlog",todo:"To Do",progress:"In Arbeit",review:"Review",done:"Erledigt"}[status] || status;
}

function projectName(id){
  return state.projects.find(p => p.id === id)?.name || "Ohne Projekt";
}

function addActivity(text){
  state.activity.unshift({text,time:"gerade eben"});
  state.activity = state.activity.slice(0,8);
}

function render(){
  renderProjectNav();
  renderStats();
  renderRecent();
  renderActivity();
  renderBoard();
  renderProjects();
  renderNotes();
  renderChat();
  renderTaskProjectOptions();
}

function renderProjectNav(){
  $("#projectNav").innerHTML = state.projects.map(p =>
    `<button class="project-link" data-project="${p.id}"><span class="project-dot"></span>${escapeHtml(p.name)}</button>`
  ).join("");
  $$("#projectNav [data-project]").forEach(btn => btn.onclick = () => {
    switchView("projects");
  });
}

function renderStats(){
  $("#statOpen").textContent = state.tasks.filter(t=>t.status!=="done").length;
  $("#statProgress").textContent = state.tasks.filter(t=>t.status==="progress").length;
  $("#statDone").textContent = state.tasks.filter(t=>t.status==="done").length;
  $("#statProjects").textContent = state.projects.length;
}

function renderRecent(){
  const tasks = state.tasks.filter(t=>t.status!=="done").slice(0,6);
  $("#recentTasks").innerHTML = tasks.length ? tasks.map(t => `
    <div class="task-row">
      <div class="task-main"><span class="task-dot ${t.priority}"></span><div><div class="task-title">${escapeHtml(t.title)}</div><div class="task-meta">${escapeHtml(projectName(t.projectId))}</div></div></div>
      <span class="status-pill ${t.status}">${statusLabel(t.status)}</span>
    </div>`).join("") : `<div class="empty">Keine offenen Aufgaben.</div>`;
}

function renderActivity(){
  $("#activityList").innerHTML = state.activity.map(a => `<div class="activity"><i></i><div>${escapeHtml(a.text)}<small>${escapeHtml(a.time)}</small></div></div>`).join("");
}

function renderBoard(){
  const columns = [
    {id:"backlog", title:"Backlog"},
    {id:"todo", title:"To Do"},
    {id:"progress", title:"In Arbeit"},
    {id:"done", title:"Erledigt"}
  ];
  $("#board").innerHTML = columns.map(c => {
    const tasks = state.tasks.filter(t=>t.status===c.id);
    return `<div class="column" data-status="${c.id}">
      <div class="column-head"><strong>${c.title}</strong><span class="count">${tasks.length}</span></div>
      <div class="column-tasks">
        ${tasks.map(t => `<div class="task-card" draggable="true" data-task="${t.id}">
          <h4>${escapeHtml(t.title)}</h4>
          <p>${escapeHtml(t.description || "Keine Beschreibung")}</p>
          <div class="card-footer"><span class="priority ${t.priority}">${t.priority}</span><span class="task-meta">${escapeHtml(projectName(t.projectId))}</span></div>
        </div>`).join("") || `<div class="empty">Keine Aufgaben</div>`}
      </div>
    </div>`;
  }).join("");

  $$(".task-card").forEach(card => {
    card.addEventListener("dragstart", e => {
      draggedTaskId = card.dataset.task;
      e.dataTransfer.effectAllowed = "move";
    });
    card.addEventListener("dragend", () => draggedTaskId = null);
  });
  $$(".column").forEach(col => {
    col.addEventListener("dragover", e => { e.preventDefault(); col.classList.add("drag-over"); });
    col.addEventListener("dragleave", () => col.classList.remove("drag-over"));
    col.addEventListener("drop", e => {
      e.preventDefault();
      col.classList.remove("drag-over");
      const task = state.tasks.find(t=>t.id===draggedTaskId);
      if(task && task.status !== col.dataset.status){
        task.status = col.dataset.status;
        addActivity(`„${task.title}“ wurde nach „${statusLabel(task.status)}“ verschoben.`);
        saveState().then(() => render());
      }
    });
  });
}

function renderProjects(){
  $("#projectGrid").innerHTML = state.projects.map(p => {
    const count = state.tasks.filter(t=>t.projectId===p.id).length;
    return `<div class="project-card">
      <h3>${escapeHtml(p.name)}</h3>
      <p>${escapeHtml(p.description)}</p>
      <div class="project-info"><span class="tag">${count} Aufgaben</span><span class="tag">${p.members} Mitglied</span><span class="tag">Privat</span></div>
    </div>`;
  }).join("");
}

function renderNotes(){
  $("#noteList").innerHTML = state.notes.length ? state.notes.map(n =>
    `<div class="note-item" data-note="${n.id}"><strong>${escapeHtml(n.title || "Unbenannt")}</strong><small>${escapeHtml(n.updated)}</small></div>`
  ).join("") : `<div class="empty">Noch keine Notizen.</div>`;
  $$(".note-item").forEach(el => el.onclick = () => {
    const n = state.notes.find(x=>x.id===el.dataset.note);
    if(n){ $("#noteTitle").value=n.title; $("#noteBody").value=n.body; }
  });
}

function renderChat(){
  $("#chatMessages").innerHTML = state.messages.map(m =>
    `<div class="message ${m.author==="Du" ? "me":""}"><div>${escapeHtml(m.text)}</div><small>${escapeHtml(m.author)} · ${escapeHtml(m.time)}</small></div>`
  ).join("");
  $("#chatMessages").scrollTop = $("#chatMessages").scrollHeight;
}

function renderTaskProjectOptions(){
  $("#taskProject").innerHTML = state.projects.map(p => `<option value="${p.id}">${escapeHtml(p.name)}</option>`).join("");
}

function switchView(view){
  $$(".view").forEach(v => v.classList.remove("active-view"));
  $(`#view-${view}`).classList.add("active-view");
  $$(".nav-item[data-view]").forEach(b => b.classList.toggle("active", b.dataset.view===view));
  const labels = {dashboard:"Dashboard",board:"Aufgaben",projects:"Projekte",notes:"Notizen",chat:"Chat",settings:"Einstellungen"};
  $("#currentSection").textContent = labels[view] || view;
  $("#pageTitle").textContent = view==="dashboard" ? "Guten Tag 👋" : labels[view];
}

$$(".nav-item[data-view]").forEach(btn => btn.onclick = () => switchView(btn.dataset.view));
$$("[data-go]").forEach(btn => btn.onclick = () => switchView(btn.dataset.go));

function openTaskModal(){
  $("#taskForm").reset();
  $("#modalBackdrop").classList.remove("hidden");
  $("#taskTitle").focus();
}
function closeModal(){ $("#modalBackdrop").classList.add("hidden"); }

$("#quickAddBtn").onclick = openTaskModal;
$("#heroTaskBtn").onclick = openTaskModal;
$("#boardAddBtn").onclick = openTaskModal;
$("#closeModal").onclick = closeModal;
$("#modalBackdrop").onclick = e => { if(e.target.id==="modalBackdrop") closeModal(); };

$("#taskForm").onsubmit = e => {
  e.preventDefault();
  const task = {
    id:"t_"+Date.now(),
    title:$("#taskTitle").value.trim(),
    description:$("#taskDescription").value.trim(),
    priority:$("#taskPriority").value,
    projectId:$("#taskProject").value,
    status:"todo"
  };
  state.tasks.unshift(task);
  addActivity(`Aufgabe „${task.title}“ wurde erstellt.`);
  saveState().then(() => render()); closeModal(); switchView("board");
};

$("#saveNoteBtn").onclick = () => {
  const title = $("#noteTitle").value.trim();
  const body = $("#noteBody").value.trim();
  if(!title && !body) return;
  state.notes.unshift({id:"n_"+Date.now(),title:title||"Unbenannt",body,updated:"gerade eben"});
  addActivity(`Notiz „${title||"Unbenannt"}“ wurde gespeichert.`);
  saveState().then(() => { renderNotes(); renderActivity(); }); $("#noteTitle").value=""; $("#noteBody").value="";
};

$("#chatForm").onsubmit = e => {
  e.preventDefault();
  const input = $("#chatInput");
  const text = input.value.trim();
  if(!text) return;
  state.messages.push({id:"m_"+Date.now(),text,author:"Du",time:"gerade eben"});
  addActivity("Du hast eine Nachricht im Chat gesendet.");
  saveState().then(() => { renderChat(); renderActivity(); }); input.value="";
};

$("#addProjectBtn").onclick = $("#projectsAddBtn").onclick = () => {
  const name = prompt("Name des neuen Projekts:");
  if(!name?.trim()) return;
  const project = {id:"p_"+Date.now(),name:name.trim(),description:"Neues Projekt",members:1,color:"purple"};
  state.projects.push(project);
  addActivity(`Projekt „${project.name}“ wurde erstellt.`);
  saveState().then(() => render()); switchView("projects");
};

$("#resetBtn").onclick = () => {
  if(confirm("Alle lokalen Demo-Daten zurücksetzen?")){
    state = clone(seed); saveState().then(() => render());
  }
};

$("#searchBtn").onclick = () => {
  const query = prompt("Suche nach Aufgabe oder Projekt:");
  if(!query) return;
  const q = query.toLowerCase();
  const task = state.tasks.find(t=>t.title.toLowerCase().includes(q));
  const project = state.projects.find(p=>p.name.toLowerCase().includes(q));
  if(task){ switchView("board"); alert(`Gefunden: ${task.title}`); }
  else if(project){ switchView("projects"); alert(`Gefunden: ${project.name}`); }
  else alert("Nichts gefunden.");
};

(async function init(){
  await loadState();
  render();
  setInterval(syncState, 5000);
})();

