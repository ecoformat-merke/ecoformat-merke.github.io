/* Eco Club — Photo Book v2. Preserves all original photographs and lightbox. */
(function(){
'use strict';
const section=document.getElementById('gallery');
if(!section)return;
const grid=section.querySelector('.gallery-clean-grid');
if(!grid)return;
const pictures=Array.from(grid.querySelectorAll('img[src]')).map(el=>({src:el.getAttribute('src'),alt:el.getAttribute('alt')||''}));
if(!pictures.length)return;
const root=document.createElement('div');root.className='eco-album';root.hidden=true;root.id='ecoPhotoBook';
root.setAttribute('role','region');root.setAttribute('aria-label','Фотоальбом Eco Club');
const board=document.createElement('div');board.className='eco-album-board';
const book=document.createElement('div');book.className='eco-album-book';book.setAttribute('aria-live','off');
board.appendChild(book);
const controls=document.createElement('div');controls.className='eco-album-controls';
const prev=document.createElement('button');prev.type='button';
const next=document.createElement('button');next.type='button';
const status=document.createElement('span');status.className='eco-album-status';status.setAttribute('role','status');status.setAttribute('aria-live','polite');
controls.append(prev,status,next);
board.appendChild(controls);
const note=document.createElement('p');note.className='eco-album-note';
root.append(board,note);
grid.parentNode.insertBefore(root,grid);
const isKz=()=>document.documentElement.lang==='kk';
const trans=(ru,kz)=>isKz()?kz:ru;
const mobile=window.matchMedia('(max-width: 720px)');
let page=0,touchX=null,touchY=null,turnTimer=null;
const pages=[{type:'cover'},{type:'coverArt'}];
const chapters=[
 {ru:'Наши первые шаги',kz:'Алғашқы қадамдар'},
 {ru:'Учимся беречь природу',kz:'Табиғатты аялауды үйренеміз'},
 {ru:'Вместе ради природы',kz:'Табиғат үшін біргеміз'},
 {ru:'Идеи и открытия',kz:'Идеялар мен жаңалықтар'},
 {ru:'Истории нашей школы',kz:'Мектебіміздің тарихы'}
];
for(let i=0;i<pictures.length;i+=3){
 pages.push({type:'photos',start:i,images:[pictures[i]]});
 pages.push({type:'photos',start:i+1,images:pictures.slice(i+1,i+3)});
}
pages.push({type:'end'},{type:'endArt'});
function el(tag,cls,txt){const n=document.createElement(tag);if(cls)n.className=cls;if(txt!==undefined)n.textContent=txt;return n}
function createPhoto(item,index,pair){
 const btn=el('button','eco-album-photo'+(pair?' eco-album-photo-pair':''));
 btn.type='button';
 btn.setAttribute('aria-label',trans('Открыть фотографию ','Фотосуретті ашу ')+(index+1));
 const img=el('img');img.src=item.src;img.alt=item.alt;img.loading='lazy';img.decoding='async';
 btn.appendChild(img);
 btn.addEventListener('click',function(){if(typeof window.openLightbox==='function')window.openLightbox(item.src)});
 return btn;
}
function pageNode(p,index){
 const node=el('div','eco-album-page');
 if(p.type==='cover'){
   node.classList.add('eco-album-cover');
   const logo=el('img','eco-album-logo');logo.src='eco-club-logo.png';logo.alt='Eco Club';logo.width=92;logo.height=92;logo.loading='lazy';
   node.append(logo,el('div','eco-album-overline','ECO CLUB • 2026–2027'));

   node.append(el('h3','',trans('Наш зелёный фотоальбом','Eco Club фотоальбомы')));
   node.append(el('p','',trans('Школьные истории, которые мы создаём вместе.','Бірге жасайтын мектептегі жарқын сәттер.')));
 }else if(p.type==='coverArt'||p.type==='endArt'){
   node.classList.add('eco-album-cover-art');
   const selected=p.type==='coverArt'?[0,1,2]:[12,13,14];
   selected.forEach(k=>{if(!pictures[k])return;const img=el('img');img.src=pictures[k].src;img.alt=pictures[k].alt;img.loading='lazy';img.decoding='async';node.append(img)});
 }else if(p.type==='end'){
   node.classList.add('eco-album-cover');
   const logo=el('img','eco-album-logo');logo.src='eco-club-logo.png';logo.alt='Eco Club';logo.width=92;logo.height=92;logo.loading='lazy';
   node.append(logo,el('div','eco-album-overline','ECO CLUB'));
   node.append(el('h3','',trans('История продолжается','Тарих жалғасады')));
   node.append(el('p','',trans('Впереди новые экологические проекты и добрые дела.','Алда жаңа экологиялық жобалар мен игі істер бар.')));
 }else{
   const header=el('div','');
   header.append(el('div','eco-album-folio','ECO CLUB • '+String(Math.floor((index-2)/2)+1).padStart(2,'0')));
   const chapter=chapters[Math.min(chapters.length-1,Math.floor((index-2)/2))];
   header.append(el('h3','eco-album-page-title',trans(chapter.ru,chapter.kz)));
   header.append(el('p','eco-album-chapter-note',trans('Фотостраницы Eco Club','Eco Club фотобеттері')));
   const body=el('div','eco-album-page-body');
   p.images.forEach((photo,i)=>body.appendChild(createPhoto(photo,p.start+i,p.images.length>1)));
   node.append(header,body,el('div','eco-album-folio',trans('НАША ИСТОРИЯ','БІЗДІҢ ТАРИХ')+'  •  '+String(index-1).padStart(2,'0')));
 }
 return node;
}
function render(){
 const isMobile=mobile.matches;
 const start=isMobile?page:Math.floor(page/2)*2;
 book.replaceChildren();
 book.append(pageNode(pages[start],start));
 if(!isMobile&&pages[start+1])book.append(pageNode(pages[start+1],start+1));
 const total=isMobile?pages.length:Math.ceil(pages.length/2);
 const current=isMobile?start+1:Math.floor(start/2)+1;
 status.textContent=current+' / '+total;
 prev.disabled=start===0;
 next.disabled=start+(isMobile?1:2)>=pages.length;
 prev.textContent=trans('‹','‹');
 next.textContent=trans('›','›');
 prev.title=trans('Предыдущая страница','Алдыңғы бет');
 next.title=trans('Следующая страница','Келесі бет');
 prev.setAttribute('aria-label',trans('Предыдущая страница','Алдыңғы бет'));
 next.setAttribute('aria-label',trans('Следующая страница','Келесі бет'));
 note.textContent=trans('Листайте страницы стрелками или свайпом. Нажмите на фото для просмотра.','Беттерді көрсеткілермен немесе саусақпен жылжытып ашыңыз. Фотоны үлкейту үшін басыңыз.');
 root.setAttribute('aria-label',trans('Фотоальбом Eco Club','Eco Club фотоальбомы'));
}
function go(step){
 const delta=mobile.matches?1:2;
 page=Math.max(0,Math.min(pages.length-1,page+step*delta));
 if(!mobile.matches)page=Math.floor(page/2)*2;
 render();
 book.classList.remove('is-turning');
 book.dataset.turnDirection=step>0?'forward':'back';
 void book.offsetWidth;
 book.classList.add('is-turning');
 if(turnTimer)clearTimeout(turnTimer);
 turnTimer=setTimeout(()=>book.classList.remove('is-turning'),380);
}
prev.onclick=()=>go(-1);
next.onclick=()=>go(1);
root.addEventListener('keydown',e=>{
 if(document.getElementById('lightbox')?.classList.contains('open'))return;
 if(e.key==='ArrowRight'){e.preventDefault();go(1)}
 if(e.key==='ArrowLeft'){e.preventDefault();go(-1)}
});
book.addEventListener('touchstart',e=>{if(e.touches.length!==1)return;touchX=e.touches[0].clientX;touchY=e.touches[0].clientY},{passive:true});
book.addEventListener('touchend',e=>{
 if(touchX===null||!e.changedTouches.length)return;
 const dx=e.changedTouches[0].clientX-touchX,dy=e.changedTouches[0].clientY-touchY;
 touchX=null;touchY=null;
 if(Math.abs(dx)>55&&Math.abs(dx)>Math.abs(dy)*1.4)go(dx<0?1:-1);
},{passive:true});
if(mobile.addEventListener)mobile.addEventListener('change',()=>{page=0;render()});
else if(mobile.addListener)mobile.addListener(()=>{page=0;render()});
new MutationObserver(()=>render()).observe(document.documentElement,{attributes:true,attributeFilter:['lang']});
render();
root.hidden=false;
grid.hidden=true;
})();
