/** EcoPassport 6.9 — pupil-facing read-only server.
 * Hosted in EXISTING student Apps Script. Do not insert owner administration code.
 * HUB 6.9: owner-issued certificates visible only to the authenticated pupil.
 * Old legacy credentials (no expiry / no stable ID) continue working during migration.
 * New credentials require both participant ID and non-expired timestamp.
 * Real personal data never goes to GitHub Pages.
 */
const ECO_PASSPORT = Object.freeze({
  spreadsheetProperty: 'ECO_SOURCE_SPREADSHEET_ID',
  contributionTab: 'Вклад',
  accessTab: 'Паспорт — доступ',
  deliveryTab: 'Паспорт — выдача',
  maxHistory: 100,
  participantTab: 'Паспорт — участники',
  issuedAwardTab: 'Награды',
  awardSessionSeconds: 900,
  maxIssuedAwards: 50,
  maxPdfBytes: 4*1024*1024
});

function doGet() {
  return HtmlService.createHtmlOutputFromFile('PassportPortal')
    .setTitle('Eco Club — Личный экологический паспорт')
    .addMetaTag('viewport','width=device-width, initial-scale=1');
}

function getMyPassport(code) {
  // This is the only remotely callable personal-data reader. The other
  // public endpoint downloads a single PDF after verifying a temporary grant.
  // No name, class or participant ID is accepted from the browser.
  const submitted = String(code || '').trim();
  if (!/^[0-9a-f]{64}$/i.test(submitted)) throw new Error('ACCESS_DENIED');
  const fingerprint = sha256_(submitted.toLowerCase());
  const book = sourceWorkbook_();
  const accessSheet = book.getSheetByName(ECO_PASSPORT.accessTab);
  if (!accessSheet) throw new Error('ACCESS_DENIED');

  const records = accessSheet.getDataRange().getValues();
  let authorised = null;
  const now = Date.now();
  for (let i = 1; i < records.length; i++) {
    const row = records[i];
    if (String(row[2] || '').toLowerCase() !== fingerprint || row[3] !== true) continue;
    // G: expiration. Empty G only applies to pre-5.5 legacy credentials.
    const rawExpiry = row[6];
    if (rawExpiry !== '' && rawExpiry != null) {
      const expiry = rawExpiry instanceof Date ? rawExpiry.getTime() : new Date(rawExpiry).getTime();
      if (!Number.isFinite(expiry) || now >= expiry) continue;
    }
    authorised = {
      name: String(row[0]||''),
      className: String(row[1]||''),
      participantId: String(row[7]||'').trim(),
      legacy: rawExpiry === '' || rawExpiry == null
    };
    break;
  }
  if (!authorised) throw new Error('ACCESS_DENIED');
  if (authorised.participantId) {
    const roster = book.getSheetByName(ECO_PASSPORT.participantTab);
    if (!roster) throw new Error('ACCESS_DENIED');
    const matches = roster.getDataRange().getValues().slice(1)
      .filter(r => String(r[0]||'').trim() === authorised.participantId && r[4] !== false);
    if (matches.length !== 1) throw new Error('ACCESS_DENIED');
    authorised.name = String(matches[0][1]||'').trim();
    authorised.className = String(matches[0][2]||'').trim();
  }

  const sheet = book.getSheetByName(ECO_PASSPORT.contributionTab);
  if (!sheet) throw new Error('DATA_UNAVAILABLE');
  const rows = sheet.getDataRange().getValues();
  const key = identityKey_(authorised.name, authorised.className);
  const history = [];
  const uniqueRequestIds = new Set();
  let paperKg = 0, capsCount = 0;
  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (authorised.participantId) {
      if (String(row[12]||'').trim() !== authorised.participantId) continue;
    } else if (identityKey_(row[1],row[2]) !== key) continue;
    if (!isConfirmed_(row[7])) continue;
    const reqId = String(row[8] || '').trim();
    if (reqId && uniqueRequestIds.has(reqId)) continue;
    if (reqId) uniqueRequestIds.add(reqId);
    const paper = nonNegative_(row[3]), caps = nonNegative_(row[4]);
    if (paper === null || caps === null) continue;
    paperKg += paper; capsCount += caps;
    const date = row[0] instanceof Date
      ? Utilities.formatDate(row[0], Session.getScriptTimeZone(), 'yyyy-MM-dd')
      : String(row[0]||'').slice(0,24);
    history.push({date, paperKg:paper, capsCount:caps});
  }
  const count = history.length;
  const milestones = [1,3,10,25];
  let level = -1;
  milestones.forEach((n,i)=>{if(count>=n)level=i;});
  const nextTarget = milestones[level+1] || null;
  const awards = [
    {id:'first', icon:'🌱', ru:'Первый вклад', kk:'Алғашқы үлес', earned:count>=1},
    {id:'three', icon:'✨', ru:'3 вклада', kk:'3 үлес', earned:count>=3},
    {id:'paper5', icon:'🌿', ru:'Первые 5 кг', kk:'Алғашқы 5 кг', earned:paperKg>=5},
    {id:'paper10', icon:'🌳', ru:'10 кг добра', kk:'10 кг жақсылық', earned:paperKg>=10},
    {id:'caps100', icon:'♻️', ru:'100 крышек', kk:'100 қақпақ', earned:capsCount>=100}
  ];
  // A short-lived, memory-only grant is generated only after a valid pupil
  // access code and active permanent participant ID were verified.
  // The grant contains no plaintext code and is rechecked on PDF download.
  const certs=authorised.participantId
    ?eco69MyAwards_(book,authorised.participantId):[];
  const awardGrant=authorised.participantId
    ?eco69IssueGrant_(fingerprint,authorised.participantId):null;
  return {
    success:true,
    name:authorised.name, className:authorised.className,
    confirmedCount:count,
    paperKg:Math.round(paperKg*1000)/1000,
    capsCount,
    level,
    nextTarget,
    participantRef: authorised.participantId ? 'ECO-'+authorised.participantId.slice(0,8).toUpperCase() : null,
    legacyAccess: authorised.legacy,
    awards,
    issuedCertificates:certs,
    certificateGrant:awardGrant,
    history:history.slice(-ECO_PASSPORT.maxHistory).reverse()
  };
}

