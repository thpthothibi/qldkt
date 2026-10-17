let excelPromise;
function loadExcel(){if(window.XLSX)return Promise.resolve();if(excelPromise)return excelPromise;excelPromise=new Promise((resolve,reject)=>{const el=document.createElement('script');el.src='./xlsx.full.min.js';el.onload=()=>resolve();el.onerror=()=>{excelPromise=null;el.remove();reject(Error('Không tải được công cụ Excel. Vui lòng thử lại.'));};document.head.appendChild(el);});return excelPromise;}
const SCHOOL_LOGO = new URL('./school-logo.png?v=1.5.2', window.location.href).href;
'use strict';
const $=s=>document.querySelector(s), $$=s=>Array.from(document.querySelectorAll(s));
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const paths={book:'M4 4h6a3 3 0 0 1 3 3v14a4 4 0 0 0-4-3H4z M20 4h-4a3 3 0 0 0-3 3v14a4 4 0 0 1 4-3h3z',edit:'M16 3l5 5-12 12H4v-5z M13 6l5 5',grid:'M3 3h7v7H3z M14 3h7v7h-7z M3 14h7v7H3z M14 14h7v7h-7z',file:'M14 2H5v20h14V7z M14 2v6h5 M8 12h8 M8 16h6',check:'M5 12l4 4L20 5',upload:'M12 16V3 M7 8l5-5 5 5 M3 15v6h18v-6',download:'M12 3v13 M7 11l5 5 5-5 M3 17v4h18v-4',users:'M16 21v-3a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v3 M14 3a4 4 0 0 1 0 8 M22 21v-3a4 4 0 0 0-3-4 M13 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0',room:'M3 21h18 M5 21V3h14v18 M9 7h2 M14 7h1 M9 11h2 M14 11h1 M10 21v-6h4v6',key:'M14 10l8 8-3 3-3-3-2 2-3-3 M15 7A6 6 0 1 1 3 7a6 6 0 0 1 12 0',logout:'M9 3H3v18h6 M9 12h12 M16 7l5 5-5 5',settings:'M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8 M12 2v3 M12 19v3 M2 12h3 M19 12h3 M5 5l2 2 M17 17l2 2 M5 19l2-2 M17 7l2-2',chevron:'M9 5l7 7-7 7',info:'M12 11v6 M12 7v.1 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',save:'M4 3h13l4 4v14H3V3z M7 3v7h10V3 M7 21v-7h10v7',print:'M6 9V3h12v6 M6 18H3V9h18v9h-3 M6 14h12v8H6z',clock:'M12 7v5l3 2 M22 12a10 10 0 1 1-20 0 10 10 0 0 1 20 0',menu:'M3 6h18 M3 12h18 M3 18h18',plus:'M12 4v16 M4 12h16',shield:'M12 2l9 4v6c0 5-9 10-9 10S3 17 3 12V6z M8 12l3 3 5-6',cloud:'M6 18a5 5 0 0 1 0-10 6 6 0 0 1 12-1 5 5 0 0 1 0 11 M9 15l3-3 3 3 M12 12v9',chart:'M4 21V10h4v11 M10 21V3h4v18 M16 21V7h4v14',close:'M5 5l14 14 M5 19L19 5'};
const icon=n=>`<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="${paths[n]||paths.file}"/></svg>`;
const NATIVE_GAS=typeof google!=='undefined'&&google.script&&google.script.run;
const GAS=NATIVE_GAS || window.HTB_CONFIG?.mode==='live';
const DEFAULT='Htb12345@'; // Legacy demo only. No hard-coded credentials in live mode.
const defaultConfig={years:['2026 - 2027'],periods:['Giữa HK1','HK1','Giữa HK2','HK2'],subjects:['Toán','Ngữ văn','Tiếng Anh','Vật lý','Hóa học','Sinh học','Lịch sử','Địa lý','GD Kinh tế và Pháp luật','Tin học','Công nghệ','GD Quốc phòng và An ninh','Giáo dục thể chất']};
const S={profileSignature:'',signatureVersion:'',signatureLoaded:false,signatureWarning:'',signatureSaving:false,token:'',user:null,config:structuredClone(defaultConfig),year:'2026 - 2027',period:'Giữa HK1',page:'entry',data:{records:[],mappings:[],roster:[]},record:null,dirty:false,filters:{grade:'',subject:'',room:'',className:''},importRows:[],importKind:'',users:[],busy:false};
// Pilot UI is intentionally locked to one synthetic score sheet.
const PILOT_SCOPE = Object.freeze({year:'2026 - 2027',period:'PILOT-TEST',grade:'10',subject:'Toán',phach:'TEST-HTB-001',date:'2026-10-13'});
const PILOT_LABEL = 'PILOT-TEST · dữ liệu giả · admin-only';
let pilotWriteEnabled = false;let liveWriteEnabled=false;
function isPilotScope(p) {return isAdmin() && S.year===PILOT_SCOPE.year && S.period===PILOT_SCOPE.period && p.grade===PILOT_SCOPE.grade && p.subject===PILOT_SCOPE.subject && p.phach===PILOT_SCOPE.phach;}
let demoDB;
function demoInit(){try{demoDB=JSON.parse(localStorage.getItem('htb-demo-v1'));}catch{}if(!demoDB){demoDB={config:structuredClone(defaultConfig),users:[{phone:'0900000001',name:'Nguyễn Minh Anh',role:'teacher',mustChange:true,active:true},{phone:'0900000002',name:'Quản trị viên',role:'admin',mustChange:true,active:true}],mappings:[],roster:[],records:[],audit:[]};['Toán','Ngữ văn','Tiếng Anh'].forEach((subject,j)=>{[10,11,12].forEach(grade=>{for(let room=1;room<=2;room++){const m={year:S.year,period:S.period,grade:String(grade),subject,room:String(room).padStart(2,'0'),phach:`${grade}${j+1}${String(room).padStart(2,'0')}`};m.id=recordKey(m);demoDB.mappings.push(m);for(let stt=1;stt<=30;stt++)demoDB.roster.push({...m,id:m.id+'|'+stt,stt,studentId:`HS${grade}${room}${String(stt).padStart(2,'0')}`,name:`Học sinh minh họa ${String(stt).padStart(2,'0')}`,className:`${grade}A${String(room).padStart(2,'0')}`});}});});demoPersist();}}
function demoPersist(){localStorage.setItem('htb-demo-v1',JSON.stringify(demoDB));}
function recordKey(p){return [p.year,p.period,p.grade,p.subject,p.phach].join('|');}
async function digest(s){const bytes=await crypto.subtle.digest('SHA-256',new TextEncoder().encode(s));return Array.from(new Uint8Array(bytes),b=>b.toString(16).padStart(2,'0')).join('');}
function isAdmin(){return S.user?.role==='admin';}
function scoped(a){return a.filter(x=>x.year===S.year&&x.period===S.period);}
function scoreValue(v){if(v===''||v===null||v===undefined)return null;const s=String(v).trim();if(!/^\d{1,2}([.,]\d{1,2})?$/.test(s)||Number(s.replace(',','.'))>10)throw Error('Điểm từ 0–10, tối đa 2 chữ số thập phân.');return Number(s.replace(',','.'));}
function validPassword(p){return p.length>=10&&p.length<=128&&/[a-z]/.test(p)&&/[A-Z]/.test(p)&&/\d/.test(p)&&/[\W_]/.test(p)&&p!==DEFAULT;}
function publicUser(u){return {phone:u.phone,name:u.name,role:u.role,mustChange:u.mustChange,active:u.active};}
async function demoApi(action,p){
 let u=demoDB.users.find(u=>u.phone===S.user?.phone);
 if(action==='login'){u=demoDB.users.find(u=>u.phone===p.phone&&u.active);if(!u||(u.password?await digest(p.password)!==u.password:p.password!==DEFAULT))throw Error('SĐT hoặc mật khẩu không đúng.');return {token:'demo-session',user:publicUser(u)};}
 if(action==='logout')return true;
 if(!u)throw Error('Hãy đăng nhập lại.');
 if(action==='changePassword'){if(u.password?await digest(p.oldPassword)!==u.password:p.oldPassword!==DEFAULT)throw Error('Mật khẩu hiện tại không đúng.');if(!validPassword(p.newPassword)||p.newPassword===p.oldPassword)throw Error('Mật khẩu mới chưa đủ yêu cầu.');u.password=await digest(p.newPassword);u.mustChange=false;demoPersist();return publicUser(u);}
 if(action==='bootstrap')return {user:publicUser(u),config:{...demoDB.config,periodsByYear:{[S.year]:demoDB.config.periods.filter(n=>demoDB.visibility?.[S.year]?.[n]!==false)}},connected:false};
 if(action==='list')return {records:scoped(demoDB.records).filter(x=>isAdmin()||x.owner===u.phone),mappings:scoped(demoDB.mappings),roster:isAdmin()?scoped(demoDB.roster):[]};
 if(action==='loadRecord'){const r=demoDB.records.find(x=>x.id===p.id);if(!r||(!isAdmin()&&r.owner!==u.phone))throw Error('Không có quyền xem phiếu.');return structuredClone(r);}
 if(action==='saveRecord'){
 const id=recordKey(p),old=demoDB.records.find(x=>x.id===id),map=demoDB.mappings.find(x=>x.id===id);if(!map)throw Error('Số phách chưa được khai báo cho khối và môn này.');if(old&&old.owner!==u.phone)throw Error('Phiếu thuộc một giám khảo khác.');if(old?.status==='confirmed')throw Error('Phiếu đã xác nhận, cần quản trị viên mở lại.');if(old&&(p.version||0)!==old.version)throw Error('Phiếu đã thay đổi. Vui lòng tải lại.');if(!p.date)throw Error('Chọn ngày kiểm tra.');
 const rows=p.rows.map((r,i)=>({stt:i+1,score:scoreValue(r.score),note:r.note}));if(!rows.some(r=>r.score!==null))throw Error('Cần nhập ít nhất một điểm để lưu.');
 const r={...p,id,rows,room:map.room,owner:u.phone,teacher:u.name,status:p.confirm?'confirmed':'draft',digitalSignature:false,version:(old?.version||0)+1,updatedAt:new Date().toISOString()};delete r.token;demoDB.records=demoDB.records.filter(x=>x.id!==id).concat(r);demoDB.audit.push({time:r.updatedAt,actor:u.phone,action:p.confirm?'Xác nhận bằng chữ ký ảnh':'Lưu phiếu',detail:{id,version:r.version}});demoPersist();return r;
 }
 if(!isAdmin())throw Error('Chỉ quản trị viên có quyền thực hiện.');
 if(action==='periodMatrix')return {year:p.year,items:demoDB.config.periods.map(name=>({name,enabled:demoDB.visibility?.[p.year]?.[name]!==false,version:''}))};
 if(action==='savePeriodMatrix'){demoDB.visibility??={};demoDB.visibility[p.year]={};for(const x of p.items)demoDB.visibility[p.year][x.name]=x.enabled;demoPersist();return demoApi('periodMatrix',p);}
 if(action==='users')return demoDB.users.map(publicUser);
 if(action==='addConfig'){if(demoDB.config[p.type].includes(p.value))throw Error('Mục này đã có.');demoDB.config[p.type].push(p.value);demoPersist();return demoDB.config;}
 if(action==='import'){const checked=validateImport(p.kind,p.rows);if(checked.errors.length)throw Error(checked.errors[0]);const seen=new Set(),items=[];for(const r of p.rows){let d;if(p.kind==='users'){d={phone:String(r['SĐT']).trim(),name:r['Họ tên'],role:r['Vai trò'],active:true,mustChange:true};if(demoDB.users.some(x=>x.phone===d.phone))throw Error('SĐT đã tồn tại: '+d.phone);}
 else{d={year:S.year,period:S.period,grade:String(r['Khối']),subject:r['Môn'],room:String(r['Phòng'])};if(p.kind==='mappings'){d.phach=String(r['Số phách']);d.id=recordKey(d);if(demoDB.mappings.some(x=>x.id===d.id||x.year===d.year&&x.period===d.period&&x.grade===d.grade&&x.subject===d.subject&&x.room===d.room))throw Error('Phách hoặc phòng đã tồn tại.');}else{d.stt=Number(r.STT);d.studentId=String(r['Mã học sinh']);d.name=r['Họ tên'];d.className=r['Lớp'];d.id=[d.year,d.period,d.grade,d.subject,d.room,d.stt].join('|');if(demoDB.roster.some(x=>x.id===d.id||x.year===d.year&&x.period===d.period&&x.subject===d.subject&&x.studentId===d.studentId))throw Error('STT hoặc học sinh đã tồn tại.');}}
 const k=d.phone||d.id;if(seen.has(k))throw Error('Có dòng trùng trong file.');seen.add(k);items.push(d);}
 demoDB[p.kind].push(...items);demoPersist();return {count:items.length};}
 if(action==='reopen'){const r=demoDB.records.find(x=>x.id===p.id);r.status='draft';r.version++;demoDB.audit.push({time:new Date().toISOString(),actor:u.phone,action:'Mở lại phiếu',detail:{id:r.id,reason:p.reason}});demoPersist();return true;}
 if(action==='resetPassword'){const v=demoDB.users.find(x=>x.phone===p.phone);delete v.password;v.mustChange=true;demoPersist();return true;}
 if(action==='setActive'){if(p.phone===u.phone)throw Error('Không thể khóa chính mình.');demoDB.users.find(x=>x.phone===p.phone).active=p.active;demoPersist();return true;}
 if(action==='audit')return demoDB.audit.slice(-200).reverse();
 throw Error('Chức năng chưa được hỗ trợ.');
}
async function api(action,p={}){if(window.HTB_CONFIG?.mode==='live'){if(!window.HTBRemote)throw Error('Thiếu bridge.js. Hãy tải lại trang.');if(action==='addConfig'&&p.type==='periods')p={...p,year:S.year};return window.HTBRemote(action,p);}if(NATIVE_GAS)return new Promise((resolve,reject)=>google.script.run.withSuccessHandler(r=>r.ok?resolve(r.data):reject(Error(r.error))).withFailureHandler(e=>reject(Error(e.message||e))).api(action,{...p,token:S.token}));return demoApi(action,p);}
let toastTimer;function toast(message,error=false){const el=$('#toast');el.textContent=message;el.style.background=error?'#9c4343':'#142940';el.style.display='block';clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.style.display='none',5000);}
function modal(html,forced=false){const m=$('#modal');m.innerHTML=html;m.oncancel=e=>{if(forced||S.busy)e.preventDefault();};m.showModal();}
function closeModal(){const m=$('#modal');m.close();m.innerHTML='';}
function options(a,value,empty){return (empty!==undefined?`<option value="">${esc(empty)}</option>`:'')+a.map(v=>`<option value="${esc(v)}" ${String(v)===String(value)?'selected':''}>${esc(v)}</option>`).join('');}
function initials(name){return name.split(' ').slice(-2).map(x=>x[0]).join('').toUpperCase();}
function brand(){return `<div class="brand"><div class="brand-mark"><img src="${SCHOOL_LOGO}" alt="Logo Trường THPT Hồ Thị Bi"></div><div><strong>Quản lý điểm<br>kiểm tra</strong><small>THPT HỒ THỊ BI</small></div></div>`;}
function loginScreen(){S.user=null;$('#app').innerHTML=`<main class="login sample-login"><div class="sample-shell"><section class="login-box sample-card" aria-labelledby="loginTitle"><div class="sample-logo"><img src="${SCHOOL_LOGO}" alt="Logo Trường THPT Hồ Thị Bi" width="120" height="120"></div><p class="sample-school">TRƯỜNG THPT HỒ THỊ BI</p><h2 id="loginTitle">Quản Lý Điểm Kiểm Tra</h2><div class="sample-badge">CỔNG ĐĂNG NHẬP</div><form id="loginForm"><div class="field"><label for="phone">Số điện thoại đăng nhập</label><div class="sample-input"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><circle cx="12" cy="7" r="4"/><path d="M3 22v-2a9 9 0 0 1 18 0v2"/></svg><input id="phone" name="phone" type="text" autocomplete="username" placeholder="Nhập số điện thoại" required maxlength="254"></div></div><div class="field"><label for="password">Mật khẩu</label><div class="sample-input"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><rect x="4" y="10" width="16" height="11" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4"/></svg><input id="password" name="password" type="password" autocomplete="current-password" placeholder="Nhập mật khẩu" required><button type="button" id="showPassword" aria-label="Hiển thị mật khẩu" aria-pressed="false"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" aria-hidden="true"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/></svg></button></div></div><div id="loginError" class="error" role="alert"></div><button class="primary" id="loginBtn">Đăng nhập</button><button type="button" class="sample-forgot" data-action="forgot">Quên mật khẩu?</button><button type="button" class="small" data-action="logout" style="margin-top:12px;width:100%">Đăng xuất phiên cũ / đổi tài khoản</button></form></section><footer class="sample-copyright">© ${new Date().getFullYear()} Trường THPT Hồ Thị Bi</footer></div></main>`;
 $('#showPassword').onclick=()=>{const visible=$('#password').type==='password';$('#password').type=visible?'text':'password';$('#showPassword').setAttribute('aria-pressed',String(visible));$('#showPassword').setAttribute('aria-label',visible?'Ẩn mật khẩu':'Hiển thị mật khẩu');};$('#loginForm').onsubmit=async e=>{e.preventDefault();$('#loginBtn').disabled=true;$('#loginBtn').textContent='Đang đăng nhập…';$('#loginError').textContent='';try{const user=await window.HTBAuth.login($('#phone').value.trim(),$('#password').value);$('#password').value='';S.token=user.$id;$('#loginBtn').textContent='Đang mở không gian làm việc…';await boot();if(S.user.mustChange)toast('Vui lòng đổi mật khẩu lần đầu trong hộp thoại để tiếp tục.',true);}catch(e){if($('#loginError'))$('#loginError').textContent=e.message;else toast(e.message,true);}finally{if($('#loginBtn')){$('#loginBtn').disabled=false;$('#loginBtn').textContent='Đăng nhập';}}};
}
function changePassword(forced=false){modal(`<h2>${forced?'Đổi mật khẩu lần đầu':'Đổi mật khẩu'}</h2><p>${forced?'Chào '+esc(S.user.name)+'. Hãy đặt mật khẩu riêng trước khi nhập điểm.':'Sau khi lưu, bạn sẽ đăng nhập lại bằng mật khẩu mới.'}</p><form id="changeForm"><div class="field"><label>Mật khẩu hiện tại</label><input name="old" type="password" autocomplete="current-password" required></div><div class="field"><label>Mật khẩu mới</label><input name="next" type="password" autocomplete="new-password" required minlength="10" maxlength="128"></div><div class="field"><label>Nhập lại mật khẩu mới</label><input name="again" type="password" autocomplete="new-password" required></div><p>Từ 10 ký tự, có chữ hoa, chữ thường, số và ký tự đặc biệt.</p><div id="changeError" class="error"></div><div class="modal-actions">${forced?'<button type="button" data-action="logout">Đăng xuất</button>':'<button type="button" data-action="close">Hủy</button>'}<button class="primary">Lưu mật khẩu</button></div></form>`,forced);$('#changeForm').onsubmit=async e=>{e.preventDefault();const f=e.target;if(f.next.value!==f.again.value){$('#changeError').textContent='Mật khẩu nhập lại chưa khớp.';return;}if(!validPassword(f.next.value)){$('#changeError').textContent='Mật khẩu mới chưa đủ yêu cầu hoặc trùng mật khẩu mặc định.';return;}const b=f.querySelector('.primary');b.disabled=true;try{S.user=await api('changePassword',{oldPassword:f.old.value,newPassword:f.next.value});await window.HTBAuth.logout();closeModal();S.token='';S.user=null;S.dirty=false;S.record=null;S.data={records:[],mappings:[],roster:[]};window.HTBHQGD?.clear();dataStamp=null;usersStamp=null;loginScreen();toast('Đã lưu mật khẩu mới. Vui lòng đăng nhập lại bằng mật khẩu mới.');}catch(e){if($('#changeError'))$('#changeError').textContent=e.message;else toast(e.message,true);}finally{b.disabled=false;}};}
async function boot(initial){
 const b=initial||await api('bootstrap');
 S.profileSignature='';S.signatureVersion='';S.signatureLoaded=false;S.signatureWarning='';window.HTBHQGD?.clear();
 S.user=b.user; S.config=b.config;liveWriteEnabled=b.live===true;invalidatePeriodCache();
 pilotWriteEnabled=false;
 if (isAdmin() && window.HTB_CONFIG?.enablePilotUI===true) {
   try {
     const p=await api('pilotStatus');
     pilotWriteEnabled=p?.pilot50Enabled===true && p?.mode==='pilot50';
     if (pilotWriteEnabled && !S.config.periods.includes(PILOT_SCOPE.period)) S.config.periods=[...S.config.periods,PILOT_SCOPE.period];
   } catch(e){console.warn('HTB pilot status unavailable:',e?.message);}
 }
 if(b.year)S.year=b.year;if(b.period)S.period=b.period;syncPeriodSelection();
 S.page='entry';S.record=null;S.dirty=false;
 if(S.user.mustChange){S.data={records:[],mappings:[],roster:[]};render();changePassword(true);return;}
 // Q14: show the authenticated shell as soon as bootstrap has finished.
 // List pagination and the user's signature are not critical-path to showing the page.
 if(initial?.data){S.data=initial.data;dataStamp={token:S.token,year:S.year,period:S.period,time:Date.now()};}
 else {S.data={records:[],mappings:[],roster:[]};dataStamp=null;}
 render();
 // Paint the authenticated form before starting background requests.
 await new Promise(resolve=>requestAnimationFrame(()=>setTimeout(resolve,0)));
 if(!initial?.data){const pane=document.querySelector('#content');if(pane)pane.insertAdjacentHTML('afterbegin','<div id="htb-list-loading" class="htb-list-loading" role="status">Đang đồng bộ số phách và danh sách phiếu. Có thể nhập thông tin trong khi tải.</div>');}
 const session=S.token, scopeYear=S.year, scopePeriod=S.period;
 const valid=()=>S.token===session&&S.year===scopeYear&&S.period===scopePeriod;
 loadProfileSignature().then(()=>{
   if(valid()&&S.page==='entry'&&!S.dirty&&S.record?.status!=='confirmed'){
     // Do not replace an in-progress form merely because its signature arrived.
     if(S.record&&!S.record.signature&&S.profileSignature){
       S.record.signature=S.profileSignature;S.record.useProfileSignature=true;
       S.record.profileSignatureVersion=S.signatureVersion;
     }
     const signatureBox=document.querySelector('.signature-card');
     if(signatureBox && S.profileSignature && !document.querySelector('.sign-upload img')){
       const button=signatureBox.querySelector('.sign-upload');
       if(button)button.innerHTML='<img src="'+esc(S.profileSignature)+'" alt="Chữ ký giám khảo">';
     }
   }
 }).catch(e=>console.warn('Signature loading:',e?.message));
 if(!initial?.data){
   loadData().then(()=>{
     if(valid()){document.querySelector('#htb-list-loading')?.remove();if(['sheets','mappings'].includes(S.page)&&!S.dirty)renderContent();}
   }).catch(e=>{if(valid()){document.querySelector('#htb-list-loading')?.remove();toast('Chưa tải được danh sách: '+e.message,true);}});
 }
}
// Session-only list snapshot. Never persisted to localStorage and never caches authentication.
// A forced refresh and scope change always read authoritative server state.
const LIST_FRESH_ADMIN_MS=120*1000, LIST_FRESH_TEACHER_MS=300*1000;
let dataStamp=null, usersStamp=null;
let listGeneration=0;
let roomSearchReady=false;
let periodMatrixCache=null,periodMatrixDirty=false,periodMatrixBusy=false;
function periodChoices(year=S.year){
  // Administrators must be able to inspect periods even when hidden from teachers.
  return isAdmin()?S.config.periods:(S.config.periodsByYear?.[year]||S.config.periods);
}
function syncPeriodSelection(){const choices=periodChoices();if(!choices.includes(S.period))S.period=choices[0]||'';}
function invalidatePeriodCache(){periodMatrixCache=null;periodMatrixDirty=false;}

