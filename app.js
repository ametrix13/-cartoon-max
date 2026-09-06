const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const KEY='cartoonmax3';
let state=JSON.parse(localStorage.getItem(KEY)||'null')||{theme:'night',lang:'tr',profile:0,profiles:[{name:'Ana Profil',avatar:'😎',kid:false},{name:'Çocuk',avatar:'🧸',kid:true},{name:'Misafir',avatar:'👾',kid:false}],fav:{},cfav:{},ratings:{},comments:{},account:null,accounts:{},posterCache:{}};
state.posterCache ||= {};
const save=()=>localStorage.setItem(KEY,JSON.stringify(state));
const prof=()=>state.profiles[state.profile]||state.profiles[0];
const pfav=()=>state.fav[state.profile]||(state.fav[state.profile]=[]);
const fav=x=>pfav().includes(x.title);
const posterJobs=new Set();

const T={tr:{home:'Ana Sayfa',shows:'Diziler',movies:'Filmler',people:'Karakterler',years:'Takvim',list:'Listem',today:'Bugün ne izlesem?'},en:{home:'Home',shows:'Shows',movies:'Movies',people:'Characters',years:'Timeline',list:'My List',today:'What should I watch?'}};

document.head.insertAdjacentHTML('beforeend',`<style>
.card.poster-card{padding:0;min-height:286px;background:#0b1627}
.poster-wrap{position:absolute;inset:0}
.poster{position:absolute;inset:0;background-size:cover;background-position:center top;transition:transform .25s ease,filter .25s ease;filter:saturate(1.02)}
.poster::after{content:'';position:absolute;inset:0;background:linear-gradient(180deg,#0000 0%,#0001 45%,#051018b0 70%,#051018 100%)}
.card.poster-card:hover .poster{transform:scale(1.04)}
.card-body{position:absolute;left:0;right:0;bottom:0;padding:16px;z-index:2}
.card.poster-card h3{font-size:18px;line-height:1.1;margin:8px 0 8px;text-shadow:0 2px 10px #000a}
.card.poster-card p{font-size:12px;color:#dde6f4;text-shadow:0 2px 8px #0008}
.card.poster-card .net{display:inline-flex;background:#0007;border:1px solid #ffffff20;border-radius:999px;padding:5px 8px;font-size:10px;font-weight:900;letter-spacing:.7px;color:var(--a,#68f1c8);text-transform:uppercase;backdrop-filter:blur(8px)}
.card.poster-card .year{z-index:3;background:#0008;border:1px solid #ffffff16;backdrop-filter:blur(8px)}
.card.poster-card .fav{z-index:3;right:12px;bottom:12px;background:#0008;border:1px solid #ffffff16;backdrop-filter:blur(8px)}
.poster-skel{position:absolute;inset:0;background:linear-gradient(120deg,#12233e,#18345a,#12233e);background-size:200% 100%;animation:cmsh 1.4s linear infinite}
@keyframes cmsh{0%{background-position:200% 0}100%{background-position:-200% 0}}
.detail-art{height:280px;border-radius:20px;overflow:hidden;border:1px solid #ffffff18;background:#101b2d;margin:10px 0 18px;position:relative}
.detail-art .poster{background-position:center 20%}
.detail-art .poster::after{background:linear-gradient(180deg,#00000018 0%,#0410183d 55%,#07101fb5 100%)}
.detail-overlay{position:absolute;inset:auto 0 0 0;padding:22px;z-index:2}
.detail-overlay h2{margin:0 0 4px;font-size:32px;text-shadow:0 2px 12px #000a}
.detail-overlay p{margin:0;color:#e1e8f4}
html[data-theme=light] .card.poster-card p,html[data-theme=light] .detail-overlay p{color:#eff4ff}
</style>`);

