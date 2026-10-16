/* Q19 · Giao diện báo cáo HQGD được gửi: không đổi API hoặc phân quyền. */
(function(){'use strict';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
window.HTBHQGDInbox={async render(year,period){
 const host=document.getElementById('content');if(!host)return;
 host.innerHTML=`<section class="card inbox-shell"><div class="inbox-heading"><div><h2>Báo cáo hiệu quả giảng dạy</h2><p>Danh sách PDF đã được quản trị gửi tới tài khoản của thầy cô.</p></div><span class="inbox-count" id="hq-inbox-count">Đang tải</span></div><div id="hq-inbox-contents" role="status" aria-live="polite"><div class="inbox-empty">Đang tải báo cáo…</div></div></section>`;
 try{
  const list=await window.HTBRemote('hqgdInbox',{year,period});
  const area=document.getElementById('hq-inbox-contents');if(!area||!Array.isArray(list))return;
  const count=document.getElementById('hq-inbox-count');if(count)count.textContent=`${list.length} báo cáo`;
  area.innerHTML=list.length?list.map(r=>`<article class="inbox-row"><span class="inbox-filemark" aria-hidden="true">PDF</span><div class="inbox-fileinfo"><strong title="${esc(r.filename)}">${esc(r.filename)}</strong><small>${esc(r.period)} · ${esc(r.departmentId)}</small></div><button type="button" class="small" data-view="${esc(r.reportId)}">Xem PDF ↗</button></article>`).join(''):'<div class="inbox-empty"><strong>Chưa có báo cáo được gửi</strong><p>Khi quản trị gửi báo cáo HQGD, tệp PDF sẽ xuất hiện tại đây.</p></div>';
  area.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>window.HTBHQGDFiles.open(b.dataset.view).catch(e=>alert(e.message)));
 }catch(e){const area=document.getElementById('hq-inbox-contents');if(area)area.innerHTML='<div class="inbox-empty error">Chưa thể tải hộp thư: '+esc(e.message)+'</div>';}
}};
})();
