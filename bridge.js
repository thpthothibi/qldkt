/* HTB bridge — Appwrite Gateway v1.5 / legacy Apps Script iframe */
(function () {
  'use strict';
  const config = window.HTB_CONFIG || {};
  if (config.mode !== 'live') return;

  // Keep the existing HTBRemote(action, payload) contract for the UI.
  if (config.transport === 'appwrite') {
    let endpoint;
    try {
      endpoint = new URL(config.appwriteFunctionUrl);
      if (endpoint.protocol !== 'https:' || endpoint.username || endpoint.password || endpoint.search || endpoint.hash) {
        throw Error('URL Appwrite phải là HTTPS và không chứa tham số hoặc thông tin đăng nhập.');
      }
      endpoint = endpoint.href;
    } catch (error) {
      const message = 'Địa chỉ Appwrite Function không hợp lệ. Kiểm tra appwriteFunctionUrl trong config.js.';
      window.HTBRemote = async () => { throw Error(message); };
      console.error(message, error);
      return;
    }

    window.HTBRemote = async (action, payload = {}) => {
      if (typeof action !== 'string' || !action || !payload || typeof payload !== 'object' || Array.isArray(payload)) {
        throw Error('Yêu cầu gửi đến máy chủ không hợp lệ.');
      }
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 35000);
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          mode: 'cors',
          credentials: 'omit',
          cache: 'no-store',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action, payload }),
          signal: controller.signal
        });
        let result;
        try {
          result = await response.json();
        } catch {
          throw Error('Máy chủ trả về dữ liệu không phải JSON. Kiểm tra deployment Appwrite.');
        }
        if (!result || typeof result.ok !== 'boolean') {
          throw Error('Phản hồi từ Gateway không hợp lệ.');
        }
        if (!response.ok || !result.ok) {
          throw Error(typeof result.error === 'string' && result.error ? result.error : 'Máy chủ không xử lý được yêu cầu.');
        }
        return result.data;
      } catch (error) {
        if (error && error.name === 'AbortError') {
          throw Error('Máy chủ quá thời gian phản hồi. Nếu vừa lưu điểm, hãy kiểm tra phiếu trước khi gửi lại.');
        }
        if (error instanceof TypeError) {
          throw Error('Không kết nối được Appwrite Gateway. Kiểm tra mạng, domain Function và CORS.');
        }
        throw error;
      } finally {
        clearTimeout(timeout);
      }
    };
    return;
  }

  // Legacy transport: existing Google Apps Script iframe bridge.
  const nonce = crypto.randomUUID();
  const pending = new Map();
  let remote, remoteOrigin, readyResolve, readyReject;
  const ready = new Promise((resolve, reject) => { readyResolve = resolve; readyReject = reject; });
  ready.catch(() => {});
  const readyTimer = setTimeout(() => readyReject(Error('Không kết nối được Apps Script. Kiểm tra bản triển khai mới, quyền truy cập và URL /exec.')), 45000);
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
      pending.set(id, { resolve, reject, timer });
      remote.postMessage({ channel: 'htb-v14', nonce, type: 'request', id, action, payload }, remoteOrigin);
    });
  };
  try {
    const url = new URL(config.appsScriptUrl);
    if (url.origin !== 'https://script.google.com' || !/^\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url.pathname) || url.search || url.hash || url.username || url.password) throw Error('Đường dẫn Apps Script phải kết thúc bằng /exec.');
    url.searchParams.set('bridge', '1'); url.searchParams.set('nonce', nonce);
    const frame = document.createElement('iframe');
    frame.hidden = true; frame.tabIndex = -1; frame.setAttribute('aria-hidden', 'true'); frame.title = 'Kết nối dữ liệu trường'; frame.src = url.href;
    document.body.appendChild(frame);
  } catch (e) { clearTimeout(readyTimer); readyReject(e); }
})();
