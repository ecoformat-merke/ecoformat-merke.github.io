/* Eco Club — Interactive Globe Projects V1
   Progressive scroll story; no external scripts, no backend/API calls.
   All six project texts and pictures remain authored in index.html (RU/KZ). */
(function(){
 'use strict';
 var section=document.getElementById('projects');
 var journey=document.getElementById('ecoOrbitJourney');
 var stage=document.getElementById('ecoOrbitStage');
 var globe=document.getElementById('ecoOrbitGlobe');
 var dialog=document.getElementById('ecoOrbitDialog');
 if(!section||!journey||!stage||!globe)return;
 var cards=Array.prototype.slice.call(stage.querySelectorAll('.eco-orbit-card'));
 var dots=Array.prototype.slice.call(stage.querySelectorAll('[data-eco-step]'));
 var readout=document.getElementById('ecoOrbitPosition');
 var live=document.getElementById('ecoOrbitAnnouncement');
 var prev=document.getElementById('ecoOrbitPrev'),next=document.getElementById('ecoOrbitNext');
 var railUp=document.getElementById('ecoOrbitRailUp'),railDown=document.getElementById('ecoOrbitRailDown');
 var dialogClose=document.getElementById('ecoOrbitDialogClose');
 var reduced=window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 var current=-1,lastMobile=null,selectedCard=null,ticking=false,startedX=null,startedY=null,suppressClick=false;

 function kz(){return document.documentElement.lang==='kk'}
 function updateAria(){
  globe.setAttribute('aria-label',kz()
   ?'Глобусты айналдыру және алты жобаны ауыстыру'
   :'Вращать глобус и переходить между шестью проектами');
  if(railUp){
   railUp.setAttribute('aria-label',kz()?'Алдыңғы жоба':'Предыдущий проект');
   railUp.title=kz()?'Артқа':'Назад';
  }
  if(railDown){
   railDown.setAttribute('aria-label',kz()?'Келесі жоба':'Следующий проект');
   railDown.title=kz()?'Келесі':'Далее';
  }
 }
 function clamp(v,a,b){return Math.max(a,Math.min(b,v))}
 function currentTitle(c){return c.querySelector('.project-copy h3')?.textContent?.trim()||''}
 function scrollRange(){
  return Math.max(1,journey.offsetHeight-stage.offsetHeight);
 }
 function scrollProgress(){
  var top=journey.getBoundingClientRect().top;
  var stickyTop=parseFloat(getComputedStyle(stage).top)||82;
  return clamp((stickyTop-top)/scrollRange(),0,1);
 }
 function scrollIndex(){return Math.min(cards.length-1,Math.floor(scrollProgress()*cards.length))}
 function update(index,announce){
  index=clamp(index,0,cards.length-1);
  var mobile=window.matchMedia('(max-width:950px)').matches;
  if(index===current && mobile===lastMobile && !announce)return;
  current=index;lastMobile=mobile;
  cards.forEach(function(card,i){
   var visible=mobile?i===current:i<=current;
   card.classList.toggle('is-visible',visible);
   card.classList.toggle('is-active',i===current);
   // Avoid inaccessible buttons remaining tabbable behind faded panels.
   card.setAttribute('aria-hidden',String(!visible));
   card.tabIndex=visible?0:-1;
   var open=card.querySelector('.eco-orbit-more');
   if(open)open.tabIndex=visible?0:-1;
  });
  dots.forEach(function(dot,i){
   if(i===current)dot.setAttribute('aria-current','step');
   else dot.removeAttribute('aria-current');
  });
  if(readout)readout.textContent=String(current+1).padStart(2,'0')+' / '+String(cards.length).padStart(2,'0');
  if(prev)prev.disabled=current===0;
  if(next)next.disabled=current===cards.length-1;
  if(railUp)railUp.disabled=current===0;
  if(railDown)railDown.disabled=current===cards.length-1;
  if(announce&&live){
   live.textContent=(kz()?'Жоба ':'Проект ')+(current+1)+': '+currentTitle(cards[current]);
  }
 }
 function updateFromScroll(){ticking=false;update(scrollIndex(),false)}
 function requestUpdate(){
  if(ticking)return;ticking=true;requestAnimationFrame(updateFromScroll);
 }
 function goTo(index){
  var target=clamp(index,0,cards.length-1);
  update(target,true);
  var stickyTop=parseFloat(getComputedStyle(stage).top)||82;
  var sectionTop=journey.getBoundingClientRect().top+window.scrollY;
  var desired=sectionTop-stickyTop+scrollRange()*((target+.45)/cards.length);
  window.scrollTo({top:Math.max(0,desired),behavior:reduced?'instant':'smooth'});
 }
 function detail(card){
  if(!dialog||!card)return;
  var img=card.querySelector('.project-art img');
  var title=card.querySelector('.project-copy h3');
  var copy=card.querySelector('.project-copy p');
  var kicker=card.querySelector('.project-kicker');
  var status=card.querySelector('.project-status span');
  var outImage=document.getElementById('ecoOrbitDialogImg');
  var outTitle=document.getElementById('ecoOrbitDialogTitle');
  var outDescription=document.getElementById('ecoOrbitDialogDescription');
  var outKicker=document.getElementById('ecoOrbitDialogKicker');
  var outStatus=document.getElementById('ecoOrbitDialogStatus');
  if(outImage&&img){outImage.src=img.getAttribute('src');outImage.alt=img.getAttribute('alt')||''}
  if(outTitle)outTitle.textContent=title?.textContent||'';
  if(outDescription)outDescription.textContent=copy?.textContent||'';
  if(outKicker)outKicker.textContent=kicker?.textContent||'';
  if(outStatus)outStatus.textContent=status?.textContent||'';

  // Practical next steps for all six projects, localized without inventing results.
  var activities={
   ru:[
    ['Сортировать бумагу, пластиковые крышечки и использованные батарейки по отдельности.','Передавать собранное ответственным участникам клуба.','Фиксировать результаты после подтверждения сбора.'],
    ['Выбирать участки школьного двора для озеленения.','Участвовать в посадке и регулярном уходе за растениями.','Отмечать состояние посадок и необходимые работы.'],
    ['Участвовать в субботниках и экологических акциях.','Сортировать найденные отходы, где это безопасно.','Соблюдать правила безопасности и работать с руководителем.'],
    ['Участвовать в эко-уроках, мастер-классах и тематических встречах.','Создавать наглядные материалы и делиться экологическими знаниями.','Применять полученные знания в повседневной жизни.'],
    ['Приносить пригодные к использованию книги и школьные принадлежности.','Обмениваться вещами, чтобы продлить срок их службы.','Следить за аккуратным и бережным обращением с вещами.'],
    ['Наблюдать за экологическими привычками в школе.','Предлагать способы экономии воды, электричества и материалов.','Передавать предложения руководителям Eco Club.']
   ],
   kk:[
    ['Қағазды, пластик қақпақтарды және пайдаланылған батареяларды бөлек жинау.','Жиналған заттарды клубтың жауапты мүшелеріне тапсыру.','Нәтижелерді растаудан кейін тіркеу.'],
    ['Мектеп ауласын көгалдандыратын орындарды таңдау.','Өсімдіктерді отырғызуға және күтіп-баптауға қатысу.','Өсімдіктердің жағдайын және қажетті жұмыстарды бақылау.'],
    ['Сенбіліктер мен экологиялық акцияларға қатысу.','Қауіпсіз жағдайда қалдықтарды сұрыптау.','Қауіпсіздік ережелерін сақтап, жетекшімен бірге жұмыс істеу.'],
    ['Эко-сабақтарға, шеберлік сыныптарына және кездесулерге қатысу.','Көрнекі материалдар әзірлеп, экологиялық біліммен бөлісу.','Алған білімді күнделікті өмірде қолдану.'],
    ['Қолдануға жарамды кітаптар мен мектеп құралдарын әкелу.','Заттардың қолданылу мерзімін ұзарту үшін алмасу.','Заттарды ұқыпты пайдалану.'],
    ['Мектептегі экологиялық әдеттерді бақылау.','Су, электр энергиясы және материалдарды үнемдеу жолдарын ұсыну.','Ұсыныстарды Eco Club жетекшілеріне жеткізу.']
   ]
  };
  var idx=cards.indexOf(card),lang=kz()?'kk':'ru',steps=activities[lang][idx];
  var detailBox=dialog.querySelector('.eco-orbit-dialog-details');
  if(!detailBox){
   detailBox=document.createElement('div');
   detailBox.className='eco-orbit-dialog-details';
   dialog.appendChild(detailBox);
  }
  detailBox.replaceChildren();
  var h=document.createElement('h4');h.textContent=kz()?'Қалай қатысуға болады?':'Как можно участвовать?';
  detailBox.appendChild(h);
  var ul=document.createElement('ul');
  steps.forEach(function(step){var li=document.createElement('li');li.textContent=step;ul.appendChild(li)});
  detailBox.appendChild(ul);
  var join=document.createElement('a');join.className='eco-orbit-join';
  join.href='#application';join.textContent=kz()?'Клубқа қосылу →':'Вступить в Eco Club →';
  join.addEventListener('click',closeDetail);
  detailBox.appendChild(join);

  // Project evidence panel: use the current results section rather than
  // historical paper/cap totals (the site explicitly started a new count).
  var evidence=document.createElement('section');
  evidence.className='eco-orbit-evidence';
  var heading=document.createElement('h4');
  heading.textContent=kz()?'Нәтижелер мен фотосуреттер':'Результаты и фотографии';
  evidence.appendChild(heading);
  var note=document.createElement('p');
  note.className='eco-orbit-evidence-note';
  if(idx===0){
    var paper=document.getElementById('paperKgCounter');
    var caps=document.getElementById('capsCountCounter');
    var paperVal=paper&&Number((paper.textContent||'').replace(/[^0-9.,]/g,'').replace(',','.'));
    var capsVal=caps&&Number((caps.textContent||'').replace(/[^0-9.,]/g,'').replace(',','.'));
    if(Number.isFinite(paperVal)&&Number.isFinite(capsVal)&&(paperVal>0||capsVal>0)){
      note.textContent=kz()
       ?'Ағымдағы есеп: '+paperVal+' кг макулатура, '+capsVal+' қақпақ. Дерек: «Нәтижелер» бөлімі. Бұрынғы жинақтар есепке алынбайды.'
       :'Текущий отсчёт: '+paperVal+' кг макулатуры, '+capsVal+' крышек. Источник: раздел «Результаты». Предыдущие сборы не учитываются.';
    }else{
      note.textContent=kz()
       ?'Осы бағыттың нәтижелері «Нәтижелер» бөлімінде жаңартылады. Қазір расталған жаңа көрсеткіштерді көрсету мүмкін емес.'
       :'Показатели этого направления обновляются в разделе «Результаты». Подтверждённых новых значений для отображения сейчас нет.';
    }
  }else{
    note.textContent=kz()
     ?'Бұл бағыт бойынша жеке расталған сандық көрсеткіштер әлі жарияланбаған. Жоспарланған іс-шаралар орындалған нәтиже ретінде көрсетілмейді.'
     :'Подтверждённые числовые результаты по этому направлению пока не опубликованы. Планы не учитываются как выполненные мероприятия.';
  }
  evidence.appendChild(note);
  var links=document.createElement('div');links.className='eco-orbit-evidence-links';
  var resultsLink=document.createElement('a');resultsLink.href='#results';
  resultsLink.textContent=kz()?'Нақты көрсеткіштер →':'Актуальные показатели →';
  var galleryLink=document.createElement('a');galleryLink.href='#gallery';
  galleryLink.textContent=kz()?'Фотогалерея →':'Фотогалерея →';
  [resultsLink,galleryLink].forEach(function(a){
    a.addEventListener('click',closeDetail);
    links.appendChild(a);
  });
  evidence.appendChild(links);
  var gallery=document.querySelector('#gallery .gallery-clean-grid');
  if(gallery){
    var photos=Array.prototype.slice.call(gallery.querySelectorAll('img[src]')).slice(0,3);
    if(photos.length){
      var caption=document.createElement('p');caption.className='eco-orbit-photo-caption';
      caption.textContent=kz()
       ?'Eco Club жалпы фотогалереясынан. Суреттер нақты осы жобаға тиесілі деп белгіленбеген.'
       :'Снимки из общей галереи Eco Club. Их принадлежность именно этому проекту не подтверждена.';
      evidence.appendChild(caption);
      var strip=document.createElement('div');strip.className='eco-orbit-photo-strip';
      photos.forEach(function(photo){
        var thumb=document.createElement('a');thumb.href='#gallery';
        thumb.setAttribute('aria-label',kz()?'Фотогалереяны ашу':'Открыть фотогалерею');
        thumb.addEventListener('click',closeDetail);
        var shot=document.createElement('img');shot.src=photo.getAttribute('src');
        shot.alt=photo.getAttribute('alt')||'Eco Club';shot.loading='lazy';
        thumb.appendChild(shot);strip.appendChild(thumb);
      });
      evidence.appendChild(strip);
    }
  }
  detailBox.insertBefore(evidence,join);
 }
 function openDetail(card){
  if(!dialog)return;
  selectedCard=card;detail(card);
  if(typeof dialog.showModal==='function'&&!dialog.open)dialog.showModal();
  else dialog.setAttribute('open','');
 }
 function closeDetail(){
  if(!dialog)return;
  if(typeof dialog.close==='function'&&dialog.open)dialog.close();
  else dialog.removeAttribute('open');
  selectedCard=null;
 }
 cards.forEach(function(card,index){
  // Entire capsule opens the original full project description.
  // Keep keyboard access, even though the old tiny "more" control is hidden in premium mode.
  card.setAttribute('role','button');
  card.addEventListener('click',function(e){
   if(e.target.closest('.eco-orbit-more'))return;
   update(index,true);openDetail(card);
  });
  card.addEventListener('keydown',function(e){
   if(e.key==='Enter'||e.key===' '){
    e.preventDefault();update(index,true);openDetail(card);
   }
  });
  var more=card.querySelector('.eco-orbit-more');
  if(more)more.addEventListener('click',function(e){e.stopPropagation();update(index,true);openDetail(card)});
 });
 dots.forEach(function(dot,index){dot.addEventListener('click',function(){goTo(index)})});
 if(prev)prev.addEventListener('click',function(){goTo(current-1)});
 if(next)next.addEventListener('click',function(){goTo(current+1)});
 if(railUp)railUp.addEventListener('click',function(){goTo(current-1)});
 if(railDown)railDown.addEventListener('click',function(){goTo(current+1)});
 if(dialogClose)dialogClose.addEventListener('click',closeDetail);
 if(dialog){
  dialog.addEventListener('click',function(e){if(e.target===dialog)closeDetail()});
  dialog.addEventListener('close',function(){selectedCard=null});
 }
 if(window.MutationObserver){
  new MutationObserver(function(){
   updateAria();
   if(selectedCard&&dialog&&dialog.open)detail(selectedCard);
   if(live&&current>=0)live.textContent=(kz()?'Жоба ':'Проект ')+(current+1)+': '+currentTitle(cards[current]);
  }).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
 }
 // Natural page scrolling advances the story; drag the globe horizontally to change projects.
 globe.addEventListener('pointerdown',function(event){
  if(event.button!==undefined&&event.button!==0)return;
  startedX=event.clientX;startedY=event.clientY;suppressClick=false;
 });
 globe.addEventListener('pointerup',function(event){
  if(startedX===null)return;
  var dx=event.clientX-startedX,dy=event.clientY-startedY;
  startedX=null;startedY=null;
  if(Math.abs(dx)>42&&Math.abs(dx)>Math.abs(dy)*1.1){
   suppressClick=true;
   goTo(current+(dx<0?1:-1));
  }
 });
 globe.addEventListener('pointercancel',function(){startedX=null;startedY=null});
 globe.addEventListener('click',function(){
  if(suppressClick){suppressClick=false;return}
  goTo(current===cards.length-1?0:current+1);
 });
 globe.addEventListener('keydown',function(e){
  if(e.key==='ArrowLeft'||e.key==='ArrowRight'){
   e.preventDefault();goTo(current+(e.key==='ArrowRight'?1:-1));
  }
 });
 if('IntersectionObserver' in window){
  var watcher=new IntersectionObserver(function(entries){
   entries.forEach(function(e){stage.classList.toggle('eco-orbit-inview',e.isIntersecting)});
  },{rootMargin:'180px 0px 180px 0px'});
  watcher.observe(stage);
 }else{stage.classList.add('eco-orbit-inview')}
 window.addEventListener('scroll',requestUpdate,{passive:true});
 window.addEventListener('resize',requestUpdate,{passive:true});
 // Never hide the originals until listeners and the first active state exist.
 update(scrollIndex(),false);
 updateAria();
 stage.classList.add('eco-orbit-ready');
 journey.classList.add('eco-orbit-enabled');
})();
