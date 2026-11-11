/* Eco Club — Impact Dashboard 1.0: listens to existing verified API updates. */
(function(){
'use strict';
const section=document.getElementById('results');
const anchor=document.getElementById('resultsGoalCard');
if(!section||!anchor)return;
const dashboard=document.createElement('section');
dashboard.className='eco-impact-dashboard';
dashboard.setAttribute('aria-label','Интерактивная статистика Eco Club');
dashboard.innerHTML='<div class="eco-impact-header"><div><p class="eco-impact-eyebrow"></p><h3 class="eco-impact-title"></h3><p class="eco-impact-sub"></p></div><span class="eco-impact-source" role="status"></span></div><div class="eco-impact-tabs" role="tablist" aria-label="Показатель"></div><div class="eco-impact-panel" role="tabpanel"><div><strong class="eco-impact-number">—</strong><div class="eco-impact-unit"></div></div><div><div class="eco-impact-progress-caption"><span class="eco-impact-progress-name"></span><strong class="eco-impact-progress-value">—</strong></div><div class="eco-impact-progress-rail" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="eco-impact-progress-bar"></div></div><p class="eco-impact-progress-detail"></p></div></div><p class="eco-impact-disclaimer"></p>';
anchor.insertAdjacentElement('afterend',dashboard);
const $=sel=>dashboard.querySelector(sel);
const tabs=$('.eco-impact-tabs');
const kaz=()=>document.documentElement.lang==='kk';
const tr=(ru,kk)=>kaz()?kk:ru;
const data={
  members:{value:null,ref:null,loaded:false},
  paper:{value:null,ref:100,loaded:false},
  caps:{value:null,ref:20000,loaded:false}
};
const specs=[
 {key:'members',tab:['Участники','Қатысушылар'],unit:['человек','адам'],focus:['Выполнение цели клуба','Клуб мақсатының орындалуы'],basis:['Цель сообщества','Қауымдастық мақсаты']},
 {key:'paper',tab:['Макулатура','Макулатура'],unit:['кг','кг'],focus:['Сбор макулатуры','Макулатура жинау'],basis:['Ориентир визуализации','Көрнекі бағдар']},
 {key:'caps',tab:['Крышки','Қақпақтар'],unit:['шт.','дана'],focus:['Сбор пластиковых крышек','Пластик қақпақтарды жинау'],basis:['Ориентир визуализации','Көрнекі бағдар']}
];
let selected='members';
const nodes={};
const num=n=>Number(n).toLocaleString(kaz()?'kk-KZ':'ru-RU',{maximumFractionDigits:1});
for(const spec of specs){
 const btn=document.createElement('button');
 btn.type='button';btn.className='eco-impact-tab';btn.setAttribute('role','tab');
 btn.addEventListener('click',()=>{selected=spec.key;render();btn.focus()});
 tabs.append(btn);nodes[spec.key]=btn;
}
tabs.addEventListener('keydown',e=>{
 if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;
 e.preventDefault();
 const i=specs.findIndex(s=>s.key===selected);
 const target=e.key==='Home'?0:e.key==='End'?specs.length-1:(i+(e.key==='ArrowLeft'?-1:1)+specs.length)%specs.length;
 selected=specs[target].key;render();nodes[selected].focus();
});
function render(){
 $('.eco-impact-eyebrow').textContent=tr('ЭКОМОНИТОРИНГ • ECO CLUB','ЭКОМОНИТОРИНГ • ECO CLUB');
 $('.eco-impact-title').textContent=tr('Экологический прогресс в цифрах','Экологиялық прогресс сандармен');
 $('.eco-impact-sub').textContent=tr('Показатели обновляются из учётной системы клуба. Выберите направление, чтобы увидеть результат и ориентир.','Көрсеткіштер клубтың есеп жүйесінен жаңартылады. Нәтиже мен бағдарды көру үшін бағытты таңдаңыз.');
 const spec=specs.find(s=>s.key===selected);
 specs.forEach(s=>{nodes[s.key].textContent=tr(...s.tab);nodes[s.key].setAttribute('aria-selected',String(selected===s.key));nodes[s.key].tabIndex=selected===s.key?0:-1});
 const item=data[selected],ready=item.loaded&&Number.isFinite(item.value),ref=item.ref,percent=ready&&Number.isFinite(ref)&&ref>0?Math.max(0,Math.round(item.value/ref*1000)/10):0;
 const allReady=Object.values(data).every(d=>d.loaded);
 const source=$('.eco-impact-source');
 source.textContent=allReady?tr('Данные из API','API деректері'):tr('Ожидание данных','Деректер күтілуде');
 source.classList.toggle('is-live',allReady);
 $('.eco-impact-number').textContent=ready?num(item.value):'—';
 $('.eco-impact-unit').textContent=tr(...spec.unit);
 $('.eco-impact-progress-name').textContent=tr(...spec.focus);
 $('.eco-impact-progress-value').textContent=ready&&ref>0?num(percent)+'%':'—';
 const bar=$('.eco-impact-progress-bar'),rail=$('.eco-impact-progress-rail');
 bar.style.width=Math.min(100,percent)+'%';rail.setAttribute('aria-valuenow',String(Math.round(Math.min(100,percent))));
 $('.eco-impact-progress-detail').textContent=ready&&ref>0?tr(...spec.basis)+': '+num(ref)+' '+tr(...spec.unit)+(item.value>ref?' · '+tr('ориентир превышен','бағдардан асты'):''):tr('Показатель появится после ответа сервиса.','Көрсеткіш сервис жауабынан кейін көрсетіледі.');
 $('.eco-impact-disclaimer').textContent=tr('Макулатура и крышки: текущий отчётный период; 100 кг и 20 000 шт. — только ориентиры для сравнения. Проценты не означают экологический эффект. Демо-режим дерева не учитывается.','Макулатура мен қақпақтар: ағымдағы есептік кезең; 100 кг және 20 000 дана — салыстыруға арналған бағдарлар ғана. Пайыздар экологиялық әсерді білдірмейді. Ағаштың демо режимі есепке алынбайды.');
 dashboard.setAttribute('aria-label',tr('Интерактивная статистика Eco Club','Eco Club интерактивті статистикасы'));
}
window.addEventListener('eco:member-update',e=>{
 const {count,goal}=e.detail||{};
 if(Number.isFinite(count)&&count>=0&&Number.isFinite(goal)&&goal>0){data.members={value:count,ref:goal,loaded:true};render()}
});
window.addEventListener('eco:impact-update',e=>{
 const {paper,caps}=e.detail||{};
 if(Number.isFinite(paper)&&paper>=0)data.paper={value:paper,ref:100,loaded:true};
 if(Number.isFinite(caps)&&caps>=0)data.caps={value:caps,ref:20000,loaded:true};
 render();
});
new MutationObserver(render).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
render();
})();