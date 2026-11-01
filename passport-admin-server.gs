/**
 * Eco Club Hub 6.0 / EcoPassport 5.6 — OWNER-ONLY administration.
 * Standalone Apps Script project, NEVER put this in the pupils' project.
 * Deploy: execute as USER ACCESSING THE APP; only owner may access.
 * Script properties: ECO_SOURCE_SPREADSHEET_ID and ECO_ADMIN_EMAIL.
 * No plaintext student access codes are stored, emailed or logged.
 */
const PASSPORT_ADMIN54=Object.freeze({
 sheetProperty:'ECO_SOURCE_SPREADSHEET_ID',
 emailProperty:'ECO_ADMIN_EMAIL',
 contributions:'Вклад',
 access:'Паспорт — доступ',
 roster:'Паспорт — участники',
 audit:'Паспорт — аудит',
 days:180,
 limit:500
});
function doGet(){
 requirePassportAdmin_();
 return HtmlService.createHtmlOutputFromFile('AdminPanel')
  .setTitle('Eco Club — Цифровой кабинет')
  .addMetaTag('viewport','width=device-width, initial-scale=1');
}
function admin54Overview(){
 requirePassportAdmin_();
 const book=passportAdminBook_();
 const contribution=passportAdminSheet_(book,PASSPORT_ADMIN54.contributions);
 const access=passportAdminSheet_(book,PASSPORT_ADMIN54.access);
 const roster=book.getSheetByName(PASSPORT_ADMIN54.roster);
 const records=contribution.getDataRange().getValues().slice(1);
 const issued=access.getDataRange().getValues().slice(1);
 const persons=new Map(),audit=passportAdminAuditRows_(records);
 const registry=roster?roster.getDataRange().getValues().slice(1):[];
 const rosterById=new Map();
 registry.forEach(r=>{
  const id=String(r[0]||'').trim();
  if(id&&r[4]!==false)rosterById.set(id,{id,name:String(r[1]||''),className:String(r[2]||'')});
 });
 const activeByKey=new Map(),activeById=new Map();
 let expiredCodes=0,legacyCodes=0;
 issued.forEach(r=>{
  if(r[3]!==true)return;
  if(!passportAdminNotExpired_(r)){expiredCodes++;return;}
  if(!r[6])legacyCodes++;
  const id=String(r[7]||'').trim(), key=passportAdminIdentity_(r[0],r[1]);
  if(id)activeById.set(id,(activeById.get(id)||0)+1);
  else if(key)activeByKey.set(key,(activeByKey.get(key)||0)+1);
 });
 records.forEach(r=>{
  if(!passportAdminConfirmed_(r[7])||/тест/i.test(String(r[1]||'')))return;
  const paper=passportAdminNumber_(r[3]),caps=passportAdminNumber_(r[4]);
  if(paper===null||caps===null)return;
  let id=String(r[12]||'').trim();
  let p=id?rosterById.get(id):null;
  // Before the migration only, show existing participants by name/class.
  if(!roster){
   const key=passportAdminIdentity_(r[1],r[2]);if(!key)return;
   if(!persons.has(key))persons.set(key,{id:'',name:String(r[1]),className:String(r[2]),contributions:0,paperKg:0,capsCount:0});
   p=persons.get(key);id=key;
  }else{
   if(!p)return; // New rows must be explicitly synced before counting in a passport.
   if(!persons.has(id))persons.set(id,{id:p.id,name:p.name,className:p.className,contributions:0,paperKg:0,capsCount:0});
   p=persons.get(id);
  }
  p.contributions++;p.paperKg+=paper;p.capsCount+=caps;
 });
 // Keep a card for a person with an ID but temporarily no confirmed contributions.
 if(roster)rosterById.forEach(p=>{
  if(!persons.has(p.id))persons.set(p.id,{...p,contributions:0,paperKg:0,capsCount:0});
 });
 const expiry=passportAdmin56ExpiryOverview_(issued);
 const participants=Array.from(persons.values()).map(p=>{
  const key=passportAdminIdentity_(p.name,p.className);
  const n=(p.id?(activeById.get(p.id)||0):0)+(activeByKey.get(key)||0);
  const accessState=passportAdmin56ExpiryForPerson_(issued,p.id,key);
  return {...p,paperKg:Math.round(p.paperKg*1000)/1000,accessActive:n>0,accessCount:n,
   credentialStatus:accessState.status,expiryDate:accessState.expiryDate,
   daysUntilExpiry:accessState.daysUntilExpiry,
   participantRef:p.id?'ECO-'+p.id.slice(0,8).toUpperCase():null};
 }).sort((a,b)=>a.className.localeCompare(b.className,'ru')||a.name.localeCompare(b.name,'ru'));
 return {ok:true,participants:participants.slice(0,PASSPORT_ADMIN54.limit),
  setupRequired:!roster,summary:{total:participants.length,
  active:participants.filter(p=>p.accessActive).length,
  withoutAccess:participants.filter(p=>!p.accessActive).length,
  moreThanOneActive:participants.filter(p=>p.accessCount>1).length,
  expiredCodes,legacyCodes,expiresWithin7Days:expiry.within7,
  expiresWithin30Days:expiry.within30,invalidExpiry:expiry.invalid},
  audit,isTruncated:participants.length>PASSPORT_ADMIN54.limit};
}
/** Called from admin UI after explicit review. Idempotent; no deletions. */
function admin54Migrate(confirm){
 requirePassportAdmin_();
 if(confirm!=='MIGRATE_ECO55')throw new Error('CONFIRM_MIGRATION');
 const lock=LockService.getScriptLock();lock.waitLock(30000);
 try {
  const result=passportAdminLinkRows_();
  passportAdminLog_('MIGRATION','', 'OK','linked:'+result.linked+' newIDs:'+result.newIds+' linkedCodes:'+result.linkedCodes);
  return {ok:true,...result};
 }finally{lock.releaseLock();}
}
/** Re-run when new contributions arrive, after checking their identity. */
function admin54Sync(confirm){
 requirePassportAdmin_();
 if(confirm!=='SYNC_ECO55')throw new Error('CONFIRM_SYNC');
 const lock=LockService.getScriptLock();lock.waitLock(30000);
 try {
  const book=passportAdminBook_();
  if(!book.getSheetByName(PASSPORT_ADMIN54.roster))throw new Error('MIGRATE_FIRST');
  const result=passportAdminLinkRows_();
  passportAdminLog_('SYNC','', 'OK','linked:'+result.linked+' newIDs:'+result.newIds);
  return {ok:true,...result};
 }finally{lock.releaseLock();}
}
function passportAdminLinkRows_(){
 const book=passportAdminBook_();
 const contributions=passportAdminSheet_(book,PASSPORT_ADMIN54.contributions);
 const access=passportAdminSheet_(book,PASSPORT_ADMIN54.access);
 let roster=book.getSheetByName(PASSPORT_ADMIN54.roster);
 if(!roster){
  roster=book.insertSheet(PASSPORT_ADMIN54.roster);
  roster.appendRow(['ID участника','ФИО','Класс','Создан','Активен']);
  roster.setFrozenRows(1);
 }
 const audit=book.getSheetByName(PASSPORT_ADMIN54.audit);
 if(!audit){
  const log=book.insertSheet(PASSPORT_ADMIN54.audit);
  log.appendRow(['Время','Действие','ID участника','Результат','Администратор','Описание']);
  log.setFrozenRows(1);
 }
 const h=contributions.getRange(1,13).getValue();
 if(h && String(h).trim()!=='ID участника')throw new Error('COLUMN_M_IN_USE');
 if(!h)contributions.getRange(1,13).setValue('ID участника');
 const ah=access.getRange(1,7).getValue(),aId=access.getRange(1,8).getValue();
 if(ah && String(ah)!=='Истекает')throw new Error('ACCESS_COLUMN_G_IN_USE');
 if(aId && String(aId)!=='ID участника')throw new Error('ACCESS_COLUMN_H_IN_USE');
 if(!ah)access.getRange(1,7).setValue('Истекает');
 if(!aId)access.getRange(1,8).setValue('ID участника');
 const rosterRows=roster.getDataRange().getValues().slice(1);
 const byKey=new Map(),ids=new Set();
 rosterRows.forEach(r=>{
  const id=String(r[0]||'').trim(),key=passportAdminIdentity_(r[1],r[2]);
  if(!id||!key||ids.has(id)||byKey.has(key))throw new Error('AMBIGUOUS_ROSTER');
  ids.add(id);byKey.set(key,id);
 });
 const raw=contributions.getDataRange().getValues(),creds=access.getDataRange().getValues();
 // Preflight: an existing ID must point to the same roster identity.
 for(let i=1;i<raw.length;i++){
  const r=raw[i];if(!passportAdminConfirmed_(r[7])||/тест/i.test(String(r[1]||'')))continue;
  const key=passportAdminIdentity_(r[1],r[2]),stored=String(r[12]||'').trim();
  if(!key)throw new Error('MISSING_IDENTITY_ROW_'+(i+1));
  if(stored&&byKey.has(key)&&stored!==byKey.get(key))throw new Error('CONTRIBUTION_ID_CONFLICT_'+(i+1));
  if(stored&&!byKey.has(key))throw new Error('UNKNOWN_CONTRIBUTION_ID_'+(i+1));
 }
 for(let i=1;i<creds.length;i++){
  const r=creds[i];const key=passportAdminIdentity_(r[0],r[1]),id=String(r[7]||'').trim();
  if(id&&byKey.has(key)&&id!==byKey.get(key))throw new Error('ACCESS_ID_CONFLICT_'+(i+1));
  if(id&&!byKey.has(key))throw new Error('UNKNOWN_ACCESS_ID_'+(i+1));
 }
 let linked=0,newIds=0,linkedCodes=0;
 for(let i=1;i<raw.length;i++){
  const r=raw[i];if(!passportAdminConfirmed_(r[7])||/тест/i.test(String(r[1]||'')))continue;
  const key=passportAdminIdentity_(r[1],r[2]);
  let id=byKey.get(key);
  if(!id){
   id=Utilities.getUuid().replace(/-/g,'').toLowerCase();
   roster.appendRow([id,String(r[1]).trim(),String(r[2]).trim(),new Date(),true]);
   byKey.set(key,id);newIds++;
  }
  if(!String(r[12]||'').trim()){contributions.getRange(i+1,13).setValue(id);linked++;}
 }
 for(let i=1;i<creds.length;i++){
  const r=creds[i];
  const key=passportAdminIdentity_(r[0],r[1]),id=byKey.get(key);
  if(id&&!String(r[7]||'').trim()){access.getRange(i+1,8).setValue(id);linkedCodes++;}
 }
 return {linked,newIds,linkedCodes};
}
function admin54Issue(name,className){
 requirePassportAdmin_();
 const lock=LockService.getScriptLock();lock.waitLock(30000);
 try {
  const book=passportAdminBook_(),access=passportAdminSheet_(book,PASSPORT_ADMIN54.access);
  const rows=passportAdminSheet_(book,PASSPORT_ADMIN54.contributions).getDataRange().getValues();
  const roster=book.getSheetByName(PASSPORT_ADMIN54.roster);
  if(!roster)throw new Error('MIGRATE_FIRST');
  const key=passportAdminIdentity_(name,className);
  const people=roster.getDataRange().getValues().slice(1).filter(r=>
   passportAdminIdentity_(r[1],r[2])===key&&r[4]!==false);
  if(people.length!==1)throw new Error('INVALID_PARTICIPANT');
  const id=String(people[0][0]||'').trim();
  if(!id||/тест/i.test(String(name)))throw new Error('INVALID_PARTICIPANT');
  // HUB 6.4: an accepted student has a passport even before the first contribution.
  // Profile starts with zero contributions and no awards; code is issued only on click.
  const code=(Utilities.getUuid()+Utilities.getUuid()).replace(/-/g,'').toLowerCase();
  const now=new Date(),expires=new Date(now.getTime()+PASSPORT_ADMIN54.days*24*3600000);
  const previous=access.getDataRange().getValues();
  // First store only the hash and explicit ID/expiry; then invalidate previous.
  access.appendRow([String(people[0][1]).trim(),String(people[0][2]).trim(),
    passportAdminHash_(code),true,now,'',expires,id]);
  let revokedPrevious=0;
  for(let i=1;i<previous.length;i++){
   const r=previous[i],legacyKey=passportAdminIdentity_(r[0],r[1]);
   if(r[3]===true&&(String(r[7]||'').trim()===id||(!r[7]&&legacyKey===key))){
    access.getRange(i+1,4,1,3).setValues([[false,r[4]||'',now]]);
    revokedPrevious++;
   }
  }
  passportAdminLog_('ISSUE',id,'OK','replaced:'+revokedPrevious+' validityDays:'+PASSPORT_ADMIN54.days);
  return {ok:true,code,revokedPrevious,expiresAt:expires.toISOString()};
 }finally{lock.releaseLock();}
}
function admin54Revoke(name,className){
 requirePassportAdmin_();
 const lock=LockService.getScriptLock();lock.waitLock(30000);
 try {
  const book=passportAdminBook_(),access=passportAdminSheet_(book,PASSPORT_ADMIN54.access);
  const roster=book.getSheetByName(PASSPORT_ADMIN54.roster);if(!roster)throw new Error('MIGRATE_FIRST');
  const key=passportAdminIdentity_(name,className);
  const candidates=roster.getDataRange().getValues().slice(1).filter(r=>
   passportAdminIdentity_(r[1],r[2])===key&&r[4]!==false);
  if(candidates.length!==1)throw new Error('INVALID_PARTICIPANT');
  const id=String(candidates[0][0]||'').trim();
  const rows=access.getDataRange().getValues(),now=new Date();let revoked=0;
  for(let i=1;i<rows.length;i++){
   if(rows[i][3]===true&&(String(rows[i][7]||'').trim()===id||
     (!rows[i][7]&&passportAdminIdentity_(rows[i][0],rows[i][1])===key))){
    access.getRange(i+1,4,1,3).setValues([[false,rows[i][4]||'',now]]);
    revoked++;
   }
  }
  passportAdminLog_('REVOKE',id,'OK','count:'+revoked);
  return {ok:true,revoked};
 }finally{lock.releaseLock();}
}
function passportAdminLog_(action,id,result,info){
 const book=passportAdminBook_(),sheet=book.getSheetByName(PASSPORT_ADMIN54.audit);
 if(!sheet)throw new Error('MIGRATE_FIRST');
 sheet.appendRow([new Date(),action,id,result,Session.getActiveUser().getEmail(),info]);
}
function passportAdminAuditRows_(rows){
 const audit={rows:0,confirmed:0,unconfirmed:0,testConfirmed:0,
  confirmedWithoutRequestId:0,duplicateRequestIds:0,possibleRepeatedSubmissions:0,
  unlinkedConfirmed:0};
 const ids=new Set(),signatures=new Map();
 rows.forEach(r=>{
  if(!r.some(v=>v!==''&&v!=null))return;audit.rows++;
  if(!passportAdminConfirmed_(r[7])){audit.unconfirmed++;return;}
  audit.confirmed++;
  if(/тест/i.test(String(r[1]||''))){audit.testConfirmed++;return;}
  const requestId=String(r[8]||'').trim();
  if(!requestId)audit.confirmedWithoutRequestId++;
  else if(ids.has(requestId))audit.duplicateRequestIds++;
  else ids.add(requestId);
  if(!String(r[12]||'').trim())audit.unlinkedConfirmed++;
  const key=passportAdminIdentity_(r[1],r[2])+'|'+r[3]+'|'+r[4];
  signatures.set(key,(signatures.get(key)||0)+1);
 });
 signatures.forEach(n=>{if(n>1)audit.possibleRepeatedSubmissions+=n-1;});
 return audit;
}
function passportAdminNotExpired_(row){
 if(row[6]===''||row[6]==null)return true; // legacy codes remain valid until rotation/revocation
 const time=row[6] instanceof Date?row[6].getTime():new Date(row[6]).getTime();
 return Number.isFinite(time)&&Date.now()<time;
}
function requirePassportAdmin_(){
 const props=PropertiesService.getScriptProperties();
 const expected=String(props.getProperty(PASSPORT_ADMIN54.emailProperty)||'').trim().toLowerCase();
 const active=String(Session.getActiveUser().getEmail()||'').trim().toLowerCase();
 const effective=String(Session.getEffectiveUser().getEmail()||'').trim().toLowerCase();
 if(!expected||!active||!effective||active!==expected||effective!==expected)
  throw new Error('ADMIN_ACCESS_DENIED');
}
function passportAdminBook_(){
 const id=PropertiesService.getScriptProperties().getProperty(PASSPORT_ADMIN54.sheetProperty);
 if(!id||!/^[A-Za-z0-9_-]{20,}$/.test(id))throw new Error('NOT_CONFIGURED');
 return SpreadsheetApp.openById(id);
}
function passportAdminSheet_(book,name){
 const sheet=book.getSheetByName(name);
 if(!sheet)throw new Error('MISSING_SHEET_'+name);
 return sheet;
}
function passportAdminIdentity_(name,className){
 const norm=s=>String(s||'').normalize('NFKC').replace(/ё/gi,'е')
  .replace(/\s+/g,' ').trim().toLowerCase();
 const n=norm(name),cl=norm(className).replace(/\s/g,'');
 return n&&cl?n+'|'+cl:'';
}
function passportAdminConfirmed_(status){
 const s=String(status||'').normalize('NFKC').toLowerCase().replace(/[^a-zа-яәғқңөұүһіё]/g,'');
 return ['подтверждено','подтвердждено','confirmed','approved','расталды','бекітілді'].includes(s);
}
function passportAdminNumber_(n){
 const x=Number(String(n==null||n===''?0:n).replace(',','.'));
 return Number.isFinite(x)&&x>=0?x:null;
}
function passportAdminHash_(code){
 return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,code,Utilities.Charset.UTF_8)
  .map(v=>(v&255).toString(16).padStart(2,'0')).join('');
}