async function loadData(force=false,includeSheetDetails=false){
 if(!S.period){S.data={records:[],mappings:[],roster:[]};dataStamp=null;return;}
 if(S.page==='rooms'){roomSearchReady=false;return;}
 // Q14: unrelated admin/HQGD menus do not initiate a full score/mapping scan.
 if(!['entry','sheets','mappings','scores'].includes(S.page))return;

 const oldBusy=S.busy;
 const token=S.token,year=S.year,period=S.period,generation=++listGeneration;const current=()=>{if(generation!==listGeneration||S.token!==token||S.year!==year||S.period!==period)throw Error('Phiên hoặc đợt kiểm tra đã thay đổi.');};
 try{
 const same=dataStamp&&dataStamp.token===S.token&&dataStamp.year===S.year&&dataStamp.period===S.period&&Date.now()-dataStamp.time<(isAdmin()?LIST_FRESH_ADMIN_MS:LIST_FRESH_TEACHER_MS);
 async function all(entity){const out=[];let pos=0;do{const result=await api('listPage',{entity,year,period,offset:pos});if(!Array.isArray(result.rows))throw Error('Danh sách không hợp lệ.');out.push(...result.rows);pos=result.nextOffset;if(out.length>30000)throw Error('Danh sách vượt 30.000 dòng.');}while(pos!==null);return out;}
 if(force||!same){const [records,mappings]=await Promise.all([all('records'),all('mappings')]);current();S.data={records,mappings,roster:[]};dataStamp={token:S.token,year:S.year,period:S.period,time:Date.now(),rosterLoaded:false};}
 if(isAdmin()&&['rooms','scores'].includes(S.page)&&!dataStamp.rosterLoaded){const roster=await all('roster');current();S.data.roster=roster;dataStamp.rosterLoaded=true;}
 // Viewing the saved-sheet INDEX must not download 50 score rows for every record.
 // Full score details are loaded on demand, or for the actual score report.
 if(S.page==='scores'||includeSheetDetails){const pending=S.data.records.filter(x=>!x.rowsLoaded);for(let i=0;i<pending.length;i+=10){const loaded=await api('recordBatch',{ids:pending.slice(i,i+10).map(r=>r.id)});current();loaded.forEach(r=>{r.rowsLoaded=true;const n=S.data.records.findIndex(x=>x.id===r.id);if(n>=0)S.data.records[n]=r;});}}
 }finally{S.busy=oldBusy;}
}

