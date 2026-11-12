(()=>{
"use strict";
if(document.getElementById("eco-ai-launcher"))return;
const css=`
#eco-ai-launcher{position:fixed;right:22px;top:175px;bottom:auto;z-index:7998;width:76px;height:76px;border:2px solid #cdf7dc;border-radius:50%;padding:3px;background:linear-gradient(145deg,#08553d,#16a177);box-shadow:0 8px 28px #07533b66;cursor:pointer;display:grid;place-items:center;animation:eco-ai-float 4s ease-in-out infinite}
#eco-ai-launcher::before{content:"Eco AI";position:absolute;right:calc(100% + 9px);top:50%;transform:translateY(-50%);white-space:nowrap;font:800 13px/1 Inter,Segoe UI,Arial,sans-serif;padding:10px 12px;color:#fff;background:#0b6347;border:1px solid #4eaf78;border-radius:12px;box-shadow:0 8px 18px #08472d55;pointer-events:none}
#eco-ai-launcher:hover{transform:scale(1.06);box-shadow:0 8px 35px #0f9b69aa}
#eco-ai-launcher:focus-visible,#eco-ai-panel button:focus-visible,#eco-ai-panel a:focus-visible{outline:3px solid #a6ee73;outline-offset:3px}
#eco-ai-launcher .eco-ai-face{width:100%;height:100%;border-radius:50%;background:radial-gradient(circle at 50% 35%,#d7faff,#60d9ca 65%,#0b7152);display:grid;place-items:center;overflow:hidden}
#eco-ai-launcher .eco-ai-face svg{width:98%;height:98%}
#eco-ai-launcher .eco-ai-dot{position:absolute;right:4px;bottom:7px;width:15px;height:15px;background:#c1ff80;border:3px solid #0b6543;border-radius:50%}
#eco-ai-panel{position:fixed;right:22px;top:270px;bottom:auto;z-index:7999;width:min(390px,calc(100vw - 24px));max-height:min(650px,calc(100dvh - 290px));overflow:auto;border-radius:22px;background:#fff;color:#163e2d;box-shadow:0 22px 75px #072a2090;border:1px solid #cfe4d5;font-family:Inter,Segoe UI,Arial,sans-serif}
#eco-ai-panel[hidden]{display:none!important}
#eco-ai-panel .eco-ai-head{position:sticky;top:0;z-index:3;background:linear-gradient(130deg,#083e30,#0a7954);padding:20px;color:white;position:relative;display:flex;gap:14px;align-items:center}
#eco-ai-panel .eco-ai-avatar{width:74px;height:74px;border-radius:17px;flex:none;background:radial-gradient(circle,#d9fff7,#31bca6);display:grid;place-items:center;overflow:hidden;border:1px solid #aeefcf}
#eco-ai-panel .eco-ai-avatar svg{width:90%;height:90%}
#eco-ai-panel .eco-ai-head strong{font-size:20px;display:block;line-height:1.2}
#eco-ai-panel .eco-ai-head small{font-size:12px;color:#c9edda;display:block;margin-top:5px}
#eco-ai-panel .eco-ai-close{position:absolute;right:10px;top:8px;border:0;background:#ffffff25;color:white;border-radius:8px;width:30px;height:30px;font-size:20px;cursor:pointer}
#eco-ai-panel .eco-ai-body{padding:22px}
#eco-ai-panel .eco-ai-intro{font-size:14px;line-height:1.6;margin:0 0 16px}
#eco-ai-panel .eco-ai-pills{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px}
#eco-ai-panel .eco-ai-pill{border-radius:12px;border:1px solid #bcdac7;background:#eff8f0;color:#0a6343;padding:10px 13px;font-weight:800;cursor:pointer}
#eco-ai-panel .eco-ai-pill[aria-pressed=true]{background:#0a704b;color:white}
#eco-ai-panel .eco-ai-content{border-radius:14px;background:#f1f8f3;border:1px solid #d9e9dd;padding:14px;font-size:13px;line-height:1.5}
#eco-ai-panel .eco-ai-content h3{font-size:16px;margin:0 0 8px;color:#0b6245}
#eco-ai-panel .eco-ai-content p{margin:0 0 12px}
#eco-ai-panel .eco-ai-link{display:inline-flex;align-items:center;padding:10px 14px;background:#0a714b;color:white;border-radius:10px;text-decoration:none;font-weight:800}
#eco-ai-panel .eco-ai-note{font-size:11px;color:#667f71;margin:14px 0 0;line-height:1.55}
@keyframes eco-ai-float{0%,100%{translate:0 0}50%{translate:0 -5px}}
@media(max-width:650px){#eco-ai-launcher{width:64px;height:64px;right:13px;top:172px;bottom:auto}#eco-ai-launcher::before{font-size:11px;padding:8px 9px}#eco-ai-panel{right:12px;top:245px;bottom:auto;width:calc(100vw - 24px);max-height:calc(100dvh - 260px)}#eco-ai-panel .eco-ai-head{padding:16px}}
@media(prefers-reduced-motion:reduce){#eco-ai-launcher{animation:none}}

#eco-ai-launcher{transition:box-shadow .25s,filter .25s;isolation:isolate}
#eco-ai-launcher::after{content:"";position:absolute;inset:-6px;border:1px solid #68e7bb;border-radius:50%;opacity:.6;pointer-events:none;animation:eco-ai-aura 3.8s ease-in-out infinite}
#eco-ai-launcher:hover{filter:drop-shadow(0 0 10px #65f5c8)}
#eco-ai-launcher img{animation:eco-ai-breathe 4.2s ease-in-out infinite}
#eco-ai-panel:not([hidden]) .eco-ai-avatar img{animation:eco-ai-hello .55s ease-out}
#eco-ai-panel:not([hidden]){animation:eco-ai-appear .22s ease-out}
#eco-ai-panel .eco-ai-topics{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin:10px 0}
#eco-ai-panel .eco-ai-topic{padding:9px 6px;font:750 12px/1.4 Inter,Segoe UI,Arial,sans-serif;color:#155d41;background:#fff;border:1px solid #c9dfce;border-radius:10px;cursor:pointer;text-align:left}
#eco-ai-panel .eco-ai-topic[aria-pressed="true"]{background:#d5f2df;border-color:#279967}
#eco-ai-panel .eco-ai-question{margin:11px 0 10px;font-weight:750;color:#164634}
#eco-ai-panel .eco-ai-options{display:grid;gap:7px}
#eco-ai-panel .eco-ai-option{display:block;width:100%;text-align:left;padding:9px 11px;border:1px solid #c8ddce;border-radius:10px;background:#fff;color:#24543a;font:600 12px/1.4 Inter,Segoe UI,Arial,sans-serif;cursor:pointer}
#eco-ai-panel .eco-ai-option:disabled{cursor:default;opacity:1}
#eco-ai-panel .eco-ai-option.correct{background:#d4f4dc;border-color:#2f9b58}
#eco-ai-panel .eco-ai-option.wrong{background:#fff0e8;border-color:#dc9869}
#eco-ai-panel .eco-ai-feedback{margin-top:8px;font-size:12px;line-height:1.5}
#eco-ai-panel .eco-ai-next{margin-top:10px;padding:9px 13px;background:#0c704f;color:#fff;border:0;border-radius:10px;font-weight:800;cursor:pointer}
#eco-ai-panel .eco-ai-progress{color:#617c6c;font-size:11px;margin-top:8px}
#eco-ai-panel .eco-ai-links{display:flex;flex-wrap:wrap;gap:7px;margin-top:13px}
#eco-ai-panel .eco-ai-links a{color:#086542;background:#fff;padding:7px 9px;border:1px solid #bdddc5;border-radius:9px;font-size:11px;font-weight:750;text-decoration:none}
#eco-ai-panel .eco-ai-score{font-weight:800;color:#096b4a}

#eco-ai-panel .eco-ai-levels{display:flex;gap:7px;margin:9px 0}
#eco-ai-panel .eco-ai-level{flex:1;border:1px solid #bedac5;border-radius:9px;padding:9px 5px;background:#fff;color:#0d6245;font-weight:800;cursor:pointer}
#eco-ai-panel .eco-ai-level[aria-pressed="true"]{background:#0b7050;color:#fff}
#eco-ai-panel .eco-ai-stats{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:12px 0}
#eco-ai-panel .eco-ai-stat{text-align:center;border:1px solid #c7e0d0;background:white;border-radius:9px;padding:8px 3px;font-size:10px}
#eco-ai-panel .eco-ai-stat b{display:block;font-size:19px;color:#0c704d}
#eco-ai-panel .eco-ai-badges{font-size:12px;line-height:1.8;margin-bottom:8px}
#eco-ai-panel .eco-ai-bar{height:7px;background:#d8e9dc;border-radius:8px;overflow:hidden;margin:8px 0}
#eco-ai-panel .eco-ai-bar span{height:100%;background:#1fa370;display:block;transition:width .3s}
@keyframes eco-ai-aura{0%,100%{opacity:.3;scale:1}50%{opacity:.8;scale:1.08}}
@keyframes eco-ai-breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.035)}}
@keyframes eco-ai-hello{from{transform:scale(.86) rotate(-6deg);opacity:.3}to{transform:scale(1) rotate(0);opacity:1}}
@keyframes eco-ai-appear{from{transform:translateY(-8px);opacity:0}to{transform:translateY(0);opacity:1}}
@media(prefers-reduced-motion:reduce){#eco-ai-launcher::after,#eco-ai-launcher img,#eco-ai-panel,#eco-ai-panel .eco-ai-avatar img{animation:none!important}}
`;
const style=document.createElement("style");style.textContent=css;document.head.appendChild(style);
const robot=`<svg viewBox="0 0 100 100" aria-hidden="true" xmlns="http://www.w3.org/2000/svg"><defs><radialGradient id="ecoAiSilver"><stop stop-color="#fff"/><stop offset=".7" stop-color="#bed9e8"/><stop offset="1" stop-color="#5689a4"/></radialGradient><radialGradient id="ecoAiEye"><stop stop-color="#e8ffff"/><stop offset=".45" stop-color="#28d6ff"/><stop offset="1" stop-color="#026ba6"/></radialGradient></defs><path d="M26 78 Q14 84 12 99 H88 Q86 84 74 78 L62 74 H38Z" fill="#e6f4f7" stroke="#40758a" stroke-width="2"/><path d="M40 68 H60 V87 L50 95 L40 87Z" fill="#28677d"/><circle cx="50" cy="86" r="5" fill="#75f8a7"/><rect x="18" y="39" width="12" height="23" rx="5" fill="#6bd6c8" stroke="#44839c"/><rect x="70" y="39" width="12" height="23" rx="5" fill="#6bd6c8" stroke="#44839c"/><path d="M24 43 Q24 12 50 11 Q76 12 76 43 L74 60 Q68 78 50 79 Q32 78 26 60Z" fill="url(#ecoAiSilver)" stroke="#4d7a98" stroke-width="2"/><path d="M30 49 Q37 39 45 49 Q39 59 30 49Z" fill="#0c3451"/><path d="M55 49 Q63 39 70 49 Q61 59 55 49Z" fill="#0c3451"/><circle cx="39" cy="49" r="5" fill="url(#ecoAiEye)"/><circle cx="61" cy="49" r="5" fill="url(#ecoAiEye)"/><path d="M44 66 Q50 70 56 66" stroke="#286784" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M48 59 Q50 61 52 59" stroke="#46748b" stroke-width="1.3" fill="none"/></svg>`;
const launcher=document.createElement("button");launcher.id="eco-ai-launcher";launcher.type="button";launcher.setAttribute("aria-haspopup","dialog");launcher.setAttribute("aria-expanded","false");launcher.innerHTML='<span class="eco-ai-face"><img src="eco-ai-mascot.svg" alt="" style="width:100%;height:100%;object-fit:cover"></span><span class="eco-ai-dot"></span>';document.body.append(launcher);
const panel=document.createElement("section");panel.id="eco-ai-panel";panel.setAttribute("role","dialog");panel.setAttribute("aria-modal","false");panel.setAttribute("aria-label","Eco AI");panel.hidden=true;
panel.innerHTML='<div class="eco-ai-head"><div class="eco-ai-avatar"><img src="eco-ai-mascot.svg" alt="" style="width:100%;height:100%;object-fit:cover"></div><div><strong>Eco AI</strong><small id="eco-ai-subtitle"></small></div><button class="eco-ai-close" type="button" aria-label="Close">×</button></div><div class="eco-ai-body"><p class="eco-ai-intro" id="eco-ai-intro"></p><div class="eco-ai-pills"><button class="eco-ai-pill" data-role="student" type="button"></button><button class="eco-ai-pill" data-role="teacher" type="button"></button></div><div class="eco-ai-content" id="eco-ai-content"></div><p class="eco-ai-note" id="eco-ai-note"></p></div>';
document.body.append(panel);

const T={
ru:{open:"Открыть Eco AI",close:"Закрыть",subtitle:"Цифровой помощник Eco Club",intro:"Привет! Я Eco AI — помощник в мире экологии. Выбери свою роль.",student:"🎓 Ученик",teacher:"👩‍🏫 Учитель",studentTitle:"Экологическая лаборатория",studentText:"Выбери тему и проверь свои знания. Всё работает бесплатно и без регистрации.",teacherTitle:"Материалы для учителя",teacherText:"Создавайте КСП, рабочие листы, тесты и исследования в Teacher Studio.",teacherAction:"Открыть Teacher Studio",choose:"Выберите тему",difficulty:"Уровень",basic:"Базовый",advanced:"Продвинутый",completed:"Пройдено",perfect:"Без ошибок",points:"Баллы",achievement:"Достижения",stored:"Результат сохранён в браузере",question:"Вопрос",of:"из",good:"Правильно!",wrong:"Не совсем.",next:"Следующий вопрос",finish:"Посмотреть результат",again:"Пройти заново",result:"Результат",explore:"Материалы на сайте",projects:"Проекты",tasks:"Практические задачи",results:"Наши результаты",note:"Экологическая викторина работает бесплатно и без нейросети. Ответы заранее подготовлены. Полноценный ИИ подключим отдельно."},
kk:{open:"Eco AI көмекшісін ашу",close:"Жабу",subtitle:"Eco Club цифрлық көмекшісі",intro:"Сәлем! Мен Eco AI — экология әлеміндегі көмекшіңмін. Өз рөліңді таңда.",student:"🎓 Оқушы",teacher:"👩‍🏫 Мұғалім",studentTitle:"Экологиялық зертхана",studentText:"Тақырыпты таңда да, біліміңді тексер. Тегін және тіркеусіз жұмыс істейді.",teacherTitle:"Мұғалімге арналған материалдар",teacherText:"Teacher Studio арқылы ҚМЖ, жұмыс парағы, тест және зерттеу жұмысын дайындаңыз.",teacherAction:"Teacher Studio ашу",choose:"Тақырыпты таңда",difficulty:"Деңгей",basic:"Бастапқы",advanced:"Күрделі",completed:"Аяқталды",perfect:"Қатесіз",points:"Ұпай",achievement:"Жетістіктер",stored:"Нәтиже браузерде сақталды",question:"Сұрақ",of:"ішінен",good:"Дұрыс!",wrong:"Дәл емес.",next:"Келесі сұрақ",finish:"Нәтижені көру",again:"Қайта өту",result:"Нәтиже",explore:"Сайт материалдары",projects:"Жобалар",tasks:"Практикалық тапсырмалар",results:"Біздің нәтижелер",note:"Экологиялық викторина тегін және нейрожелісіз жұмыс істейді. Жауаптар алдын ала дайындалған. Толыққанды ЖИ кейін қосылады."}};
const topics=[
{id:"water",label:{ru:"💧 Вода",kk:"💧 Су"},questions:[
{q:{ru:"Что помогает экономить воду дома?",kk:"Үйде суды үнемдеуге не көмектеседі?"},a:{ru:["Оставлять кран открытым","Закрывать кран при чистке зубов","Мыть посуду под постоянной струёй"],kk:["Кранды ашық қалдыру","Тіс тазалағанда кранды жабу","Ыдысты ағып тұрған су астында жуу"]},correct:1,why:{ru:"Закрытый кран сокращает ненужный расход воды.",kk:"Кранды жабу судың босқа ағуын азайтады."}},
{q:{ru:"Какой процесс возвращает воду из облаков на поверхность Земли?",kk:"Бұлттан суды Жер бетіне қайтаратын үдеріс қалай аталады?"},a:{ru:["Осадки","Испарение","Фотосинтез"],kk:["Жауын-шашын","Булану","Фотосинтез"]},correct:0,why:{ru:"Дождь и снег относятся к атмосферным осадкам.",kk:"Жаңбыр мен қар — атмосфералық жауын-шашын."}},
{q:{ru:"Почему нельзя пить воду из неизвестного водоёма без очистки?",kk:"Неге белгісіз су айдынындағы суды тазартпай ішуге болмайды?"},a:{ru:["Она всегда солёная","В ней могут быть опасные микроорганизмы","Она всегда слишком холодная"],kk:["Ол әрқашан тұзды","Онда қауіпті микроағзалар болуы мүмкін","Ол әрқашан тым суық"]},correct:1,why:{ru:"Природная вода может содержать патогены и загрязнения.",kk:"Табиғи суда ауру тудыратын микроағзалар мен ластағыштар болуы мүмкін."}}]},
{id:"waste",label:{ru:"♻️ Отходы",kk:"♻️ Қалдықтар"},questions:[
{q:{ru:"Что лучше сделать с чистой пластиковой бутылкой после использования?",kk:"Қолданғаннан кейін таза пластик бөтелкемен не істеген дұрыс?"},a:{ru:["Выбросить на землю","Сдать в подходящий пункт сбора","Сжечь"],kk:["Жерге тастау","Тиісті қабылдау орнына тапсыру","Өртеу"]},correct:1,why:{ru:"Раздельный сбор позволяет направить пригодный пластик на переработку.",kk:"Бөлек жинау жарамды пластикті қайта өңдеуге мүмкіндік береді."}},
{q:{ru:"Куда правильно сдавать использованные батарейки?",kk:"Қолданылған батарейкаларды қайда тапсыру керек?"},a:{ru:["В специальный пункт приёма","В компост","В обычную урну"],kk:["Арнайы қабылдау орнына","Компостқа","Кәдімгі қоқыс жәшігіне"]},correct:0,why:{ru:"Батарейки требуют отдельного сбора, чтобы снизить риск загрязнения.",kk:"Батарейкаларды ластану қаупін азайту үшін бөлек жинау керек."}},
{q:{ru:"Что означает повторное использование?",kk:"Қайта пайдалану нені білдіреді?"},a:{ru:["Взять новую вещь","Сжечь старую вещь","Использовать вещь ещё раз по назначению или иначе"],kk:["Жаңа зат алу","Ескі затты өртеу","Затты қайтадан бұрынғы не басқа мақсатта пайдалану"]},correct:2,why:{ru:"Повторное использование снижает потребность в новых материалах.",kk:"Қайта пайдалану жаңа материалдарға қажеттілікті азайтады."}}]},
{id:"nature",label:{ru:"🌳 Природа",kk:"🌳 Табиғат"},questions:[
{q:{ru:"Что производят зелёные растения при фотосинтезе?",kk:"Жасыл өсімдіктер фотосинтез кезінде не бөледі?"},a:{ru:["Кислород","Пластик","Дым"],kk:["Оттек","Пластик","Түтін"]},correct:0,why:{ru:"При фотосинтезе растения выделяют кислород.",kk:"Фотосинтез кезінде өсімдіктер оттек бөледі."}},
{q:{ru:"Что лучше делать при встрече с гнездом дикой птицы?",kk:"Жабайы құстың ұясын көрсең, не істеген дұрыс?"},a:{ru:["Трогать яйца","Наблюдать издалека, не тревожа","Унести гнездо домой"],kk:["Жұмыртқаларын ұстау","Мазаламай алыстан бақылау","Ұяны үйге алып кету"]},correct:1,why:{ru:"Диких животных и их потомство не следует беспокоить.",kk:"Жабайы жануарлар мен олардың төлдерін мазаламау керек."}},
{q:{ru:"Почему важно сохранять разнообразие живых организмов?",kk:"Тірі ағзалардың алуан түрлілігін сақтау неге маңызды?"},a:{ru:["Оно поддерживает устойчивость экосистем","Все организмы одинаковы","Оно не влияет на природу"],kk:["Ол экожүйелердің тұрақтылығын қолдайды","Барлық ағзалар бірдей","Оның табиғатқа әсері жоқ"]},correct:0,why:{ru:"Разные виды выполняют важные функции в экосистемах.",kk:"Әртүрлі түрлер экожүйеде маңызды қызмет атқарады."}}]},
{id:"climate",label:{ru:"🌍 Климат",kk:"🌍 Климат"},questions:[
{q:{ru:"Что относится к возобновляемым источникам энергии?",kk:"Жаңартылатын энергия көзіне не жатады?"},a:{ru:["Уголь","Ветер","Нефть"],kk:["Көмір","Жел","Мұнай"]},correct:1,why:{ru:"Ветер постоянно восполняется природными процессами.",kk:"Жел табиғи үдерістер арқылы үнемі жаңарып отырады."}},
{q:{ru:"Что уменьшает расход электричества в классе?",kk:"Сыныпта электр қуатын не үнемдейді?"},a:{ru:["Выключать ненужный свет","Держать все лампы включёнными","Не отключать оборудование"],kk:["Қажетсіз жарықты сөндіру","Барлық шамды жағып қою","Құрылғыларды өшірмеу"]},correct:0,why:{ru:"Выключение ненужных приборов снижает потребление энергии.",kk:"Қажетсіз құрылғыларды өшіру энергия тұтынуды азайтады."}},
{q:{ru:"Что описывает климат, а не погоду?",kk:"Ауа райын емес, климатты не сипаттайды?"},a:{ru:["Дождь сегодня","Температура в этот час","Средние погодные условия за десятилетия"],kk:["Бүгінгі жаңбыр","Осы сағаттағы температура","Ондаған жылдардағы орташа ауа райы жағдайлары"]},correct:2,why:{ru:"Климат характеризуют многолетние погодные условия.",kk:"Климат көпжылдық ауа райы жағдайларымен сипатталады."}}]}
];

const advancedBank={
water:[
{q:{ru:"Почему кипячение не удаляет из воды большинство растворённых солей?",kk:"Неге қайнату суда еріген тұздардың көбін кетірмейді?"},a:{ru:["Они остаются в воде","Они превращаются в кислород","Они всегда улетучиваются"],kk:["Олар суда қалады","Олар оттекке айналады","Олар міндетті түрде буланады"]},correct:0,why:{ru:"Кипячение убивает многие микроорганизмы, но не удаляет большинство растворённых солей.",kk:"Қайнату көптеген микроағзаларды жояды, алайда еріген тұздардың көбін кетірмейді."}},
{q:{ru:"Как корректно измерить сокращение расхода воды в школе?",kk:"Мектептегі су тұтынудың азаюын қалай дұрыс өлшеуге болады?"},a:{ru:["По количеству плакатов","По показаниям счётчиков за сопоставимые периоды","На глаз"],kk:["Плакат саны бойынша","Ұқсас кезеңдердегі есептегіш көрсеткіштері бойынша","Көзбен"]},correct:1,why:{ru:"Сравнение показаний за сопоставимые периоды показывает фактический расход.",kk:"Ұқсас кезеңдегі көрсеткіштерді салыстыру нақты шығынды анықтайды."}},
{q:{ru:"Почему загрязнение подземных вод иногда сохраняется долго?",kk:"Неге жерасты суларының ластануы кейде ұзақ сақталады?"},a:{ru:["Подземная вода не существует","Вода всегда мгновенно очищается","Обновление воды в отдельных водоносных горизонтах медленное"],kk:["Жерасты суы жоқ","Су бірден тазарады","Кейбір сулы қабаттарда судың жаңаруы баяу"]},correct:2,why:{ru:"В отдельных горизонтах вода обновляется медленно, и загрязнители могут сохраняться.",kk:"Кейбір қабаттарда су баяу жаңарады, сондықтан ластағыштар ұзақ сақталуы мүмкін."}}
],
waste:[
{q:{ru:"Что предпочтительнее с точки зрения предотвращения отходов?",kk:"Қалдықтың пайда болуын болдырмау тұрғысынан қайсысы тиімді?"},a:{ru:["Покупать лишнее","Не приобретать ненужную вещь","Сразу захоронить вещь"],kk:["Артық зат сатып алу","Қажетсіз затты сатып алмау","Затты бірден көму"]},correct:1,why:{ru:"Предотвращение отходов обычно лучше их последующей переработки.",kk:"Қалдықтың пайда болуын болдырмау оны кейін өңдеуден әдетте тиімдірек."}},
{q:{ru:"Как подтвердить результат сбора макулатуры?",kk:"Макулатура жинау нәтижесін қалай растауға болады?"},a:{ru:["Взвесить и записать дату","Указать цифру наугад","Посчитать только пакеты"],kk:["Өлшеп, күнін жазу","Кез келген санды көрсету","Тек пакеттерді санау"]},correct:0,why:{ru:"Масса в килограммах с датой — проверяемый показатель.",kk:"Күнімен тіркелген килограмм — тексерілетін көрсеткіш."}},
{q:{ru:"Почему батарейки собирают отдельно?",kk:"Неге батарейкалар бөлек жиналады?"},a:{ru:["Они пригодны для компоста","Они всегда безвредны","При неправильном обращении их вещества могут загрязнять среду"],kk:["Олар компостқа жарамды","Олар әрқашан зиянсыз","Дұрыс өңделмесе, құрамындағы заттар ортаны ластауы мүмкін"]},correct:2,why:{ru:"Специализированная обработка снижает экологические риски.",kk:"Арнайы өңдеу экологиялық қауіпті азайтады."}}
],
nature:[
{q:{ru:"Что может произойти при исчезновении важного опылителя?",kk:"Маңызды тозаңдандырғыш жоғалса, не болуы мүмкін?"},a:{ru:["У некоторых растений снизится размножение","Растения станут пластиком","Всегда исчезнут все растения"],kk:["Кейбір өсімдіктердің көбеюі азаяды","Өсімдіктер пластикке айналады","Барлық өсімдіктер міндетті түрде жойылады"]},correct:0,why:{ru:"Некоторые растения зависят от животных-опылителей.",kk:"Кейбір өсімдіктер жануар-тозаңдандырғыштарға тәуелді."}},
{q:{ru:"Зачем повторять наблюдения за птицами?",kk:"Құстарды бақылауды неге қайталау керек?"},a:{ru:["Чтобы заменить данные догадками","Чтобы заметить изменения и уменьшить влияние случайности","Чтобы все птицы прилетели сразу"],kk:["Деректерді болжаммен алмастыру үшін","Өзгерістерді байқап, кездейсоқ әсерді азайту үшін","Барлық құстар бірден ұшып келуі үшін"]},correct:1,why:{ru:"Повторение наблюдений повышает надёжность выводов.",kk:"Бақылауды қайталау қорытындының сенімділігін арттырады."}},
{q:{ru:"Что уменьшает риск распространения инвазивных видов?",kk:"Инвазиялық түрлердің таралу қаупін не азайтады?"},a:{ru:["Выпускать питомцев в лес","Вывозить растения без проверки","Не выпускать чужеродные организмы в природу"],kk:["Үй жануарларын орманға жіберу","Өсімдіктерді тексерусіз тасымалдау","Бөтен ағзаларды табиғатқа жібермеу"]},correct:2,why:{ru:"Некоторые чужеродные виды угрожают местным экосистемам.",kk:"Кейбір бөтен түрлер жергілікті экожүйелерге қауіп төндіреді."}}
],
climate:[
{q:{ru:"Что отличает климат от погоды?",kk:"Климаттың ауа райынан айырмашылығы қандай?"},a:{ru:["Климат описывает многолетние закономерности","Климат — погода за один час","Понятия одинаковы"],kk:["Климат көпжылдық заңдылықтарды сипаттайды","Климат — бір сағаттағы ауа райы","Екеуі бірдей ұғым"]},correct:0,why:{ru:"Климат характеризуется статистикой погоды за длительный период.",kk:"Климат ұзақ уақыттағы ауа райының статистикасымен сипатталады."}},
{q:{ru:"Почему повышение концентрации CO₂ влияет на климат?",kk:"CO₂ мөлшері артса, климатқа неге әсер етеді?"},a:{ru:["Он превращает воду в пластик","Он поглощает часть инфракрасного излучения","Он уничтожает всю атмосферу"],kk:["Ол суды пластикке айналдырады","Ол инфрақызыл сәуленің бір бөлігін жұтады","Ол бүкіл атмосфераны жояды"]},correct:1,why:{ru:"Парниковые газы влияют на баланс тепла в атмосфере.",kk:"Парниктік газдар атмосферадағы жылу теңгеріміне әсер етеді."}},
{q:{ru:"Как достовернее сравнить расход энергии в двух классах?",kk:"Екі сыныптың энергия шығынын қалай сенімді салыстыруға болады?"},a:{ru:["По числу окон","По цвету стен","По измерениям за сопоставимые периоды с учётом условий"],kk:["Терезе саны бойынша","Қабырға түсі бойынша","Ұқсас кезеңдегі өлшемдерді жағдайды ескеріп салыстыру"]},correct:2,why:{ru:"Для корректного сравнения нужны измерения и сопоставимые условия.",kk:"Дұрыс салыстыру үшін өлшемдер мен ұқсас жағдайлар қажет."}}
]};
topics.forEach(topic=>{topic.advancedQuestions=advancedBank[topic.id]||topic.questions});
let role="student",level="basic",topicId="water",questionIndex=0,score=0,answered=false,selectedIndex=-1,finished=false,lastFocus=null;
try{if(localStorage.getItem("ecoAiRole")==="teacher")role="teacher";if(localStorage.getItem("ecoAiLevel")==="advanced")level="advanced"}catch(e){}
const progressKey="ecoAiProgressV1";
let progress={runs:0,perfect:0,points:0,completed:{}};
try{const v=JSON.parse(localStorage.getItem(progressKey)||"null");if(v&&Number.isFinite(v.runs)&&Number.isFinite(v.perfect)&&Number.isFinite(v.points))progress={runs:v.runs,perfect:v.perfect,points:v.points,completed:v.completed||{}}}catch(e){}
const resetRound=()=>{questionIndex=0;score=0;answered=false;selectedIndex=-1;finished=false};
function saveResult(total){progress.runs++;progress.points+=score;if(score===total)progress.perfect++;progress.completed[topicId+":"+level]=Math.max(score,progress.completed[topicId+":"+level]||0);try{localStorage.setItem(progressKey,JSON.stringify(progress))}catch(e){}}

const lang=()=>document.documentElement.lang==="kk"?"kk":"ru";
const text=(value)=>value[lang()];
const add=(parent,tag,cls,textContent)=>{const el=document.createElement(tag);if(cls)el.className=cls;if(textContent!==undefined)el.textContent=textContent;parent.append(el);return el};
function draw(){
const t=T[lang()];launcher.setAttribute("aria-label",t.open);panel.querySelector(".eco-ai-close").setAttribute("aria-label",t.close);
document.getElementById("eco-ai-subtitle").textContent=t.subtitle;document.getElementById("eco-ai-intro").textContent=t.intro;
panel.querySelectorAll("[data-role]").forEach(b=>{b.setAttribute("aria-pressed",String(b.dataset.role===role));b.textContent=t[b.dataset.role]});
const content=document.getElementById("eco-ai-content");content.replaceChildren();
if(role==="teacher"){add(content,"h3","",t.teacherTitle);add(content,"p","",t.teacherText);const link=add(content,"a","eco-ai-link",t.teacherAction);link.href="eco-ai-teacher-v2.html";}
else{
add(content,"h3","",t.studentTitle);add(content,"p","",t.studentText);
add(content,"div","eco-ai-progress",t.choose+":");
const menu=add(content,"div","eco-ai-topics");
topics.forEach(topic=>{const b=add(menu,"button","eco-ai-topic",text(topic.label));b.type="button";b.setAttribute("aria-pressed",String(topicId===topic.id));b.onclick=()=>{topicId=topic.id;resetRound();draw();panel.scrollTop=0}});
const levels=add(content,"div","eco-ai-levels");
[["basic",t.basic],["advanced",t.advanced]].forEach(([name,label])=>{const b=add(levels,"button","eco-ai-level",label);b.type="button";b.setAttribute("aria-pressed",String(level===name));b.onclick=()=>{level=name;try{localStorage.setItem("ecoAiLevel",level)}catch(e){}resetRound();draw();panel.scrollTop=0}});
const stats=add(content,"div","eco-ai-stats");
[[t.completed,progress.runs],[t.perfect,progress.perfect],[t.points,progress.points]].forEach(([name,val])=>{const el=add(stats,"div","eco-ai-stat");add(el,"b","",String(val));add(el,"span","",name)});
const badges=add(content,"div","eco-ai-badges");
badges.textContent=t.achievement+": "+(progress.runs>0?"🌱 ":"🔒 ")+(progress.perfect>0?"🏆 ":"🔒 ")+(Object.keys(progress.completed).length>=4?"🌍":"🔒");
const topic=topics.find(x=>x.id===topicId)||topics[0];const questions=level==="advanced"?topic.advancedQuestions:topic.questions;const q=questions[questionIndex];
const play=add(content,"div","eco-ai-play");
if(finished){add(play,"p","eco-ai-score",t.result+": "+score+" / "+questions.length);add(play,"div","eco-ai-progress",t.stored);const retry=add(play,"button","eco-ai-next",t.again);retry.type="button";retry.onclick=()=>{resetRound();draw()}}
else{
add(play,"div","eco-ai-progress",t.question+" "+(questionIndex+1)+" "+t.of+" "+questions.length);
add(play,"p","eco-ai-question",text(q.q));
const bar=add(play,"div","eco-ai-bar");const fill=add(bar,"span");fill.style.width=String(100*(questionIndex+(answered?1:0))/questions.length)+"%";const choices=add(play,"div","eco-ai-options");
text(q.a).forEach((option,i)=>{const b=add(choices,"button","eco-ai-option",option);b.type="button";b.disabled=answered;if(answered&&i===q.correct)b.classList.add("correct");if(answered&&i===selectedIndex&&i!==q.correct)b.classList.add("wrong");b.onclick=()=>{if(answered)return;answered=true;selectedIndex=i;if(i===q.correct)score++;draw()}});
if(answered){add(play,"div","eco-ai-feedback",(selectedIndex===q.correct?t.good:t.wrong)+" "+text(q.why));const next=add(play,"button","eco-ai-next",questionIndex===questions.length-1?t.finish:t.next);next.type="button";next.onclick=()=>{if(questionIndex===questions.length-1){finished=true;saveResult(questions.length)}else questionIndex++;answered=false;selectedIndex=-1;draw()}}
}
add(content,"div","eco-ai-progress",t.explore);
const links=add(content,"div","eco-ai-links");[[t.projects,"#projects"],[t.tasks,"#tasks"],[t.results,"#results"]].forEach(([label,href])=>{const a=add(links,"a","",label);a.href=href;a.addEventListener("click",close)});
}
document.getElementById("eco-ai-note").textContent=t.note;
}
function open(){lastFocus=document.activeElement;draw();panel.hidden=false;panel.scrollTop=0;launcher.setAttribute("aria-expanded","true");panel.querySelector(".eco-ai-close").focus()}
function close(){panel.hidden=true;launcher.setAttribute("aria-expanded","false");if(lastFocus&&lastFocus.isConnected)lastFocus.focus()}
launcher.addEventListener("click",()=>panel.hidden?open():close());
panel.querySelector(".eco-ai-close").addEventListener("click",close);
panel.querySelectorAll("[data-role]").forEach(b=>b.addEventListener("click",()=>{role=b.dataset.role;try{localStorage.setItem("ecoAiRole",role)}catch(e){}draw();panel.scrollTop=0}));
document.addEventListener("keydown",e=>{if(e.key==="Escape"&&!panel.hidden)close()});
panel.addEventListener("click",e=>e.stopPropagation());
document.addEventListener("pointerdown",e=>{if(!panel.hidden&&!e.composedPath().includes(panel)&&!e.composedPath().includes(launcher))close()});
new MutationObserver(()=>{draw();panel.scrollTop=0}).observe(document.documentElement,{attributes:true,attributeFilter:["lang"]});draw();
})();