// --- EcoPassport 5.6: owner-facing expiry status and optional weekly mail digest ---
// These functions never log or email plaintext codes, hashes, pupil names or IDs.
// Old credentials without an expiry are explicitly reported as legacy.
function passportAdmin56ExpiryOverview_(rows,now) {
  const current=typeof now==='number'?now:Date.now();
  const result={within7:0,within30:0,expired:0,legacy:0,invalid:0,valid:0};
  rows.forEach(r=>{
    if(r[3]!==true)return;
    const check=passportAdmin56Classify_(r,current);
    if(check.status==='legacy')result.legacy++;
    else if(check.status==='expired')result.expired++;
    else if(check.status==='invalid')result.invalid++;
    else if(check.status==='within7'){result.within7++;result.within30++;}
    else if(check.status==='within30')result.within30++;
    else if(check.status==='valid')result.valid++;
  });
  return result;
}
function passportAdmin56Classify_(row,now) {
  const current=typeof now==='number'?now:Date.now();
  if(row[3]!==true)return {status:'revoked',expiryDate:null,daysUntilExpiry:null};
  const raw=row[6];
  if(raw===''||raw==null)return {status:'legacy',expiryDate:null,daysUntilExpiry:null};
  const millis=raw instanceof Date?raw.getTime():new Date(raw).getTime();
  if(!Number.isFinite(millis))return {status:'invalid',expiryDate:null,daysUntilExpiry:null};
  const days=Math.ceil((millis-current)/86400000);
  const expiryDate=Utilities.formatDate(new Date(millis),Session.getScriptTimeZone(),'yyyy-MM-dd');
  if(millis<=current)return {status:'expired',expiryDate,daysUntilExpiry:0};
  if(millis-current<=7*86400000)return {status:'within7',expiryDate,daysUntilExpiry:days};
  if(millis-current<=30*86400000)return {status:'within30',expiryDate,daysUntilExpiry:days};
  return {status:'valid',expiryDate,daysUntilExpiry:days};
}
function passportAdmin56ExpiryForPerson_(issued,id,key,now) {
  const all=issued.filter(r=>String(r[7]||'').trim()===id&&id||
    !String(r[7]||'').trim()&&passportAdminIdentity_(r[0],r[1])===key);
  const priorities={within7:1,within30:2,legacy:3,valid:4,expired:5,invalid:6,revoked:7};
  const summary=all.map(r=>passportAdmin56Classify_(r,now)).sort((a,b)=>
    priorities[a.status]-priorities[b.status]);
  return summary[0]||{status:'none',expiryDate:null,daysUntilExpiry:null};
}
/** Owner-only settings, no email sent by status lookup. */
function admin56NotificationStatus(){
  requirePassportAdmin_();
  const enabled=PropertiesService.getScriptProperties().getProperty('ECO56_REMINDERS_ENABLED')==='1';
  const actual=ScriptApp.getProjectTriggers().some(t=>t.getHandlerFunction()==='passportAdmin56WeeklyDigest');
  return {enabled:enabled&&actual,timezone:Session.getScriptTimeZone(),
    schedule:'Понедельник, около 08:00 (временная зона проекта)'};
}
/** Called only after explicit click and confirmation in the owner-only admin panel. */
function admin56SetNotifications(enabled){
  requirePassportAdmin_();
  if(typeof enabled!=='boolean')throw new Error('INVALID_VALUE');
  const props=PropertiesService.getScriptProperties();
  const triggers=ScriptApp.getProjectTriggers().filter(t=>
    t.getHandlerFunction()==='passportAdmin56WeeklyDigest');
  if(enabled){
    if(triggers.length===0)ScriptApp.newTrigger('passportAdmin56WeeklyDigest')
      .timeBased().onWeekDay(ScriptApp.WeekDay.MONDAY).atHour(8)
      .everyWeeks(1).inTimezone('Asia/Almaty').create();
    // Remove duplicate triggers if any; do not affect other workflows.
    const matching=ScriptApp.getProjectTriggers().filter(t=>
      t.getHandlerFunction()==='passportAdmin56WeeklyDigest');
    matching.slice(1).forEach(t=>ScriptApp.deleteTrigger(t));
  }else{
    triggers.forEach(t=>ScriptApp.deleteTrigger(t));
  }
  props.setProperty('ECO56_REMINDERS_ENABLED',enabled?'1':'0');
  passportAdminLog_(enabled?'REMINDERS_ENABLED':'REMINDERS_DISABLED','', 'OK','aggregate counts only');
  return admin56NotificationStatus();
}
/**
 * Installable trigger entry point: externally callable name, but rejects
 * any request without a matching installed trigger UID in the event.
 * Triggers may have no active-user email; trust only effective account,
 * project-owned property and the flag for owner-initiated scheduling.
 */
