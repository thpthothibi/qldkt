(function(){
 let installPrompt=null;
 window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;});
 window.addEventListener('appinstalled',()=>{installPrompt=null;});
 window.HTBInstall=async function(){
  if(window.matchMedia('(display-mode: standalone)').matches||navigator.standalone){alert('Ứng dụng đang mở ở chế độ đã cài đặt.');return;}
  if(installPrompt){const event=installPrompt;installPrompt=null;await event.prompt();await event.userChoice;return;}
  const m=document.getElementById('modal');const msg='Android/Chrome: mở menu ⋮ → Cài đặt ứng dụng hoặc Thêm vào màn hình chính. iPhone/Safari: chọn Chia sẻ → Thêm vào Màn hình chính. Nếu trình duyệt chưa hiện tùy chọn cài, hãy mở đường dẫn GitHub Pages bằng trình duyệt chính và tải lại trang.';
  if(m){m.innerHTML='<h2>Cài ứng dụng HTB</h2><p>'+msg+'</p><p>Cổng truy cập PWA cần mạng khi nhập điểm thật. Trang Apps Script mở bên ngoài phạm vi GitHub.</p><div class="modal-actions"><button id="closeInstall">Đã hiểu</button></div>';m.showModal();document.getElementById('closeInstall').onclick=()=>m.close();}else alert(msg);
 };
 if('serviceWorker' in navigator&&window.isSecureContext){window.addEventListener('load',()=>{navigator.serviceWorker.register('./sw.js',{scope:'./'}).catch(()=>{/* Installation stays browser-controlled; no success claim on error. */});});}
})();
