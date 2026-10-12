(function () {
  'use strict';
  var config = window.HTB_CONFIG || {};
  if (config.mode === 'demo') {
    var script = document.createElement('script');
    script.src = './app.js?v=1.3';
    document.body.appendChild(script);
    return;
  }
  var url;
  try {
    url = new URL(config.appsScriptUrl);
    if (config.mode !== 'live' || url.origin !== 'https://script.google.com' ||
        !/^\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(url.pathname) || url.search || url.hash || url.username || url.password) {
      throw new Error('invalid configuration');
    }
  } catch (e) {
    document.getElementById('app').innerHTML = '<main style="max-width:600px;margin:12vh auto;padding:32px;background:#fff;border:1px solid #dce8f6;border-radius:16px"><h1>Chưa cấu hình ứng dụng</h1><p>Quản trị viên cần điền đường dẫn Google Apps Script kết thúc bằng /exec trong config.js.</p><p>Trang chưa tiếp nhận tài khoản hoặc điểm kiểm tra.</p></main>';
    return;
  }
  // Open the configured school app in this tab; no intermediate landing page.
  window.location.replace(url.href);
})();
