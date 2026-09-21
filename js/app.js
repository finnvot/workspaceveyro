const API='/.netlify/functions/workspace';
const seed={projects:[{id:'p1',name:'Allgemein',description:'Zentrale Aufgaben'},{id:'p2',name:'Website',description:'Website-Projekt'}],tasks:[{id:'t1',title:'Workspace einrichten',status:'done',project:'Allgemein'},{id:'t2',title:'Mobile Ansicht testen',status:'doing',project:'Allgemein'},{id:'t3',title:'Neue Projektidee sammeln',status:'todo',project:'Allgemein'},{id:'t4',title:'Startseite verbessern',status:'backlog',project:'Website'}],notes:[{id:'n1',title:'Willkommen',body:'Deine zentrale Workspace-Notiz.'}],messages:[]};
const pages={dashboard:'Dashboard',tasks:'Aufgaben',projects:'Projekte',notes:'Notizen',chat:'Chat',settings:'Einstellungen'};
const icons={dashboard:'⌂',tasks:'✓',projects:'▦',notes:'✎',chat:'◌',settings:'⚙'};
const $=s=>document.querySelector(s);
const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let state=JSON.parse(localStorage.getItem('workspace-fallback')||'null')||structuredClone(seed);
let current=routeFromHash(),noteId=state.notes[0]?.id||null,saving=false,syncing=false,dragId=null,touchDrag=null;

