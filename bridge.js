(function () {
  'use strict';
  const config = window.HTB_CONFIG || {};
  if (config.mode !== 'live') return;
  const nonce = crypto.randomUUID();
  const pending = new Map();
  let remote, remoteOrigin, readyResolve, readyReject;
  const ready = new Promise((resolve, reject) => { readyResolve = resolve; readyReject = reject; });
  ready.catch(() => {});
  const readyTimer = setTimeout(() => readyReject(Error('Không kết nối được Apps Script. Kiểm tra bản triển khai mới, quyền truy cập Anyone và đường dẫn /exec trong config.js.')), 45000);
  window.addEventListener('message', event => {
    const m = event.data;
    if (!m || m.channel !== 'htb-v14' || m.nonce !== nonce) return;
    let origin;
    try { origin = new URL(event.origin); } catch { return; }
    if (origin.protocol !== 'https:' || !(origin.hostname === 'script.google.com' || origin.hostname === 'script.googleusercontent.com' || origin.hostname.endsWith('-script.googleusercontent.com'))) return;
    if (m.type === 'ready' && !remote) {
      remote = event.source; remoteOrigin = event.origin; clearTimeout(readyTimer); readyResolve(); return;
    }
    if (event.source !== remote || event.origin !== remoteOrigin || m.type !== 'result') return;
    const request = pending.get(m.id);
    if (!request) return;
    clearTimeout(request.timer); pending.delete(m.id);
    m.result && m.result.ok ? request.resolve(m.result.data) : request.reject(Error(m.result?.error || 'Không nhận được kết quả từ máy chủ.'));
  });
  window.HTBRemote = async (action, payload) => {
    await ready;
    return new Promise((resolve, reject) => {
      const id = crypto.randomUUID();
      const timer = setTimeout(() => { pending.delete(id); reject(Error('Máy chủ chưa phản hồi. Nếu vừa lưu điểm, hãy tải lại phiếu để kiểm tra trước khi lưu lại.')); }, 120000);
      pending.set(id, {resolve, reject, timer});
      remote.postMessage({channel:'htb-v14', nonce, type:'request', id, action, payload}, remoteOrigin);
    });
  };
  try {
    const url = new URL(config.appsScriptUrl);
    if (url.origin !== 'https://script.google.com' || !/^\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url.pathname) || url.search || url.hash || url.username || url.password) throw Error('Đường dẫn Apps Script phải kết thúc bằng /exec.');
    url.searchParams.set('bridge', '1'); url.searchParams.set('nonce', nonce);
    const frame = document.createElement('iframe');
    frame.hidden = true; frame.tabIndex = -1; frame.setAttribute('aria-hidden','true'); frame.title = 'Kết nối dữ liệu trường'; frame.src = url.href;
    document.body.appendChild(frame);
  } catch (e) { clearTimeout(readyTimer); readyReject(e); }
})();