function passportAdmin56WeeklyDigest(e){
  // A publicly named handler is required for installable triggers on some
  // Apps Script runtimes. Never accept a direct google.script.run invocation.
  const uid=String(e&&e.triggerUid||'');
  if(!uid||!ScriptApp.getProjectTriggers().some(t=>
    t.getHandlerFunction()==='passportAdmin56WeeklyDigest'&&String(t.getUniqueId())===uid))
    throw new Error('TRIGGER_EVENT_REQUIRED');
  const props=PropertiesService.getScriptProperties();
  const owner=String(props.getProperty('ECO_ADMIN_EMAIL')||'').trim().toLowerCase();
  const effective=String(Session.getEffectiveUser().getEmail()||'').trim().toLowerCase();
  if(!owner||!effective||owner!==effective||props.getProperty('ECO56_REMINDERS_ENABLED')!=='1')
    throw new Error('REMINDER_ACCESS_DENIED');
  const access=passportAdminSheet_(passportAdminBook_(),PASSPORT_ADMIN54.access)
    .getDataRange().getValues().slice(1);
  const counts=passportAdmin56ExpiryOverview_(access);
  // Do not send an empty report. Legacy keys are included to encourage rotation.
  if(!counts.within7&&!counts.within30&&!counts.legacy&&!counts.expired&&!counts.invalid)
    return {sent:false,reason:'NO_ATTENTION_REQUIRED'};
  const lines=[
    'Eco Club — сводный отчёт по доступам EcoPassport',
    '',
    'Истекают в ближайшие 7 дней: '+counts.within7,
    'Истекают в ближайшие 30 дней (включая 7 дней): '+counts.within30,
    'Старые коды без срока действия: '+counts.legacy,
    'Уже истёкшие коды: '+counts.expired,
    'Некорректные даты окончания: '+counts.invalid,
    '',
    'Откройте закрытую панель Eco Club — Passport Admin для действий.',
    'В письме намеренно отсутствуют ФИО учащихся и секретные коды.'
  ];
  MailApp.sendEmail({to:owner,subject:'EcoPassport: контроль сроков кодов',body:lines.join('\n')});
  return {sent:true,counts};
}