function applyPrefs(){document.documentElement.dataset.theme=state.theme;$('#theme').value=state.theme;$('#lang').value=state.lang;let z=T[state.lang];$$('#nav button').forEach(b=>b.textContent=z[b.dataset.view]||b.textContent);$('#todayBtn').textContent=z.today}
function filtered(a){if(!prof().kid)return a;return a.filter(x=>isMovie(x)||x.type==='animation')}
function esc(s){return String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;')}
function safeUrl(s){return String(s).replace(/'/g,'%27').replace(/\)/g,'%29').replace(/\(/g,'%28')}
function placeholder(x){
  let c=x.network==='Nickelodeon'?'#ff7b00':x.network==='Disney Channel'?'#5d56e8':x.network==='Disney XD'?'#4ddb7c':x.network==='Jetix'?'#f55063':'#33c9ff';
  let s=(x.type==='movie'?'Film / Özel':'Dizi').replace('&','ve');
  let svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 560"><defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="1"><stop stop-color="#0d1b2e"/><stop offset="1" stop-color="${c}"/></linearGradient></defs><rect width="400" height="560" fill="url(#g)"/><rect x="20" y="20" width="360" height="520" rx="24" fill="rgba(255,255,255,0.06)" stroke="rgba(255,255,255,0.2)"/><text x="36" y="72" fill="white" font-family="Arial,sans-serif" font-size="22" font-weight="700">${esc(x.network)}</text><text x="36" y="140" fill="white" font-family="Arial,sans-serif" font-size="38" font-weight="900">${esc(x.title).replace(/&amp;/g,'&')}</text><text x="36" y="500" fill="white" font-family="Arial,sans-serif" font-size="22">${x.year} • ${s}</text></svg>`;
  return 'data:image/svg+xml;charset=utf-8,'+encodeURIComponent(svg);
}
function posterFor(x){return state.posterCache[x.title]||placeholder(x)}
function card(x){return `<article class="card poster-card" data-title="${esc(x.title)}"><div class="poster-wrap"><div class="poster" data-poster="${esc(x.title)}" style="background-image:url('${safeUrl(posterFor(x))}')"></div></div><span class="year">${x.year}</span><div class="card-body"><div class="net">${x.network}</div><h3>${x.title}</h3><p>${x.type==='teen'?'Gençlik dizisi':x.type==='movie'?'Film / özel yapım':'Çizgi dizi'}</p></div><button class="fav" data-fav="${esc(x.title)}">${fav(x)?'♥':'♡'}</button></article>`}
function bindCards(root=document){root.querySelectorAll('.card[data-title]').forEach(c=>c.onclick=e=>{if(e.target.dataset.fav!==undefined)return;openDetail(c.dataset.title)});root.querySelectorAll('[data-fav]').forEach(b=>b.onclick=e=>{e.stopPropagation();let t=b.dataset.fav,a=pfav(),i=a.indexOf(t);i>=0?a.splice(i,1):a.push(t);save();render();})}
function score(x){let s=0,a=pfav().map(t=>catalog.find(z=>z.title===t)).filter(Boolean);a.forEach(f=>{if(f.network===x.network)s+=3;if(f.type===x.type)s+=2;if(Math.abs(f.year-x.year)<4)s++});s+=((x.title.length*13+x.year)%11)/10;return s}
function daily(){let d=new Date().toISOString().slice(0,10),seed=[...d].reduce((a,c)=>a+c.charCodeAt(0),state.profile*19+7);let a=filtered(catalog);return a[seed%a.length]}
function chips(){let ns=['Tümü','Cartoon Network','Nickelodeon','Disney Channel','Disney XD','Jetix'];$('#chips').innerHTML=ns.map(n=>`<button class="chip" data-n="${n}">${n}</button>`).join('');$('#showChips').innerHTML=$('#chips').innerHTML;$$('[data-n]').forEach(b=>b.onclick=()=>{let a=filtered(catalog).filter(x=>!isMovie(x)&&(b.dataset.n==='Tümü'||x.network===b.dataset.n));$('#showsGrid').innerHTML=a.map(card).join('');show('shows');bindCards($('#showsGrid'));hydratePosters($('#showsGrid'))})}
function render(){let a=filtered(catalog),shows=a.filter(x=>!isMovie(x)),movies=a.filter(isMovie),d=daily();$('#countAll').textContent=a.length;$('#countShows').textContent=shows.length;$('#countMovies').textContent=movies.length;$('#todayTitle').textContent=d.title;$('#todayMeta').textContent=`${d.network} · ${d.year}`;let rec=[...a].filter(x=>!fav(x)).sort((x,y)=>score(y)-score(x)).slice(0,12);$('#recGrid').innerHTML=rec.map(card).join('');$('#homeGrid').innerHTML=a.filter(x=>x.year>=2000&&x.year<=2015).slice(0,18).map(card).join('');$('#showsGrid').innerHTML=shows.map(card).join('');$('#moviesGrid').innerHTML=movies.map(card).join('');let list=a.filter(fav);$('#listGrid').innerHTML=list.length?list.map(card).join(''):'<p class="muted">Listen henüz boş.</p>';renderPeople();renderYears();$$('.grid').forEach(bindCards);$$('.grid').forEach(hydratePosters)}
function show(id){$$('.view').forEach(v=>v.classList.toggle('on',v.id===id));window.scrollTo({top:0,behavior:'smooth'});setTimeout(()=>$$('.view.on .grid').forEach(hydratePosters),60)}
function renderPeople(){let f=state.cfav[state.profile]||(state.cfav[state.profile]=[]);$('#peopleGrid').innerHTML=people.map(p=>`<article class="card"><div class="net">${p.network}</div><h3>${p.name}</h3><p>${p.show}<br>${p.actor}</p><button class="fav" data-cfav="${esc(p.name)}">${f.includes(p.name)?'♥':'♡'}</button></article>`).join('');$$('[data-cfav]').forEach(b=>b.onclick=()=>{let i=f.indexOf(b.dataset.cfav);i>=0?f.splice(i,1):f.push(b.dataset.cfav);save();renderPeople()})}
function renderYears(){let ys=[...new Set(filtered(catalog).map(x=>x.year))].sort((a,b)=>a-b);$('#yearGrid').innerHTML=ys.map(y=>`<button class="yearbtn" data-y="${y}"><b>${y}</b><br><span class="muted">${catalog.filter(x=>x.year===y).length} yapım</span></button>`).join('');$$('[data-y]').forEach(b=>b.onclick=()=>{let a=filtered(catalog).filter(x=>x.year==b.dataset.y);$('#yearResults').innerHTML=a.map(card).join('');bindCards($('#yearResults'));hydratePosters($('#yearResults'))})}

async function fetchPoster(title){
  if(state.posterCache[title]||posterJobs.has(title)) return state.posterCache[title]||null;
  posterJobs.add(title);
  try{
    let q=title.replace(/\(\d{4}\)/g,'').replace(/[:!]/g,' ').trim();
    let r=await fetch('https://api.tvmaze.com/singlesearch/shows?q='+encodeURIComponent(q));
    if(!r.ok) throw 0;
    let j=await r.json();
    let src=j?.image?.original||j?.image?.medium||'';
    if(src){ state.posterCache[title]=src; save(); updatePosterDom(title,src); }
    return src||null;
  }catch(e){
    return null;
  }finally{ posterJobs.delete(title); }
}
function updatePosterDom(title,src){$$(`[data-poster="${CSS.escape(title)}"]`).forEach(el=>el.style.backgroundImage=`url('${safeUrl(src)}')`)}
function hydratePosters(root=document){let cards=[...root.querySelectorAll('.card[data-title]')].slice(0,48); cards.forEach((el,i)=>{ let title=el.dataset.title; if(state.posterCache[title]) updatePosterDom(title,state.posterCache[title]); else setTimeout(()=>fetchPoster(title),i*120); }); }

let current=null,tv=null;
async function openDetail(title){
  current=catalog.find(x=>x.title===title); if(!current) return;
  $('#dTitle').textContent=current.title; $('#dNet').textContent=current.network; $('#dMeta').textContent=`${current.year} · ${current.type==='movie'?'Film / özel':'Dizi'}`; $('#dDesc').textContent=`${current.title}, ${current.network} döneminin Cartoon Max arşivindeki yapımlarından biri.`; $('#toggleFav').textContent=fav(current)?'✓ Listemde':'+ Listem';
  $('#cast').innerHTML='<span class="muted">Yükleniyor…</span>'; $('#eps').innerHTML='<div class="muted">Bölüm rehberi yükleniyor…</div>'; $('#seasonTabs').innerHTML=''; drawRating(); drawComments();
  let art=posterFor(current);
  let detailTop=`<div class="detail-art"><div class="poster" style="background-image:url('${safeUrl(art)}')"></div><div class="detail-overlay"><div class="net">${current.network}</div><h2>${current.title}</h2><p>${current.year} · ${current.type==='teen'?'Gençlik dizisi':current.type==='movie'?'Film / özel yapım':'Çizgi dizi'}</p></div></div>`;
  if(!$('#detailVisual')){
    let holder=document.createElement('div'); holder.id='detailVisual'; $('#detailModal .box').insertBefore(holder,$('#dNet'));
  }
  $('#detailVisual').innerHTML=detailTop;
  openM('detailModal');
  fetchPoster(current.title).then(src=>{ if(src && current?.title===title) $('#detailVisual').innerHTML=detailTop.replace(safeUrl(art),safeUrl(src)); });
  try{
    let r=await fetch('https://api.tvmaze.com/singlesearch/shows?q='+encodeURIComponent(current.title.replace(/\(\d{4}\)/g,'').trim())+'&embed[]=episodes&embed[]=cast');
    if(!r.ok) throw 0; tv=await r.json();
    let src=tv?.image?.original||tv?.image?.medium||''; if(src){state.posterCache[current.title]=src; save(); $('#detailVisual .poster').style.backgroundImage=`url('${safeUrl(src)}')`; updatePosterDom(current.title,src)}
    let cast=tv._embedded?.cast||[];
    $('#cast').innerHTML=cast.slice(0,12).map(c=>`<span class="pill">${c.person?.name||''}${c.character?.name?' · '+c.character.name:''}</span>`).join('')||'<span class="muted">Oyuncu bilgisi bulunamadı.</span>';
    let es=tv._embedded?.episodes||[]; let ss=[...new Set(es.map(e=>e.season))];
    $('#seasonTabs').innerHTML=ss.map((n,i)=>`<button class="chip ${i?'':'on'}" data-s="${n}">Sezon ${n}</button>`).join('');
    function se(n){$('#eps').innerHTML=es.filter(e=>e.season==n).map(e=>`<div class="ep"><b>${e.number||'•'}</b><div><strong>${e.name}</strong><div class="muted">${e.airdate||''}</div></div></div>`).join('')||'<div class="muted">Bölüm bilgisi yok.</div>'}
    if(ss.length) se(ss[0]); $$('[data-s]').forEach(b=>b.onclick=()=>se(b.dataset.s));
  }catch(e){ $('#cast').innerHTML='<span class="muted">Canlı oyuncu verisi şu an alınamadı.</span>'; $('#eps').innerHTML='<div class="muted">Bölüm rehberi şu an alınamadı.</div>' }
}
function drawRating(){let n=state.ratings[current?.title]||0;$('#stars').innerHTML=[1,2,3,4,5].map(i=>`<button class="star" data-r="${i}">${i<=n?'★':'☆'}</button>`).join('');$$('[data-r]').forEach(b=>b.onclick=()=>{state.ratings[current.title]=+b.dataset.r;save();drawRating()})}
function drawComments(){let a=state.comments[current?.title]||[];$('#comments').innerHTML=a.slice().reverse().map(c=>`<div class="comment"><div><b>${c.by}</b><div>${esc(c.text)}</div></div></div>`).join('')}
function openM(id){$('#'+id).classList.add('open')} function closeM(m){m.classList.remove('open')}
function renderProfiles(){let a=state.profiles;$('#profiles').innerHTML=a.map((p,i)=>`<button class="profile" data-p="${i}"><i>${p.avatar}</i><br><b>${p.name}</b>${p.kid?'<div class="muted">Çocuk</div>':''}</button>`).join('');$$('[data-p]').forEach(b=>b.onclick=()=>{state.profile=+b.dataset.p;save();closeM($('#profileModal'));render()})}
let selAv='😎';
function renderAv(){let a=['😎','🧸','👾','🦸','🦄','🐼','🐯','🤖','🛹','🎮','👽','⭐'];$('#avatars').innerHTML=a.map(x=>`<button class="av ${x===selAv?'on':''}" data-av="${x}">${x}</button>`).join('');$$('[data-av]').forEach(b=>b.onclick=()=>{selAv=b.dataset.av;renderAv()})}
async function hash(s){let b=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
function accountUI(){if(state.account){$('#accountState').innerHTML=`<p>Giriş yapıldı: <b>${state.account}</b></p><button class="btn alt" id="logout">Çıkış yap</button>`;$('#accountForms').style.display='none';$('#logout').onclick=()=>{state.account=null;save();accountUI()}}else{$('#accountState').innerHTML='';$('#accountForms').style.display='grid'}}
function search(q){q=q.toLowerCase().trim();let a=filtered(catalog).filter(x=>x.title.toLowerCase().includes(q)).slice(0,60);let ps=people.filter(p=>p.name.toLowerCase().includes(q)||p.show.toLowerCase().includes(q)).slice(0,12);$('#searchGrid').innerHTML=a.map(card).join('')+ps.map(p=>`<article class="card" data-charshow="${esc(p.show)}"><div class="net">Karakter</div><h3>${p.name}</h3><p>${p.show}</p></article>`).join('');bindCards($('#searchGrid'));hydratePosters($('#searchGrid'));$$('[data-charshow]').forEach(c=>c.onclick=()=>openDetail(c.dataset.charshow))}
$$('#nav button').forEach(b=>b.onclick=()=>show(b.dataset.view));$$('[data-go]').forEach(b=>b.onclick=()=>show(b.dataset.go));
$('#searchBtn').onclick=()=>{$('#search').classList.add('open');$('#q').focus()}; $('#searchClose').onclick=()=>$('#search').classList.remove('open'); $('#q').oninput=e=>search(e.target.value);
$('#settingsBtn').onclick=()=>openM('settingsModal'); $('#profileBtn').onclick=()=>{renderProfiles();renderAv();openM('profileModal')}; $('#accountBtn').onclick=()=>{accountUI();openM('accountModal')};
$$('[data-close]').forEach(b=>b.onclick=()=>closeM(b.closest('.modal'))); $$('.modal').forEach(m=>m.onclick=e=>{if(e.target===m)closeM(m)});
$('#theme').onchange=e=>{state.theme=e.target.value;save();applyPrefs()}; $('#lang').onchange=e=>{state.lang=e.target.value;save();applyPrefs()}; $('#todayBtn').onclick=$('#heroToday').onclick=()=>openDetail(daily());
$('#toggleFav').onclick=()=>{let a=pfav(),i=a.indexOf(current.title);i>=0?a.splice(i,1):a.push(current.title);save();$('#toggleFav').textContent=fav(current)?'✓ Listemde':'+ Listem';render()};
$('#watchOfficial').onclick=()=>window.open('https://www.justwatch.com/tr/arama?q='+encodeURIComponent(current.title),'_blank','noopener');
$('#commentBtn').onclick=()=>{let t=$('#commentText').value.trim();if(!t)return;(state.comments[current.title]||(state.comments[current.title]=[])).push({by:state.account||prof().name,text:t});$('#commentText').value='';save();drawComments()};
$('#addProfile').onclick=()=>{let n=$('#profileName').value.trim();if(!n)return;state.profiles.push({name:n,avatar:selAv,kid:$('#kid').checked});state.profile=state.profiles.length-1;save();closeM($('#profileModal'));render()};
$('#register').onclick=async()=>{let e=$('#email').value.trim().toLowerCase(),p=$('#pass').value;if(!e||p.length<4)return alert('E-posta ve en az 4 karakter şifre gir.');state.accounts[e]=await hash(p);state.account=e;save();accountUI()};
$('#login').onclick=async()=>{let e=$('#email').value.trim().toLowerCase(),p=await hash($('#pass').value);if(state.accounts[e]!==p)return alert('E-posta veya şifre yanlış.');state.account=e;save();accountUI()};
chips();applyPrefs();render();
setTimeout(()=>{let spotlight=filtered(catalog).slice(0,24); spotlight.forEach((x,i)=>setTimeout(()=>fetchPoster(x.title),i*140));},300);