function sourceWorkbook_() {
  const id=PropertiesService.getScriptProperties().getProperty(ECO_PASSPORT.spreadsheetProperty);
  if (!id || !/^[\w-]{20,}$/.test(id)) throw new Error('NOT_CONFIGURED');
  return SpreadsheetApp.openById(id);
}

function identityKey_(name,cl) {
  const norm=x=>String(x||'').normalize('NFKC').replace(/ё/gi,'е').replace(/\s+/g,' ').trim().toLowerCase();
  return norm(name)+'|'+norm(cl).replace(/\s/g,'');
}

function isConfirmed_(status) {
  const normalized=String(status||'').normalize('NFKC').toLowerCase().replace(/[^a-zа-яәғқңөұүһіё]/g,'');
  return ['подтверждено','подтвердждено','confirmed','approved','расталды','бекітілді'].includes(normalized);
}

function nonNegative_(value) {
  if (value===null || value==='' || value===undefined) return 0;
  const n=Number(String(value).replace(',','.'));
  return Number.isFinite(n)&&n>=0?n:null;
}

function sha256_(text) {
  const bytes=Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,text,Utilities.Charset.UTF_8);
  return bytes.map(x=>(x&255).toString(16).padStart(2,'0')).join('');
}


// ===== HUB 6.9 — issued certificates in a student's private EcoPassport =====
//
// Only getMyPassport(code) and downloadMyCertificate(grant, awardId) are public
// RPC endpoints. Helper names end in "_" and are not callable via script.run.
// PDF URLs, access hashes and other pupils' rows are never sent to the browser.
function eco69MyAwards_(book,participantId){
  const expected=String(participantId||'').trim().toLowerCase();
  if(!/^[0-9a-f]{32}$/.test(expected))return [];
  const sheet=book.getSheetByName(ECO_PASSPORT.issuedAwardTab);
  if(!sheet)return []; // pre-6.8 installs remain compatible
  const values=sheet.getDataRange().getValues();
  const found=[],seen=new Set();
  for(let i=1;i<values.length;i++){
    const r=values[i];
    const id=String(r[0]||'').trim();
    if(!/^AWD-[0-9a-f-]{36}$/i.test(id)||seen.has(id))continue;
    if(String(r[2]||'').trim().toLowerCase()!==expected)continue;
    if(String(r[13]||'').trim()!=='issued')continue;
    if(!String(r[12]||'').trim())continue; // no downloadable PDF
    seen.add(id);
    const d=r[15] instanceof Date && !isNaN(r[15].getTime())
      ?Utilities.formatDate(r[15],Session.getScriptTimeZone(),'dd.MM.yyyy')
      :String(r[15]||'').trim().slice(0,22);
    const num=Number(String(r[10]??'').replace(',','.'));
    found.push({
      id:id,
      titleRu:String(r[6]||'').trim().slice(0,130),
      titleKz:String(r[7]||'').trim().slice(0,130),
      reasonRu:String(r[8]||'').trim().slice(0,220),
      reasonKz:String(r[9]||'').trim().slice(0,220),
      metricValue:Number.isFinite(num)?num:null,
      metricUnit:String(r[11]||'').trim().slice(0,25),
      issuedAt:d
    });
  }
  return found.slice(-ECO_PASSPORT.maxIssuedAwards).reverse();
}