// === ECO CLUB HUB 6.0: OWNER-ONLY unified admin, never for the pupil portal. ===
const ECO_HUB60=Object.freeze({
 applications:'Заявки',
 contributions:'Вклад',
 events:'Заявки мероприятий',
 decisions:'Журнал решений',
 limit:150
});
function admin60Dashboard(){
 requirePassportAdmin_();
 const book=passportAdminBook_();
 const apps=passportAdminSheet_(book,ECO_HUB60.applications).getDataRange().getValues();
 const gifts=passportAdminSheet_(book,ECO_HUB60.contributions).getDataRange().getValues();
 const events=passportAdminSheet_(passportAdmin65EventsBook_(),ECO_HUB60.events).getDataRange().getValues();
 const actions=passportAdminSheet_(book,ECO_HUB60.decisions).getDataRange().getValues();
 const people=book.getSheetByName(PASSPORT_ADMIN54.roster);
 const classes=new Map();
 let paper=0,caps=0,approved=0,pendingContributions=0,rejected=0,unlinked=0;
 const contributions=[];
 for(let i=1;i<gifts.length;i++){
  const r=gifts[i];if(!r.some(v=>v!==''&&v!=null))continue;
  const status=String(r[7]||'').trim(),isTest=/тест/i.test(String(r[1]||''));
  const verified=passportAdminConfirmed_(status);
  const kg=passportAdminNumber_(r[3]),count=passportAdminNumber_(r[4]);
  if(verified&&!isTest&&kg!==null&&count!==null){
   approved++;paper+=kg;caps+=count;
   if(!String(r[12]||'').trim())unlinked++;
   const cl=String(r[2]||'').trim();
   const entry=classes.get(cl)||{className:cl,paperKg:0,capsCount:0,contributions:0,score:0};
   entry.paperKg+=kg;entry.capsCount+=count;entry.contributions++;entry.score=entry.paperKg*10+entry.capsCount/10;
   classes.set(cl,entry);
  }else if(passportAdmin60IsPendingContribution_(status))pendingContributions++;
  else if(/отклон/i.test(status))rejected++;
  contributions.push({
   row:i+1,stamp:passportAdmin60Stamp_('contribution',r),
   date:passportAdmin60Text_(r[0]),name:passportAdmin60Text_(r[1]),className:passportAdmin60Text_(r[2]),
   paperKg:kg,capsCount:count,notes:passportAdmin60Text_(r[6]),status,
   requestIdPresent:!!r[8],linked:!!r[12],test:isTest,
   canDecide:passportAdmin60IsPendingContribution_(status)&&!isTest
  });
 }
 const registered=book.getSheetByName(PASSPORT_ADMIN54.roster);
 const activeRosterKeys=new Set(registered?registered.getDataRange().getValues().slice(1)
   .filter(r=>r[0]&&r[4]!==false).map(r=>passportAdminIdentity_(r[1],r[2])):[]);
 const applications=[];let pendingApplications=0,acceptedApps=0;
 for(let i=1;i<apps.length;i++){
  const r=apps[i];if(!r.some(v=>v!==''&&v!=null))continue;
  const status=String(r[7]||'').trim();
  const pending=passportAdmin60IsPendingApplication_(status);
  if(pending)pendingApplications++;
  if(/^принят/i.test(status))acceptedApps++;
  applications.push({
   row:i+1,stamp:passportAdmin60Stamp_('application',r),
   date:passportAdmin60Text_(r[0]),name:passportAdmin60Text_(r[1]),className:passportAdmin60Text_(r[2]),
   direction:passportAdmin60Text_(r[4]),notes:passportAdmin60Text_(r[5]),status,
   requestIdPresent:!!r[8],canDecide:pending&&!/тест/i.test(String(r[1]||'')),
   registered:activeRosterKeys.has(passportAdminIdentity_(r[1],r[2])),
   canEnroll:/^принят$/i.test(status)&&
     !activeRosterKeys.has(passportAdminIdentity_(r[1],r[2]))&&
     !/тест/i.test(String(r[1]||''))
  });
 }
 const eventList=[];
 let pendingEvents=0,publishedEvents=0,rejectedEvents=0;
 for(let i=1;i<events.length;i++){
  const r=events[i];if(!r.some(v=>v!==''&&v!=null))continue;
  const status=String(r[12]||'').trim();
  const pending=passportAdmin64EventPending_(status);
  if(pending)pendingEvents++;
  else if(passportAdmin64EventPublished_(status))publishedEvents++;
  else if(passportAdmin64EventRejected_(status))rejectedEvents++;
  eventList.push({
    row:i+1,stamp:passportAdmin60Stamp_('event',r),
    eventId:passportAdmin60Text_(r[0]),date:passportAdmin60Text_(r[9]),
    submittedAt:passportAdmin60Text_(r[1]),
    nameRu:passportAdmin60Text_(r[3]),nameKk:passportAdmin60Text_(r[4]),
    descRu:passportAdmin60Text_(r[5]),descKk:passportAdmin60Text_(r[6]),
    className:passportAdmin60Text_(r[8]),category:passportAdmin60Text_(r[7]),
    instagram:passportAdmin60Text_(r[10]),photoUrls:passportAdmin64EventImages_(r[11]),
    status,canDecide:pending,canPublish:pending&&passportAdmin64EventValid_(r),
    canUnpublish:passportAdmin64EventPublished_(status),
    canDeleteTest:/^(?:тест|test)(?:\s|[—-]|$)/i.test(String(r[3]||'').trim()),
    decisionReason:passportAdmin60Text_(r[15])
  });
 }
 const auditTrail=actions.slice(1).filter(r=>r.some(v=>v!==''&&v!=null)).slice(-30).reverse()
 .map(r=>({date:passportAdmin60Text_(r[0]),action:passportAdmin60Text_(r[2]),
  status:passportAdmin60Text_(r[3]),className:passportAdmin60Text_(r[7])}));
 const rosterSize=people?people.getDataRange().getValues().slice(1).filter(r=>r[0]&&r[4]!==false).length:0;
 const taskCenter=passportAdmin65BuildTasks_(book,apps,gifts,events,people);
 return {
  ok:true,
  summary:{
   participants:rosterSize,applications:applications.length,pendingApplications,acceptedApps,
   approvedContributions:approved,pendingContributions,rejectedContributions:rejected,
   paperKg:Math.round(paper*1000)/1000,capsCount:caps,unlinked,events:eventList.length,
   pendingEvents,publishedEvents,rejectedEvents
  },
  classes:Array.from(classes.values()).sort((a,b)=>b.score-a.score).map(x=>({
   ...x,paperKg:Math.round(x.paperKg*1000)/1000,score:Math.round(x.score*10)/10
  })),
  applications:applications.slice().reverse().slice(0,ECO_HUB60.limit),
  contributions:contributions.slice().reverse().slice(0,ECO_HUB60.limit),
  events:eventList.slice().reverse().slice(0,ECO_HUB60.limit),
  audit:auditTrail,taskCenter,
  truncated:applications.length>ECO_HUB60.limit||contributions.length>ECO_HUB60.limit
 };
}
/**
 * Mutates ONLY a pending application or contribution with row stamp check,
 * re-reads under lock to prevent changing someone else's row. All actions logged.
 */
