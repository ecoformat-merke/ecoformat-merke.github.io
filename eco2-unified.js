
import {initializeApp} from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js';
import {getAuth,GoogleAuthProvider,signInWithPopup,onAuthStateChanged,signOut} from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js';
import {getFirestore,doc,getDoc,setDoc,serverTimestamp,onSnapshot} from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js';
const app=initializeApp({apiKey:'AIzaSyCo05dvjXihGbfYhU_FHQ4OXg6SO_oRCU0',authDomain:'eco-club-40261.firebaseapp.com',projectId:'eco-club-40261',appId:'1:289680452873:web:c4fe4d451f1a488b9d37d8'});
const auth=getAuth(app),db=getFirestore(app),$=id=>document.getElementById(id);
let user=null,profile=null,siteCopy=null,contentUnsubscribe=null,roleLoading=false,sectionUnsubscribers=[];
const base='./';
const login=$('eco2-login'),menu=$('eco2-menu'),drawer=$('eco2-drawer'),frame=$('eco2-frame'),content=$('eco2-copy');
function lang(){return document.documentElement.lang==='kk'?'kk':'ru'}
function say(ru,kz){return lang()==='kk'?kz:ru}
function status(message,bad=false){$('eco2-message').textContent=message;$('eco2-message').style.color=bad?'#a32625':'#275c43'}
function showGate(show){login.hidden=!show;document.body.classList.toggle('eco2-gated',show);$('eco2-menu').hidden=show;if(show){$('eco2-menu-toggle').hidden=true;setMenuOpen(false)}else{$('eco2-menu-toggle').hidden=false}}
function showView(name){for(const x of ['eco2-loading','eco2-signedout','eco2-register','eco2-wait'])$(x).hidden=x!==name}
function safeDisplay(){const r=profile?.status==='active'?profile.role:'visitor';return ({admin:['Администратор','Әкімші'],leader:['Руководитель','Жетекші'],teacher:['Учитель','Мұғалім'],student:['Ученик','Оқушы'],visitor:['Заявка','Өтінім']})[r]?.[lang()==='kk'?1:0]||r}
let menuExpanded=window.matchMedia('(min-width: 801px)').matches;
function setMenuOpen(value){menuExpanded=Boolean(value);menu.hidden=!menuExpanded;$('eco2-menu-toggle').setAttribute('aria-expanded',String(menuExpanded));$('eco2-menu-toggle').textContent=menuExpanded?'× Закрыть меню':'☘ Кабинет'}
$('eco2-menu-toggle').onclick=()=>setMenuOpen(!menuExpanded);
function roleMenu(){
 const active=profile?.status==='active';showGate(!active);
 if(!active)return;
 $('eco2-who').textContent=(user.displayName||user.email||'Eco Club')+' · '+safeDisplay();
 const roles=['teacher','leader','admin'];$('eco2-teacher-link').hidden=!roles.includes(profile.role);
 $('eco2-student-link').hidden=profile.role!=='student';
 $('eco2-admin-link').hidden=profile.role!=='admin';
 $('eco2-edit').hidden=profile.role!=='admin';
 $('eco2-edit-sections').hidden=profile.role!=='admin';
 $('eco2-logout').hidden=false;
 const shortcut=document.querySelector('.ln-actions a[href="login.html"]');
 if(shortcut){shortcut.textContent=say('Открыть кабинет','Жеке кабинетті ашу');shortcut.setAttribute('data-ru','Открыть кабинет');shortcut.setAttribute('data-kz','Жеке кабинетті ашу')}
 setMenuOpen(window.matchMedia('(min-width: 801px)').matches);
}
function openPage(page){
 const allowed=['dashboard.html','teacher.html','student.html','admin-users.html'];
 if(!allowed.includes(page))return;
 if(!profile||profile.status!=='active')return;
 if(page==='teacher.html'&&!['teacher','leader','admin'].includes(profile.role))return;
 if(page==='student.html'&&profile.role!=='student')return;
 if(page==='admin-users.html'&&profile.role!=='admin')return;
 setMenuOpen(false); frame.src=page;drawer.hidden=false;document.body.classList.add('eco2-modal-open');$('eco2-close').focus();
}
function closePage(){drawer.hidden=true;frame.src='about:blank';document.body.classList.remove('eco2-modal-open')}
document.querySelectorAll('[data-eco2-page]').forEach(n=>n.addEventListener('click',e=>{e.preventDefault();openPage(n.dataset.eco2Page)}));
document.querySelectorAll('a[href="login.html"],a[href="teacher.html"],a[href="student.html"],a[href="dashboard.html"],a[href="admin-users.html"]').forEach(link=>{
 link.addEventListener('click',e=>{
  e.preventDefault();
  if(!user||profile?.status!=='active'){showGate(true);return}
  const page=link.getAttribute('href')==='login.html'?'dashboard.html':link.getAttribute('href');
  openPage(page);
 });
});
$('eco2-close').onclick=closePage;drawer.addEventListener('click',e=>{if(e.target===drawer)closePage()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!drawer.hidden)closePage()});
async function selectGoogleAccount(){status('');const provider=new GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});await signInWithPopup(auth,provider)}
$('eco2-google').onclick=async()=>{$('eco2-google').disabled=true;try{await selectGoogleAccount()}catch(e){status(e?.message||'Ошибка входа',true)}finally{$('eco2-google').disabled=false}};
$('eco2-switch-account').onclick=async()=>{$('eco2-switch-account').disabled=true;try{await signOut(auth);await selectGoogleAccount()}catch(e){status('Не удалось войти: '+(e?.message||e),true)}finally{$('eco2-switch-account').disabled=false}};
$('eco2-exit').onclick=async()=>{closePage();await signOut(auth)};
$('eco2-logout').onclick=()=>signOut(auth);
$('eco2-role').onchange=()=>{$('eco2-classrow').hidden=$('eco2-role').value!=='student';$('eco2-class').required=$('eco2-role').value==='student'};
$('eco2-registration-form').onsubmit=async e=>{
 e.preventDefault();if(!user)return;
 const role=$('eco2-role').value,cls=$('eco2-class').value.trim();
 if(role==='student'&&!cls)return status('Укажите класс',true);
 if(!$('eco2-consent').checked)return status('Подтвердите ознакомление с правилами и наличие необходимого согласия',true);
 $('eco2-register-button').disabled=true;
 try{
 await setDoc(doc(db,'profiles',user.uid),{uid:user.uid,displayName:(user.displayName||'').slice(0,120),email:user.email,requestedRole:role,requestedClass:role==='student'?cls.slice(0,20):'',role:'visitor',status:'pending',createdAt:serverTimestamp()});
 await load();
 }catch(err){status(err?.message||'Ошибка регистрации',true)}finally{$('eco2-register-button').disabled=false}
};
$('eco2-refresh').onclick=()=>load();
async function load(){
 if(!user||roleLoading)return;roleLoading=true;showView('eco2-loading');
 try{const p=await getDoc(doc(db,'profiles',user.uid));profile=p.exists()?p.data():null;
 if(!profile){showView('eco2-register');showGate(true);status('Сейчас выбран аккаунт: '+(user.email||'Google')+'. Если это не ваш зарегистрированный аккаунт, нажмите «Войти в существующий аккаунт».')}
 else if(profile.status==='active'){roleMenu();showView('eco2-loading')}
 else{$('eco2-wait-title').textContent=profile.status==='blocked'?'Доступ ограничен / Қолжетімділік шектелген':'Заявка ожидает проверки / Өтінім тексерілуде';showView('eco2-wait');showGate(true)}
 if(profile?.status==='active'&&!contentUnsubscribe){watchCopy();watchSections()}
 }catch(err){status('Ошибка профиля: '+(err?.message||err),true);showGate(true);showView('eco2-signedout')}
 finally{roleLoading=false}
}
onAuthStateChanged(auth,u=>{user=u;profile=null;if(!u){const shortcut=document.querySelector('.ln-actions a[href="login.html"]');if(shortcut){shortcut.textContent=say('Войти / Регистрация','Кіру / Тіркелу');shortcut.setAttribute('data-ru','Войти / Регистрация');shortcut.setAttribute('data-kz','Кіру / Тіркелу')}}if(contentUnsubscribe){contentUnsubscribe();contentUnsubscribe=null}sectionUnsubscribers.forEach(fn=>fn());sectionUnsubscribers=[];if(u)load();else{showGate(true);showView('eco2-signedout');closePage()}},err=>{showGate(true);showView('eco2-signedout');status(err.message,true)});
function paint(){
 if(!siteCopy){content.hidden=true;return}
 const k=lang()==='kk'?'Kz':'Ru';const title=String(siteCopy['title'+k]||''),body=String(siteCopy['body'+k]||'');
 content.hidden=!title&&!body;$('eco2-copy-title').textContent=title;$('eco2-copy-body').textContent=body;
 const hero=document.querySelector('#home .ln-hero-copy p[data-ru]'),news=document.querySelector('#news h2.title');
 const apply=(el,ru,kz)=>{if(!el)return; if(ru)el.setAttribute('data-ru',ru);if(kz)el.setAttribute('data-kz',kz);el.textContent=el.getAttribute('data-'+(lang()==='kk'?'kz':'ru'))||''};
 apply(hero,siteCopy.heroDescRu,siteCopy.heroDescKz);apply(news,siteCopy.newsTitleRu,siteCopy.newsTitleKz);
}
function watchCopy(){contentUnsubscribe=onSnapshot(doc(db,'siteContent','home'),snap=>{siteCopy=snap.exists()?snap.data():null;paint()},err=>{console.warn('Eco Club site text:',err.code)})}
$('eco2-edit').onclick=()=>{
 if(profile?.role!=='admin'||profile.status!=='active')return;
 const f=$('eco2-editpanel');f.hidden=false;
 for(const key of ['titleRu','titleKz','bodyRu','bodyKz'])$('eco2-'+key).value=siteCopy?.[key]||'';
 const hero=document.querySelector('#home .ln-hero-copy p[data-ru]'),news=document.querySelector('#news h2.title');
 for(const key of ['heroDescRu','heroDescKz','newsTitleRu','newsTitleKz']){
 const el=key.startsWith('hero')?hero:news,lc=key.endsWith('Ru')?'ru':'kz';
 $('eco2-'+key).value=siteCopy?.[key]||el?.getAttribute('data-'+lc)||'';
 }
};
$('eco2-edit-cancel').onclick=()=>{$('eco2-editpanel').hidden=true};
$('eco2-editform').onsubmit=async e=>{
 e.preventDefault();if(!user||profile?.role!=='admin'||profile?.status!=='active')return;
 $('eco2-edit-save').disabled=true;
 try{
 const value={titleRu:$('eco2-titleRu').value.trim(),titleKz:$('eco2-titleKz').value.trim(),bodyRu:$('eco2-bodyRu').value.trim(),bodyKz:$('eco2-bodyKz').value.trim(),heroDescRu:$('eco2-heroDescRu').value.trim(),heroDescKz:$('eco2-heroDescKz').value.trim(),newsTitleRu:$('eco2-newsTitleRu').value.trim(),newsTitleKz:$('eco2-newsTitleKz').value.trim(),updatedAt:serverTimestamp(),updatedBy:user.uid};
 await setDoc(doc(db,'siteContent','home'),value);
 $('eco2-editpanel').hidden=true;
 }catch(err){alert('Не удалось сохранить: '+(err?.message||err))}finally{$('eco2-edit-save').disabled=false}
};
new MutationObserver(()=>{paint();for(const id of sectionIds)paintSection(id)}).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});