const pageInfo={entry:['Nhập điểm','Ghi điểm và xác nhận phiếu kiểm tra của thầy cô.','edit'],sheets:['Phiếu đã lưu','Theo dõi và tiếp tục các phiếu ghi điểm.','file'],scores:['Xem điểm & báo cáo','Tra cứu kết quả theo khối, môn, lớp và phòng thi.','chart'],mappings:['Quản lý số phách','Kết nối số phách với phòng thi theo từng đợt kiểm tra.','key'],rooms:['Danh sách phòng thi','Quản lý danh sách học sinh và thứ tự bài trong phòng thi.','room'],users:['Tài khoản giáo viên','Nhập tài khoản, phân công môn và quản lý quyền truy cập.','users'],hqgdInbox:['Báo cáo được gửi','Xem PDF HQGD được quản trị gửi đến.','file'],hqgd:['Hiệu quả giảng dạy','Thống kê theo môn, giáo viên, khối, lớp và xuất Excel theo mẫu của trường.','chart'],settings:['Thiết lập & kết nối','Quản lý danh mục, kết nối lưu trữ và nhật ký hoạt động.','settings']};
function navButton(page){return `<button class="${S.page===page?'active':''}" ${S.page===page?'aria-current="page"':''} data-action="nav" data-page="${page}">${icon(pageInfo[page][2])}<span>${pageInfo[page][0]}</span></button>`;}
function contextBar(){return `<div class="context"><div class="field"><label for="yearSelect">NĂM HỌC</label><select id="yearSelect">${options(S.config.years,S.year)}</select></div><div class="field"><label for="periodSelect">ĐỢT KIỂM TRA</label><select id="periodSelect" ${!periodChoices().length?'disabled':''}>${options(periodChoices(),S.period,!periodChoices().length?'Chưa mở đợt kiểm tra':undefined)}</select></div>${isAdmin()?'<button class="icon-btn" data-action="addPeriod" aria-label="Thêm đợt kiểm tra" title="Thêm đợt kiểm tra">'+icon('plus')+'</button>':''}<div class="context-note">${icon('clock')} ${isAdmin()?'Quản trị chọn các đợt giáo viên được thấy':'Chỉ hiển thị đợt kiểm tra được quản trị mở'}</div></div>`;}
function render(){document.body.dataset.page=S.page;const p=pageInfo[S.page];$('#app').innerHTML=`<aside class="sidebar" id="appSidebar"><button class="icon-btn sidebar-close" data-action="closeMenu" aria-label="Đóng menu">${icon('close')}</button>${brand()}<div class="nav-label">KHÔNG GIAN LÀM VIỆC</div><nav class="nav">${navButton('entry')}${navButton('sheets')}${navButton('hqgdInbox')}${isAdmin()?navButton('scores'):''}</nav>${isAdmin()?`<div class="nav-label">QUẢN TRỊ KHẢO THÍ</div><nav class="nav">${['mappings','rooms','users','hqgd','settings'].map(navButton).join('')}</nav>`:''}<div class="side-bottom"><div class="copyright">HTB QUẢN LÝ ĐIỂM KIỂM TRA · Q29</div></div></aside><div class="mobile-backdrop" data-action="closeMenu" aria-hidden="true"></div><main class="main"><header class="topbar"><button class="icon-btn mobile-toggle" data-action="menu" aria-label="Mở menu">${icon('menu')}</button><div class="breadcrumb">Khảo thí ${icon('chevron')} <b>${esc(p[0])}</b><span class="q17-status ${liveWriteEnabled?'connected':'readonly'}" role="status">${liveWriteEnabled?'● Đã kết nối · Lưu thủ công':'● Chỉ đọc · Chưa thể lưu'}</span></div><div class="user-area"><button class="icon-btn" data-action="refresh" title="Tải lại dữ liệu" aria-label="Tải lại dữ liệu">${icon('cloud')}</button>${`<button class="small install-button" data-action="install" title="Cài ứng dụng" aria-label="Cài ứng dụng">${icon('download')} Cài ứng dụng</button>`}<div class="avatar">${esc(initials(S.user.name))}</div><div class="user-text">Xin chào, <b>${esc(S.user.name)}</b><small>${isAdmin()?'Quản trị viên':'Giáo viên'} · ${esc(S.user.phone)}</small></div><button class="icon-btn" data-action="password" title="Đổi mật khẩu" aria-label="Đổi mật khẩu">${icon('key')}</button><button class="small" data-action="logout" title="Đăng xuất" aria-label="Đăng xuất">${icon('logout')} Đăng xuất</button></div></header><div class="page"><div class="workspace-tools"><div class="page-head"><div><h1><span class="page-icon">${icon(p[2])}</span>${esc(p[0])}</h1><p>${esc(p[1])}</p></div><div class="head-actions">${S.page==='entry'&&!!S.period?`<button data-action="new">${icon('plus')} Phiếu mới</button>`:`<span class="tag">${icon('shield')} ${isAdmin()?'Quản trị khảo thí':'Không gian giáo viên'}</span>`}</div></div>${!GAS?`<div class="banner"><span><b>BẢN XEM THỬ</b> · Dữ liệu minh họa trên trình duyệt, chưa lưu Google Drive.</span><a href="HTB_SO_DIEM_GOOGLE_DRIVE.zip" download>Bộ cài cho trường ${icon('download')}</a></div>`:''}<div class="banner connection-state ${liveWriteEnabled?'is-live':'is-readonly'}"><b>${liveWriteEnabled?'ĐÃ KẾT NỐI · CÓ THỂ LƯU':'CHẾ ĐỘ CHỈ ĐỌC'}</b> · ${liveWriteEnabled?'Dữ liệu được lưu theo năm học và đợt kiểm tra.':'Máy chủ chưa mở ghi dữ liệu. Liên hệ quản trị viên.'}</div>${contextBar()}</div><section id="content"></section></div><div id="bottom"></div></main>`;$('#yearSelect').onchange=scopeChange;$('#periodSelect').onchange=scopeChange;renderContent();}
async function scopeChange(){if(S.busy)return;if(S.page==='settings'&&periodMatrixDirty&&!confirm('Ma trận có thay đổi chưa lưu. Chuyển năm học sẽ bỏ thay đổi?')){render();return;}if(S.dirty&&!confirm('Phiếu có thay đổi chưa lưu. Chuyển đợt kiểm tra?')){render();return;}const before={year:S.year,period:S.period,data:S.data,stamp:dataStamp};listGeneration++;S.year=$('#yearSelect').value;S.period=periodChoices(S.year).includes($('#periodSelect').value)?$('#periodSelect').value:periodChoices(S.year)[0]||'';S.record=null;S.dirty=false;invalidatePeriodCache();S.importRows=[];S.filters={grade:'',subject:'',room:'',className:''};try{await loadData();render();}catch(e){S.year=before.year;S.period=before.period;S.data=before.data;dataStamp=before.stamp;render();toast(e.message,true);}}
function blankRecord(){
 const available=S.data.mappings[0];
 const pilot=S.period===PILOT_SCOPE.period && S.year===PILOT_SCOPE.year && pilotWriteEnabled && isAdmin();
 return {year:S.year,period:S.period,grade:pilot?'10':available?.grade||'10',
 subject:pilot?'Toán':available?.subject||S.config.subjects[0]||'',
 phach:pilot?PILOT_SCOPE.phach:'',
 date:pilot?PILOT_SCOPE.date:new Date(Date.now()+7*3600000).toISOString().slice(0,10),
 rows:Array.from({length:50},(_,i)=>({stt:i+1,score:null,note:''})),signature:S.period===PILOT_SCOPE.period?'':S.profileSignature,useProfileSignature:S.period!==PILOT_SCOPE.period&&!!S.profileSignature,profileSignatureVersion:S.signatureVersion,version:0,status:'draft'};
}
window.HTBHQGDContext=()=>isAdmin()?({year:S.year,period:S.period,periods:S.config.periods,userId:S.user.id}):null;
function renderContent(){if(!S.period&&!isAdmin()){clearBottom();$('#content').innerHTML='<div class="card card-body"><h2>Chưa có đợt kiểm tra được mở</h2><p>Quản trị viên chưa chọn đợt kiểm tra cho năm học này. Bạn có thể đăng nhập lại sau khi quản trị lưu ma trận.</p></div>';return;}if(S.page==='entry')entry();else if(S.page==='sheets')sheets();else if(S.page==='scores')scores();else if(S.page==='mappings'||S.page==='rooms')importPage();else if(S.page==='users')users();else if(S.page==='hqgdInbox'){window.HTBHQGDInbox.render(S.year,S.period);}else if(S.page==='hqgd'){if(!isAdmin()){S.page='entry';entry();return;}window.HTBHQGD.render();}else settings();}
let quickEntry=false;
function enteredScore(value,quick=quickEntry){const raw=String(value??'').trim();if(quick&&/^\d{2}$/.test(raw)&&Number(raw)>10)return String(Number(raw)/10);return raw;}
function scoreWords(value){
 let n;try{n=scoreValue(value);}catch{return 'Điểm chưa hợp lệ';}if(n===null)return '';
 const names=['không','một','hai','ba','bốn','năm','sáu','bảy','tám','chín','mười'];
 const parts=String(n).split('.'),text=names[Number(parts[0])]+(parts[1]?' phẩy '+parts[1].split('').map(d=>names[Number(d)]).join(' '):'');
 return text[0].toUpperCase()+text.slice(1);
}
// Q9: "Vắng" is stored in the existing note field; grade stays null.
// A used STT is any row with a score or a note. The denominator is the
// highest STT touched, so skipped rows remain visible as unfinished work.
function isAbsentNote(note){return /^(?:vắng|vang)(?=$|[\s(.,:;!])/iu.test(String(note??'').trim());}
function entryProgressStats(rows){
 const items=Array.isArray(rows)?rows.slice(0,50):[];
 let total=0,scored=0,absent=0;
 items.forEach((r,i)=>{
  const score=String(r?.score??'').trim(),note=String(r?.note??'').trim();
  if(score||note)total=i+1;
  let valid=false;
  try{valid=scoreValue(r?.score)!==null;}catch{}
  if(valid)scored++;
  else if(!score&&isAbsentNote(note))absent++;
 });
 const completed=scored+absent;
 return {total,scored,absent,completed,missing:total-completed,
  percent:total?Math.round(completed/total*100):0,next:total<50?total+1:null};
}
function entryWord(row){
 if(row?.score!==null&&row?.score!==''&&row?.score!==undefined)return scoreWords(row.score);
 return isAbsentNote(row?.note)?'Vắng':'';
}
function entry(){if(!S.record)S.record=blankRecord();if(S.record.status!=='confirmed'&&!S.record.signature&&!S.record.signatureFileId&&S.profileSignature&&S.period!==PILOT_SCOPE.period&&(!S.record.owner||[S.user.id,S.user.phone].includes(S.record.owner))){S.record.signature=S.profileSignature;S.record.useProfileSignature=true;S.record.profileSignatureVersion=S.signatureVersion;}const r=S.record,noSubject=!isAdmin()&&!S.config.subjects.length,locked=noSubject||r.status==='confirmed'||r.owner&&r.owner!==S.user.phone&&r.owner!==S.user.id;$('#content').innerHTML=`<div class="print-only" style="text-align:center">THPT HỒ THỊ BI · NĂM HỌC ${esc(S.year)} · ${esc(S.period)}</div>${S.period===PILOT_SCOPE.period?`<div class="banner" style="margin-bottom:12px;border:1px solid #f6ca75;"><b>PHIẾU THỬ NGHIỆM DUY NHẤT</b> · <a href="./pilot-check.html" target="_blank" rel="noopener">Mở kiểm thử trực tiếp ↗</a> · <button class="small" data-action="createPilotMapping">Tạo số phách giả</button> · ${PILOT_SCOPE.phach} / Toán / khối 10 / 13-10-2026. Có thể nhập đủ 50 điểm giả và ghi chú thử nghiệm; không nhập thông tin học sinh thật. ${pilotWriteEnabled?'Có thể lưu nháp, KHÔNG xác nhận.':'Worker đang khóa ghi thử.'} Nếu phiếu đã tồn tại, nhấn <b>Tải phiếu</b> trước khi lưu.</div>`:''}${noSubject?'<div class="banner" role="alert">Bạn chưa được phân công môn kiểm tra trong danh mục. Vui lòng liên hệ quản trị viên để phân công môn, sau đó đăng xuất và đăng nhập lại.</div>':''}<div class="entry-layout entry-redesign"><div class="card"><div class="paper-head"><div class="paper-title"><div class="paper-intro"><div class="paper-icon"><img src="${SCHOOL_LOGO}" alt="Logo trường"></div><div><div class="eyebrow">TRƯỜNG THPT HỒ THỊ BI</div><h2>PHIẾU GHI ĐIỂM BÀI KIỂM TRA</h2></div></div><span class="tag ${r.status==='confirmed'?'':'gray'}">${r.status==='confirmed'?'Đã xác nhận':'Bản nháp'}</span></div><div class="fields"><div class="field"><label for="grade">Khối</label><select id="grade" ${locked?'disabled':''}>${options(['10','11','12'],r.grade)}</select></div><div class="field"><label for="subject">Môn kiểm tra</label><select id="subject" ${locked?'disabled':''}>${options(S.config.subjects,r.subject,noSubject?'Chưa được phân công môn':undefined)}</select></div><div class="field"><label for="examDate">Ngày kiểm tra</label><input type="date" id="examDate" value="${esc(r.date)}" ${locked?'disabled':''}></div><div class="field"><label for="phach">Số phách <span class="htb-required" aria-hidden="true">*</span></label><input id="phach" type="text" autocomplete="off" spellcheck="false" maxlength="50" required aria-required="true" value="${esc(r.phach)}" placeholder="Nhập thủ công số phách (*)" ${locked?'disabled':''}><small class="htb-phach-help">Nhập đúng số phách của túi bài theo danh sách quản trị (không phải STT bài).</small></div></div><div class="screen-only" style="margin-top:12px;display:flex;justify-content:space-between;align-items:center;gap:12px"><span style="font-size:9px;color:#8794a2">Chỉ số phách được nhập tay. STT bài tự nhảy theo số bài đã ghi nhận, tối đa 50; các dòng chưa nhập được đánh dấu tự động.</span><button class="small" data-action="findSheet">${icon('download')} Tải phiếu</button></div></div><div class="table-toolbar"><b>Danh sách điểm kiểm tra</b><span>Thang điểm 10 · Số lượng: 50 bài</span><label class="quick-toggle"><input id="quickEntry" type="checkbox" role="switch" ${quickEntry?'checked':''} ${locked?'disabled':''}><span class="quick-track" aria-hidden="true"></span><span>Chế độ gõ nhanh (85 → 8,5)</span></label></div><div class="score-wrap"><table class="scores"><thead><tr><th>STT</th><th>STT bài</th><th>Điểm số</th><th>Điểm bằng chữ</th><th>Ghi chú</th></tr></thead><tbody>${r.rows.map((v,i)=>`<tr><td>${String(i+1).padStart(2,'0')}</td><td class="paper-number" data-row="${i}">—</td><td><input class="score" aria-label="Điểm dòng ${i+1}" data-row="${i}" inputmode="decimal" maxlength="5" placeholder="—" value="${v.score===null?'':esc(String(v.score).replace('.',','))}" ${locked?'disabled':''}></td><td class="score-words" data-words="${i}">${esc(entryWord(v))}</td><td><input class="note" aria-label="Ghi chú dòng ${i+1}" data-row="${i}" maxlength="300" placeholder="" value="${esc(v.note)}" ${locked?'disabled':''}></td></tr>`).join('')}</tbody></table></div><div class="score-footer"><span>${icon('info')} Nhấn Enter để chuyển dòng tiếp theo</span><span id="rowCount" aria-live="polite">0/0 bài hoàn tất · tối đa 50</span></div></div><aside class="stack"><div class="card progress-card"><h3>Tiến độ nhập điểm</h3><p class="progress-explain">Bài có điểm + bài vắng / STT bài đã nhập</p><div class="counter" aria-live="polite"><span id="progressCount">0</span> <small>/ <span id="progressTotal">0</span> bài</small></div><div class="progress-track" role="progressbar" aria-label="Bài đã có điểm hoặc vắng" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><div class="progress-fill" id="progressFill"></div></div><div class="progress-meta"><span><span class="dot"></span>Hoàn tất</span><b id="progressPercent">0%</b></div><div class="progress-breakdown"><span>Có điểm: <b id="progressScored">0</b></span><span>Vắng: <b id="progressAbsent">0</b></span><span>Chưa đủ: <b id="progressMissing">0</b></span></div><p class="progress-next" id="progressNext">STT bài tiếp theo: 01</p></div><div class="card signature-card"><h3>Chữ ký giám khảo</h3><p>Ảnh chữ ký lưu theo tài khoản. Tải một lần, tự hiện ở lần đăng nhập sau.</p>${r.signatureWarning||S.signatureWarning?`<p class="error">${esc(r.signatureWarning||S.signatureWarning)}</p>`:''}<button class="sign-upload" data-action="signature" ${locked||S.signatureSaving?'disabled':''}>${r.signature?`<img src="${esc(r.signature)}" alt="Chữ ký giám khảo">`:`${icon('upload')}<span>Tải ảnh chữ ký</span><span style="font-size:8px;color:#9ca7b2">PNG, JPG · tối đa 200 KB</span>`}</button><div class="teacher-name">${esc(r.teacher||S.user.name)}</div><p style="text-align:center;margin:8px 0 0">Họ tên từ tài khoản đăng nhập</p></div><div class="hint"><h3>${icon('info')} Lưu ý khi nhập điểm</h3><p>Chấp nhận dấu chấm và dấu phẩy:<br><b>8.5 = 8,5</b><br>Bật gõ nhanh: 85 → 8,5; 75 → 7,5. Số 10 vẫn là 10. Tắt gõ nhanh để nhập bình thường.<br>Điểm từ 0 đến 10. Có thể để trống các dòng chưa nhập. Nếu học sinh vắng, ghi <b>Vắng</b> tại cột Ghi chú (không nhập điểm), hệ thống sẽ cộng vào tiến độ.<br><br>Mỗi STT phải khớp danh sách phòng thi. Khi xác nhận, mỗi học sinh cần điểm hoặc ghi chú. Ảnh chữ ký là hình minh họa; xác nhận phiếu sử dụng tài khoản đăng nhập.</p></div></aside></div>`;
 $('#bottom').innerHTML=`<footer class="actionbar"><div class="save-state" id="saveState">${icon('cloud')} ${r.updatedAt?'Lần lưu: '+esc(new Date(r.updatedAt).toLocaleString('vi-VN')):'Phiếu chưa được lưu'}<br><span>${liveWriteEnabled?'Lưu nháp để tiếp tục · Xác nhận để khóa phiếu':'Máy chủ đang khóa ghi dữ liệu'}</span></div><div class="actions"><button data-action="print" title="In hoặc lưu PDF">${icon('print')} In phiếu</button>${locked?`${isAdmin()&&r.status==='confirmed'?'<button data-action="reopen" class="primary">Mở lại phiếu</button>':''}`:`<button data-action="save" ${liveWriteEnabled?'':'disabled title="Máy chủ đang chỉ đọc"'}>${icon('save')} Lưu nháp</button><button data-action="confirm" class="primary" ${liveWriteEnabled?'':'disabled'}>${icon('edit')} Lưu & xác nhận</button>`}</div></footer>`;
 ['grade','subject','examDate','phach'].forEach(id=>$('#'+id).onchange=()=>{let didReset=false;const key={examDate:'date'}[id]||id,value=$('#'+id).value;if(id!=='examDate'&&value!==r[key]&&(r.version>0||r.rows.some(x=>x.score!==null&&x.score!==''||x.note))){if(!confirm('Đổi phiếu sẽ bỏ các điểm đang hiển thị. Tiếp tục?')){$('#'+id).value=r[key];return;}didReset=true;r.rows=Array.from({length:50},(_,i)=>({stt:i+1,score:null,note:''}));r.version=0;r.status='draft';r.owner='';r.id='';r.signature=S.period===PILOT_SCOPE.period?'':S.profileSignature;r.useProfileSignature=!!r.signature;r.profileSignatureVersion=S.signatureVersion;if(id==='grade'||id==='subject')r.phach='';}r[key]=id==='phach'?value.trim():value;S.dirty=true;if(id==='phach'&&!didReset){markDirty();return;}entry();markDirty();});
 $$('.score,.note').forEach(el=>{el.oninput=()=>{r.rows[Number(el.dataset.row)][el.classList.contains('score')?'score':'note']=el.classList.contains('score')?enteredScore(el.value):el.value;S.dirty=true;if(el.classList.contains('score'))try{scoreValue(enteredScore(el.value));el.classList.remove('invalid');}catch{el.classList.add('invalid');}markDirty();progress();};el.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();const next=$$(`.${el.classList.contains('score')?'score':'note'}`)[Number(el.dataset.row)+1];next?.focus();next?.select();}};});
 $('#quickEntry').onchange=e=>{quickEntry=e.target.checked;};
 $$('.score').forEach(el=>el.onblur=()=>{const value=r.rows[Number(el.dataset.row)].score;try{scoreValue(value);el.value=value===null?'':String(value).replace('.',',');}catch{}});
 $$('.score').forEach(el=>el.onpaste=e=>{const text=e.clipboardData.getData('text');if(text.includes('\n')||text.includes('\t')){e.preventDefault();const lines=text.trim().split(/\r?\n/),start=Number(el.dataset.row);if(lines.length+start>50){toast('Dữ liệu dán vượt quá 50 dòng.',true);return;}const parsed=lines.map(x=>{const cells=x.split('\t');cells[0]=enteredScore(cells[0]);return cells;});try{parsed.forEach(x=>scoreValue(x[0]));}catch(error){toast(error.message,true);return;}parsed.forEach((x,i)=>{r.rows[start+i].score=x[0];if(x[1])r.rows[start+i].note=x[1].slice(0,300);});S.dirty=true;entry();markDirty();}});progress();compactEntryToolbar();
}
function compactEntryToolbar(){
 const context=document.querySelector('.context');if(!context)return;
 context.querySelectorAll('.q17-entry-field,.q17-new-sheet').forEach(el=>el.remove());
 for(const id of ['grade','subject','examDate']){
   const control=document.getElementById(id),field=control?.closest('.field');
   if(field){field.classList.add('q17-entry-field');const label=field.querySelector('label');if(label&&id==='subject')label.textContent='Môn';if(label&&id==='examDate')label.textContent='Ngày';context.appendChild(field);}
 }
 const fresh=document.createElement('button');fresh.className='primary q17-new-sheet';fresh.dataset.action='new';fresh.innerHTML=icon('plus')+' Phiếu mới';context.appendChild(fresh);
 const counter=document.querySelector('.progress-card .counter');
 if(counter&&!counter.parentElement.classList.contains('q17-gauge')){
   const gauge=document.createElement('div');gauge.className='q17-gauge';
   gauge.setAttribute('role','img');counter.before(gauge);gauge.appendChild(counter);
 }
 const stats=entryProgressStats(S.record.rows),gauge=document.querySelector('.q17-gauge');
 if(gauge){gauge.style.setProperty('--progress',stats.percent+'%');gauge.setAttribute('aria-label',stats.completed+' trên '+stats.total+' bài hoàn tất');}
}
function phachOptions(r){return S.data.mappings.filter(m=>m.grade===r.grade&&m.subject===r.subject).map(m=>`<option value="${esc(m.phach)}"></option>`).join('');}
function progress(){
 const rows=S.record.rows,stats=entryProgressStats(rows);
 $$('[data-words]').forEach(el=>{el.textContent=entryWord(rows[Number(el.dataset.words)]);});
 $$('.paper-number[data-row]').forEach(el=>{
  const i=Number(el.dataset.row),r=rows[i];
  const hasScore=(()=>{try{return scoreValue(r.score)!==null;}catch{return false;}})();
  const isAbsent=!hasScore&&String(r.score??'').trim()===''&&isAbsentNote(r.note);
  const isNext=i===stats.total;
  el.textContent=(i<stats.total||isNext)?String(i+1).padStart(2,'0'):'—';
  el.classList.toggle('entry-next',isNext);
  el.classList.toggle('entry-done',hasScore);
  el.classList.toggle('entry-absent',isAbsent);
  el.classList.toggle('entry-missing',i<stats.total&&!hasScore&&!isAbsent);
 });
 const gauge=document.querySelector('.q17-gauge');if(gauge){gauge.style.setProperty('--progress',stats.percent+'%');gauge.setAttribute('aria-label',stats.completed+' trên '+stats.total+' bài hoàn tất');}
 $('#progressCount').textContent=stats.completed;
 $('#progressTotal').textContent=stats.total;
 $('#progressFill').style.width=stats.percent+'%';
 $('.progress-track').setAttribute('aria-valuenow',String(stats.percent));
 $('#progressPercent').textContent=stats.percent+'%';
 $('#progressScored').textContent=stats.scored;
 $('#progressAbsent').textContent=stats.absent;
 $('#progressMissing').textContent=stats.missing;
 $('#progressNext').textContent=stats.next?'STT bài tiếp theo: '+String(stats.next).padStart(2,'0'):'Đã tới STT bài 50';
 $('#rowCount').textContent=stats.completed+' / '+stats.total+' bài hoàn tất · tối đa 50';
}
function markDirty(){if($('#saveState'))$('#saveState').innerHTML=`${icon('clock')} <b>Có thay đổi chưa lưu</b><br><span>${liveWriteEnabled?'Nhấn Lưu điểm để lưu bản nháp':'Máy chủ đang chỉ đọc'}</span>`;}
async function saveRecord(confirming=false){if(S.busy)return;const r=S.record;try{if(!r.phach.trim())throw Error('Số phách (*) là trường bắt buộc. Vui lòng nhập số phách của túi bài.');if(r.phach.includes('|'))throw Error('Số phách không được chứa ký tự |.');if(!r.date)throw Error('Chọn ngày kiểm tra.');if(S.data.mappings.length&&S.period!==PILOT_SCOPE.period&&!S.data.mappings.some(m=>m.grade===r.grade&&m.subject===r.subject&&m.phach===r.phach.trim()))throw Error('Số phách không khớp danh sách quản trị. Vui lòng kiểm tra khối, môn và số phách hoặc tải lại dữ liệu.');r.rows.forEach((x,i)=>{try{scoreValue(x.score);}catch(e){throw Error('Dòng '+(i+1)+': '+e.message);}});if(confirming){modal(`<h2>Xác nhận phiếu điểm</h2><p>Phiếu <b>${esc(r.phach)}</b> · ${esc(r.subject)} · Khối ${esc(r.grade)} sẽ được khóa sau khi lưu. Quản trị viên có thể mở lại và ghi lý do.</p><div class="note-panel">Xác nhận được lưu cùng tài khoản, thời điểm và phiên bản phiếu. Ảnh chữ ký là tùy chọn, không phải chữ ký số bằng chứng thư.</div><div class="modal-actions"><button data-action="close">Kiểm tra lại</button><button class="primary" data-action="finalConfirm">Xác nhận & khóa phiếu</button></div>`);return;}await persist(false);}catch(e){toast(e.message,true);}}
async function savePilotFromEntry(){
 if(S.busy)return;
 if(!pilotWriteEnabled||!isAdmin()) throw Error('Worker chưa bật Pilot hoặc tài khoản không có quyền admin.');
 const r=S.record;
 if(!isPilotScope(r)) throw Error('Chỉ lưu dữ liệu GIẢ: 2026 - 2027 / PILOT-TEST / khối 10 / Toán / TEST-HTB-001.');
 if(r.date!==PILOT_SCOPE.date)throw Error('Ngày của phiếu thử phải là 13/10/2026.');
 if(r.status==='confirmed')throw Error('Không được sửa phiếu đã khóa.');
 if(r.signature)throw Error('Không sử dụng chữ ký trong Pilot.');
 if(!Array.isArray(r.rows)||r.rows.length!==50)throw Error('Phiếu thử phải có 50 dòng.');
 const rows=r.rows.map((x,i)=>({stt:i+1,score:scoreValue(x.score),note:(x.note||'').trim()}));
 if(!rows.some(x=>x.score!==null))throw Error('Nhập ít nhất một điểm giả.');
 if(rows.some(x=>x.note.length>300))throw Error('Ghi chú tối đa 300 ký tự.');
 const matching=S.data.mappings.filter(m=>m.year===PILOT_SCOPE.year&&m.period===PILOT_SCOPE.period&&m.grade==='10'&&m.subject==='Toán'&&m.phach===PILOT_SCOPE.phach&&m.room==='PHONG-TEST');
 if(matching.length!==1)throw Error('Chưa có số phách giả trên Appwrite. Nhấn Tạo số phách giả trong trang Nhập điểm trước.');
 if(!confirm('Chỉ ghi nháp '+rows.filter(x=>x.score!==null).length+' điểm GIẢ và ghi chú thử nghiệm vào Appwrite, đợt PILOT-TEST. Đồng ý?'))return;
 if(!Number.isSafeInteger(r.version)||r.version<0)throw Error('Phiên bản không hợp lệ. Hãy tải lại phiếu.');
 const requestId=crypto.randomUUID().replace(/-/g,'').slice(0,32);
 S.busy=true;const controls=$$('button,input,select,textarea');const disabled=controls.map(b=>b.disabled);controls.forEach(b=>b.disabled=true);
 try{
   const body=await api('pilot50SaveRecord',{...PILOT_SCOPE,version:r.version,requestId,rows,confirm:false});
   const result=body?.record;
   if(!result?.id||!Number.isInteger(result.version))throw Error('Chưa có xác nhận phiên bản từ Appwrite. Đọc lại phiếu trước khi thử tiếp.');
   Object.assign(r,result);
   S.dirty=false;
   const idx=S.data.records.findIndex(x=>x.id===result.id);
   result.rowsLoaded=true;
   if(idx>=0)S.data.records[idx]=result;else S.data.records.push(result);
   // Keep the short-lived list snapshot; the affected record was updated locally.
   toast('Appwrite đã xác nhận lưu nháp bản giả v'+result.version+'. Hãy nhấn Tải phiếu để đối chiếu.');
 }catch(e){toast(e.message+' Không gửi lại ngay; hãy tải phiếu và kiểm tra phiên bản.',true);}
 finally{S.busy=false;controls.forEach((b,i)=>b.disabled=disabled[i]);if(!S.dirty)entry();}
}
async function persist(confirming){
 if(S.signatureSaving){toast('Đang lưu chữ ký. Vui lòng chờ.',true);return;}
 if(S.busy)return;
 S.busy=true;
 const controls=$$('button,input,select,textarea');const disabled=controls.map(b=>b.disabled);controls.forEach(b=>b.disabled=true);
 try{
  // A successful save returns the canonical record. Do not fetch the entire
  // roster/mappings/records again; that makes every save wait for a second RPC.
  const savingRecord=S.record, savingScope=S.year+'|'+S.period;
  const result=await api('saveRecord',{...S.record,signature:S.record.useProfileSignature?'':S.record.signature,requestId:crypto.randomUUID().replaceAll('-',''),confirm:confirming,year:S.year,period:S.period});
  if(!result||typeof result!=='object'||!result.id||!Number.isFinite(Number(result.version)))
   throw Error('Máy chủ chưa xác nhận phiên bản phiếu. Hãy mở Phiếu đã lưu để kiểm tra.');
  if(S.record!==savingRecord||S.year+'|'+S.period!==savingScope)throw Error('Phiếu đã lưu trên máy chủ, nhưng giao diện đã thay đổi. Mở Phiếu đã lưu để kiểm tra.');
  const usingProfile=S.record.useProfileSignature;Object.assign(S.record,result);S.record.useProfileSignature=usingProfile;
  S.dirty=false;
  // Update only the record that changed, preserving the existing list UI.
  if(Array.isArray(S.data.records)){
   const index=S.data.records.findIndex(x=>x.id===result.id);
   result.rowsLoaded=true;
   if(index>=0)S.data.records[index]=result;
   else S.data.records.push(result);
  }
  // A later explicit refresh will retrieve changes made by other teachers.
  // The canonical save result already updated this list. No forced refetch on menu switch.
  toast(GAS?'Máy chủ đã xác nhận lưu phiếu trên Appwrite.':'Đã lưu phiếu minh họa trong trình duyệt.');
 }catch(e){
  // On a transport timeout, the server may have committed the write.
  // Never automatically retry and never mark the draft as saved.
  toast(e.message,true);
 }finally{
  S.busy=false;
  controls.forEach((b,i)=>b.disabled=disabled[i]);if(!S.dirty)entry();
 }
}
function empty(title,desc){return `<div class="empty">${icon('file')}<h3>${esc(title)}</h3><p>${esc(desc)}</p></div>`;}
function clearBottom(){$('#bottom').innerHTML='';}
function filterBar(includeClass=true){if(['rooms','scores'].includes(S.page))return roomSearchBar();const all=S.data.roster,rooms=[...new Set([...all,...S.data.mappings,...S.data.records].map(x=>x.room).filter(Boolean))].sort(),classes=[...new Set(all.map(x=>x.className))].sort();return `<div class="toolbar"><div class="field"><label>Khối</label><select data-filter="grade">${options(['10','11','12'],S.filters.grade,'Tất cả khối')}</select></div><div class="field"><label>Môn kiểm tra</label><select data-filter="subject">${options(S.config.subjects,S.filters.subject,'Tất cả môn')}</select></div>${includeClass?`<div class="field"><label>Lớp</label><select data-filter="className">${options(classes,S.filters.className,'Tất cả lớp')}</select></div>`:''}<div class="field"><label>Phòng thi</label><select data-filter="room">${options(rooms,S.filters.room,'Tất cả phòng')}</select></div></div>`;}
function bindFilters(fn){if(['rooms','scores'].includes(S.page)){bindRoomSearch();return;}$$('[data-filter]').forEach(el=>el.onchange=()=>{S.filters[el.dataset.filter]=el.value;fn();});}
function matches(r){return Object.entries(S.filters).every(([k,v])=>!v||String(r[k])===String(v));}
function sheets(){clearBottom();const rs=S.data.records.filter(r=>(!S.filters.grade||r.grade===S.filters.grade)&&(!S.filters.subject||r.subject===S.filters.subject)&&(!S.filters.room||r.room===S.filters.room));$('#content').innerHTML=`<div class="stats"><div class="stat"><small>Phiếu đã lưu</small><b>${S.data.records.length}</b><em>Trong đợt kiểm tra</em></div><div class="stat"><small>Đã xác nhận</small><b>${S.data.records.filter(r=>r.status==='confirmed').length}</b><em>Đã khóa chỉnh sửa</em></div><div class="stat"><small>Đang nhập</small><b>${S.data.records.filter(r=>r.status==='draft').length}</b><em>Có thể tiếp tục ghi điểm</em></div><div class="stat"><small>Bài có điểm</small><b>${S.data.records.every(r=>r.rowsLoaded)?S.data.records.reduce((n,r)=>n+r.rows.filter(x=>x.score!==null&&x.score!=='').length,0):'—'}</b><em>${S.data.records.every(r=>r.rowsLoaded)?'Không tính dòng bỏ trống':'Chưa tải chi tiết để tiết kiệm lượt đọc'}</em></div></div>${filterBar(false)}<div class="card"><div class="card-title"><h3>${isAdmin()?'Tất cả phiếu điểm':'Phiếu điểm của tôi'}</h3><span class="muted">${rs.length} phiếu</span>${S.data.records.some(r=>!r.rowsLoaded)?'<button class="small" data-action="loadSheetCounts">Tải số bài đã chấm (sử dụng lượt đọc)</button>':''}</div>${rs.length?`<div class="table-wrap"><table class="data-table"><thead><tr><th>Số phách</th><th>Khối / Môn</th><th>Giám khảo</th><th>Điểm đã nhập</th><th>Trạng thái</th><th>Cập nhật</th><th></th></tr></thead><tbody>${rs.map(r=>`<tr><td class="num">${esc(r.phach)}</td><td>Khối ${esc(r.grade)} · ${esc(r.subject)}</td><td>${esc(r.teacher)}</td><td>${r.rowsLoaded?r.rows.filter(x=>x.score!==null&&x.score!=='').length+' / 50':'Chưa tải'}</td><td><span class="tag ${r.status==='confirmed'?'':'amber'}">${r.status==='confirmed'?'Đã xác nhận':'Bản nháp'}</span></td><td>${new Date(r.updatedAt).toLocaleString('vi-VN')}</td><td><button class="small" data-action="openSheet" data-id="${esc(r.id)}">Mở phiếu ${icon('chevron')}</button></td></tr>`).join('')}</tbody></table></div>`:empty('Chưa có phiếu điểm','Chọn Nhập điểm để tạo và lưu phiếu đầu tiên trong đợt kiểm tra này.')}</div>`;bindFilters(sheets);}