function admin60Decide(kind,rowNumber,expectedStamp,decision,reason){
 requirePassportAdmin_();
 if(!['application','contribution'].includes(kind))throw new Error('INVALID_KIND');
 if(!['approve','reject'].includes(decision))throw new Error('INVALID_DECISION');
 if(!Number.isSafeInteger(rowNumber)||rowNumber<2||rowNumber>10000)throw new Error('INVALID_ROW');
 if(!/^[a-f0-9]{64}$/.test(String(expectedStamp||'')))throw new Error('INVALID_STAMP');
 const why=String(reason||'').trim().slice(0,300);
 if(decision==='reject'&&why.length<3)throw new Error('REJECTION_REASON_REQUIRED');
 const lock=LockService.getScriptLock();lock.waitLock(30000);
 try{
  const book=passportAdminBook_();
  const name=kind==='application'?ECO_HUB60.applications:ECO_HUB60.contributions;
  const sheet=passportAdminSheet_(book,name);
  const width=kind==='application'?9:13;
  if(rowNumber>sheet.getLastRow())throw new Error('ROW_NOT_FOUND');
  const data=sheet.getRange(rowNumber,1,1,width).getValues()[0];
  if(passportAdmin60Stamp_(kind,data)!==expectedStamp)throw new Error('ROW_CHANGED_REFRESH');
  if(kind==='application'&&!passportAdmin60IsPendingApplication_(data[7]))
   throw new Error('ALREADY_REVIEWED');
  if(kind==='contribution'&&!passportAdmin60IsPendingContribution_(data[7]))
   throw new Error('ALREADY_REVIEWED');
  if(/тест/i.test(String(data[1]||'')))throw new Error('TEST_RECORD_REVIEW_REQUIRED');
  let enrolled=null;
  if(kind==='application'&&decision==='approve'){
    // Registration must succeed before the application status changes.
    enrolled=passportAdmin64EnsureParticipant_(book,data[1],data[2]);
  }
  const email=Session.getActiveUser().getEmail(),when=new Date();
  const status=kind==='application'?(decision==='approve'?'Принят':'Отклонён'):
   (decision==='approve'?'✅ Подтверждено':'❌ Отклонено');
  // Strong validation on contribution statuses permits only exact labels.
  sheet.getRange(rowNumber,8).setValue(status);
  if(kind==='contribution'){
   sheet.getRange(rowNumber,10).setValue(when);
   sheet.getRange(rowNumber,11).setValue(email);
   sheet.getRange(rowNumber,12).setValue(decision==='reject'?why:'');
  }
  const log=passportAdminSheet_(book,ECO_HUB60.decisions);
  log.appendRow([when,email,kind==='application'?'HUB_APPLICATION_'+decision.toUpperCase():
   'HUB_CONTRIBUTION_'+decision.toUpperCase(),status,
   kind==='contribution'?rowNumber:'',String(data[8]||''),
   String(data[1]||''),String(data[2]||''),kind==='contribution'?data[3]:'',
   kind==='contribution'?data[4]:'',why]);
  return {ok:true,kind,row:rowNumber,status,
   registered:enrolled?{created:enrolled.created,
    participantRef:'ECO-'+enrolled.id.slice(0,8).toUpperCase()}:null,
   needsSync:kind==='contribution'&&decision==='approve'};
 }finally{lock.releaseLock();}
}
function passportAdmin60IsPendingApplication_(status){
 return /^(?:новая заявка|новая|ожидает|⏳\s*ожидает)$/i.test(String(status||'').trim());
}
function passportAdmin60IsPendingContribution_(status){
 return /^(?:⏳\s*ожидает|ожидает)$/i.test(String(status||'').trim());
}
function passportAdmin60Text_(value){
 return value instanceof Date?Utilities.formatDate(value,Session.getScriptTimeZone(),'dd.MM.yyyy HH:mm'):
  String(value??'').slice(0,400);
}
function passportAdmin60Stamp_(kind,row){
 const selected=kind==='application'?row.slice(0,9):kind==='event'?row.slice(0,16):row.slice(0,13);
 // Empty column P is missing from getDataRange(), but present in 16-column row reads.
 if(kind==='event')while(selected.length<16)selected.push('');
 const normalized=selected.map(v=>v instanceof Date?v.toISOString():String(v??'')).join('\u241e');
 return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,kind+'\u241f'+normalized,Utilities.Charset.UTF_8)
  .map(v=>(v&255).toString(16).padStart(2,'0')).join('');
}


/**
 * ECO CLUB HUB 6.3 — read-only participant profile.
 * Only the owner may inspect a student by immutable roster ID.
 * Source and award thresholds intentionally match the pupil passport.
 * No codes, hashes or contact data are returned to the browser.
 */
function admin63MemberProfile(participantId){
 requirePassportAdmin_();
 const id=String(participantId||'').trim();
 if(!/^[0-9a-f]{32}$/i.test(id))throw new Error('INVALID_PARTICIPANT_ID');
 const book=passportAdminBook_();
 const roster=passportAdminSheet_(book,PASSPORT_ADMIN54.roster);
 const matches=roster.getDataRange().getValues().slice(1).filter(row=>
  String(row[0]||'').trim().toLowerCase()===id.toLowerCase()&&row[4]!==false);
 if(matches.length!==1)throw new Error('PARTICIPANT_NOT_FOUND');
 const person=matches[0];
 const name=String(person[1]||'').trim(),className=String(person[2]||'').trim();
 if(!name||!className)throw new Error('PARTICIPANT_DATA_INVALID');
 const rows=passportAdminSheet_(book,PASSPORT_ADMIN54.contributions).getDataRange().getValues();
 const history=[],seenRequests=new Set();
 let paperKg=0,capsCount=0;
 for(let i=1;i<rows.length;i++){
  const row=rows[i];
  if(String(row[12]||'').trim().toLowerCase()!==id.toLowerCase())continue;
  if(!passportAdminConfirmed_(row[7]))continue;
  const requestId=String(row[8]||'').trim();
  if(requestId&&seenRequests.has(requestId))continue;
  if(requestId)seenRequests.add(requestId);
  const paper=passportAdminNumber_(row[3]);
  const caps=passportAdminNumber_(row[4]);
  if(paper===null||caps===null)continue;
  paperKg+=paper;capsCount+=caps;
  const when=row[0]instanceof Date
   ?Utilities.formatDate(row[0],Session.getScriptTimeZone(),'yyyy-MM-dd')
   :String(row[0]||'').slice(0,24);
  history.push({date:when,paperKg:paper,capsCount:caps});
 }
 const count=history.length;
 const milestones=[1,3,10,25];
 let level=-1;
 milestones.forEach((target,i)=>{if(count>=target)level=i;});
 const nextTarget=milestones[level+1]||null;
 const awards=[
  {id:'first',icon:'🌱',ru:'Первый вклад',kk:'Алғашқы үлес',earned:count>=1},
  {id:'three',icon:'✨',ru:'3 вклада',kk:'3 үлес',earned:count>=3},
  {id:'paper5',icon:'🌿',ru:'Первые 5 кг',kk:'Алғашқы 5 кг',earned:paperKg>=5},
  {id:'paper10',icon:'🌳',ru:'10 кг добра',kk:'10 кг жақсылық',earned:paperKg>=10},
  {id:'caps100',icon:'♻️',ru:'100 крышек',kk:'100 қақпақ',earned:capsCount>=100}
 ];
 const access=passportAdminSheet_(book,PASSPORT_ADMIN54.access).getDataRange().getValues().slice(1);
 const codes=access.filter(r=>String(r[7]||'').trim().toLowerCase()===id.toLowerCase());
 const current=codes.filter(r=>r[3]===true&&passportAdminNotExpired_(r));
 const credential=passportAdmin56ExpiryForPerson_(codes,id,passportAdminIdentity_(name,className));
 return {
  ok:true,participantId:id.toLowerCase(),participantRef:'ECO-'+id.slice(0,8).toUpperCase(),
  name,className,confirmedCount:count,paperKg:Math.round(paperKg*1000)/1000,
  capsCount,level,nextTarget,awards,
  history:history.slice(-100).reverse(),historyTruncated:history.length>100,
  accessActive:current.length>0,activeCodes:current.length,
  credentialStatus:credential.status,expiryDate:credential.expiryDate,
  daysUntilExpiry:credential.daysUntilExpiry
 };
}


