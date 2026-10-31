/* HTB - staging Appwrite Auth + Cloudflare /api. NEVER embed a server API key. */
(() => {
  'use strict';
  const config = window.HTB_CONFIG;
  if (!config || config.transport !== 'cloudflare') throw Error('Sai config.js: yêu cầu transport=cloudflare');
  if (!window.Appwrite?.Client || !window.Appwrite?.Account) throw Error('Không tải được Appwrite SDK.');
  const url = new URL(config.workerApiUrl);
  if(url.protocol !== 'https:' || url.pathname !== '/api' || url.username || url.password || url.search || url.hash) throw Error('workerApiUrl không hợp lệ.');
  const client = new window.Appwrite.Client().setEndpoint(config.appwriteEndpoint).setProject(config.appwriteProjectId);
  const account = new window.Appwrite.Account(client);
  let cachedJwt = null, jwtAt = 0, pendingJwt = null, authGeneration = 0;
  const clearJwt = () => {authGeneration++; cachedJwt=null; jwtAt=0; pendingJwt=null;};
  async function jwt() {
    if(cachedJwt && Date.now() - jwtAt < 5*60*1000) return cachedJwt;
    if(!pendingJwt) { const generation=authGeneration; let jwtTimer; const jwtDeadline=new Promise((_,reject)=>{jwtTimer=setTimeout(()=>reject(Error('Không lấy được phiên đăng nhập trong 12 giây. Vui lòng thử lại.')),12000);});pendingJwt = Promise.race([account.createJWT(),jwtDeadline]).then(result => {
      if(generation!==authGeneration)throw Error("Phiên đăng nhập đã thay đổi. Vui lòng thử lại.");
      if (!result.jwt) throw Error('Appwrite không tạo được JWT.');
      cachedJwt = result.jwt; jwtAt = Date.now(); return cachedJwt;
    }).finally(()=>{clearTimeout(jwtTimer);if(generation===authGeneration)pendingJwt=null;}); }
    return pendingJwt;
  }
  window.HTBAuth = Object.freeze({
    async login(username,password) {
      if(typeof username!=='string'||!username.trim()||!password)throw Error('Nhập SĐT và mật khẩu.');
      clearJwt();let email=username.trim();
      if(!email.includes('@')){
        const phone=email.replace(/[\s().-]/g,'');if(!/^0\d{9}$/.test(phone))throw Error('SĐT phải có 10 số và giữ số 0 đầu.');
        const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),30000);
        try{const res=await fetch(new URL('/phone-login',url.origin).href,{method:'POST',mode:'cors',credentials:'omit',cache:'no-store',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone,password}),signal:controller.signal});
          const body=await res.json();if(!res.ok||body.ok!==true)throw Error(body.error||'Không đăng nhập được.');email=body.data?.email;if(typeof email!=='string'||!email.includes('@'))throw Error('Phản hồi đăng nhập không hợp lệ.');
        }finally{clearTimeout(timer);}
      }
      // Q16: a new session already returns userId; bootstrap supplies the profile.
      // Avoid two sequential account.get requests on the normal login path.
      try {
        const session=await account.createEmailPasswordSession(email,password);
        if(!session.userId)throw Error('Phiên đăng nhập không có mã tài khoản.');
        return {$id:session.userId};
      } catch(e) {
        if(e?.type!=='user_session_already_exists')throw e;
        const current=await account.get();
        if(current.email.toLowerCase()!==email.toLowerCase())throw Error('Đang có phiên của tài khoản khác. Hãy đăng xuất trước.');
        return current;
      }
    },
    async requestPasswordReset(email) {
      if(typeof email!=='string'||!email.trim())throw Error('Nhập email đã đăng ký.');
      return account.createRecovery(email.trim(),new URL('./password-reset.html',window.location.href).href);
    },
    async completePasswordReset(userId,secret,password) {
      if(!userId||!secret||!password)throw Error('Liên kết hoặc mật khẩu không hợp lệ.');
      return account.updateRecovery(userId,secret,password);
    },
    async logout() {
      // Keep the current session if logout fails; never claim a server logout on a network error.
      try {await account.deleteSession('current');}
      catch(e){if(e?.code!==401 && !(e?.code===404 && e?.type==='user_session_not_found'))throw e;}
      clearJwt();
    }
  });
  const readActions = new Set(['getProfileSignature','saveProfileSignature','bootstrap','list','loadRecord','users','audit','pilotStatus','pilot50SaveRecord','pilotCreateMapping','teacherImportStatus','importTeacher','passwordReady','changePassword','roomChoices','listPage','phachAuditPage','phachAuditCheck','phachVerifyBatch','reportPage','recordBatch','saveRecord','reopen','import','correctMapping','addConfig','periodMatrix','savePeriodMatrix','resetPassword','setActive','setSubject','hqgdSaveMatrix','hqgdSetDepartment','hqgdSetRole','hqgdDirectory','hqgdDispatch','hqgdInbox','hqgdRevoke','hqgdTemplateList','hqgdClassAverages','hqgdAssignments','hqgdSaveAssignments','hqgdTeacherDirectory','hqgdReportSave','hqgdReportList','hqgdReportGet']);
  window.HTBRemote = async (action,payload={},options={}) => {
    if(!readActions.has(action))throw Error('Thao tác API không được hỗ trợ. Hãy tải lại trang hoặc kiểm tra phiên bản web.');
    if(action==='pilot50SaveRecord' && (config.enablePilotUI!==true || !Array.isArray(payload?.rows) || payload.rows.length!==50)) throw Error('Phiếu thử không hợp lệ.');
    if(action==='pilotCreateMapping' && config.enablePilotUI!==true)throw Error('Chưa bật giao diện Pilot.');
    if(typeof action !== 'string' || !action || !payload || typeof payload !== 'object' || Array.isArray(payload)) throw Error('Yêu cầu không hợp lệ.');
    const controller = new AbortController(),externalAbort=()=>controller.abort();
    if(options.signal?.aborted)controller.abort();else options.signal?.addEventListener('abort',externalAbort,{once:true});
    const timer = setTimeout(()=>controller.abort(),action==='reportPage'?20000:action==='hqgdSaveMatrix'?120000:30000);
    const abortable=promise=>new Promise((resolve,reject)=>{const abort=()=>reject(Object.assign(Error('Aborted'),{name:'AbortError'}));if(controller.signal.aborted){abort();return;}controller.signal.addEventListener('abort',abort,{once:true});Promise.resolve(promise).then(resolve,reject).finally(()=>controller.signal.removeEventListener('abort',abort));});
    try {
      const token=await abortable(jwt());
      const res = await fetch(url.href,{method:'POST',mode:'cors',credentials:'omit',cache:'no-store',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
        body:JSON.stringify({action,payload}),signal:controller.signal});
      const body = await res.json().catch(()=>{throw Error('API Cloudflare không trả về JSON.');});
      if(res.status===401)clearJwt();
      if(!res.ok || body.ok!==true){const e=Error(body.error || `Cloudflare HTTP ${res.status}`);e.status=res.status;throw e;}
      return body.data;
    } catch(e) {
      if(e.name==='AbortError'){if(action==='reportPage'||options.signal?.aborted)throw Error(options.signal?.aborted?'Đã hủy tìm kiếm.':'Tải điểm quá 20 giây. Bấm Tìm kiếm để thử lại hoặc chọn một phòng.');throw Error('Hết thời gian chờ. Không gửi lại thao tác ghi trước khi kiểm tra trạng thái phiếu.');}
      if(e instanceof TypeError)throw Error('Không kết nối Cloudflare. Kiểm tra mạng, CORS và Worker.');
      throw e;
    } finally {clearTimeout(timer);options.signal?.removeEventListener('abort',externalAbort);}
  };
  window.HTBHQGDTemplates=Object.freeze({
    async upload(file,{year,semester,expectedVersion}){
      if(!/\.xlsx$/i.test(file?.name||'')||file.size<100||file.size>20*1024*1024)throw Error('Chỉ nhận file .xlsx, tối đa 20 MB.');
      const token=await jwt(),form=new FormData();form.append('file',file);
      form.append('year',year);form.append('semester',semester);form.append('expectedVersion',expectedVersion||'');
      const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),90000);
      try{
        const res=await fetch(new URL('/hqgd/template/upload',url.origin),{method:'POST',headers:{Authorization:'Bearer '+token},body:form,cache:'no-store',signal:controller.signal});
        const body=await res.json().catch(()=>({}));if(!res.ok||!body.ok)throw Error(body.error||'Không lưu được mẫu HQGD.');return body.data;
      }finally{clearTimeout(timer);}
    },
    async load(templateId){
      if(!/^[A-Za-z0-9._-]{1,36}$/.test(templateId))throw Error('Mã mẫu không hợp lệ.');
      const token=await jwt();const res=await fetch(new URL('/hqgd/template/'+templateId,url.origin),{headers:{Authorization:'Bearer '+token},cache:'no-store'});
      if(!res.ok){const body=await res.json().catch(()=>({}));throw Error(body.error||'Không tải được mẫu.');}
      return res.arrayBuffer();
    }
  });
  window.HTBHQGDFiles=Object.freeze({
    async upload(file,meta){
      const token=await jwt();const form=new FormData();form.append('file',file);
      for(const [k,v] of Object.entries(meta))form.append(k,String(v??''));
      const result=await fetch(new URL('/hqgd/upload',url.origin),{method:'POST',headers:{Authorization:'Bearer '+token},body:form,cache:'no-store'});
      const body=await result.json().catch(()=>({}));if(!result.ok||!body.ok)throw Error(body.error||'Không tải được PDF lên kho lưu trữ.');return body.data;
    },
    async open(reportId){
      if(!/^[A-Za-z0-9._-]{1,36}$/.test(reportId))throw Error('Mã báo cáo sai.');
      const token=await jwt();const res=await fetch(new URL('/hqgd/pdf/'+reportId,url.origin),{headers:{Authorization:'Bearer '+token},cache:'no-store'});
      if(!res.ok){const body=await res.json().catch(()=>({}));throw Error(body.error||'Không mở được PDF.');}
      const pdf=await res.blob();if(pdf.type!=='application/pdf')throw Error('Định dạng phản hồi không đúng.');
      const objectUrl=URL.createObjectURL(pdf);const win=window.open(objectUrl,'_blank','noopener');if(!win){const link=document.createElement('a');link.href=objectUrl;link.download='bao-cao-hqgd.pdf';link.click();}
      setTimeout(()=>URL.revokeObjectURL(objectUrl),60000);
    }
  });
  let installPrompt=null;window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();installPrompt=e;});window.HTBInstall=async()=>{if(installPrompt){await installPrompt.prompt();installPrompt=null;}else alert('Mở menu trình duyệt và chọn Cài ứng dụng / Thêm vào màn hình chính.');};if('serviceWorker' in navigator)navigator.serviceWorker.register('./service-worker.js').catch(()=>{});
})();