let roomChoiceState={key:'',rooms:[],busy:false,error:'',time:0},roomChoiceSerial=0;
let searchOffset=0,searchNext=null,searchTotal=0;
function choiceKey(){return JSON.stringify([S.token,S.year,S.period,S.filters.grade,S.filters.subject]);}
function roomSearchBar(){const valid=roomChoiceState.key===choiceKey(),rooms=valid?roomChoiceState.rooms:[],loading=valid&&roomChoiceState.busy;return `<div class="toolbar"><div class="field"><label>Khối *</label><select data-query="grade">${options(['10','11','12'],S.filters.grade,'Chọn khối')}</select></div><div class="field"><label>Môn kiểm tra *</label><select data-query="subject">${options(S.config.subjects,S.filters.subject,'Chọn môn')}</select></div><div class="field"><label>Phòng thi</label><select data-query="room" ${loading||!S.filters.grade||!S.filters.subject?'disabled':''}>${options(rooms,S.filters.room,loading?'Đang tải phòng…':'Tất cả phòng')}</select></div><button class="primary" data-action="searchRoom" ${loading?'disabled':''}>${icon('search')} Tìm kiếm</button><button class="small" data-action="refreshRooms" ${loading?'disabled':''}>Cập nhật phòng</button></div>${valid&&roomChoiceState.error?'<div class="error">'+esc(roomChoiceState.error)+'</div>':''}<div class="note-panel">Chọn tất cả phòng hoặc một phòng rồi bấm Tìm kiếm. Mỗi trang tối đa 50 học sinh; thống kê và xuất Excel chỉ tính trang đang xem.</div>${roomSearchReady?`<div class="toolbar"><button data-action="searchPrev" ${searchOffset===0?'disabled':''}>← Trang trước</button><span>Trang ${Math.floor(searchOffset/50)+1} · ${S.data.roster.length} / ${searchTotal} dòng</span><button data-action="searchNext" ${searchNext===null?'disabled':''}>Trang sau →</button></div>`:''}`;}
function bindRoomSearch(){ $$('[data-query]').forEach(el=>{el.onchange=()=>{S.filters[el.dataset.query]=el.value;S.filters.className='';if(el.dataset.query!=='room')S.filters.room='';roomSearchReady=false;searchOffset=0;searchNext=null;S.data={records:[],mappings:[],roster:[]};searchLanding();};});void ensureRoomChoices();}
async function ensureRoomChoices(force=false){
 if(!['rooms','scores'].includes(S.page)||!S.filters.grade||!S.filters.subject)return;
 const key=choiceKey();if(!force&&roomChoiceState.key===key&&(roomChoiceState.busy||Date.now()-roomChoiceState.time<300000))return;
 const serial=++roomChoiceSerial;roomChoiceState={key,rooms:[],busy:true,error:'',time:Date.now()};
 // Update just the controls; keep the current import preview intact.
 const select=$('[data-query="room"]');if(select){select.disabled=true;select.innerHTML='<option value="">Đang tải phòng…</option>';}
 const query={year:S.year,period:S.period,grade:S.filters.grade,subject:S.filters.subject,refresh:force};
 try{const result=await api('roomChoices',query);if(serial!==roomChoiceSerial||key!==choiceKey()||!['rooms','scores'].includes(S.page))return;if(!Array.isArray(result.rooms))throw Error('Phản hồi danh mục phòng không hợp lệ.');roomChoiceState.rooms=result.rooms;if(S.filters.room&&!result.rooms.includes(S.filters.room))S.filters.room='';}
 catch(e){if(serial!==roomChoiceSerial||key!==choiceKey())return;roomChoiceState.error=e.message;toast('Không tải được danh mục phòng: '+e.message,true);}
 finally{if(serial===roomChoiceSerial&&key===choiceKey()){roomChoiceState.busy=false;roomChoiceState.time=Date.now();const el=$('[data-query="room"]');if(el){el.disabled=false;el.innerHTML=options(roomChoiceState.rooms,S.filters.room,'Tất cả phòng');}$$('[data-action="searchRoom"],[data-action="refreshRooms"]').forEach(b=>b.disabled=S.busy);}}
}
function searchLanding(){clearBottom();$('#content').innerHTML=(S.page==='rooms'?importBox('roster'):'')+roomSearchBar()+empty('Chưa tải danh sách','Chọn bộ lọc rồi bấm Tìm kiếm để xem kết quả.');bindRoomSearch();}
async function searchRoom(targetOffset=0){
 if(S.busy||!['rooms','scores'].includes(S.page))return;
 if(roomChoiceState.busy&&roomChoiceState.key===choiceKey())throw Error('Đang tải danh mục phòng, vui lòng chờ.');
 const query={year:S.year,period:S.period,grade:S.filters.grade,subject:S.filters.subject,room:S.filters.room||''};
 if(!query.grade||!query.subject)throw Error('Chọn khối và môn trước khi tìm kiếm.');
 const page=S.page,token=S.token;roomSearchReady=false;S.busy=true;
 const controls=$$('button,input,select,textarea'),disabled=controls.map(x=>x.disabled);controls.forEach(x=>x.disabled=true);
 try{
  const fetchPage=async(entity,extra={})=>{const r=await api('listPage',{entity,...query,offset:0,...extra});if(r.searchVersion!==3||!Array.isArray(r.rows))throw Error('Cần cập nhật Worker Q3 để tìm kiếm và phân trang.');if(r.rows.some(x=>x.year!==query.year||x.period!==query.period||x.grade!==query.grade||x.subject!==query.subject||(query.room&&x.room!==query.room)||(extra.rooms&&!extra.rooms.includes(x.room))))throw Error('Máy chủ trả dữ liệu ngoài phạm vi tìm kiếm.');return r;};
  const result=await fetchPage('roster',{offset:targetOffset,pageSize:50}),roster=result.rows;let records=[],mappings=[];
  if(page==='scores'&&roster.length){const rooms=[...new Set(roster.map(r=>r.room))];const m=await fetchPage('mappings',{rooms}),r=await fetchPage('records',{rooms});if(m.nextOffset!==null||r.nextOffset!==null)throw Error('Phòng có quá nhiều phiếu/phách; cần kiểm tra dữ liệu.');mappings=m.rows;for(let i=0;i<r.rows.length;i+=10){const batch=await api('recordBatch',{ids:r.rows.slice(i,i+10).map(r=>r.id)});records.push(...batch.map(r=>({...r,rowsLoaded:true})));}}
  if(S.page!==page||S.token!==token||S.year!==query.year||S.period!==query.period)return;
  S.filters={grade:query.grade,subject:query.subject,room:query.room,className:''};S.data={roster,records,mappings};dataStamp=null;searchOffset=targetOffset;searchNext=result.nextOffset;searchTotal=result.total??roster.length;roomSearchReady=true;renderContent();
 }catch(e){if(S.page===page){S.data={roster:[],records:[],mappings:[]};searchLanding();}throw e;}finally{S.busy=false;controls.forEach((x,i)=>x.disabled=disabled[i]);}
}