function passportAdmin64RosterIdentity_(name,className){
 const key=passportAdminIdentity_(name,className);
 if(!key||String(name).trim().length<3||String(className).trim().length<1)throw new Error('INVALID_STUDENT_IDENTITY');
 return key;
}
function passportAdmin64EnsureParticipant_(book,name,className){
 const key=passportAdmin64RosterIdentity_(name,className);
 const roster=passportAdminSheet_(book,PASSPORT_ADMIN54.roster);
 const rows=roster.getDataRange().getValues().slice(1);
 const matching=rows.filter(r=>passportAdminIdentity_(r[1],r[2])===key);
 if(matching.length>1)throw new Error('AMBIGUOUS_PARTICIPANT');
 if(matching.length===1){
   if(matching[0][4]===false)throw new Error('INACTIVE_PARTICIPANT');
   const existing=String(matching[0][0]||'').trim();
   if(!/^[0-9a-f]{32}$/i.test(existing))throw new Error('INVALID_ROSTER_ID');
   return {id:existing,created:false};
 }
 const id=Utilities.getUuid().replace(/-/g,'').toLowerCase();
 roster.appendRow([id,String(name).trim(),String(className).trim(),new Date(),true]);
 return {id,created:true};
}
/** Separate existing teacher-submission spreadsheet; no private ID in GitHub. */

/**
 * HUB 6.4.3 public-feed bridge. The public v7 backend reads the MAIN
 * spreadsheet's "Мероприятия" sheet, NOT the teacher-submission sheet.
 * This is an export of approved publication fields only, not teacher identity.
 */
function passportAdmin643PublicSheet_(main){
 const sh=passportAdminSheet_(main,'Мероприятия');
 if(sh.getLastRow()===0)sh.appendRow([
  'ID','Дата заявки','Email учителя','Название RU','Название KZ',
  'Описание RU','Описание KZ','Категория','Класс','Дата мероприятия',
  'Instagram','ID фотографий','Статус','Решение от','Решение кем','Причина'
 ]);
 return sh;
}
function passportAdmin643MirrorIndex_(sheet,id){
 const n=sheet.getLastRow();
 if(n<2)return 0;
 const values=sheet.getRange(2,1,n-1,1).getDisplayValues();
 const found=[];
 values.forEach((row,i)=>{if(String(row[0]||'').trim()===id)found.push(i+2);});
 if(found.length>1)throw new Error('DUPLICATE_PUBLIC_EVENT_ID');
 return found[0]||0;
}
function passportAdmin643PublicRow_(source,status,at){
 return [
  String(source[0]||''),source[1]||'','',String(source[3]||''),String(source[4]||''),
  String(source[5]||''),String(source[6]||''),String(source[7]||''),
  String(source[8]||''),source[9]||'',String(source[10]||''),
  String(source[11]||''),status,at||'','',''
 ];
}
function passportAdmin643HideMirror_(main,id,status){
 const sheet=passportAdmin643PublicSheet_(main);
 const pos=passportAdmin643MirrorIndex_(sheet,id);
 if(pos)sheet.getRange(pos,13).setValue(status);
 return {sheet,pos};
}

