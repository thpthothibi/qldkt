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
  let cachedJwt = null, jwtAt = 0, pendingJwt = null;
  const clearJwt = () => {cachedJwt=null; jwtAt=0; pendingJwt=null;};
  async function jwt() {
    if(cachedJwt && Date.now() - jwtAt < 5*60*1000) return cachedJwt;
    if(!pendingJwt) pendingJwt = account.createJWT().then(result => {
      if (!result.jwt) throw Error('Appwrite không tạo được JWT.');
      cachedJwt = result.jwt; jwtAt = Date.now(); return cachedJwt;
    }).finally(()=>{pendingJwt=null;});
    return pendingJwt;
  }
  window.HTBAuth = Object.freeze({
    async login(email,password) {
      if (typeof email !== 'string' || !email.trim() || !password) throw Error('Vui lòng nhập đủ email và mật khẩu.');
      clearJwt();
      try {
        const current = await account.get();
        if (current.email.toLowerCase() !== email.trim().toLowerCase()) throw Error('Đang có phiên của tài khoản khác. Hãy đăng xuất trước.');
        return current;
      } catch (e) {
        if (e?.message?.includes('phiên của tài khoản khác')) throw e;
        if (e?.code !== 401) throw e;
      }
      // Appwrite Web SDK 17.0.0 takes positional arguments.
      await account.createEmailPasswordSession(email.trim(),password);
      return account.get();
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
  const readActions = new Set(['bootstrap','list','loadRecord','users','audit','pilotStatus','pilot50SaveRecord','pilotCreateMapping','teacherImportStatus','importTeacher','passwordReady']);
  window.HTBRemote = async (action,payload={}) => {
    if(!readActions.has(action))throw Error('Staging chỉ đọc; thao tác này chưa được nghiệm thu.');
    if(action==='pilot50SaveRecord' && (config.enablePilotUI!==true || !Array.isArray(payload?.rows) || payload.rows.length!==50)) throw Error('Phiếu thử không hợp lệ.');
    if(action==='pilotCreateMapping' && config.enablePilotUI!==true)throw Error('Chưa bật giao diện Pilot.');
    if(typeof action !== 'string' || !action || !payload || typeof payload !== 'object' || Array.isArray(payload)) throw Error('Yêu cầu không hợp lệ.');
    const token = await jwt();
    const controller = new AbortController();
    const timer = setTimeout(()=>controller.abort(),30000);
    try {
      const res = await fetch(url.href,{method:'POST',mode:'cors',credentials:'omit',cache:'no-store',
        headers:{'Content-Type':'application/json','Authorization':'Bearer '+token},
        body:JSON.stringify({action,payload}),signal:controller.signal});
      const body = await res.json().catch(()=>{throw Error('API Cloudflare không trả về JSON.');});
      if(res.status===401)clearJwt();
      if(!res.ok || body.ok!==true){const e=Error(body.error || `Cloudflare HTTP ${res.status}`);e.status=res.status;throw e;}
      return body.data;
    } catch(e) {
      if(e.name==='AbortError')throw Error('Hết thời gian chờ. Không gửi lại thao tác ghi trước khi kiểm tra trạng thái phiếu.');
      if(e instanceof TypeError)throw Error('Không kết nối Cloudflare. Kiểm tra mạng, CORS và Worker.');
      throw e;
    } finally {clearTimeout(timer);}
  };
  window.HTBInstall = ()=>alert('Đây là bản staging. Chỉ cài ứng dụng PWA sau khi nghiệm thu.');
})();