function routeFromHash(){const p=location.hash.replace(/^#/,'');return pages[p]?p:'dashboard'}
function nav(){return Object.entries(pages).map(([k,v])=>`<button type="button" class="nav-btn ${current===k?'active':''}" data-page="${k}"><span class="nav-icon">${icons[k]}</span><span>${v}</span></button>`).join('')}
function renderNav(){const d=$('#desktopNav'),m=$('#mobileNav');if(d)d.innerHTML=nav();if(m)m.innerHTML=nav()}
function go(p,{replace=false,scroll=true}={}){
  if(!pages[p])p='dashboard';
  current=p;
  const url=`#${p}`;
  if(replace)history.replaceState({p},'',url);else if(location.hash!==url)history.pushState({p},'',url);
  closeDrawer();render();if(scroll)window.scrollTo({top:0,behavior:'smooth'});
}
function render(){
  renderNav();
  $('#headTitle').textContent=pages[current];
  $('#crumb').textContent=current==='dashboard'?'Workspace':`Workspace / ${pages[current]}`;
  $('#backBtn').style.visibility=current==='dashboard'?'hidden':'visible';
  const views={dashboard,tasks,projects,notes,chat,settings};
  $('#page').innerHTML=views[current]();
  bindPage();
}
function dashboard(){
  const open=state.tasks.filter(t=>t.status!=='done').length;
  return `<div class="page-head"><div><div class="eyebrow">ÜBERSICHT</div><h2>Dein Workspace</h2><p>Alles an einem Ort – synchron auf PC und Handy.</p></div><button class="btn primary" data-action="new-task">＋ Aufgabe</button></div>
  <div class="grid grid4"><div class="glass stat"><span>Offene Aufgaben</span><b>${open}</b></div><div class="glass stat"><span>Projekte</span><b>${state.projects.length}</b></div><div class="glass stat"><span>Notizen</span><b>${state.notes.length}</b></div><div class="glass stat"><span>Nachrichten</span><b>${state.messages.length}</b></div></div>
  <div class="grid grid3 dashboard-grid"><section class="glass panel"><div class="section-title"><h3>Nächste Aufgaben</h3><button class="link-btn" data-page="tasks">Alle ansehen</button></div>${state.tasks.filter(t=>t.status!=='done').slice(0,5).map(t=>`<button class="list-item" data-page="tasks"><span><b>${esc(t.title)}</b><small>${esc(t.project||'Allgemein')}</small></span><span class="chevron">›</span></button>`).join('')||'<div class="empty">Alles erledigt 🎉</div>'}</section>
  <section class="glass panel"><div class="section-title"><h3>Projekte</h3><button class="link-btn" data-page="projects">Öffnen</button></div>${state.projects.map(p=>`<button class="list-item" data-page="projects"><span><b>${esc(p.name)}</b><small>${state.tasks.filter(t=>t.project===p.name).length} Aufgaben</small></span><span class="chevron">›</span></button>`).join('')}</section>
  <section class="glass panel"><h3>Schnellzugriff</h3><div class="quick-grid"><button class="quick-card" data-page="tasks"><span>✓</span>Aufgaben</button><button class="quick-card" data-page="notes"><span>✎</span>Notizen</button><button class="quick-card" data-page="chat"><span>◌</span>Chat</button><button class="quick-card" data-page="settings"><span>⚙</span>Einstellungen</button></div></section></div>`;
}
const columns=[['backlog','Backlog'],['todo','To Do'],['doing','In Arbeit'],['done','Erledigt']];
function tasks(){return `<div class="page-head"><div><div class="eyebrow">PLANUNG</div><h2>Aufgaben</h2><p>Auf Desktop ziehen, auf dem Handy gedrückt halten und verschieben.</p></div><button class="btn primary" data-action="new-task">＋ Aufgabe</button></div><div class="board">${columns.map(([s,n])=>`<section class="column drop" data-status="${s}"><div class="column-head"><span>${n}</span><span class="count">${state.tasks.filter(t=>t.status===s).length}</span></div><div class="task-list">${state.tasks.filter(t=>t.status===s).map(t=>`<article class="task" draggable="true" data-task="${t.id}"><div class="task-grip">⋮⋮</div><b>${esc(t.title)}</b><small>${esc(t.project||'Allgemein')}</small></article>`).join('')||'<div class="empty">Leer</div>'}</div></section>`).join('')}</div>`}
function projects(){return `<div class="page-head"><div><div class="eyebrow">STRUKTUR</div><h2>Projekte</h2><p>Deine Projekte und die zugehörigen Aufgaben.</p></div><button class="btn primary" data-action="new-project">＋ Projekt</button></div><div class="grid grid3">${state.projects.map(p=>`<section class="glass project-card"><div class="project-icon">▦</div><h3>${esc(p.name)}</h3><p>${esc(p.description||'')}</p><span class="pill">${state.tasks.filter(t=>t.project===p.name).length} Aufgaben</span></section>`).join('')}</div>`}
function notes(){let n=state.notes.find(x=>x.id===noteId)||state.notes[0];if(n)noteId=n.id;return `<div class="page-head"><div><div class="eyebrow">WISSEN</div><h2>Notizen</h2><p>Schreiben, speichern und auf allen Geräten weiterarbeiten.</p></div><button class="btn primary" data-action="new-note">＋ Notiz</button></div><div class="note-layout"><aside class="glass note-list">${state.notes.map(x=>`<button class="note-choice ${x.id===n?.id?'active':''}" data-note="${x.id}"><span>${esc(x.title)}</span><span>›</span></button>`).join('')||'<div class="empty">Keine Notizen</div>'}</aside><section class="glass editor-card">${n?`<input class="title-input" id="noteTitle" value="${esc(n.title)}" aria-label="Notiztitel"><textarea class="editor" id="noteBody" aria-label="Notiztext">${esc(n.body)}</textarea>`:'<div class="empty">Keine Notiz ausgewählt.</div>'}</section></div>`}
function chat(){return `<div class="page-head"><div><div class="eyebrow">KOMMUNIKATION</div><h2>Chat</h2><p>Kurze Nachrichten direkt im Workspace.</p></div></div><section class="glass chat"><div class="messages">${state.messages.map(m=>`<div class="message ${m.me?'me':''}">${esc(m.text)}</div>`).join('')||'<div class="empty">Noch keine Nachrichten.</div>'}</div><form class="chat-form" id="chatForm"><input id="chatText" autocomplete="off" placeholder="Nachricht schreiben…"><button class="btn primary">Senden</button></form></section>`}
function settings(){return `<div class="page-head"><div><div class="eyebrow">SYSTEM</div><h2>Einstellungen</h2><p>Gemeinsamen Datenbestand synchronisieren.</p></div></div><section class="glass panel"><div class="setting-row"><div><h3>Synchronisation</h3><p>Der Datenbestand liegt zentral in Netlify Blobs.</p></div><button class="btn" data-action="sync">Jetzt synchronisieren</button></div></section>`}

function bindPage(){
  document.querySelectorAll('[data-page]').forEach(el=>el.onclick=e=>{e.preventDefault();go(el.dataset.page)});
  document.querySelectorAll('[data-action]').forEach(el=>el.onclick=()=>{const a=el.dataset.action;if(a==='new-task')taskModal();if(a==='new-project')projectModal();if(a==='new-note')noteModal();if(a==='sync')sync()});
  document.querySelectorAll('[data-note]').forEach(el=>el.onclick=()=>{noteId=el.dataset.note;render()});
  const nt=$('#noteTitle'),nb=$('#noteBody');
  if(nt)nt.oninput=()=>{const n=state.notes.find(x=>x.id===noteId);if(n){n.title=nt.value;save()}};
  if(nb)nb.oninput=()=>{const n=state.notes.find(x=>x.id===noteId);if(n){n.body=nb.value;save()}};
  const cf=$('#chatForm');if(cf)cf.onsubmit=e=>{e.preventDefault();const i=$('#chatText'),v=i.value.trim();if(v){state.messages.push({text:v,me:true});i.value='';render();save()}};
  bindDnD();
}
function bindDnD(){
  document.querySelectorAll('.task').forEach(el=>{
    el.addEventListener('dragstart',()=>{dragId=el.dataset.task;el.classList.add('dragging')});
    el.addEventListener('dragend',()=>{dragId=null;el.classList.remove('dragging');clearDropHighlights()});
    el.addEventListener('touchstart',e=>{const t=e.touches[0];touchDrag={id:el.dataset.task,x:t.clientX,y:t.clientY,moved:false};el.classList.add('dragging')},{passive:true});
    el.addEventListener('touchmove',e=>{if(!touchDrag)return;const t=e.touches[0];const moved=Math.abs(t.clientX-touchDrag.x)+Math.abs(t.clientY-touchDrag.y)>10;if(!moved)return;touchDrag.moved=true;e.preventDefault();const z=document.elementFromPoint(t.clientX,t.clientY)?.closest('.drop');document.querySelectorAll('.drop').forEach(x=>x.classList.toggle('drop-active',x===z))},{passive:false});
    el.addEventListener('touchend',e=>{if(!touchDrag)return;const t=e.changedTouches[0],z=document.elementFromPoint(t.clientX,t.clientY)?.closest('.drop');if(touchDrag.moved&&z)move(touchDrag.id,z.dataset.status);touchDrag=null;el.classList.remove('dragging');clearDropHighlights()});
  });
  document.querySelectorAll('.drop').forEach(z=>{z.addEventListener('dragover',e=>{e.preventDefault();z.classList.add('drop-active')});z.addEventListener('dragleave',()=>z.classList.remove('drop-active'));z.addEventListener('drop',e=>{e.preventDefault();if(dragId)move(dragId,z.dataset.status);dragId=null;clearDropHighlights()})});
}
function clearDropHighlights(){document.querySelectorAll('.drop').forEach(x=>x.classList.remove('drop-active'))}
function move(id,status){const t=state.tasks.find(x=>x.id===id);if(!t)return;t.status=status;render();save()}
function openModal(html){$('#modalBox').innerHTML=html;$('#modal').classList.add('open');setTimeout(()=>$('#modalBox input')?.focus(),0)}
function closeModal(){$('#modal').classList.remove('open')}
function taskModal(){openModal(`<div class="modal-kicker">NEUE AUFGABE</div><h3>Aufgabe erstellen</h3><label>Titel<input id="mTitle" placeholder="Was steht an?"></label><label>Projekt<select id="mProject">${state.projects.map(p=>`<option value="${esc(p.name)}">${esc(p.name)}</option>`).join('')}</select></label><div class="modal-actions"><button class="btn" data-close>Abbrechen</button><button class="btn primary" id="mSave">Erstellen</button></div>`);$('#mSave').onclick=()=>{const title=$('#mTitle').value.trim();if(!title)return;state.tasks.push({id:crypto.randomUUID(),title,status:'todo',project:$('#mProject').value});closeModal();render();save()};$('#modal [data-close]').onclick=closeModal}
function projectModal(){openModal(`<div class="modal-kicker">NEUES PROJEKT</div><h3>Projekt erstellen</h3><label>Name<input id="mName" placeholder="Projektname"></label><div class="modal-actions"><button class="btn" data-close>Abbrechen</button><button class="btn primary" id="mSave">Erstellen</button></div>`);$('#mSave').onclick=()=>{const name=$('#mName').value.trim();if(!name)return;state.projects.push({id:crypto.randomUUID(),name,description:'Neues Projekt'});closeModal();render();save()};$('#modal [data-close]').onclick=closeModal}
function noteModal(){openModal(`<div class="modal-kicker">NEUE NOTIZ</div><h3>Notiz erstellen</h3><label>Titel<input id="mName" placeholder="Titel"></label><div class="modal-actions"><button class="btn" data-close>Abbrechen</button><button class="btn primary" id="mSave">Erstellen</button></div>`);$('#mSave').onclick=()=>{const n={id:crypto.randomUUID(),title:$('#mName').value.trim()||'Neue Notiz',body:''};state.notes.push(n);noteId=n.id;closeModal();render();save()};$('#modal [data-close]').onclick=closeModal}
function closeDrawer(){$('#drawer').classList.remove('open')}
function back(){if(current==='dashboard')return;const idx=history.state?.p; if(idx&&idx!==current){history.back();return;} go('dashboard')}
function toast(t){$('#toast').textContent=t}
async function save(){localStorage.setItem('workspace-fallback',JSON.stringify(state));if(saving)return;saving=true;toast('● Speichere…');try{const r=await fetch(API+'?t='+Date.now(),{method:'PUT',headers:{'Content-Type':'application/json','Cache-Control':'no-cache'},cache:'no-store',body:JSON.stringify(state)});if(!r.ok)throw new Error();toast('✓ Gespeichert')}catch(e){toast('⚠ Lokal gespeichert')}finally{saving=false}}
async function sync(){if(syncing||saving)return;syncing=true;toast('● Synchronisiere…');try{const r=await fetch(API+'?t='+Date.now(),{cache:'no-store',headers:{'Cache-Control':'no-cache'}});if(!r.ok)throw new Error();const x=await r.json();if(x?.tasks&&x?.projects&&x?.notes&&x?.messages){const incoming=JSON.stringify(x);if(incoming!==JSON.stringify(state)){state=x;localStorage.setItem('workspace-fallback',incoming);render()}}toast('✓ Synchronisiert')}catch(e){toast('⚠ Offline / Fallback')}finally{syncing=false}}

$('#menuBtn').onclick=()=>$('#drawer').classList.add('open');
$('#drawerShade').onclick=closeDrawer;
$('#backBtn').onclick=back;
$('#syncBtn').onclick=sync;
$('#newBtn').onclick=()=>{if(current==='projects')projectModal();else if(current==='notes')noteModal();else taskModal()};
$('#modal').onclick=e=>{if(e.target.id==='modal')closeModal()};
window.addEventListener('popstate',()=>{current=routeFromHash();render()});
window.addEventListener('hashchange',()=>{const p=routeFromHash();if(p!==current){current=p;render()}});
if(!location.hash)history.replaceState({p:'dashboard'},'', '#dashboard');
render();sync();setInterval(sync,5000);