function passportAdmin65EventsBook_(){
 const id=String(PropertiesService.getScriptProperties()
   .getProperty('ECO_EVENTS_SPREADSHEET_ID')||'').trim();
 if(!/^[A-Za-z0-9_-]{20,}$/.test(id))throw new Error('ECO_EVENTS_SPREADSHEET_ID_NOT_CONFIGURED');
 return SpreadsheetApp.openById(id);
}
function passportAdmin65PhotoIds_(row){
 const parts=String(row[11]||'').split(',').map(x=>x.trim()).filter(Boolean);
 if(parts.length<1||parts.length>3||parts.some(x=>!/^[A-Za-z0-9_-]{15,150}$/.test(x)))
   throw new Error('INVALID_EVENT_PHOTOS');
 return parts;
}
function passportAdmin65PhotoFiles_(row){
 return passportAdmin65PhotoIds_(row).map(id=>DriveApp.getFileById(id));
}
function passportAdmin65ExternalAudit_(book,row,action,actor,reason){
 const sh=passportAdminSheet_(book,'Мероприятия — журнал');
 sh.appendRow([new Date(),actor,action,String(row[0]||''),String(reason||'')]);
}
function passportAdmin64EventPending_(status){
 const s=String(status||'').normalize('NFKC').trim().toLowerCase().replace(/^⏳\s*/,'');
 return ['на проверке','на модерации','ожидает','ожидает проверки','ожидает подтверждения',
   'на рассмотрении','отправлено','новая публикация','новое мероприятие','pending','submitted'].includes(s);
}
function passportAdmin64EventPublished_(status){
 const s=String(status||'').normalize('NFKC').trim().toLowerCase().replace(/^✅\s*/,'');
 return ['опубликовано','одобрено','утверждено','published','approved'].includes(s);
}
function passportAdmin64EventRejected_(status){
 const s=String(status||'').normalize('NFKC').trim().toLowerCase().replace(/^❌\s*/,'');
 return ['отклонено','отклонён','отклонена','отказано','rejected'].includes(s);
}
function passportAdmin64EventValid_(r){
 const eventId=String(r[0]||'').trim();
 const title=String(r[3]||'').trim();
 const category=String(r[7]||'').trim();
 const date=r[9];
 return /^EV-[A-Za-z0-9-]{1,80}$/.test(eventId)&&title.length>=3&&title.length<=200&&
  !!category&&!!date;
}
function passportAdmin64EventImages_(raw){
 const text=String(raw||'').trim();
 let items=[];
 if(text.startsWith('[')){
   try{const val=JSON.parse(text);if(Array.isArray(val))items=val;}catch(e){}
 }
 if(!items.length)items=text.split(/[,;\s]+/);
 return items.map(x=>String(x||'').trim())
  .filter(x=>/^[A-Za-z0-9_-]{15,150}$/.test(x))
  .slice(0,12)
  .map(id=>'https://drive.google.com/thumbnail?id='+encodeURIComponent(id)+'&sz=w500');
}
function passportAdmin64AuditEvent_(book,row,status,email,reason){
 const log=passportAdminSheet_(book,ECO_HUB60.decisions);
 const action=passportAdmin64EventPublished_(status)?'PUBLISH':status==='Снято с публикации'?'UNPUBLISH':'REJECT';
 log.appendRow([new Date(),email,'HUB_EVENT_'+action,
  status,'',String(row[0]||''),String(row[3]||''),String(row[8]||''),'','',reason]);
}
/** Approve or reject a submitted teacher event, with optimistic concurrency. */
function admin64DecideEvent(rowNumber,expectedStamp,decision,reason){
 requirePassportAdmin_();
 if(!Number.isSafeInteger(rowNumber)||rowNumber<2||rowNumber>10000)throw new Error('INVALID_ROW');
 if(!['approve','reject','unpublish'].includes(decision))throw new Error('INVALID_DECISION');
 if(!/^[a-f0-9]{64}$/.test(String(expectedStamp||'')))throw new Error('INVALID_STAMP');
 const explanation=String(reason||'').trim().slice(0,300);
 if(decision!=='approve'&&explanation.length<5)throw new Error('REJECTION_REASON_REQUIRED');
 const lock=LockService.getScriptLock();lock.waitLock(30000);
 try{
  const main=passportAdminBook_();
  const eventsBook=passportAdmin65EventsBook_();
  const sheet=passportAdminSheet_(eventsBook,ECO_HUB60.events);
  if(rowNumber>sheet.getLastRow())throw new Error('ROW_NOT_FOUND');
  const r=sheet.getRange(rowNumber,1,1,16).getValues()[0];
  if(passportAdmin60Stamp_('event',r)!==expectedStamp)throw new Error('ROW_CHANGED_REFRESH');
  const current=String(r[12]||'').trim();
  if(decision==='unpublish'?!passportAdmin64EventPublished_(current):
     !passportAdmin64EventPending_(current))throw new Error('ALREADY_REVIEWED');
  if(decision==='approve'&&!passportAdmin64EventValid_(r))throw new Error('EVENT_REQUIRED_FIELDS_MISSING');
  const id=String(r[0]||'');
  const status=decision==='approve'?'Опубликовано':decision==='reject'?'Отклонено':'Снято с публикации';
  const when=new Date(),email=Session.getActiveUser().getEmail();
  const publicSheet=passportAdmin643PublicSheet_(main);
  const mirrorPos=passportAdmin643MirrorIndex_(publicSheet,id);
  // Existing real publication for same ID must not be silently overwritten.
  if(decision==='approve'&&mirrorPos&&
     String(publicSheet.getRange(mirrorPos,13).getValue())==='Опубликовано')
    throw new Error('EVENT_ALREADY_PUBLISHED_IN_PUBLIC_FEED');
  // Capture public record before any changes for compensating rollback.
  const oldMirror=mirrorPos?publicSheet.getRange(mirrorPos,1,1,16).getValues()[0]:null;
  let publicRow=mirrorPos,createdPublicRow=false;
  const photos=(decision==='approve'||decision==='unpublish')
    ?passportAdmin65PhotoFiles_(r):[];
  const prevPermissions=[];
  function restorePhotos(){
   prevPermissions.forEach(x=>{
    try{x.file.setSharing(x.access,x.permission)}catch(err){console.error('Photo rollback failed',err)}
   });
  }
  function restoreMirror(){
   try{
    if(createdPublicRow)publicSheet.deleteRow(publicRow);
    else if(oldMirror)publicSheet.getRange(publicRow,1,1,16).setValues([oldMirror]);
   }catch(err){console.error('Public mirror rollback failed',err)}
  }
  // First hide on unpublish, before any Drive changes; never republish if closing
  // photo permissions fails (failure leaves the public feed hidden).
  if(decision==='unpublish'&&mirrorPos)
   publicSheet.getRange(mirrorPos,13).setValue('Снято с публикации');
  try{
   for(const file of photos){
    const access=file.getSharingAccess(),permission=file.getSharingPermission();
    prevPermissions.push({file,access,permission});
    if(decision==='approve')file.setSharing(DriveApp.Access.ANYONE_WITH_LINK,DriveApp.Permission.VIEW);
    else file.setSharing(DriveApp.Access.PRIVATE,DriveApp.Permission.NONE);
   }
  }catch(err){
   // When unpublishing, keep public feed hidden even if a photo access change fails.
   if(decision==='approve')restorePhotos();
   throw new Error('PHOTO_PERMISSION_CHANGE_FAILED: '+String(err.message||err));
  }
  if(decision==='approve'){
   // Stage as non-public until teacher registry also records the decision.
   try{
    const data=passportAdmin643PublicRow_(r,'Ожидает',when);
    if(mirrorPos)publicSheet.getRange(mirrorPos,1,1,16).setValues([data]);
    else{
     publicSheet.appendRow(data);
     publicRow=publicSheet.getLastRow();
     createdPublicRow=true;
    }
   }catch(err){restorePhotos();throw new Error('PUBLIC_FEED_PREPARATION_FAILED: '+String(err.message||err));}
  }
  try{
   sheet.getRange(rowNumber,13,1,4).setValues([[status,when,email,explanation]]);
  }catch(err){
   if(decision==='approve'){restoreMirror();restorePhotos();}
   throw err;
  }
  if(decision==='approve'){
   // Final switch visible to the public endpoint. If this fails, revert the
   // teacher status so the operation can be safely retried from HUB.
   try{publicSheet.getRange(publicRow,13).setValue('Опубликовано')}
   catch(err){
    try{sheet.getRange(rowNumber,13,1,4).setValues([[current,r[13]||'',r[14]||'',r[15]||'']])}
    catch(e){console.error('Teacher status rollback failed',e)}
    restoreMirror();restorePhotos();
    throw new Error('PUBLIC_FEED_PUBLICATION_FAILED: '+String(err.message||err));
   }
  }
  // Rejecting pending entries should not create a public row. Any stalled
  // mirror left by an interrupted attempt is made explicitly non-public.
  if(decision==='reject'&&mirrorPos)publicSheet.getRange(mirrorPos,13).setValue('Отклонено');
  try{passportAdmin65ExternalAudit_(eventsBook,r,decision,email,explanation)}
  catch(err){console.error('Event audit failed',err)}
  try{passportAdmin64AuditEvent_(main,r,status,email,explanation)}
  catch(err){console.error('Hub event audit failed',err)}
  SpreadsheetApp.flush();
  return {ok:true,status,eventId:id,publicFeedSynchronized:true};
 }finally{lock.releaseLock();}
}
/**
 * Limited clean-up for explicitly marked TEST teacher submissions only.
 * This never touches a real event or a non-test photo. Destructive action
 * requires owner account, current row stamp and an explicit UI confirmation.
 */
function admin65DeleteTestEvent(rowNumber,expectedStamp,eventId){
 requirePassportAdmin_();
 if(!Number.isSafeInteger(rowNumber)||rowNumber<2||rowNumber>10000)throw new Error('INVALID_ROW');
 if(!/^[a-f0-9]{64}$/.test(String(expectedStamp||'')))throw new Error('INVALID_STAMP');
 if(!/^EV-[A-Za-z0-9-]{1,80}$/.test(String(eventId||'')))throw new Error('INVALID_EVENT_ID');
 const lock=LockService.getScriptLock();lock.waitLock(30000);
 try{
  const book=passportAdmin65EventsBook_(),sheet=passportAdminSheet_(book,ECO_HUB60.events);
  if(rowNumber>sheet.getLastRow())throw new Error('ROW_NOT_FOUND');
  const r=sheet.getRange(rowNumber,1,1,16).getValues()[0];
  if(String(r[0]||'')!==eventId||passportAdmin60Stamp_('event',r)!==expectedStamp)
   throw new Error('ROW_CHANGED_REFRESH');
  if(!/^(?:тест|test)(?:\s|[—-]|$)/i.test(String(r[3]||'').trim()))
   throw new Error('NOT_A_TEST_EVENT');
  const photos=passportAdmin65PhotoFiles_(r);
  // Verify we can access every photo before altering any record.
  photos.forEach(file=>{if(!/^eco-/i.test(String(file.getName())))throw new Error('PHOTO_NOT_OWNED_BY_EVENT');});
  const email=Session.getActiveUser().getEmail();
  const auditSheet=passportAdminSheet_(book,'Мероприятия — журнал');
  auditSheet.appendRow([new Date(),email,'DELETE_TEST',String(r[0]),'Удаление тестовой записи с закрытием фото']);
  // Remove any public copy of this TEST publication before deleting the
  // source. Public endpoint must never display a deleted TEST entry.
  const main=passportAdminBook_();
  const feed=passportAdmin643PublicSheet_(main);
  const mirrorIndex=passportAdmin643MirrorIndex_(feed,eventId);
  if(mirrorIndex)feed.deleteRow(mirrorIndex);
  sheet.deleteRow(rowNumber);
  let failed=0;
  photos.forEach(file=>{
   try{
    file.setSharing(DriveApp.Access.PRIVATE,DriveApp.Permission.NONE);
    file.setTrashed(true);
   }catch(e){failed++;console.error('Cleanup test photo failed',e);}
  });
  try{passportAdmin64AuditEvent_(passportAdminBook_(),r,'Тест удалён',email,'DELETE_TEST')}
  catch(e){console.error('Admin audit cleanup failed',e)}
  SpreadsheetApp.flush();
  return {ok:true,deletedEventId:eventId,photoCleanupFailures:failed};
 }finally{lock.releaseLock();}
}

