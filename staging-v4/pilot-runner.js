/* Pure acceptance runner. Only the fixed synthetic record may be written. No background runs or retries. */
(() => {
 'use strict';
 const SCOPE=Object.freeze({year:'2026 - 2027',period:'PILOT-TEST',grade:'10',subject:'Toán',phach:'TEST-HTB-001',date:'2026-10-13'});
 const ID=[SCOPE.year,SCOPE.period,SCOPE.grade,SCOPE.subject,SCOPE.phach].join('|');
 const sampleRows=(label='MẪU GIẢ')=>Array.from({length:50},(_,i)=>({stt:i+1,score:i===0?0:i===1?8.75:i===49?10:(i%11),note:`${label} · dòng ${i+1}`}));
 function assert(ok,message){if(!ok)throw Error(message);}
 function payload(version,rows,extras={}){return {...SCOPE,version,rows:rows.map(x=>({...x})),requestId:crypto.randomUUID().replaceAll('-',''),confirm:false,...extras};}
 function matches(r,rows,version){
  assert(r && r.id===ID,'Máy chủ trả sai mã phiếu.');
  for(const k of ['year','period','grade','subject','phach','date'])assert(r[k]===SCOPE[k],`Máy chủ trả sai ${k}.`);
  assert(r.status==='draft','Phiếu thử phải ở trạng thái nháp.');
  assert(r.version===version,'Phiên bản tăng không đúng.');
  assert(Array.isArray(r.rows)&&r.rows.length===50,'Không đọc lại được đủ 50 dòng.');
  for(let i=0;i<50;i++){assert(r.rows[i].stt===i+1,`Sai STT dòng ${i+1}.`);assert(r.rows[i].score===rows[i].score&&r.rows[i].note===rows[i].note,`Điểm/ghi chú dòng ${i+1} không khớp.`);}
 }
 async function denied(api,p,status){try{await api('pilot50SaveRecord',p);}catch(e){if(e.status===status)return;throw e;}throw Error(`Thao tác phải bị từ chối HTTP ${status} nhưng máy chủ đã chấp nhận.`);}
 function begin(kind,onUpdate){
  const report={format:'HTB-PILOT-ACCEPTANCE-1',kind,scope:{...SCOPE},startedAt:new Date().toISOString(),status:'running',checks:[],limitations:['Chỉ kiểm tra phiếu giả; không nghiệm thu ghi điểm thật, tải 100 người hoặc quyền bảng Appwrite trực tiếp.']};
  const emit=()=>onUpdate?.(structuredClone(report));
  const step=async(name,fn)=>{const start=Date.now();try{const detail=await fn();report.checks.push({name,status:'passed',durationMs:Date.now()-start});emit();return detail;}catch(e){report.checks.push({name,status:'failed',durationMs:Date.now()-start,message:String(e.message||'Lỗi không xác định')});emit();throw e;}};
  const finish=(ok)=>{report.status=ok?'passed':'failed';report.finishedAt=new Date().toISOString();emit();return report;};emit();return {report,step,finish};
 }
 async function runAdmin(api,onUpdate){
  const {report,step,finish}=begin('admin-pilot50',onUpdate);let current,originalVersion;
  const read=()=>api('loadRecord',{id:ID});
  const verifyUnchanged=async(before)=>{const after=await read();matches(after,before.rows,before.version);};
  try{
   const user=await step('Tài khoản admin và chế độ pilot50',async()=>{const b=await api('bootstrap');assert(b.user?.role==='admin','Chỉ admin chạy bộ thử này.');assert(b.user.mustChange!==true,'Tài khoản cần hoàn tất đổi mật khẩu trước khi ghi thử.');const s=await api('pilotStatus');assert(s.mode==='pilot50'&&s.pilot50Enabled===true,'Worker chưa bật HTB_WRITE_MODE=pilot50 hoặc vẫn là bản cũ.');assert(s.scope?.phach===SCOPE.phach&&s.scope?.room==='PHONG-TEST','Worker trả sai phạm vi dữ liệu giả.');return b.user;});
   // Do not include personal identity in exported reports.
   delete report.checks[0].detail;
   await step('Kiểm tra phiên bản và chủ sở hữu',async()=>{try{current=await read();}catch(e){if(e.status!==404)throw e;current=null;}if(current){assert(current.owner===user.id,'Phiếu giả thuộc tài khoản khác. Hãy đăng nhập chủ phiếu.');assert(current.status==='draft','Phiếu giả đang khóa; dừng thử.');assert(Number.isSafeInteger(current.version)&&current.version>=0,'Phiên bản phiếu không hợp lệ.');}originalVersion=current?.version||0;report.startVersion=originalVersion;});
   await step('Tạo/kiểm tra số phách giả',async()=>{const m=await api('pilotCreateMapping');assert(m.phach===SCOPE.phach&&m.room==='PHONG-TEST','Mapping giả không khớp.');});
   const rows=sampleRows(),p=payload(originalVersion,rows);
   await step('Lưu đủ 50 điểm và 50 ghi chú',async()=>{const out=await api('pilot50SaveRecord',p);matches(out.record,rows,originalVersion+1);current=out.record;});
   await step('Đọc lại và đối chiếu toàn bộ 50 dòng',async()=>{current=await read();matches(current,rows,originalVersion+1);});
   await step('Gửi lại cùng requestId không tăng phiên bản',async()=>{const out=await api('pilot50SaveRecord',p);matches(out.record,rows,current.version);await verifyUnchanged(current);});
   await step('Từ chối phiên bản cũ — HTTP 409',async()=>{await denied(api,payload(originalVersion,rows),409);await verifyUnchanged(current);});
   await step('Từ chối xác nhận phiếu — HTTP 403',async()=>{await denied(api,payload(current.version,rows,{confirm:true}),403);await verifyUnchanged(current);});
   await step('Từ chối số phách giả ngoài phạm vi — HTTP 403',async()=>{await denied(api,payload(current.version,rows,{phach:'TEST-HTB-INVALID'}),403);await verifyUnchanged(current);});
   await step('Hai lần lưu đồng thời: một thành công, một HTTP 409',async()=>{
    const pair=[payload(current.version,sampleRows('GIẢ A')),payload(current.version,sampleRows('GIẢ B'))];
    const outcomes=await Promise.allSettled(pair.map(x=>api('pilot50SaveRecord',x)));
    const win=outcomes.findIndex(x=>x.status==='fulfilled');
    assert(outcomes.filter(x=>x.status==='fulfilled').length===1&&outcomes.filter(x=>x.status==='rejected'&&x.reason.status===409).length===1,'Kết quả đồng thời chưa đạt; dừng thử và tải phiếu kiểm tra.');
    matches(outcomes[win].value.record,pair[win].rows,current.version+1);current=await read();matches(current,pair[win].rows,pair[win].version+1);
   });
   await step('Xóa điểm/ghi chú dòng 50 không giữ giá trị cũ',async()=>{const cleared=current.rows.map(x=>({...x}));cleared[49]={stt:50,score:null,note:''};const v=current.version+1;const out=await api('pilot50SaveRecord',payload(current.version,cleared));matches(out.record,cleared,v);current=await read();matches(current,cleared,v);});
   await step('Kết thúc với đủ 50 điểm giả đã đối chiếu',async()=>{const v=current.version+1;const out=await api('pilot50SaveRecord',payload(current.version,rows));matches(out.record,rows,v);current=await read();matches(current,rows,v);report.endVersion=current.version;assert(current.version===originalVersion+4,'Số phiên bản tăng ngoài dự kiến. Có thể phiếu đang được sửa ở cửa sổ khác.');});
   report.nextSteps=['Đăng nhập giáo viên để thử từ chối quyền.','Đặt HTB_WRITE_MODE=off, áp dụng cấu hình rồi chạy kiểm tra khóa ghi.'];
   return finish(true);
  }catch{report.nextSteps=['Dừng thao tác ghi; tải phiếu kiểm tra phiên bản và dữ liệu trước khi chạy lại.'];return finish(false);}
 }
 async function checkOff(api,onUpdate){const {step,finish}=begin('write-off',onUpdate);try{
  await step('Admin và Worker ở chế độ off',async()=>{const b=await api('bootstrap');assert(b.user?.role==='admin','Cần admin để kiểm tra khóa ghi.');assert(b.user.mustChange!==true,'Cần hoàn tất đổi mật khẩu trước khi kiểm tra khóa ghi.');const s=await api('pilotStatus');assert(s.mode==='off'&&s.enabled===false,'Hãy đặt HTB_WRITE_MODE=off và áp dụng cấu hình trước.');});
  await step('Worker từ chối ghi phiếu giả khi off — HTTP 403',async()=>{await denied(api,payload(0,sampleRows()),403);});return finish(true);
 }catch{return finish(false);}}
 async function checkTeacher(api,onUpdate){const {step,finish}=begin('teacher-denied',onUpdate);try{
  await step('Tài khoản giáo viên',async()=>{const b=await api('bootstrap');assert(b.user?.role==='teacher','Đăng xuất admin và đăng nhập giáo viên để chạy kiểm tra này.');});
  await step('Giáo viên bị từ chối API lưu Pilot — HTTP 403',async()=>{await denied(api,payload(0,sampleRows()),403);});
  await step('Giáo viên bị từ chối đọc phiếu Pilot — HTTP 403',async()=>{try{await api('loadRecord',{id:ID});}catch(e){if(e.status===403)return;throw e;}throw Error('Giáo viên đọc được phiếu Pilot.');});return finish(true);
 }catch{return finish(false);}}
 window.HTBPilotRunner=Object.freeze({scope:SCOPE,runAdmin,checkOff,checkTeacher});
})();
