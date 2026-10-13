(() => {
 'use strict';
 const $=id=>document.getElementById(id),history=[];
 let user=null,status=null,busy=false,current=null;
 const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const api=(a,p={})=>window.HTBRemote(a,p);
 function controls(){
  $('loginButton').disabled=busy;
  for(const id of ['logout','refresh'])$(id).disabled=busy;
  $('email').disabled=busy;$('password').disabled=busy;
  $('adminRun').disabled=busy||user?.role!=='admin'||status?.mode!=='pilot50'||user?.mustChange===true;
  $('teacherRun').disabled=busy||user?.role!=='teacher';
  $('offRun').disabled=busy||user?.role!=='admin'||status?.mode!=='off'||user?.mustChange===true;
  $('download').disabled=busy||!history.length;
 }
 function render(report){
  current=report;
  $('runState').textContent=report.status==='running'?'Đang chạy — không sửa phiếu tại cửa sổ khác.':report.status==='passed'?'Phép thử vừa chạy: ĐẠT.':'Phép thử chưa đạt. Dừng ghi và tải phiếu kiểm tra trước khi chạy lại.';
  if(report.status==='running')$('runState').insertAdjacentHTML('afterbegin','<span class="spinner" aria-hidden="true"></span>');
  $('log').innerHTML=report.checks.map(c=>`<div class="step"><div class="tick ${c.status==='failed'?'fail':''}">${c.status==='passed'?'✓':'!'}</div><div><strong>${esc(c.name)}</strong><div class="muted">${c.durationMs} ms</div>${c.message?`<div class="error">${esc(c.message)}</div>`:''}</div></div>`).join('')||'<p class="muted">Đang kiểm tra kết nối và quyền.</p>';
 }
 function summary(){const names=[['admin-pilot50','50 điểm'],['teacher-denied','Giáo viên'],['write-off','Khóa ghi off']];$('summary').innerHTML=names.map(([kind,label])=>{const r=history.filter(x=>x.kind===kind).at(-1);return `<div class="status-card">${label}: <strong>${r?(r.status==='passed'?'ĐẠT':'CHƯA ĐẠT'):'CHƯA THỬ'}</strong></div>`;}).join('');}
 async function refresh(){const b=await api('bootstrap');user=b.user;status=null;if(user?.role==='admin')status=await api('pilotStatus');$('role').textContent=user?.role==='admin'?'Quản trị viên':'Giáo viên';$('mode').textContent=user?.role==='admin'?`Worker: ${status?.mode||'không xác định'}${user.mustChange?' · Cần hoàn tất đổi mật khẩu.':''}`:'Pilot không cấp quyền ghi cho giáo viên.';$('sessionCard').classList.remove('hidden');$('loginCard').classList.add('hidden');controls();}
 async function run(kind){
  if(busy)return;
  if(kind==='admin'&&!confirm('Bộ thử sẽ thay điểm và ghi chú của phiếu GIẢ TEST-HTB-001 bằng dữ liệu mẫu, gồm bốn lần lưu thành công nếu đạt. Bạn đồng ý chạy?'))return;
  busy=true;controls();$('runError').textContent='';
  try{const fn=kind==='admin'?'runAdmin':kind==='teacher'?'checkTeacher':'checkOff';const r=await window.HTBPilotRunner[fn](api,render);history.push(r);summary();}catch(e){$('runError').textContent=e.message;}
  finally{busy=false;controls();}
 }
 $('loginForm').addEventListener('submit',async e=>{e.preventDefault();if(busy)return;busy=true;controls();$('loginError').textContent='';try{await window.HTBAuth.login($('email').value.trim(),$('password').value);$('password').value='';await refresh();}catch(e){$('loginError').textContent=e.message;}finally{busy=false;controls();}});
 $('logout').addEventListener('click',async()=>{if(busy)return;busy=true;controls();$('sessionError').textContent='';try{await window.HTBAuth.logout();user=null;status=null;$('sessionCard').classList.add('hidden');$('loginCard').classList.remove('hidden');$('password').value='';}catch(e){$('sessionError').textContent=e.message;}finally{busy=false;controls();}});
 $('refresh').addEventListener('click',async()=>{if(busy)return;busy=true;controls();$('sessionError').textContent='';try{await refresh();}catch(e){status=null;$('sessionError').textContent=e.message;}finally{busy=false;controls();}});
 $('adminRun').addEventListener('click',()=>run('admin'));$('teacherRun').addEventListener('click',()=>run('teacher'));$('offRun').addEventListener('click',()=>run('off'));
 $('download').addEventListener('click',()=>{if(busy||!history.length)return;const latest=kind=>history.filter(x=>x.kind===kind).at(-1)?.status==='passed';const report={format:'HTB-PILOT-REPORT-1',createdAt:new Date().toISOString(),syntheticOnly:true,threeChecksPassed:['admin-pilot50','teacher-denied','write-off'].every(latest),realWritesApproved:false,runs:history};const url=URL.createObjectURL(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='HTB_Pilot_KetQua_'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);});
 summary();
 if(!window.HTBAuth||!window.HTBRemote||!window.HTBPilotRunner){$('loginError').textContent='Không tải được thư viện hoặc cấu hình. Kiểm tra kết nối, config.js và Appwrite SDK.';$('loginButton').disabled=true;}
})();