function reportRows(){return S.data.roster.filter(matches).map(s=>{const m=S.data.mappings.find(m=>m.grade===s.grade&&m.subject===s.subject&&m.room===s.room),r=m&&S.data.records.find(r=>r.id===recordKey(m)),g=r?.status==='confirmed'?r.rows?.[s.stt-1]:null;return {...s,phach:m?.phach||'',score:g?.score??null,note:g?.note||'',teacher:r?.teacher||'',status:!m?'Chưa ghép phách':!r?'Chưa nhập':r.status==='confirmed'?'Đã xác nhận':'Bản nháp (chưa tính)'};});}
function scores(){if(!roomSearchReady){searchLanding();return;}clearBottom();const rows=reportRows(),graded=rows.filter(r=>r.score!==null&&r.score!==''),avg=graded.length?(graded.reduce((s,r)=>s+Number(r.score),0)/graded.length).toFixed(2).replace('.',','):'—';$('#content').innerHTML=`<div class="stats"><div class="stat"><small>Lượt dự kiểm tra</small><b>${rows.length}</b><em>Trong trang đang xem</em></div><div class="stat"><small>Đã có điểm</small><b>${graded.length}</b><em>${rows.length?Math.round(graded.length/rows.length*100):0}% danh sách</em></div><div class="stat"><small>Điểm trung bình</small><b>${avg}</b><em>Tính cả điểm 0</em></div><div class="stat"><small>Chưa có điểm</small><b>${rows.length-graded.length}</b><em>Bao gồm bài vắng</em></div></div>${filterBar()}<div class="card"><div class="card-title"><h3>Kết quả kiểm tra <span class="tag gray">${rows.length}</span></h3><button data-action="exportReport" class="primary small">${icon('download')} Xuất Excel trang đang xem</button></div>${rows.length?`<div class="table-wrap"><table class="data-table"><thead><tr><th>STT</th><th>Mã học sinh</th><th>Họ tên học sinh</th><th>Lớp</th><th>Môn</th><th>Phòng</th><th>Số phách</th><th>Điểm</th><th>Ghi chú</th><th>Trạng thái</th></tr></thead><tbody>${rows.map((r,i)=>`<tr><td>${i+1}</td><td>${esc(r.studentId)}</td><td>${esc(r.name)}</td><td>${esc(r.className)}</td><td>${esc(r.subject)}</td><td>${esc(r.room)}</td><td>${esc(r.phach)||'—'}</td><td class="num">${r.score===null?'—':esc(String(r.score).replace('.',','))}</td><td>${esc(r.note)}</td><td><span class="tag ${r.status==='Đã xác nhận'?'':'gray'}">${esc(r.status)}</span></td></tr>`).join('')}</tbody></table></div>`:empty('Chưa có kết quả phù hợp','Nhập danh sách phòng thi, số phách và điểm để tổng hợp báo cáo.')}</div><div class="note-panel">Ghép điểm theo năm học + đợt kiểm tra + khối + môn + số phách → phòng thi + STT. Bản nháp KHÔNG đưa vào điểm trung bình hoặc báo cáo chính thức.</div>`;bindFilters(scores);}
const importDefs={users:{title:'tài khoản giáo viên',headers:['SĐT','Họ tên','Vai trò'],sample:[['0901234567','Nguyễn Văn A','teacher']],file:'MAU_TAI_KHOAN.xlsx'},mappings:{title:'số phách',headers:['Khối','Môn','Phòng','Số phách'],sample:[['10','Toán','01','10101']],file:'MAU_SO_PHACH.xlsx'},roster:{title:'danh sách phòng thi',headers:['Khối','Môn','Phòng','STT','Mã học sinh','Họ tên','Lớp'],sample:[['10','Toán','01',1,'HS001','Nguyễn Văn A','10A01']],file:'MAU_PHONG_THI.xlsx'}};
function importBox(kind){const d=importDefs[kind];return `<div class="dropzone">${icon('upload')}<h3>Nhập ${esc(d.title)} từ Excel</h3><p>Chọn file .xlsx, .xls hoặc .csv · Tối đa ${kind==='users'?'30':'20.000'} dòng / lần · 5 MB</p><button class="primary" data-action="chooseImport" data-kind="${kind}">${icon('plus')} Chọn file Excel</button><button data-action="template" data-kind="${kind}">${icon('download')} Tải file mẫu</button></div><div id="importPreview"></div>`;}
// Q8: Doi chieu so phach da khai bao voi phieu GV da luu. Chi so sanh metadata, khong doc 50 diem/ phieu.
let mappingCompareRows=[];
function mappingComparison(mappings,records){
 const key=x=>[String(x.grade??''),String(x.subject??'')].join('|');
 const sameRoom=(a,b)=>key(a)===key(b)&&String(a.room??'')===String(b.room??'');
 const samePhach=(a,b)=>key(a)===key(b)&&String(a.phach??'')===String(b.phach??'');
 const result=[],seenRecords=new Set();
 for(const m of mappings){
   const byRoom=records.filter(r=>sameRoom(m,r));
   const byPhach=records.filter(r=>samePhach(m,r));
   const chosen=byRoom[0]||byPhach[0];
   if(chosen)seenRecords.add(chosen);
   const duplicates=mappings.filter(x=>x!==m&&(sameRoom(m,x)||samePhach(m,x))).length>0||byRoom.length>1||byPhach.length>1;
   let state='Khớp';
   if(duplicates)state='Trùng dữ liệu';
   else if(!chosen)state='Chưa có phiếu';
   else if(!samePhach(m,chosen)||chosen.room&&String(chosen.room)!==String(m.room))state='Không khớp';
   result.push({grade:m.grade,subject:m.subject,room:m.room,adminPhach:m.phach,teacherPhach:chosen?.phach||'',teacher:chosen?.teacher||'',recordStatus:chosen?.status||'',state});
 }
 for(const r of records){
   if(seenRecords.has(r))continue;
   const admin=mappings.find(m=>sameRoom(m,r)||samePhach(m,r));
   result.push({grade:r.grade,subject:r.subject,room:r.room||'—',adminPhach:admin?.phach||'—',teacherPhach:r.phach||'',teacher:r.teacher||'',recordStatus:r.status||'',state:admin?'Không khớp':'Không có trong DS quản trị'});
 }
 return result;
}
function showMappingComparison(){
 const host=$('#mappingCompare');if(!host)return;
 const match=(r)=>(!S.filters.grade||r.grade===S.filters.grade)&&(!S.filters.subject||r.subject===S.filters.subject)&&(!S.filters.room||r.room===S.filters.room);
 mappingCompareRows=mappingComparison(S.data.mappings.filter(match),S.data.records.filter(match));
 const counters={ok:0,missing:0,wrong:0,duplicate:0};
 for(const r of mappingCompareRows){if(r.state==='Khớp')counters.ok++;else if(r.state==='Chưa có phiếu')counters.missing++;else if(r.state==='Trùng dữ liệu')counters.duplicate++;else counters.wrong++;}
 host.innerHTML=`<div class="card htb-compare"><div class="card-title"><h3>Đối chiếu số phách: Quản trị ↔ Giáo viên</h3><button class="small primary" data-action="exportMappingCompare">${icon('download')} Xuất đối chiếu Excel</button></div><div class="htb-compare-stats"><span>Khớp <b>${counters.ok}</b></span><span>Chưa có phiếu <b>${counters.missing}</b></span><span>Không khớp / Ngoài danh sách <b>${counters.wrong}</b></span><span>Trùng <b>${counters.duplicate}</b></span></div><p class="htb-compare-help">Đối chiếu theo năm học, đợt kiểm tra, khối, môn, phòng và số phách. Chỉ so sánh phiếu GV đã lưu; số phách đang gõ nhưng chưa lưu không thể hiển thị ở đây. Trạng thái bản nháp vẫn được đối chiếu.</p><div class="table-wrap"><table class="data-table"><thead><tr><th>Khối</th><th>Môn</th><th>Phòng</th><th>Số phách quản trị</th><th>Số phách GV nhập</th><th>Giáo viên</th><th>Phiếu</th><th>Kết quả đối chiếu</th></tr></thead><tbody>${mappingCompareRows.slice(0,100).map(r=>`<tr><td>${esc(r.grade)}</td><td>${esc(r.subject)}</td><td>${esc(r.room)}</td><td><b>${esc(r.adminPhach)}</b></td><td><b>${esc(r.teacherPhach||'—')}</b></td><td>${esc(r.teacher||'—')}</td><td>${esc(r.recordStatus==='confirmed'?'Đã xác nhận':r.recordStatus==='draft'?'Bản nháp':'—')}</td><td><span class="htb-check-status ${r.state==='Khớp'?'good':r.state==='Chưa có phiếu'?'pending':'bad'}">${esc(r.state)}</span></td></tr>`).join('')}</tbody></table></div>${mappingCompareRows.length>100?`<p class="htb-compare-help">Chỉ hiển thị 100/${mappingCompareRows.length} dòng đầu; xuất Excel để xem toàn bộ.</p>`:''}</div>`;
}
function importPage(){if(S.page==='rooms'&&!roomSearchReady){searchLanding();return;}clearBottom();const kind=S.page==='mappings'?'mappings':'roster';S.importKind=kind;const data=S.data[kind].filter(r=>(!S.filters.grade||r.grade===S.filters.grade)&&(!S.filters.subject||r.subject===S.filters.subject)&&(!S.filters.room||r.room===S.filters.room));$('#content').innerHTML=importBox(kind)+(kind==='mappings'?`<div class="htb-compare-tools"><div><strong>So dò số phách</strong><p>Đối chiếu danh sách quản trị đã tải lên với số phách trong phiếu giáo viên đã lưu.</p></div><button class="primary" data-action="compareMappings">${icon('check')} So dò ngay</button></div><div id="mappingCompare"></div>`:'')+`${filterBar(false)}<div class="card"><div class="card-title"><h3>${kind==='mappings'?'Danh sách số phách':'Học sinh trong phòng thi'} <span class="tag gray">${data.length}</span></h3><button class="small" data-action="exportList" data-kind="${kind}">${icon('download')} Xuất trang đang xem</button></div>${data.length?`<div class="table-wrap"><table class="data-table"><thead><tr>${(kind==='mappings'?['Khối','Môn kiểm tra','Phòng thi','Số phách']:['Khối','Môn kiểm tra','Phòng','STT bài','Mã học sinh','Họ tên học sinh','Lớp']).map(x=>'<th>'+x+'</th>').join('')}</tr></thead><tbody>${data.map(r=>`<tr>${(kind==='mappings'?[r.grade,r.subject,r.room,r.phach]:[r.grade,r.subject,r.room,r.stt,r.studentId,r.name,r.className]).map(v=>`<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`:empty('Chưa có dữ liệu','Tải file mẫu, điền danh sách và nhập vào đúng năm học, đợt kiểm tra đang chọn.')}</div><div class="note-panel">${kind==='mappings'?'Mỗi số phách là một túi bài, ứng với một phòng trong cùng khối và môn. Không nhập trùng phòng hoặc số phách.':'STT từ 1–50 phải khớp thứ tự bài trên phiếu điểm. Giữ nguyên STT sau khi bắt đầu chấm để ghép điểm đúng học sinh.'} Năm học và đợt kiểm tra lấy từ bộ lọc phía trên. Dữ liệu mới được thêm, không ghi đè dữ liệu cũ.</div>`;bindFilters(importPage);}
async function users(){clearBottom();$('#content').innerHTML='<div class="loading">Đang tải danh sách tài khoản…</div>';try{if(!usersStamp||usersStamp.token!==S.token||Date.now()-usersStamp.time>60*1000){const fetched=await api('users');S.users=fetched;usersStamp={token:S.token,time:Date.now()};}if(S.page!=='users')return;$('#content').innerHTML='<div class="note-panel"><b>Nhập giáo viên từ Excel</b><p>Chọn sheet, kiểm tra email/SĐT và chọn người cần cấp quyền teacher.</p><a class="primary" href="./teacher-import.html">Mở nhập danh sách giáo viên →</a></div>'+`<div class="note-panel">Tài khoản dùng chung giữa các năm học và đợt kiểm tra. SĐT cần định dạng Text để giữ số 0 đầu. Vai trò: <b>teacher</b> hoặc <b>admin</b>. Tài khoản và mật khẩu được quản lý trong Appwrite Auth. Tài khoản mới dùng SĐT / Htb12345@ và phải đổi mật khẩu lần đầu.</div><div class="card"><div class="card-title"><h3>Danh sách tài khoản <span class="tag gray">${S.users.length}</span></h3></div><div class="table-wrap"><table class="data-table"><thead><tr><th>Họ tên</th><th>Số điện thoại</th><th>Vai trò</th><th>Trạng thái</th><th>Mật khẩu</th><th>Thao tác</th></tr></thead><tbody>${S.users.map(u=>`<tr><td>${esc(u.name)}</td><td>${esc(u.phone)}</td><td>${u.role==='admin'?'Quản trị viên':'Giáo viên'}</td><td><span class="tag ${u.active?'':'gray'}">${u.active?'Hoạt động':'Đã khóa'}</span></td><td>${u.mustChange?'Cần đổi lần đầu':'Đã đổi'}<br><small>${esc(u.subject||'Chưa phân công môn')}</small></td><td>${u.phone===S.user.phone?'<span class="muted">Bạn</span>':`<button class="small" data-action="setSubject" data-phone="${esc(u.phone)}">Phân công môn</button> <button class="small" data-action="resetPassword" data-phone="${esc(u.phone)}">Đặt lại</button> <button class="small" data-action="toggleUser" data-phone="${esc(u.phone)}" data-active="${!u.active}">${u.active?'Khóa':'Mở khóa'}</button>`}</td></tr>`).join('')}</tbody></table></div></div>`;}catch(e){toast(e.message,true);}}
function settings(){
 clearBottom();
 $('#content').innerHTML=`<div class="period-settings">
   <div class="ps-hero"><div class="ps-hero-icon">${icon('settings')}</div><div><div class="ps-kicker">TRUNG TÂM QUẢN TRỊ</div><h2>Thiết lập năm học & đợt kiểm tra</h2><p>Chọn các đợt được phép hiển thị cho giáo viên. Thay đổi chỉ có hiệu lực sau khi nhấn Lưu ma trận.</p></div><span class="ps-year-chip">${esc(S.year)}</span></div>
   <div class="ps-summary" id="periodSummary"><div><small>Năm học</small><strong>${esc(S.year)}</strong></div><div><small>Đợt đang mở</small><strong id="periodEnabledCount">—</strong></div><div><small>Tổng đợt</small><strong id="periodTotalCount">—</strong></div><div><small>Trạng thái</small><strong id="periodMatrixState">Đang tải…</strong></div></div>
   <div class="ps-card"><div class="ps-card-header"><div><div class="ps-section-kicker">CẤU HÌNH HIỂN THỊ</div><h3>Ma trận đợt kiểm tra</h3><p>Tích chọn để <b>mở</b>, bỏ tích để <b>ẩn</b> với tài khoản giáo viên. Quản trị vẫn truy cập được mọi đợt.</p></div><button type="button" class="ps-ghost" id="periodReload">${icon('cloud')} Tải lại</button></div>
     <div class="ps-toolbar"><div class="ps-toolbar-label">Các đợt kiểm tra của năm học <b>${esc(S.year)}</b></div><div class="ps-quick-actions"><button type="button" id="periodSelectAll">Chọn tất cả</button><button type="button" id="periodSelectNone">Bỏ chọn tất cả</button></div></div>
     <div class="ps-period-grid" id="periodMatrixGrid"><div class="ps-loading">Đang tải ma trận đã lưu từ Appwrite…</div></div>
     <div class="ps-footer"><p id="periodMatrixMessage" role="status">Ô được tích là đợt sẽ xuất hiện trong danh sách của giáo viên.</p><button type="button" class="ps-save" id="periodSave" disabled>${icon('save')} Lưu ma trận</button></div>
   </div>
   <div class="ps-card ps-tools"><div class="ps-card-header"><div><div class="ps-section-kicker">DANH MỤC & QUẢN LÝ</div><h3>Công cụ quản trị</h3><p>Thêm mục mới và theo dõi thay đổi cấu hình.</p></div></div><div class="ps-tool-buttons"><button data-action="addConfig" data-type="years">${icon('plus')} Thêm năm học</button><button data-action="addConfig" data-type="periods">${icon('plus')} Thêm đợt kiểm tra</button><button data-action="addConfig" data-type="subjects">${icon('plus')} Thêm môn học</button><button data-action="audit">${icon('clock')} Nhật ký hoạt động</button></div></div>
   <div class="ps-notice">${icon('shield')} <span>Ma trận được lưu trên Appwrite; giáo viên chỉ thấy đợt được mở. Đợt đã ẩn không xóa điểm hoặc phiếu đã nhập trước đó.</span></div>
 </div>`;
 attachPeriodMatrix();
}
function periodGridPaint(){
 const grid=$('#periodMatrixGrid');if(!grid||!periodMatrixCache)return;
 const items=periodMatrixCache.items;
 grid.innerHTML=items.map((p,i)=>`<label class="ps-period ${p.enabled?'is-enabled':'is-hidden'}"><input type="checkbox" data-period-index="${i}" ${p.enabled?'checked':''}><span class="ps-checkmark">${icon('check')}</span><span class="ps-period-text"><strong>${esc(p.name)}</strong><small>${p.enabled?'Đang hiển thị cho giáo viên':'Đang ẩn với giáo viên'}</small></span><span class="ps-status">${p.enabled?'Đang mở':'Đã ẩn'}</span></label>`).join('');
 const count=items.filter(x=>x.enabled).length;
 $('#periodEnabledCount').textContent=String(count);$('#periodTotalCount').textContent=String(items.length);
 $('#periodMatrixState').textContent=periodMatrixDirty?'Chưa lưu':'Đã đồng bộ';
 $('#periodSave').disabled=periodMatrixBusy||!periodMatrixDirty;
 $('#periodMatrixMessage').textContent=periodMatrixDirty?`Có thay đổi chưa lưu. Giáo viên hiện vẫn thấy cấu hình trước đó.`:count?`${count} đợt đang được mở cho giáo viên.`:'Tất cả đợt đang ẩn với giáo viên.';
}
async function loadPeriodMatrix(){
 if(periodMatrixDirty&&!confirm('Bạn có lựa chọn chưa lưu. Tải lại sẽ bỏ các lựa chọn này. Tiếp tục?'))return;
 const year=S.year;periodMatrixBusy=true;
 if($('#periodMatrixGrid'))$('#periodMatrixGrid').innerHTML='<div class="ps-loading">Đang đọc cấu hình đã lưu…</div>';
 try{
  const matrix=await api('periodMatrix',{year});if(S.year!==year||S.page!=='settings')return;
  if(!matrix||!Array.isArray(matrix.items))throw Error('Máy chủ không trả về ma trận hợp lệ.');
  periodMatrixCache=matrix;periodMatrixDirty=false;
  periodGridPaint();
 }catch(e){const grid=$('#periodMatrixGrid');if(grid)grid.innerHTML='<div class="ps-error">'+esc(e.message)+'</div>';if($('#periodMatrixMessage'))$('#periodMatrixMessage').textContent='Không tải được ma trận. Kiểm tra Worker Q11.';}
 finally{periodMatrixBusy=false;const b=$('#periodSave');if(b)b.disabled=!periodMatrixDirty;}
}
function attachPeriodMatrix(){
 $('#periodReload').onclick=()=>loadPeriodMatrix();
 $('#periodMatrixGrid').onchange=e=>{const i=Number(e.target.dataset.periodIndex);if(!e.target.matches('[data-period-index]')||!periodMatrixCache?.items?.[i])return;periodMatrixCache.items[i].enabled=e.target.checked;periodMatrixDirty=true;periodGridPaint();};
 const choose=(enabled)=>{if(!periodMatrixCache||periodMatrixBusy)return;for(const p of periodMatrixCache.items)p.enabled=enabled;periodMatrixDirty=true;periodGridPaint();};
 $('#periodSelectAll').onclick=()=>choose(true);$('#periodSelectNone').onclick=()=>choose(false);
 $('#periodSave').onclick=async()=>{
  if(!periodMatrixCache||!periodMatrixDirty||periodMatrixBusy)return;
  if(!periodMatrixCache.items.some(x=>x.enabled)&&!confirm('Bạn đang ẩn tất cả đợt kiểm tra với giáo viên. Bạn vẫn muốn lưu?'))return;
  periodMatrixBusy=true;const button=$('#periodSave');button.disabled=true;button.textContent='Đang lưu…';
  try{
   const result=await api('savePeriodMatrix',{year:S.year,items:periodMatrixCache.items.map(x=>({name:x.name,enabled:x.enabled,version:x.version}))});
   periodMatrixCache=result;periodMatrixDirty=false;
   // Admin selectors retain all periods, but teacher bootstrap now receives the
   // updated visibility per school year. Do not overwrite other config fields.
   S.config.periodsByYear??={};S.config.periodsByYear[S.year]=result.items.filter(x=>x.enabled).map(x=>x.name);
   periodGridPaint();toast('Đã lưu ma trận đợt kiểm tra. Giáo viên sẽ thấy cấu hình mới khi đăng nhập lại.');
  }catch(e){$('#periodMatrixMessage').textContent=e.message;toast(e.message,true);}
  finally{periodMatrixBusy=false;if($('#periodSave')){$('#periodSave').innerHTML=icon('save')+' Lưu ma trận';$('#periodSave').disabled=!periodMatrixDirty;}}
 };
 loadPeriodMatrix();
}


function validateImport(kind,rows){const d=importDefs[kind],errors=[],ids=new Set(),secondary=new Set();if(!rows.length)errors.push('File chưa có dữ liệu.');if(rows.length>(kind==='users'?30:20000))errors.push('File vượt giới hạn số dòng.');rows.forEach((r,i)=>{const err=msg=>errors.push('Dòng '+(i+2)+': '+msg);for(const h of d.headers)if(r[h]===undefined||String(r[h]).trim()==='')err('Thiếu '+h);if(kind==='users'){if(!/^0\d{9}$/.test(String(r['SĐT'])))err('SĐT phải đủ 10 số, bắt đầu bằng 0.');if(!['teacher','admin'].includes(r['Vai trò']))err('Vai trò là teacher hoặc admin.');}else{if(!['10','11','12'].includes(String(r['Khối'])))err('Khối 10, 11 hoặc 12.');if(!S.config.subjects.includes(r['Môn']))err('Môn chưa có trong danh mục.');if(kind==='roster'&&(!Number.isInteger(Number(r.STT))||Number(r.STT)<1||Number(r.STT)>50))err('STT từ 1–50.');}
 const k=kind==='users'?r['SĐT']:kind==='mappings'?[r['Khối'],r['Môn'],r['Số phách']].join('|'):[r['Khối'],r['Môn'],r['Phòng'],r.STT].join('|');if(ids.has(k))err('Trùng khóa trong file.');ids.add(k);if(kind!=='users'){const k2=kind==='mappings'?[r['Khối'],r['Môn'],r['Phòng']].join('|'):[r['Môn'],r['Mã học sinh']].join('|');if(secondary.has(k2))err('Trùng phòng hoặc học sinh trong cùng môn.');secondary.add(k2);}});return {errors};}
function chooseFile(accept,callback){const input=document.createElement('input');input.type='file';input.accept=accept;input.onchange=()=>{if(input.files[0])callback(input.files[0]);};input.click();}
async function importFile(kind,file){try{await loadExcel();if(file.size>5*1024*1024)throw Error('File không được vượt quá 5 MB.');const wb=XLSX.read(await file.arrayBuffer(),{type:'array',cellText:true});const sheet=wb.Sheets[wb.SheetNames[0]],rows=XLSX.utils.sheet_to_json(sheet,{defval:'',raw:false});S.importKind=kind;S.importRows=rows.map(r=>Object.fromEntries(Object.entries(r).map(([k,v])=>[k.trim(),String(v).trim()])));const {errors}=validateImport(kind,S.importRows);const d=importDefs[kind];$('#importPreview').innerHTML=`<div class="card" style="margin-bottom:23px"><div class="card-title"><h3>Xem trước: ${esc(file.name)}</h3><span class="tag ${errors.length?'amber':''}">${rows.length} dòng · ${errors.length} lỗi</span></div><div class="card-body">${errors.length?`<div class="error">${errors.slice(0,10).map(esc).join('<br>')}${errors.length>10?'<br>…':''}</div>`:`<div class="note-panel">Sắp thêm ${rows.length} dòng vào ${esc(S.year)} · ${esc(S.period)}. Kiểm tra đúng đợt trước khi xác nhận.</div>`}<div class="table-wrap"><table class="data-table"><thead><tr>${d.headers.map(h=>'<th>'+esc(h)+'</th>').join('')}</tr></thead><tbody>${S.importRows.slice(0,8).map(r=>'<tr>'+d.headers.map(h=>'<td>'+esc(r[h])+'</td>').join('')+'</tr>').join('')}</tbody></table></div><p class="muted" style="font-size:10px;margin:14px 0">Hiển thị tối đa 8 dòng đầu. Toàn bộ file được kiểm tra trước khi nhập.</p><button class="primary" data-action="commitImport" ${errors.length?'disabled':''}>${icon('check')} Xác nhận nhập ${rows.length} dòng</button> <button data-action="cancelImport">Hủy</button></div></div>`;$('#importPreview').scrollIntoView({behavior:'smooth',block:'start'});}catch(e){toast('Không đọc được file: '+e.message,true);}}
async function xlsxDownload(headers,rows,filename,sheetName='Danh sách'){await loadExcel();const safe=rows.map(row=>row.map(v=>typeof v==='string'&&/^[=+@-]/.test(v)?"'"+v:v));const ws=XLSX.utils.aoa_to_sheet([headers,...safe]);ws['!cols']=headers.map((h,i)=>({wch:Math.min(38,Math.max(h.length+3,...safe.slice(0,100).map(r=>String(r[i]??'').length+2)))}));ws['!autofilter']={ref:XLSX.utils.encode_range({s:{r:0,c:0},e:{r:safe.length,c:headers.length-1}})};const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,sheetName);XLSX.writeFile(wb,filename);}
async function exportReport(){const rows=reportRows().filter(r=>r.status==='Đã xác nhận');if(!rows.length){toast('Không có dữ liệu để xuất.',true);return;}await xlsxDownload(['Năm học','Đợt kiểm tra','Khối','Môn','Lớp','Phòng','STT bài','Mã học sinh','Họ tên','Số phách','Điểm','Ghi chú','Giám khảo','Trạng thái'],rows.map(r=>[S.year,S.period,r.grade,r.subject,r.className,r.room,r.stt,r.studentId,r.name,r.phach,r.score===null?'':Number(r.score),r.note,r.teacher,r.status]),'BAO_CAO_DIEM_'+S.period.replaceAll(' ','_')+'.xlsx','Điểm kiểm tra');}
async function findSheet(){if(S.busy)return;const id=recordKey(S.record);if(S.dirty&&!confirm('Tải phiếu đã lưu và bỏ thay đổi hiện tại?'))return;S.busy=true;try{const r=await api('loadRecord',{id});S.record=r;S.dirty=false;const i=S.data.records.findIndex(x=>x.id===id);if(i>=0)S.data.records[i]=r;else S.data.records.push(r);entry();toast('Đã tải phiếu '+r.phach+' · v'+r.version);}catch(e){if(e.status===404)toast('Chưa có phiếu đã lưu trên máy chủ. Bạn có thể nhập mới.');else throw e;}finally{S.busy=false;}}
function addConfig(type){const title={years:'năm học',periods:'đợt kiểm tra',subjects:'môn kiểm tra'}[type];modal(`<h2>Thêm ${title}</h2><form id="configForm"><div class="field"><label>Tên ${title}</label><input id="configValue" required maxlength="80" placeholder="${type==='years'?'2027 - 2028':type==='periods'?'Kiểm tra bổ sung':'Tên môn kiểm tra'}"></div><div class="modal-actions"><button type="button" data-action="close">Hủy</button><button class="primary">Thêm mới</button></div><div class="error" id="configError"></div></form>`);$('#configForm').onsubmit=async e=>{e.preventDefault();const b=e.target.querySelector('.primary');b.disabled=true;try{const value=$('#configValue').value.trim();if(!value)throw Error('Nhập tên danh mục.');S.config=await api('addConfig',{type,value});invalidatePeriodCache();closeModal();render();toast('Đã thêm '+title+'.');}catch(e){$('#configError').textContent=e.message;}finally{b.disabled=false;}};}
async function loadProfileSignature(){const session=S.token;try{if(!GAS){S.signatureLoaded=true;return;}const result=await api('getProfileSignature');if(S.token!==session||!S.user)return;S.profileSignature=result.signature||'';S.signatureVersion=result.version||'';S.signatureLoaded=true;S.signatureWarning='';}catch(e){if(S.token!==session||!S.user)return;S.signatureWarning='Chưa tải được chữ ký tài khoản: '+e.message;S.signatureLoaded=false;}}
async function uploadSignature(file){if(S.signatureSaving)return;if(S.period===PILOT_SCOPE.period){toast('Không tải chữ ký trong phiếu thử nghiệm.',true);return;}const userId=S.user.id,record=S.record;S.signatureSaving=true;try{if(GAS&&!S.signatureLoaded){await loadProfileSignature();if(!S.signatureLoaded)throw Error(S.signatureWarning);} if(!['image/png','image/jpeg'].includes(file.type)||file.size>200*1024)throw Error('Chữ ký phải là PNG/JPG tối đa 200 KB.');const data=await new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsDataURL(file);});const img=new Image();await new Promise((resolve,reject)=>{img.onload=resolve;img.onerror=()=>reject(Error('Ảnh chữ ký không hợp lệ.'));img.src=data;});if(GAS){const result=await api('saveProfileSignature',{signature:data,expectedVersion:S.signatureVersion});if(S.user?.id!==userId)return;S.profileSignature=result.signature;S.signatureVersion=result.version;S.signatureLoaded=true;S.signatureWarning='';}else{S.profileSignature=data;toast('Bản minh họa: chữ ký chỉ có trong phiên này.',true);}if(S.record===record){S.record.signature=data;S.record.useProfileSignature=GAS;S.record.profileSignatureVersion=S.signatureVersion;S.dirty=true;entry();markDirty();}if(GAS)toast('Đã lưu chữ ký tài khoản. Những lần đăng nhập sau sẽ tự tải ảnh.');}catch(e){S.signatureLoaded=false;toast(e.message,true);}finally{S.signatureSaving=false;if(S.user?.id===userId&&S.record===record&&S.page==='entry')entry();}}
async function action(e){const b=e.target.closest('[data-action]');if(!b||b.disabled||S.busy)return;const a=b.dataset.action;try{
 if(a==='searchRoom'){await searchRoom(0);return;}
 if(a==='searchNext'&&roomSearchReady&&searchNext!==null){await searchRoom(searchNext);return;}
 if(a==='searchPrev'&&roomSearchReady&&searchOffset>0){await searchRoom(Math.max(0,searchOffset-50));return;}
 if(a==='refreshRooms'){await ensureRoomChoices(true);return;}
 if(a==='close')closeModal();
 if(a==='menu'){$('.sidebar').classList.toggle('open');if($('.sidebar').classList.contains('open'))$('.sidebar-close').focus();}
 if(a==='closeMenu'){$('.sidebar').classList.remove('open');$('.mobile-toggle')?.focus();}
 if(a==='refresh'){if(S.page==='settings'){if(periodMatrixDirty&&!confirm('Có thay đổi ma trận chưa lưu. Tải lại?'))return;await loadPeriodMatrix();toast('Đã tải lại ma trận.');return;}if(S.dirty)throw Error('Lưu phiếu hoặc bỏ thay đổi trước khi tải lại dữ liệu.');usersStamp=null;
   if(!isAdmin()){const info=await api('bootstrap');S.config=info.config;syncPeriodSelection();dataStamp=null;await loadData(true);render();toast('Đã cập nhật danh sách đợt kiểm tra và dữ liệu mới nhất.');return;}
   await loadData(true);renderContent();toast('Đã tải dữ liệu mới nhất.');}
 if(a==='loadSheetCounts'){if(S.page!=='sheets')return;await loadData(false,true);renderContent();toast('Đã tải chi tiết điểm theo yêu cầu.');}
 if(a==='install')window.HTBInstall?.();
 if(a==='forgot')modal('<h2>Đặt mật khẩu tài khoản</h2><p>Tài khoản nhập từ Excel chưa có mật khẩu ban đầu. Bạn có thể tự đặt mật khẩu bằng email đã đăng ký.</p><div class="modal-actions"><a class="primary" href="./password-reset.html">Mở đặt / khôi phục mật khẩu</a><button data-action="close">Đóng</button></div>');
 if(a==='demo'){throw Error('Không dùng tài khoản demo trên bản Appwrite.');const u=demoDB.users.find(x=>x.phone===(b.dataset.role==='admin'?'0900000002':'0900000001'));S.user=publicUser(u);S.token='demo-session';await boot();if(!S.data.records.some(r=>r.id===recordKey({...blankRecord(),phach:'10101'}))){S.record=blankRecord();S.record.phach='10101';[8.5,7,9.25,6.5,8,7.75,9,5.5].forEach((v,i)=>S.record.rows[i].score=v);S.dirty=true;entry();markDirty();}}
 if(a==='logout'){if(S.signatureSaving){toast('Đang lưu chữ ký. Vui lòng chờ.',true);return;}if((S.dirty||window.HTBHQGD?.hasUnsaved())&&!confirm('Có điểm hoặc số liệu HQGD chưa lưu/xuất. Bạn vẫn muốn đăng xuất?'))return;S.busy=true;b.disabled=true;try{if(window.HTB_CONFIG?.transport==='cloudflare')await window.HTBAuth.logout();else await window.HTBAuth.logout();closeModal();listGeneration++;S.token='';pilotWriteEnabled=false;S.dirty=false;S.record=null;S.user=null;S.data={records:[],mappings:[],roster:[]};S.users=[];usersStamp=null;S.importRows=[];S.profileSignature='';S.signatureVersion='';S.signatureLoaded=false;window.HTBHQGD?.clear();dataStamp=null;loginScreen();toast('Đã kết thúc phiên. Bạn có thể đăng nhập tài khoản khác.');}catch(e){toast('Không thể kết thúc phiên: '+e.message,true);}finally{S.busy=false;b.disabled=false;}return;}
 if(a==='password'){changePassword(false);return;}
 if(a==='nav'){if(S.page==='settings'&&periodMatrixDirty&&!confirm('Ma trận đợt kiểm tra chưa lưu. Bạn muốn rời khỏi trang?'))return;invalidatePeriodCache();if(S.page==='hqgd'&&window.HTBHQGD?.hasUnsaved()&&!confirm('Có dữ liệu HQGD chưa xuất hoặc lưu bản chụp. Bạn muốn chuyển menu?'))return;if(S.page==='hqgd'&&window.HTBHQGDDispatch?.hasUnsaved()){if(window.HTBHQGDDispatch.isBusy()){toast('Đang lưu phân quyền. Vui lòng chờ.',true);return;}if(!confirm('Ma trận có thay đổi chưa lưu. Bỏ thay đổi và chuyển menu?'))return;window.HTBHQGDDispatch.discard();}if(S.dirty&&!confirm('Phiếu có thay đổi chưa lưu. Chuyển menu?'))return;if(S.dirty)S.record=null;S.dirty=false;const previous=S.page;S.page=b.dataset.page;S.importRows=[];try{await loadData(false);render();}catch(e){S.page=previous;render();toast(e.message,true);}}
 if(a==='new'){if(S.dirty&&!confirm('Tạo phiếu mới và bỏ thay đổi hiện tại?'))return;S.record=null;S.dirty=false;entry();}
 if(a==='createPilotMapping'){if(S.busy)return;if(!pilotWriteEnabled||!isAdmin())throw Error('Cần admin và HTB_WRITE_MODE=pilot50.');S.busy=true;b.disabled=true;try{await api('pilotCreateMapping');await loadData();entry();toast('Số phách giả đã sẵn sàng.');}finally{S.busy=false;b.disabled=false;}return;}
 if(a==='save')await saveRecord(false);
 if(a==='confirm')await saveRecord(true);
 if(a==='finalConfirm'){closeModal();await persist(true);}
 if(a==='signature')chooseFile('image/png,image/jpeg',uploadSignature);
 if(a==='print')printRecord();
 if(a==='findSheet')await findSheet();
 if(a==='openSheet'){S.record=await api('loadRecord',{id:b.dataset.id});const ix=S.data.records.findIndex(r=>r.id===S.record.id);if(ix>=0)S.data.records[ix]={...S.record,rowsLoaded:true};S.page='entry';S.dirty=false;render();}
 if(a==='reopen'){modal(`<h2>Mở lại phiếu điểm</h2><p>Giám khảo sẽ được sửa phiếu. Lý do mở lại được lưu trong nhật ký.</p><form id="reopenForm"><div class="field"><label>Lý do</label><input name="reason" required maxlength="300"></div><div class="modal-actions"><button type="button" data-action="close">Hủy</button><button class="primary">Mở lại phiếu</button></div><div id="reopenError" class="error"></div></form>`);$('#reopenForm').onsubmit=async e=>{e.preventDefault();const btn=e.target.querySelector('.primary');btn.disabled=true;try{await api('reopen',{id:S.record.id,version:S.record.version,reason:e.target.reason.value});S.record=await api('loadRecord',{id:S.record.id});closeModal();await loadData();entry();toast('Đã mở lại phiếu.');}catch(e){if($('#reopenError'))$('#reopenError').textContent=e.message;else toast(e.message,true);}finally{btn.disabled=false;}};}
 if(a==='addPeriod')addConfig('periods');
 if(a==='addConfig')addConfig(b.dataset.type);
 if(a==='template'){const d=importDefs[b.dataset.kind];await xlsxDownload(d.headers,d.sample,d.file,'Mau_nhap');toast('File mẫu có một dòng ví dụ. Thay bằng dữ liệu trường trước khi nhập.');}
 if(a==='chooseImport')chooseFile('.xlsx,.xls,.csv',file=>importFile(b.dataset.kind,file));
 if(a==='cancelImport'){S.importRows=[];$('#importPreview').innerHTML='';}
 if(a==='commitImport'){const controls=$$('button,input,select,textarea'),disabled=controls.map(x=>x.disabled);S.busy=true;controls.forEach(x=>x.disabled=true);try{let count=0;const batchSize=20;const rows=S.importRows.slice();try{for(let i=0;i<rows.length;i+=batchSize){const result=await api('import',{kind:S.importKind,rows:rows.slice(i,i+batchSize),year:S.year,period:S.period});count+=result.count;b.textContent='Đã nhập '+count+'/'+rows.length+' dòng';}}catch(err){S.importRows=rows.slice(count);$('#importPreview').innerHTML='<div class="error">'+esc('Đã xác nhận nhập '+count+' dòng. '+err.message+' Nếu yêu cầu cuối bị gián đoạn, kiểm tra danh sách tài khoản trước khi nhập tiếp; không tải lại toàn bộ file.')+'</div>';throw err;}S.importRows=[];await loadData();renderContent();toast('Đã nhập '+count+' dòng.');}finally{S.busy=false;controls.forEach((x,i)=>x.disabled=disabled[i]);}}
 if(a==='exportReport')await exportReport();
 if(a==='exportList'){const k=b.dataset.kind,d=importDefs[k],rows=S.data[k].filter(r=>(!S.filters.grade||r.grade===S.filters.grade)&&(!S.filters.subject||r.subject===S.filters.subject)&&(!S.filters.room||r.room===S.filters.room));await xlsxDownload(['Năm học','Đợt kiểm tra',...d.headers],rows.map(r=>[S.year,S.period,...(k==='mappings'?[r.grade,r.subject,r.room,r.phach]:[r.grade,r.subject,r.room,r.stt,r.studentId,r.name,r.className])]),'DANH_SACH_'+k+'.xlsx');}
 if(a==='setSubject'){const value=prompt('Môn được phép nhập (nhiều môn ngăn bằng dấu ;):');if(value?.trim()){await api('setSubject',{phone:b.dataset.phone,subject:value.trim()});usersStamp=null;await users();}return;}
 if(a==='resetPassword'){if(!confirm('Đặt lại mật khẩu của '+b.dataset.phone+' về Htb12345@?'))return;await api('resetPassword',{phone:b.dataset.phone});usersStamp=null;await users();toast('Đã đặt lại mật khẩu và yêu cầu đổi lần đầu.');}
 if(a==='toggleUser'){if(!confirm((b.dataset.active==='true'?'Mở khóa':'Khóa')+' tài khoản '+b.dataset.phone+'?'))return;await api('setActive',{phone:b.dataset.phone,active:b.dataset.active==='true'});usersStamp=null;await users();toast('Đã cập nhật tài khoản.');}
 if(a==='audit'){const rows=await api('audit');modal(`<h2>Nhật ký hoạt động</h2><p>Tối đa 200 hoạt động gần nhất, bao gồm tất cả các đợt kiểm tra.</p><div style="max-height:400px;overflow:auto">${rows.length?rows.map(r=>`<div style="padding:14px 0;border-bottom:1px solid var(--line)"><b style="font-size:12px">${esc(r.action)}</b><p style="margin:5px 0;font-size:10px">${esc(r.actor)} · ${new Date(r.time).toLocaleString('vi-VN')}<br>${esc(JSON.stringify(r.detail))}</p></div>`).join(''):empty('Chưa có hoạt động','Các lần lưu phiếu sẽ xuất hiện ở đây.')}</div><div class="modal-actions"><button data-action="close">Đóng</button></div>`);}
 }catch(e){toast(e.message,true);}}
 document.addEventListener('click',action);window.addEventListener('beforeunload',e=>{if(S.dirty||window.HTBHQGD?.hasUnsaved()){e.preventDefault();e.returnValue='';}});if(!GAS)demoInit();loginScreen();

