
import {initializeApp} from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-app.js';
import {getAuth,GoogleAuthProvider,signInWithPopup,onAuthStateChanged,signOut} from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-auth.js';
import {getFirestore,doc,getDoc,setDoc,serverTimestamp,onSnapshot} from 'https://www.gstatic.com/firebasejs/12.6.0/firebase-firestore.js';
const app=initializeApp({apiKey:'AIzaSyCo05dvjXihGbfYhU_FHQ4OXg6SO_oRCU0',authDomain:'eco-club-40261.firebaseapp.com',projectId:'eco-club-40261',appId:'1:289680452873:web:c4fe4d451f1a488b9d37d8'});
const auth=getAuth(app),db=getFirestore(app),$=id=>document.getElementById(id);
let user=null,profile=null,siteCopy=null,contentUnsubscribe=null,roleLoading=false;
const base='./';
const login=$('eco2-login'),menu=$('eco2-menu'),drawer=$('eco2-drawer'),frame=$('eco2-frame'),content=$('eco2-copy');
function lang(){return document.documentElement.lang==='kk'?'kk':'ru'}
function say(ru,kz){return lang()==='kk'?kz:ru}
function status(message,bad=false){$('eco2-message').textContent=message;$('eco2-message').style.color=bad?'#a32625':'#275c43'}
function showGate(show){login.hidden=!show;document.body.classList.toggle('eco2-gated',show);$('eco2-menu').hidden=show}
function showView(name){for(const x of ['eco2-loading','eco2-signedout','eco2-register','eco2-wait'])$(x).hidden=x!==name}
function safeDisplay(){const r=profile?.status==='active'?profile.role:'visitor';return ({admin:['Администратор','Әкімші'],leader:['Руководитель','Жетекші'],teacher:['Учитель','Мұғалім'],student:['Ученик','Оқушы'],visitor:['Заявка','Өтінім']})[r]?.[lang()==='kk'?1:0]||r}
function roleMenu(){
 const active=profile?.status==='active';showGate(!active);
 if(!active)return;
 $('eco2-who').textContent=(user.displayName||user.email||'Eco Club')+' · '+safeDisplay();
 const roles=['teacher','leader','admin'];$('eco2-teacher-link').hidden=!roles.includes(profile.role);
 $('eco2-student-link').hidden=profile.role!=='student';
 $('eco2-admin-link').hidden=profile.role!=='admin';
 $('eco2-edit').hidden=profile.role!=='admin';
 $('eco2-logout').hidden=false;
}
function openPage(page){
 const allowed=['dashboard.html','teacher.html','student.html','admin-users.html'];
 if(!allowed.includes(page))return;
 if(!profile||profile.status!=='active')return;
 if(page==='teacher.html'&&!['teacher','leader','admin'].includes(profile.role))return;
 if(page==='student.html'&&profile.role!=='student')return;
 if(page==='admin-users.html'&&profile.role!=='admin')return;
 frame.src=page;drawer.hidden=false;document.body.classList.add('eco2-modal-open');$('eco2-close').focus();
}
function closePage(){drawer.hidden=true;frame.src='about:blank';document.body.classList.remove('eco2-modal-open')}
document.querySelectorAll('[data-eco2-page]').forEach(n=>n.addEventListener('click',e=>{e.preventDefault();openPage(n.dataset.eco2Page)}));
$('eco2-close').onclick=closePage;drawer.addEventListener('click',e=>{if(e.target===drawer)closePage()});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!drawer.hidden)closePage()});
$('eco2-google').onclick=async()=>{status('');$('eco2-google').disabled=true;try{await signInWithPopup(auth,new GoogleAuthProvider())}catch(e){status(e?.message||'Ошибка входа',true)}finally{$('eco2-google').disabled=false}};
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
 if(!profile){showView('eco2-register');showGate(true)}
 else if(profile.status==='active'){roleMenu();showView('eco2-loading')}
 else{$('eco2-wait-title').textContent=profile.status==='blocked'?'Доступ ограничен / Қолжетімділік шектелген':'Заявка ожидает проверки / Өтінім тексерілуде';showView('eco2-wait');showGate(true)}
 if(profile?.status==='active'&&!contentUnsubscribe)watchCopy();
 }catch(err){status('Ошибка профиля: '+(err?.message||err),true);showGate(true);showView('eco2-signedout')}
 finally{roleLoading=false}
}
onAuthStateChanged(auth,u=>{user=u;profile=null;if(contentUnsubscribe){contentUnsubscribe();contentUnsubscribe=null}if(u)load();else{showGate(true);showView('eco2-signedout');closePage()}},err=>{showGate(true);showView('eco2-signedout');status(err.message,true)});
function paint(){
 if(!siteCopy){content.hidden=true;return}
 const k=lang()==='kk'?'Kz':'Ru';const title=String(siteCopy['title'+k]||''),body=String(siteCopy['body'+k]||'');
 content.hidden=!title&&!body;$('eco2-copy-title').textContent=title;$('eco2-copy-body').textContent=body;
}
function watchCopy(){contentUnsubscribe=onSnapshot(doc(db,'siteContent','home'),snap=>{siteCopy=snap.exists()?snap.data():null;paint()},err=>{console.warn('Eco Club site text:',err.code)})}
$('eco2-edit').onclick=()=>{
 if(profile?.role!=='admin'||profile.status!=='active')return;
 const f=$('eco2-editpanel');f.hidden=false;
 for(const key of ['titleRu','titleKz','bodyRu','bodyKz'])$('eco2-'+key).value=siteCopy?.[key]||'';
};
$('eco2-edit-cancel').onclick=()=>{$('eco2-editpanel').hidden=true};
$('eco2-editform').onsubmit=async e=>{
 e.preventDefault();if(!user||profile?.role!=='admin'||profile?.status!=='active')return;
 $('eco2-edit-save').disabled=true;
 try{
 const value={titleRu:$('eco2-titleRu').value.trim(),titleKz:$('eco2-titleKz').value.trim(),bodyRu:$('eco2-bodyRu').value.trim(),bodyKz:$('eco2-bodyKz').value.trim(),updatedAt:serverTimestamp(),updatedBy:user.uid};
 await setDoc(doc(db,'siteContent','home'),value);
 $('eco2-editpanel').hidden=true;
 }catch(err){alert('Не удалось сохранить: '+(err?.message||err))}finally{$('eco2-edit-save').disabled=false}
};
new MutationObserver(paint).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
// The public site remains static HTML. This gate controls the UI, not secrecy of published source.