/** Explicitly register an already-accepted applicant from earlier submissions. */
function admin64EnrollAccepted(rowNumber,expectedStamp){
 requirePassportAdmin_();
 if(!Number.isSafeInteger(rowNumber)||rowNumber<2||rowNumber>10000)throw new Error('INVALID_ROW');
 if(!/^[a-f0-9]{64}$/.test(String(expectedStamp||'')))throw new Error('INVALID_STAMP');
 const lock=LockService.getScriptLock();lock.waitLock(30000);
 try{
  const book=passportAdminBook_();
  const sheet=passportAdminSheet_(book,ECO_HUB60.applications);
  if(rowNumber>sheet.getLastRow())throw new Error('ROW_NOT_FOUND');
  const r=sheet.getRange(rowNumber,1,1,9).getValues()[0];
  if(passportAdmin60Stamp_('application',r)!==expectedStamp)throw new Error('ROW_CHANGED_REFRESH');
  if(!/^принят$/i.test(String(r[7]||'').trim()))throw new Error('NOT_ACCEPTED');
  if(/тест/i.test(String(r[1]||'')))throw new Error('TEST_RECORD_REVIEW_REQUIRED');
  const result=passportAdmin64EnsureParticipant_(book,r[1],r[2]);
  if(result.created)passportAdminLog_('HUB_ENROLL',result.id,'OK','accepted applicant registration');
  return {ok:true,participantRef:'ECO-'+result.id.slice(0,8).toUpperCase(),created:result.created};
 }finally{lock.releaseLock();}
}


// === ECO CLUB HUB 6.5: private, read-only daily task queue. ===
// Not an automation: no code issue, approval, revocation, or row mutation.
// All tasks originate from real spreadsheet values and retain stable row/ID targets.
function passportAdmin65BuildTasks_(book,apps,gifts,events,rosterSheet,now){
 const current=typeof now==='number'?now:Date.now();
 const tasks=[],amounts={applications:0,contributions:0,events:0,access:0,data:0},
   urgency={critical:0,high:0,normal:0,routine:0};
 const add=(kind,severity,title,detail,target,row,personId,name,className,date)=>{
  tasks.push({kind,severity,title:String(title).slice(0,180),detail:String(detail).slice(0,260),
   target,row:Number(row)||0,participantId:String(personId||''),
   name:String(name||'').slice(0,120),className:String(className||'').slice(0,40),
   date:passportAdmin60Text_(date).slice(0,50)});
  amounts[kind]++;urgency[severity]++;
 };
 for(let i=1;i<apps.length;i++){
  const r=apps[i],status=String(r[7]||'').trim();
  if(!r.some(v=>v!==''&&v!=null))continue;
  const name=String(r[1]||'').trim(),cl=String(r[2]||'').trim();
  if(passportAdmin60IsPendingApplication_(status))
   add('applications','high','Проверить заявку',name+' · '+cl,'applications',i+1,'',name,cl,r[0]);
 }
 for(let i=1;i<gifts.length;i++){
  const r=gifts[i],status=String(r[7]||'').trim();
  if(!r.some(v=>v!==''&&v!=null))continue;
  const name=String(r[1]||'').trim(),cl=String(r[2]||'').trim();
  const test=/тест/i.test(name);
  if(passportAdmin60IsPendingContribution_(status))
   add('contributions','high','Проверить экологический вклад',
    name+' · '+cl+' · '+passportAdminNumber_(r[3])+' кг / '+passportAdminNumber_(r[4])+' крышек',
    'contributions',i+1,'',name,cl,r[0]);
  else if(!test&&passportAdminConfirmed_(status)&&!String(r[12]||'').trim())
   add('data','normal','Привязать подтверждённый вклад',name+' · '+cl+
    ' · запись не связана с ID участника','passports',i+1,'',name,cl,r[0]);
 }
 for(let i=1;i<events.length;i++){
  const r=events[i],status=String(r[12]||'').trim();
  if(!r.some(v=>v!==''&&v!=null))continue;
  if(passportAdmin64EventPending_(status))
   add('events','high','Проверить публикацию',String(r[3]||'Без названия')+
    ' · '+String(r[8]||''),'events',i+1,'','',String(r[8]||''),r[1]);
 }
 const roster=rosterSheet?rosterSheet.getDataRange().getValues().slice(1)
  .filter(r=>r[0]&&r[4]!==false):[];
 const activeKeys=new Set(roster.map(r=>passportAdminIdentity_(r[1],r[2])));
 for(let i=1;i<apps.length;i++){
  const r=apps[i];if(!/^принят$/i.test(String(r[7]||'').trim()))continue;
  const key=passportAdminIdentity_(r[1],r[2]);
  if(!key||activeKeys.has(key)||/тест/i.test(String(r[1]||'')))continue;
  add('data','normal','Создать EcoPassport принятому ученику',
   String(r[1]||'')+' · '+String(r[2]||'')+' · принят, но ещё без ID',
   'applications',i+1,'',r[1],r[2],r[0]);
 }
 const access=passportAdminSheet_(book,PASSPORT_ADMIN54.access).getDataRange().getValues().slice(1);
 roster.forEach(p=>{
  const id=String(p[0]||'').trim(),name=String(p[1]||'').trim(),cl=String(p[2]||'').trim();
  const key=passportAdminIdentity_(name,cl);
  const matches=access.filter(r=>String(r[7]||'').trim()===id||
   (!String(r[7]||'').trim()&&passportAdminIdentity_(r[0],r[1])===key));
  const valid=matches.filter(r=>r[3]===true&&passportAdminNotExpired_(r));
  if(!valid.length){
   const expired=matches.some(r=>r[3]===true&&
     passportAdmin56Classify_(r,current).status==='expired');
   const invalid=matches.some(r=>r[3]===true&&
     passportAdmin56Classify_(r,current).status==='invalid');
   const important=expired||invalid;
   add('access',important?'critical':'routine',
    important?'Восстановить доступ к EcoPassport':'Код EcoPassport не выдан',
    name+' · '+cl+(expired?' · срок кода истёк':invalid?' · некорректная дата':' · нет действующего кода'),
    'passports',0,id,name,cl,p[3]);
  }else{
   // At most one alert per participant, even when old and newer codes co-exist.
   const statuses=valid.map(r=>passportAdmin56Classify_(r,current));
   const urgent=statuses.find(x=>x.status==='within7');
   const soon=statuses.find(x=>x.status==='within30');
   const legacy=statuses.find(x=>x.status==='legacy');
   const selected=urgent||soon||legacy;
   if(selected){
    const level=urgent?'critical':soon?'normal':'routine';
    const label=urgent?'Код истекает в ближайшие 7 дней':
      soon?'Код истекает в ближайшие 30 дней':'Старый код без срока действия';
    const d=selected.expiryDate?' · до '+selected.expiryDate:' · рекомендуем плановую замену';
    add('access',level,label,name+' · '+cl+d,'passports',0,id,name,cl,p[3]);
   }
  }
 });
 const rank={critical:0,high:1,normal:2,routine:3};
 tasks.sort((a,b)=>rank[a.severity]-rank[b.severity]||
  (b.row||0)-(a.row||0)||a.title.localeCompare(b.title,'ru'));
 const limit=120;
 return {total:tasks.length,shown:Math.min(limit,tasks.length),truncated:tasks.length>limit,
  counts:amounts,urgency,items:tasks.slice(0,limit),
  generatedAt:Utilities.formatDate(new Date(current),Session.getScriptTimeZone(),'dd.MM.yyyy HH:mm')};
}