function eco69IssueGrant_(fingerprint,participantId){
  const token=(
    Utilities.getUuid().replace(/-/g,'')+
    Utilities.getUuid().replace(/-/g,'')
  ).toLowerCase();
  if(!/^[0-9a-f]{64}$/.test(token))throw new Error('CERTIFICATE_UNAVAILABLE');
  const entry=JSON.stringify({fingerprint,participantId:participantId.toLowerCase()});
  CacheService.getScriptCache().put(
    'ecopassport-award:'+token,entry,ECO_PASSPORT.awardSessionSeconds
  );
  return token;
}

function eco69CheckGrant_(grant){
  const token=String(grant||'').trim().toLowerCase();
  if(!/^[0-9a-f]{64}$/.test(token))throw new Error('ACCESS_DENIED');
  const raw=CacheService.getScriptCache().get('ecopassport-award:'+token);
  if(!raw)throw new Error('ACCESS_DENIED');
  let entry;
  try{entry=JSON.parse(raw)}catch(e){throw new Error('ACCESS_DENIED')}
  if(!entry||!/^[0-9a-f]{64}$/.test(String(entry.fingerprint||''))||
     !/^[0-9a-f]{32}$/.test(String(entry.participantId||'')))
    throw new Error('ACCESS_DENIED');

  // Revocation, expiry and participant deactivation must take effect even
  // when the pupil already has a 15-minute download grant.
  const book=sourceWorkbook_();
  const access=book.getSheetByName(ECO_PASSPORT.accessTab);
  const roster=book.getSheetByName(ECO_PASSPORT.participantTab);
  if(!access||!roster)throw new Error('ACCESS_DENIED');
  const now=Date.now();
  const registered=roster.getDataRange().getValues().slice(1)
    .filter(r=>String(r[0]||'').trim().toLowerCase()===entry.participantId && r[4]!==false);
  if(registered.length!==1)throw new Error('ACCESS_DENIED');
  const active=access.getDataRange().getValues().slice(1).some(r=>{
    if(String(r[2]||'').trim().toLowerCase()!==entry.fingerprint||
       r[3]!==true||String(r[7]||'').trim().toLowerCase()!==entry.participantId)
      return false;
    const expiry=r[6];
    if(expiry===''||expiry==null)return true; // grandfathered legacy
    const end=expiry instanceof Date?expiry.getTime():new Date(expiry).getTime();
    return Number.isFinite(end)&&now<end;
  });
  if(!active)throw new Error('ACCESS_DENIED');
  return {book,participantId:entry.participantId};
}

function downloadMyCertificate(grant,awardId){
  // Never accept participant ID, name, file URL, filename or class from client.
  const tokenId=String(awardId||'').trim();
  if(!/^AWD-[0-9a-f-]{36}$/i.test(tokenId))throw new Error('ACCESS_DENIED');
  const verified=eco69CheckGrant_(grant);
  const sheet=verified.book.getSheetByName(ECO_PASSPORT.issuedAwardTab);
  if(!sheet)throw new Error('CERTIFICATE_UNAVAILABLE');
  const rows=sheet.getDataRange().getValues();
  let row=null;
  for(let i=1;i<rows.length;i++){
    if(String(rows[i][0]||'').trim()!==tokenId)continue;
    if(row)throw new Error('CERTIFICATE_UNAVAILABLE'); // duplicate ID
    row=rows[i];
  }
  if(!row||String(row[2]||'').trim().toLowerCase()!==verified.participantId||
     String(row[13]||'').trim()!=='issued')
    throw new Error('ACCESS_DENIED');

  // The PDF stays private; never return its Drive URL to the pupil.
  const fileUrl=String(row[12]||'').trim();
  const m=/^https:\/\/drive\.google\.com\/file\/d\/([A-Za-z0-9_-]{15,})\/(?:view|edit)(?:[?#].*)?$/.exec(fileUrl);
  if(!m)throw new Error('CERTIFICATE_UNAVAILABLE');
  const blob=DriveApp.getFileById(m[1]).getBlob();
  if(blob.getContentType()!=='application/pdf')throw new Error('CERTIFICATE_UNAVAILABLE');
  const bytes=blob.getBytes();
  if(bytes.length<10||bytes.length>ECO_PASSPORT.maxPdfBytes)
    throw new Error('CERTIFICATE_UNAVAILABLE');
  return {
    ok:true,
    filename:tokenId+'.pdf',
    mime:'application/pdf',
    base64:Utilities.base64Encode(bytes)
  };
}