function printRecordHtml(r){
 return [0,1].map(page=>`<section class="print-page"><header class="print-header"><img src="${SCHOOL_LOGO}" alt="Logo trường"><div><b>TRƯỜNG THPT HỒ THỊ BI</b><h2>PHIẾU GHI ĐIỂM BÀI KIỂM TRA</h2><p>Năm học: ${esc(r.year||S.year)} · Đợt: ${esc(r.period||S.period)}</p></div></header><div class="print-meta"><span>Khối: <b>${esc(r.grade)}</b></span><span>Môn KT: <b>${esc(r.subject)}</b></span><span>Ngày KT: <b>${esc(r.date)}</b></span><span>Số phách: <b>${esc(r.phach)}</b></span></div><table class="print-table"><colgroup><col style="width:12mm"><col style="width:28mm"><col style="width:22mm"><col style="width:42mm"><col></colgroup><thead><tr><th>STT</th><th>STT bài</th><th>Điểm số</th><th>Điểm bằng chữ</th><th>Ghi chú</th></tr></thead><tbody>${r.rows.slice(page*25,page*25+25).map((row,i)=>`<tr><td>${page*25+i+1}</td><td>${esc(String(row.stt||page*25+i+1).padStart(2,'0'))}</td><td>${row.score===null||row.score===''?'':esc(String(row.score).replace('.',','))}</td><td class="print-words">${esc(entryWord(row))}</td><td><div class="print-note" style="font-size:${String(row.note||'').length>200?5:String(row.note||'').length>120?6.5:8}pt;line-height:${String(row.note||'').length>200?1.8:String(row.note||'').length>120?2.2:2.5}mm">${esc(row.note)}</div></td></tr>`).join('')}</tbody></table><footer class="print-sign"><div><span>${r.status==='confirmed'?'Đã xác nhận':'Bản nháp'}</span><p>Trang ${page+1}/2 · STT ${page*25+1}–${page*25+25}</p></div><div class="print-examiner"><b>Giám khảo</b><small>(Ký và ghi rõ họ tên)</small>${r.signature?`<img src="${esc(r.signature)}" alt="Chữ ký giám khảo">`:'<div class="signature-space"></div>'}<strong>${esc(r.teacher||S.user.name)}</strong></div></footer></section>`).join('');
}
function printRecord(){
 let root=document.getElementById('printRoot');if(!root){root=document.createElement('div');root.id='printRoot';document.body.appendChild(root);}root.innerHTML=printRecordHtml(S.record);document.body.classList.add('printing-record');
 Promise.all(Array.from(root.querySelectorAll('img')).map(img=>img.decode?img.decode().catch(()=>{}):Promise.resolve())).then(()=>window.print());
}
window.addEventListener('afterprint',()=>document.body.classList.remove('printing-record'));
