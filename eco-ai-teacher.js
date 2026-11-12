/* Eco AI Teacher Studio — offline template engine (not a generative AI service). */
(function(){
'use strict';
var $=id=>document.getElementById(id);
var locale='kk',built=false,docData=null;
var inputIds=['teacher','grade','subject','topic','goal','duration','lessonDate','mode'];
var state={};
function text(kk,ru){return locale==='kk'?kk:ru}
function node(tag,content,cls){var e=document.createElement(tag);if(cls)e.className=cls;if(content!==undefined)e.textContent=content;return e}
function safeString(v){return String(v||'').trim()}
function read(){var o={};inputIds.forEach(k=>o[k]=safeString($(k).value));return o}
function notify(msg,bad){var el=$('status');el.textContent=msg;el.className=bad?'status bad':'status';}
function applyLang(next){
 locale=next;document.documentElement.lang=next;
 document.querySelectorAll('[data-kk][data-ru]').forEach(function(el){el.textContent=el.getAttribute('data-'+next)});
 document.querySelectorAll('[data-placeholder-kk][data-placeholder-ru]').forEach(function(el){el.placeholder=el.getAttribute('data-placeholder-'+next)});
 $('kk').setAttribute('aria-pressed',String(next==='kk'));$('ru').setAttribute('aria-pressed',String(next==='ru'));
 try{sessionStorage.setItem('ecoTeacherAILang',locale)}catch(e){}
 if(built)notify(text('Дайын құжатты мәтін арқылы өзгертіп, Word форматында жүктей аласыз.','Готовый документ можно изменить вручную и скачать в Word.'));
}
function buildInput(){
 var d=read();
 if(!d.topic){notify(text('Сабақтың тақырыбын енгізіңіз.','Введите тему урока.'),true);$('topic').focus();return null}
 if(!d.goal){notify(text('Оқу мақсатын өзіңіз енгізіңіз: ресми бағдарламадан автоматты түрде алынбайды.','Укажите учебную цель самостоятельно: она не подставляется из официальной программы.'),true);$('goal').focus();return null}
 if(Number(d.duration)<20||Number(d.duration)>120){notify(text('Ұзақтығы 20–120 минут аралығында болуы керек.','Продолжительность должна быть от 20 до 120 минут.'),true);return null}
 return d;
}
function para(s){return {kind:'p',value:s}}
function h(s){return {kind:'h',value:s}}
function table(headers,rows){return{kind:'table',headers:headers,rows:rows}}
function lesson(d){
 var min=Number(d.duration),parts=[Math.round(min*.1),Math.round(min*.2),Math.round(min*.3),Math.round(min*.25)];parts.push(min-parts.reduce((a,b)=>a+b,0));
 var kk=locale==='kk';
 var stages=kk?['Ұйымдастыру және ынталандыру','Алдыңғы білімді белсендіру','Жаңа материалды зерттеу','Практикалық жұмыс және саралау','Рефлексия және қорытынды']:['Организация и мотивация','Актуализация знаний','Исследование новой темы','Практическая работа и дифференциация','Рефлексия и итог'];
 var tactions=kk?[
 'Сәлемдесу, сабақ мақсатын таныстыру, тақырыпқа байланысты сұрақ қою.',
 'Оқушылардың бастапқы білімін анықтайтын 2–3 сұрақ ұсыну.',
 'Тақырып бойынша дереккөз, бақылау не мысал ұсыну; түсініктерді салыстырту.',
 'Жұптық тапсырма, зерттеу сұрағы және қолдауды қажет ететін оқушыға нұсқаулық ұсыну.',
 'Жетістікті талдау, кері байланыс алу және келесі қадамды анықтау.'
 ]:[
 'Приветствие, обозначение цели урока и проблемного вопроса.',
 'Предложить 2–3 вопроса для выявления исходных представлений.',
 'Показать источник, наблюдение или пример по теме; организовать сравнение понятий.',
 'Организовать работу в парах, исследовательское задание и подсказки для нуждающихся в поддержке.',
 'Обсудить достижения, собрать обратную связь и определить следующий шаг.'
 ];
 var sactions=kk?[
 'Сұраққа жауап беріп, сабақ мақсатын түсіндіреді.',
 'Болжам жасайды, алдыңғы білімін мысалмен байланыстырады.',
 'Мәліметті талдайды, сұрақ қояды, қорытынды тұжырымдайды.',
 'Тапсырманы орындайды, дәлел келтіреді, жұмысын критериймен тексереді.',
 'Бір үйренгенін, бір қиындықты және келесі қадамын атайды.'
 ]:[
 'Отвечают на вопрос и формулируют цель.',
 'Высказывают гипотезы и приводят примеры из прошлого опыта.',
 'Анализируют сведения, задают вопросы и формулируют вывод.',
 'Выполняют задание, аргументируют решение, сверяются с критериями.',
 'Называют одно достижение, одну трудность и следующий шаг.'
 ];
 var criteria=kk?[
 'Мақсатты түсіндіріп, бастапқы болжам айтады.',
 'Негізгі ұғымды дұрыс ажыратады.',
 'Дәлел мен қорытындыны байланыстырады.',
 'Мысал келтіреді, жұмыс қадамдарын түсіндіреді.',
 'Өзіндік бағалау жасайды.'
 ]:[
 'Обозначает цель и исходную гипотезу.',
 'Правильно различает ключевые понятия.',
 'Связывает доказательство с выводом.',
 'Приводит пример и объясняет ход работы.',
 'Проводит самооценку.'
 ];
 var hd=kk?['Кезең / уақыт','Мұғалімнің әрекеті','Оқушының әрекеті','Бағалау / ресурстар']:['Этап / время','Действия учителя','Действия учащегося','Оценивание / ресурсы'];
 var rows=stages.map((x,i)=>[x+' ('+parts[i]+' '+(kk?'мин':'мин')+')',tactions[i],sactions[i],criteria[i]+(i===2?' '+(kk?'Оқу материалы, көрнекілік.':'Учебный материал, визуализация.'):'')]);
 return [
 h(kk?'Қысқа мерзімді сабақ жоспары (ҚМЖ)':'Краткосрочный план урока (КСП)'),
 table(kk?['Көрсеткіш','Мәлімет']:['Поле','Значение'],[
 [kk?'Пән':'Предмет',d.subject],[kk?'Сынып':'Класс',d.grade],
 [kk?'Тақырып':'Тема',d.topic],[kk?'Педагог':'Педагог',d.teacher||'—'],
 [kk?'Күні':'Дата',d.lessonDate||'—'],[kk?'Ұзақтығы':'Продолжительность',d.duration+' '+(kk?'минут':'минут')]
 ]),
 h(kk?'Оқу мақсаты (мұғалім енгізген)':'Учебная цель (введена педагогом)'),
 para(d.goal),
 h(kk?'Сабақ мақсаты':'Цель урока'),
 para(kk?'Оқушылар «'+d.topic+'» тақырыбы бойынша негізгі ұғымдарды түсіндіреді, мысалдар келтіреді және өз қорытындысын негіздейді.':'Учащиеся объясняют основные понятия по теме «'+d.topic+'», приводят примеры и обосновывают собственные выводы.'),
 h(kk?'Сабақ барысы':'Ход урока'),
 table(hd,rows),
 h(kk?'Саралау':'Дифференциация'),
 para(kk?'Қолдауды қажет ететін оқушыларға тірек сөздер мен үлгі ұсынылады; дайын оқушыларға салыстыру және өз шешімін дәлелдеу тапсырмасы беріледі.':'Учащимся, которым нужна поддержка, предоставляются опорные слова и образец; продвинутым — сравнение подходов и аргументация.'),
 h(kk?'Қалыптастырушы бағалау':'Формативное оценивание'),
 para(kk?'Дескрипторлар: негізгі ұғымды түсіндіреді; мысал келтіреді; дәлелін түсіндіреді; қорытынды жасайды.':'Дескрипторы: объясняет понятие; приводит пример; аргументирует ответ; формулирует вывод.'),
 h(kk?'Үй тапсырмасы':'Домашнее задание'),
 para(kk?'«'+d.topic+'» тақырыбы бойынша күнделікті өмірден мысал тауып, 3–5 сөйлеммен түсіндіріңіз.':'Найдите пример по теме «'+d.topic+'» в повседневной жизни и объясните его в 3–5 предложениях.'),
 para(kk?'Ескерту: бұл әдістемелік үлгі. Оқу мақсатының коды, бағалау талаптары және ресурстар қолданыстағы оқу бағдарламасымен педагог тарапынан тексерілуі тиіс.':'Примечание: это методический шаблон. Код учебной цели, критерии и ресурсы педагог должен сверить с действующей учебной программой.')
 ];
}
function worksheet(d){
 var kk=locale==='kk',T=d.topic;
 var tasks=kk?[
 ['Түсінік','«'+T+'» тақырыбына қатысты 3 негізгі терминді жазып, анықтама беріңіз.','3 дәл анықтама'],
 ['Салыстыру','Осы тақырыпқа қатысты екі құбылысты немесе екі тәсілді салыстырыңыз. Ұқсастық пен айырмашылықты көрсетіңіз.','2 ұқсастық, 2 айырмашылық'],
 ['Дерекпен жұмыс','Тақырып бойынша сенімді дереккөзден бір мәлімет алып, оның нені дәлелдейтінін түсіндіріңіз.','Дереккөз, дерек, түсіндірме'],
 ['Қолдану','Білімді мектептегі немесе күнделікті өмірдегі бір жағдаятта қолданыңыз.','Орынды мысал және негіздеме'],
 ['Зерттеу','Шағын зерттеу сұрағын және тексеруге болатын болжамды жазыңыз.','Сұрақ, болжам, қауіпсіз әдіс'],
 ['Қорытынды','Нені білдіңіз? 3 сөйлемдік қорытынды және бір ашық сұрақ жазыңыз.','Қорытынды мен сұрақ']
 ]:[
 ['Понятия','Запишите 3 ключевых термина по теме «'+T+'» и объясните их.','Три корректных определения'],
 ['Сравнение','Сравните два явления или два способа, относящиеся к теме. Выделите сходства и различия.','2 сходства и 2 различия'],
 ['Работа с источником','Найдите одно сведение в надёжном источнике по теме и объясните его значение.','Источник, факт и объяснение'],
 ['Применение','Предложите ситуацию из жизни школы, где можно применить знания по теме.','Релевантный пример и обоснование'],
 ['Исследование','Сформулируйте небольшой исследовательский вопрос и проверяемую гипотезу.','Вопрос, гипотеза, безопасный метод'],
 ['Вывод','Напишите вывод из трёх предложений и один вопрос для дальнейшего изучения.','Вывод и вопрос']
 ];
 return [h(kk?'Оқушының жұмыс парағы':'Рабочий лист'),para((kk?'Пән: ':'Предмет: ')+d.subject+'   |   '+(kk?'Сынып: ':'Класс: ')+d.grade+'   |   '+T),
 para((kk?'Оқу мақсаты: ':'Учебная цель: ')+d.goal),
 ...tasks.flatMap((a,i)=>[h((i+1)+'. '+a[0]),para(a[1]),para(kk?'Жауап: _____________________________________________':'Ответ: _____________________________________________')]),
 h(kk?'Бағалау критерийлері':'Критерии оценивания'),
 table(kk?['Тапсырма','Дескриптор']:['Задание','Дескриптор'],tasks.map((a,i)=>[(i+1).toString(),a[2]])),
 h(kk?'Мұғалімге арналған жауап үлгісі':'Ключ для педагога'),
 para(kk?'Ашық тапсырмалар үшін бір ғана дайын жауап жоқ. Дұрыстығын тақырыпқа сәйкес оқу материалдарымен салыстырыңыз.':'Задания открытого типа, единого ключа нет. Проверьте фактическую корректность ответов по учебным материалам темы.')];
}
function test(d){
 var kk=locale==='kk',t=d.topic;
 var stems=kk?[
 'Тақырыптағы негізгі ұғымды анықтаңыз.', 'Екі байланысты терминнің айырмасын түсіндіріңіз.',
 'Тақырыпқа бір нақты мысал келтіріңіз.','Қандай себеп-салдар байланысы бар?','Тақырыпты зерттеуге қандай сұрақ қоюға болады?',
 'Қай дереккөзді сенімді деп есептейсіз? Неге?','Бақылауға болатын қандай көрсеткішті таңдайсыз?',
 'Бір дұрыс және бір қате тұжырым құрастырыңыз.','Қателікті қалай анықтауға болады?','Тақырыпқа қатысты кестеге қандай үш дерек енгізуге болады?',
 'Зерттеу болжамын тұжырымдаңыз.','Қауіпсіз зерттеу қадамын ұсыныңыз.','Жаңа білімді өмірде қалай қолданасыз?',
 'Өз ұстанымыңызды екі дәлелмен қорғаңыз.','Осы тақырып бойынша қорытынды мен келесі зерттеу сұрағын жазыңыз.'
 ]:[
 'Определите ключевое понятие темы.','Объясните различие между двумя связанными терминами.',
 'Приведите конкретный пример по теме.','Опишите одну причинно-следственную связь.','Сформулируйте исследовательский вопрос по теме.',
 'Какой источник вы считаете надёжным и почему?','Выберите показатель для наблюдения и обоснуйте выбор.',
 'Составьте одно верное и одно ошибочное утверждение.','Как обнаружить ошибку в объяснении?','Какие три данные вы внесли бы в таблицу по теме?',
 'Сформулируйте проверяемую гипотезу.','Предложите безопасный шаг исследования.','Как применить знание в повседневной жизни?',
 'Защитите свою позицию двумя аргументами.','Сформулируйте итоговый вывод и вопрос для дальнейшего изучения.'
 ];
 var rows=stems.map((q,i)=>[(i+1).toString(),q,kk?'1 балл: жауап нақты; 1 балл: негіздеме бар.':'1 балл: корректность; 1 балл: обоснование.']);
 return [
 h(kk?'15 ашық сұрақтан тұратын тест':'Тест — 15 открытых заданий'),
 para((kk?'Тақырып: ':'Тема: ')+t+' · '+(kk?'Сынып: ':'Класс: ')+d.grade),
 para(kk?'Нұсқаулық: әр сұраққа қысқа, дәлелді жауап беріңіз. Әр сұрақ — 2 балл, барлығы 30 балл.':'Инструкция: дайте краткие аргументированные ответы. Каждое задание — 2 балла, всего 30 баллов.'),
 table(kk?['№','Тапсырма','Дескриптор']:['№','Задание','Дескриптор'],rows),
 h(kk?'Жауаптарды бағалау нұсқаулығы':'Рекомендации по проверке'),
 para(kk?'Бұл — ашық тапсырмалар конструкторы. Сұрақтардың мазмұнын мұғалім сабақ тақырыбына сәйкес нақтылауы керек. Автоматты түрде жалған жауап кілті жасалмайды.':'Это конструктор открытых заданий. Педагог уточняет формулировки с учётом темы. Автоматически выдуманный ключ ответов не формируется.'),
 para(kk?'2 балл — дәл әрі негізделген жауап; 1 балл — жартылай дұрыс; 0 балл — жауап жоқ немесе қате.':'2 балла — корректный и аргументированный ответ; 1 — частично верный; 0 — неверный или отсутствует.')
 ];
}
function research(d){
 var kk=locale==='kk';
 return [h(kk?'Зерттеу тапсырмасы':'Исследовательское задание'),
 para((kk?'Тақырып: ':'Тема: ')+d.topic+' | '+(kk?'Сынып: ':'Класс: ')+d.grade),
 h(kk?'Зерттеу сұрағы':'Исследовательский вопрос'),
 para(kk?'«'+d.topic+'» тақырыбының мектеп немесе жергілікті ортадағы көрінісін қандай дәлелдер арқылы зерттеуге болады?':'Как с помощью наблюдений и доступных данных исследовать проявление темы «'+d.topic+'» в школьной или местной среде?'),
 h(kk?'Болжам':'Гипотеза'),para(kk?'Егер біз бақылау жүргізіп, бірдей көрсеткіштерді салыстырсақ, белгілі бір заңдылықты байқай аламыз.':'Если провести наблюдение и сравнить одинаковые показатели, можно обнаружить определённую закономерность.'),
 h(kk?'Әдістеме':'Методика'),
 table(kk?['Қадам','Орындалатын жұмыс','Нәтиже']:['Шаг','Действие','Результат'],[
 ['1',kk?'Сұрақ пен болжамды нақтылау':'Уточнить вопрос и гипотезу',kk?'Жазбаша жоспар':'Письменный план'],
 ['2',kk?'Қауіпсіз бақылау орнын таңдау':'Выбрать безопасное место наблюдения',kk?'Бақылау шарттары':'Условия наблюдения'],
 ['3',kk?'Кемінде үш бақылау жүргізу':'Выполнить не менее трёх наблюдений',kk?'Бастапқы деректер':'Первичные данные'],
 ['4',kk?'Деректерді кестеге түсіру және салыстыру':'Занести наблюдения в таблицу и сравнить',kk?'Кесте және диаграмма':'Таблица и диаграмма'],
 ['5',kk?'Қорытынды жасап, шектеулерді атау':'Сделать вывод и указать ограничения',kk?'Дәлелді қорытынды':'Аргументированный вывод']
 ]),
 h(kk?'Бақылау кестесі':'Таблица наблюдений'),
 table(kk?['Бақылау №','Күні / жағдай','Көрсеткіш','Ескертпе']:['№','Дата / условие','Показатель','Примечание'],[['1','','',''],['2','','',''],['3','','','']]),
 h(kk?'Бағалау критерийлері':'Критерии оценивания'),
 para(kk?'Сұрақ пен болжам — 2 балл; әдіс қауіпсіздігі — 2 балл; деректер сапасы — 3 балл; қорытынды мен шектеулер — 3 балл. Барлығы 10 балл.':'Вопрос и гипотеза — 2 балла; безопасность методики — 2; качество данных — 3; вывод и ограничения — 3. Итого 10 баллов.'),
 para(kk?'Қауіпсіздік: химиялық заттарды қолданбаңыз, суды ішпеңіз, белгісіз қалдықтарды қолмен ұстамаңыз.':'Безопасность: не используйте опасные реактивы, не пробуйте воду на вкус и не трогайте неизвестные отходы.')
 ];
}
function generate(){
 var d=buildInput();if(!d)return;
 var f={lesson:lesson,worksheet:worksheet,test:test,research:research}[d.mode]||lesson;
 docData=f(d);$('preview').replaceChildren();docData.forEach(function(block){
  if(block.kind==='h'){var x=node('h2',block.value);x.contentEditable='true';$('preview').append(x)}
  if(block.kind==='p'){var p=node('p',block.value);p.contentEditable='true';$('preview').append(p)}
  if(block.kind==='table'){
   var tableEl=node('table');var head=node('thead'),row=node('tr');block.headers.forEach(v=>row.append(node('th',v)));head.append(row);tableEl.append(head);
   var body=node('tbody');block.rows.forEach(function(cells){var tr=node('tr');cells.forEach(function(v){var td=node('td',v);td.contentEditable='true';tr.append(td)});body.append(tr)});tableEl.append(body);$('preview').append(tableEl)
  }
 });
 $('preview').hidden=false;$('empty').hidden=true;$('download').disabled=false;$('copy').disabled=false;
 built=true;notify(text('Үлгі дайын. Нәтижені өңдеңіз және Word құжатын жүктеңіз.','Шаблон готов. Отредактируйте результат и скачайте Word.'));
}
function cleanText(s){return String(s||'').replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g,'')}
function xml(s){return cleanText(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&apos;')}
function wt(s){return '<w:r><w:t xml:space="preserve">'+xml(s)+'</w:t></w:r>'}
function wp(s,style){return '<w:p>'+(style?'<w:pPr><w:pStyle w:val="'+style+'"/></w:pPr>':'')+wt(s)+'</w:p>'}
function cell(s){return '<w:tc><w:tcPr><w:tcW w:w="2400" w:type="dxa"/><w:tcBorders><w:bottom w:val="single" w:sz="4" w:color="D8E9DF"/></w:tcBorders></w:tcPr>'+wp(s)+'</w:tc>'}
function tableXML(el){var rows=Array.from(el.querySelectorAll('tr')).map(function(row){return '<w:tr>'+Array.from(row.children).map(c=>cell(c.textContent)).join('')+'</w:tr>'});return '<w:tbl><w:tblPr><w:tblBorders><w:top w:val="single" w:sz="4" w:color="C2DACC"/><w:bottom w:val="single" w:sz="4" w:color="C2DACC"/><w:insideH w:val="single" w:sz="4" w:color="D7E6DC"/><w:insideV w:val="single" w:sz="4" w:color="D7E6DC"/></w:tblBorders></w:tblPr>'+rows.join('')+'</w:tbl>'}
async function exportDocx(){
 if(!$('preview').children.length)return;
 if(!window.JSZip){notify(text('Word модулі жүктелмеді. Интернет байланысын тексеріңіз.','Модуль Word не загрузился. Проверьте подключение к интернету.'),true);return}
 try{
 var body=Array.from($('preview').children).map(function(el){if(el.tagName==='TABLE')return tableXML(el);return wp(el.textContent,el.tagName==='H2'?'Heading1':null)}).join('');
 var doc='<?xml version="1.0" encoding="UTF-8" standalone="yes"?><w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:body>'+body+'<w:sectPr><w:pgSz w:w="11906" w:h="16838"/><w:pgMar w:top="1000" w:right="900" w:bottom="1000" w:left="900"/></w:sectPr></w:body></w:document>';
 var style='<?xml version="1.0" encoding="UTF-8"?><w:styles xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main"><w:style w:type="paragraph" w:default="1" w:styleId="Normal"><w:name w:val="Normal"/><w:rPr><w:rFonts w:ascii="Calibri" w:hAnsi="Calibri"/><w:sz w:val="21"/></w:rPr><w:pPr><w:spacing w:after="120"/></w:pPr></w:style><w:style w:type="paragraph" w:styleId="Heading1"><w:name w:val="heading 1"/><w:basedOn w:val="Normal"/><w:rPr><w:b/><w:color w:val="176345"/><w:sz w:val="28"/></w:rPr><w:pPr><w:spacing w:before="250" w:after="110"/></w:pPr></w:style></w:styles>';
 var z=new JSZip();
 z.file('[Content_Types].xml','<?xml version="1.0" encoding="UTF-8"?><Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types"><Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/><Default Extension="xml" ContentType="application/xml"/><Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/><Override PartName="/word/styles.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.styles+xml"/></Types>');
 z.folder('_rels').file('.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/></Relationships>');
 z.folder('word').file('document.xml',doc);
 z.folder('word').file('styles.xml',style);
 z.folder('word').folder('_rels').file('document.xml.rels','<?xml version="1.0" encoding="UTF-8"?><Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships"><Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/styles" Target="styles.xml"/></Relationships>');
 var blob=await z.generateAsync({type:'blob',compression:'DEFLATE'});
 var link=document.createElement('a');var url=URL.createObjectURL(blob);
 link.href=url;link.download='Eco_AI_'+$('mode').value+'_'+($('grade').value||'class')+'.docx';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
 notify(text('Word құжаты жүктелді.','Документ Word скачан.'));
 }catch(e){notify(text('Экспорт қатесі: ','Ошибка экспорта: ')+e.message,true)}
}
async function copy(){
 try{await navigator.clipboard.writeText($('preview').innerText);notify(text('Мәтін көшірілді.','Текст скопирован.'))}
 catch(e){notify(text('Көшіру мүмкін болмады.','Не удалось скопировать.'),true)}
}
$('make').addEventListener('click',generate);
$('download').addEventListener('click',exportDocx);
$('copy').addEventListener('click',copy);
$('kk').addEventListener('click',()=>applyLang('kk'));
$('ru').addEventListener('click',()=>applyLang('ru'));
$('mode').addEventListener('change',function(){document.querySelectorAll('.tool').forEach(x=>x.classList.toggle('selected',x.dataset.tool===$('mode').value))});
try{applyLang(sessionStorage.getItem('ecoTeacherAILang')==='ru'?'ru':'kk')}catch(e){applyLang('kk')}
})();