const sectionIds=['about','tasks','results','projects','gallery','team','members','application'];
const sectionData=new Map();
const sectionDefaults=new Map();
function sectionEls(id){
  const root=document.getElementById(id);
  return root?{heading:root.querySelector('h2.title'),lead:root.querySelector('.lead, .projects-lead')}:null;
}
function originalSection(id){
  const el=sectionEls(id);
  if(!el||!el.heading||!el.lead)return null;
  if(!sectionDefaults.has(id))sectionDefaults.set(id,{
    titleRu:el.heading.getAttribute('data-ru')||'',
    titleKz:el.heading.getAttribute('data-kz')||'',
    descRu:el.lead.getAttribute('data-ru')||'',
    descKz:el.lead.getAttribute('data-kz')||''
  });
  return sectionDefaults.get(id);
}
function paintSection(id){
  const nodes=sectionEls(id),defaults=originalSection(id);
  if(!nodes||!defaults)return;
  const data=sectionData.get(id)||defaults;
  const apply=(el,ru,kz)=>{
    const a=String(ru||''),b=String(kz||'');
    el.setAttribute('data-ru',a);el.setAttribute('data-kz',b);
    el.textContent=lang()==='kk'?b:a;
  };
  apply(nodes.heading,data.titleRu||defaults.titleRu,data.titleKz||defaults.titleKz);
  apply(nodes.lead,data.descRu||defaults.descRu,data.descKz||defaults.descKz);
}
function watchSections(){
  sectionUnsubscribers.forEach(fn=>fn());sectionUnsubscribers=[];
  for(const id of sectionIds){
    originalSection(id);
    sectionUnsubscribers.push(onSnapshot(doc(db,'siteSections',id),
      snap=>{sectionData.set(id,snap.exists()?snap.data():null);paintSection(id)},
      error=>console.warn('Eco Club section',id,error.code||error.message)
    ));
  }
}
function fillSectionForm(){
  const id=$('eco2-section-id').value,defaults=originalSection(id);
  if(!defaults){$('eco2-section-status').textContent='Раздел недоступен для редактирования';return}
  const data=sectionData.get(id)||defaults;
  for(const k of ['titleRu','titleKz','descRu','descKz'])$('eco2-section-'+k).value=String(data[k]||defaults[k]);
  $('eco2-section-status').textContent='';
}
$('eco2-edit-sections').onclick=()=>{
  if(profile?.status!=='active'||profile?.role!=='admin')return;
  $('eco2-section-editor').hidden=false;fillSectionForm();setMenuOpen(false);
};
$('eco2-section-id').onchange=fillSectionForm;
$('eco2-section-cancel').onclick=()=>{$('eco2-section-editor').hidden=true};
$('eco2-section-form').onsubmit=async e=>{
  e.preventDefault();
  if(!user||profile?.status!=='active'||profile?.role!=='admin')return;
  const id=$('eco2-section-id').value;if(!sectionIds.includes(id))return;
  const value={};
  for(const k of ['titleRu','titleKz','descRu','descKz'])value[k]=$('eco2-section-'+k).value.trim();
  value.updatedBy=user.uid;value.updatedAt=serverTimestamp();
  $('eco2-section-save').disabled=true;$('eco2-section-status').textContent='Сохраняем…';
  try{
    await setDoc(doc(db,'siteSections',id),value);
    $('eco2-section-editor').hidden=true;
    document.getElementById(id)?.scrollIntoView({block:'start',behavior:'smooth'});
  }catch(error){$('eco2-section-status').textContent='Не удалось сохранить: '+(error?.message||error)}
  finally{$('eco2-section-save').disabled=false}
};

// The public site remains static HTML. This gate controls the UI, not secrecy of published source.
