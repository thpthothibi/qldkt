/* HQGD V7: evaluate original workbook formulas locally; admin-only integration. */
(function(){'use strict';
const h=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const el=id=>document.getElementById(id);let books=[],bookIndex=0,sheetName='',errors=[],busy=false,mode='automatic',reportDirty=false;
function markReportDirty(){snapshotRequestId='';reportDirty=true;if(book()){book().dirtyByMode=book().dirtyByMode||{};book().dirtyByMode[mode]=true;}}
function markReportSaved(){if(book()?.dirtyByMode)book().dirtyByMode[mode]=false;reportDirty=books.some(b=>Boolean(b.dirtyByMode?.[mode]));}
const activeSource=()=>book()?.sources?.[mode]||null;
const E=()=>window.HTBHQGDEngine,book=()=>books[bookIndex],sheet=()=>book()?.wb.Sheets[sheetName];
const normalize=s=>String(s??'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').toLowerCase().replace(/[^a-z0-9]/g,'');
const classKey=s=>normalize(s).replace(/^(10|11|12)a0+(\d+)$/,'$1a$2');
const aliases={ly:'vatly',li:'vatly',vatli:'vatly',diali:'dialy',van:'nguvan',hoa:'hoahoc',su:'lichsu',dia:'dialy',sinh:'sinhhoc',ktpl:'giaoduckinhtevaphapluat',gdktpl:'giaoduckinhtevaphapluat',gdkinhtevaphapluat:'giaoduckinhtevaphapluat',gdquocphongvaanninh:'giaoducquocphong',giaoducquocphongvaanninh:'giaoducquocphong',tinhoc:'tinhoc',tin:'tinhoc',anh:'tienganh',gdqp:'giaoducquocphong',theduc:'giaoducthechat'};
const subjectKey=s=>aliases[normalize(s)]||normalize(s);
function display(c){if(!c)return '—';if(c.t==='e')return 'Lỗi công thức';if(typeof c.v==='number')return Number.isInteger(c.v)?String(c.v):c.v.toFixed(2);return String(c.v??'');}
function recalc(){errors=[];for(const sn of book().wb.SheetNames){if(sn==='DSHS')continue;errors.push(...E().engine(book().wb.Sheets[sn]).recalculate().map(e=>({...e,sheet:sn})));}el('hq-export').disabled=errors.length>0;renderWorkflowStats();}
function picker(){if(book()?.modeCopies){book().wb=book().modeCopies[mode];book().liveFromSystem=mode==='automatic'&&Boolean(book().sources?.automatic);}el('hq-book').innerHTML=books.map((b,i)=>`<option value="${i}">${h(b.name)}</option>`).join('');el('hq-book').value=bookIndex;const names=book().wb.SheetNames.filter(n=>E().describe(book().wb.Sheets[n]).classes.length);if(!names.includes(sheetName))sheetName=names[0]||'';el('hq-subject').innerHTML=names.map(n=>`<option>${h(n)}</option>`).join('');el('hq-subject').value=sheetName;el('hq-system').disabled=!sheetName;}
function paint(){if(!sheet())return;const s=sheet(),d=E().describe(s),grade=el('hq-grade').value,query=normalize(el('hq-teacher-search').value);const rows=d.classes.filter(x=>(!grade||x.grade===grade)&&(!query||normalize(x.teacher).includes(query)));let out=`<h3>${h(s.A2?.v||sheetName)}</h3><p>Bình quân khối, độ lệch, xếp hạng và hiệu quả được tính lại theo công thức trong file. Bộ lọc chỉ đổi phần hiển thị.</p><div class="hq-scroll"><table class="hq-table"><thead><tr>${['Lớp','Giáo viên','Sĩ số','BQ giữa kỳ','ĐL GK','XH GK','BQ học kỳ','ĐL HK','XH HK','Hiệu quả','Hạng'].map(x=>`<th>${x}</th>`).join('')}</tr></thead><tbody>`;
 for(const r of rows){out+='<tr>';for(let c=1;c<=11;c++){const ref=E().address(r.row,c),v=s[ref];out+=`<td>${mode==='manual'&&[4,7].includes(c)&&!v?.f?`<input class="hq-score-edit" data-cell="${ref}" aria-label="${h(r.lop)} ${c===4?'giữa kỳ':'học kỳ'}" inputmode="decimal" value="${h(v?.v??'')}" style="width:100px">`:h(display(v))}</td>`;}out+='</tr>';}
 out+='</tbody></table></div><h3>Bình quân khối theo mẫu</h3><div class="hq-scroll"><table class="hq-table"><tr><th>Khối</th><th>Giữa kỳ</th><th>Học kỳ</th></tr>';
 for(const [ref,c]of Object.entries(s)){if(/^A\d+$/.test(ref)&&/^K(10|11|12)$/i.test(String(c.v))){const r=+ref.slice(1);out+=`<tr><td>${h(c.v)}</td><td>${h(display(s['D'+r]))}</td><td>${h(display(s['G'+r]))}</td></tr>`;}}
 out+='</table></div><h3>Kết quả giáo viên trong mẫu gốc (tham khảo)</h3><p>Bảng này giữ nguyên phân công cũ có trong Excel. Bảng tổng hợp theo giáo viên thực tế được trình bày riêng phía dưới, lấy phân công từ Appwrite.</p><div class="hq-scroll"><table class="hq-table"><thead><tr><th>Giáo viên</th><th>Lớp</th><th>BQ GK</th><th>BQ HK</th><th>ĐL GK</th><th>ĐL HK</th><th>HQ lớp</th>';
 const cols=[];for(let c=9;c<=13;c++){const title=s[E().address(d.teacherHeader,c)]?.v;if(title){cols.push(c);out+=`<th>${h(title)}</th>`;}}out+='</tr></thead><tbody>';let current='';
 const max=E().coord(s['!ref'].split(':').pop()).r;for(let r=d.teacherHeader+1;d.teacherHeader&&r<=max;r++){const cls=String(s['C'+r]?.v||'');if(!/^(10|11|12)[A-Z]\d+$/i.test(cls))continue;if(s['B'+r]?.v)current=s['B'+r].v;if(query&&!normalize(current).includes(query))continue;if(grade&&!cls.startsWith(grade))continue;out+=`<tr><td>${h(current)}</td><td>${h(cls)}</td>`;for(const c of [4,5,6,7,8,...cols])out+=`<td>${h(display(s[E().address(r,c)]))}</td>`;out+='</tr>';}
 out+='</tbody></table></div>';el('hq-result').innerHTML=out;
 el('hq-info').textContent=errors.length?`${errors.length} lỗi: `+errors.slice(0,5).map(x=>x.sheet+'!'+x.cell+': '+x.message).join('; '):`${book().name} · ${d.classes.length} lớp · ${d.teachers.length} giáo viên trong môn. Đã tính lại công thức. Có thể sửa BQ GK/HK trực tiếp; xuất Excel để giữ thay đổi.`;
 renderTeacherStats();
 el('hq-result').querySelectorAll('[data-cell]').forEach(input=>input.onchange=()=>{const text=input.value.trim().replace(',','.');if(!text||!Number.isFinite(Number(text))||Number(text)<0||Number(text)>10){alert('Nhập điểm từ 0 đến 10; không dùng ô trống thay điểm 0.');paint();return;}s[input.dataset.cell]={...(s[input.dataset.cell]||{}),t:'n',v:Number(text)};delete s[input.dataset.cell].w;book().sources.manual={source:'manual',description:'Nhập trực tiếp từng ô theo mẫu Excel',at:new Date().toISOString()};markReportDirty();recalc();paint();renderWorkflowStats();});
}
async function averages(year,period,subject=sheetName){
 const r=await window.HTBRemote('hqgdClassAverages',{year,period,subject});
 return new Map(r.classes.map(x=>[x.classKey,x]));
}
let excelLoadPromise=null;async function ensureExcel(){if(window.XLSX)return;if(!excelLoadPromise)excelLoadPromise=new Promise((ok,no)=>{const t=document.createElement('script');t.src='./xlsx.full.min.js';t.onload=ok;t.onerror=()=>no(Error('Không tải được bộ đọc Excel. Kiểm tra mạng và tệp xlsx.full.min.js'));document.head.appendChild(t);}).catch(e=>{excelLoadPromise=null;throw e;});await excelLoadPromise;}
function decodeBook(name,bytes,semester=""){const original=XLSX.read(bytes,{type:'array',cellStyles:true});if(!original.SheetNames.some(sn=>E().describe(original.Sheets[sn]).classes.length))throw Error('Không nhận diện được mẫu HQGD: '+name);const manual=original,automatic=XLSX.read(XLSX.write(original,{type:'array',bookType:'xlsx',compression:true}),{type:'array',cellStyles:true});return {name,wb:automatic,semester,modeCopies:{manual,automatic},sources:{manual:null,automatic:null},dirtyByMode:{manual:false,automatic:false},liveFromSystem:false};}
let templateMeta=[],templateUploadBusy=false,templateSerial=0,templateLoadedYear='';
async function loadTemplates(){
 const context=window.HTBHQGDContext?.();if(!context)return;if(books.length&&window.HTBHQGD?.hasUnsaved?.()&&!confirm('Đang có dữ liệu chưa lưu. Tải lại mẫu từ Appwrite sẽ thay thế các thay đổi trong phiên, tiếp tục?'))return;
 if(templateLoadedYear!==context.year){books=[];bookIndex=0;sheetName='';errors=[];templateMeta=[];templateLoadedYear=context.year;const result=el('hq-result');if(result)result.textContent='Chưa tải mẫu HQGD của năm học '+context.year;const info=el('hq-info');if(info)info.textContent='Chờ dữ liệu của năm học '+context.year;}
 const serial=++templateSerial,box=el('hq-template-status');assignedFor='';assignmentByClass.clear();assignmentUsers.clear();++assignSerial;
 if(box)box.textContent='Đang đọc mẫu đã lưu trên Appwrite...';
 try{
  const meta=await window.HTBRemote('hqgdTemplateList',{year:context.year});
  if(serial!==templateSerial||window.HTBHQGDContext?.()?.year!==context.year)return;
  templateMeta=meta;
  if(!meta.length){if(box)box.textContent='Chưa có mẫu lưu trên Appwrite cho năm học này. Quản trị tải HK1/HK2 một lần.';return;}
  await ensureExcel();const results=await Promise.all(meta.map(async item=>{const bytes=await window.HTBHQGDTemplates.load(item.templateId);return decodeBook(item.filename,bytes,item.semester);}));
  if(serial!==templateSerial||window.HTBHQGDContext?.()?.year!==context.year)return;
  books=results;bookIndex=0;picker();syncTermPeriods();recalc();paint();assignmentsPanel();reportDirty=false;maybeAutoSync();
  if(box)box.textContent=`Đã tự tải ${meta.length} mẫu HQGD từ Appwrite · năm học ${context.year}.`;
 }catch(e){if(box)box.textContent='Không tự tải được mẫu: '+e.message+' (có thể dùng mẫu trên máy nhưng chưa lưu).';}
}
async function saveTemplate(semester){
 if(templateUploadBusy)return;const context=window.HTBHQGDContext?.(),f=[...(el('hq-file')?.files||[])];
 if(!context||!['HK1','HK2'].includes(semester))throw Error('Chọn học kỳ HK1 hoặc HK2.');
 if(f.length!==1)throw Error('Để lưu mẫu, chỉ chọn đúng một tệp XLSX của học kỳ đang chọn.');
 await ensureExcel();decodeBook(f[0].name,await f[0].arrayBuffer());
 const existing=templateMeta.find(t=>t.semester===semester);
 if(!confirm(`Lưu ${f[0].name} làm mẫu ${semester} cho năm học ${context.year}? Mẫu cũ sẽ được giữ trong lịch sử Storage.`))return;
 templateUploadBusy=true;el('hq-template-save').disabled=true;
 try{await window.HTBHQGDTemplates.upload(f[0],{year:context.year,semester,expectedVersion:existing?.version||''});await loadTemplates();}
 finally{templateUploadBusy=false;el('hq-template-save').disabled=false;}
}
let assignSerial=0,assignBusy=false,assignedFor='',assignmentByClass=new Map(),assignmentUsers=new Map();
function exportWithAssignments(){
 if(!book()||errors.length)throw Error('Báo cáo đang có lỗi công thức, chưa thể xuất.');
 // Work on an export copy so a previous subject's teacher summary can never contaminate later exports.
 const wb=XLSX.read(XLSX.write(book().wb,{type:'array',bookType:'xlsx',compression:true}),{type:'array',cellStyles:true}),summaryName='HTB_GV_APPWRITE';
 if(wb.Sheets[summaryName]){delete wb.Sheets[summaryName];wb.SheetNames=wb.SheetNames.filter(n=>n!==summaryName);}
 if(book().liveFromSystem&&assignedFor===`${book()?.name}|${sheetName}|${activeSemester()}`){
   const rows=[['THPT HỒ THỊ BI - HIỆU QUẢ GIẢNG DẠY THEO PHÂN CÔNG APPWRITE'],['Bản tổng hợp chưa ký số/chưa phê duyệt; căn cứ điểm đã xác nhận'],
   ['Năm học',window.HTBHQGDContext?.()?.year||'','Học kỳ',activeSemester(),'Môn',sheetName],
   ['Giáo viên','Các lớp','Tổng độ lệch GK','Tổng độ lệch HK','Hiệu quả chung','Hạng']];
   const teachers=new Map();let missing=0;
   for(const c of E().describe(sheet()).classes){const a=assignmentByClass.get(classKey(c.lop)),user=assignmentUsers.get(a?.teacherUserId);
     if(!a?.active||!user){missing++;continue;}
     const k=a.teacherUserId,mid=Number(sheet()['E'+c.row]?.v),fin=Number(sheet()['H'+c.row]?.v),eff=Number(sheet()['J'+c.row]?.v);
     if(![mid,fin,eff].every(Number.isFinite))throw Error('Dữ liệu HQGD có ô không hợp lệ, không thể xuất bảng giáo viên.');
     if(!teachers.has(k))teachers.set(k,{name:user.name,classes:[],mid:0,fin:0,eff:0});const t=teachers.get(k);
     t.classes.push(c.lop);t.mid+=mid;t.fin+=fin;t.eff+=eff;
   }
   const list=[...teachers.values()].sort((a,b)=>b.eff-a.eff||a.name.localeCompare(b.name,'vi'));
   for(const t of list){const rank=1+list.filter(v=>v.eff>t.eff+1e-10).length;rows.push([t.name,t.classes.join(', '),t.mid,t.fin,t.eff,rank]);}
   rows.push([]);rows.push([`Chưa có phân công giáo viên: ${missing} lớp. Nếu chưa phân công đủ, bảng trên chưa đại diện toàn môn.`]);
   const sh=XLSX.utils.aoa_to_sheet(rows);sh['!cols']=[{wch:30},{wch:36},{wch:22},{wch:22},{wch:22},{wch:12}];
   wb.Sheets[summaryName]=sh;if(!wb.SheetNames.includes(summaryName))wb.SheetNames.push(summaryName);
 }
 const tag=mode==='automatic'?(book().liveFromSystem?'TU_DONG_DA_XAC_NHAN':'TU_DONG_CHUA_LAY_DIEM'):'THU_CONG_EXCEL';
 XLSX.writeFile(wb,'HTB_HQGD_'+tag+'_'+book().name.replace(/\.xlsx?$/i,'')+'.xlsx');markReportSaved();
}
function renderTeacherStats(){const root=el('hq-live-teachers');if(!root)return;
 if(!sheet()||assignedFor!==`${book()?.name}|${sheetName}|${activeSemester()}`){root.textContent='Chưa đồng bộ phân công từ Appwrite cho môn đang chọn.';return;}
 const subjects=E().describe(sheet()).classes;let missing=0,invalid=0;const sums=new Map();
 for(const c of subjects){const a=assignmentByClass.get(classKey(c.lop));if(!a?.active||!a.teacherUserId){missing++;continue;}
   const teacher=assignmentUsers.get(a.teacherUserId);if(!teacher){invalid++;continue;}
   const mid=Number(sheet()['E'+c.row]?.v),final=Number(sheet()['H'+c.row]?.v),eff=Number(sheet()['J'+c.row]?.v);
   if(!Number.isFinite(mid)||!Number.isFinite(final)||!Number.isFinite(eff)){invalid++;continue;}
   if(!sums.has(a.teacherUserId))sums.set(a.teacherUserId,{name:teacher.name,classes:[],mid:0,final:0,total:0});
   const row=sums.get(a.teacherUserId);row.classes.push(c.lop);row.mid+=mid;row.final+=final;row.total+=eff;
 }
 const list=[...sums.values()].sort((a,b)=>b.total-a.total||a.name.localeCompare(b.name,'vi'));
 let out=`<h3>Hiệu quả theo giáo viên giảng dạy (phân công Appwrite)</h3><p>${mode==='automatic'&&book()?.liveFromSystem?'Điểm vừa lấy từ phiếu đã xác nhận.':mode==='manual'?'Số liệu thủ công theo mẫu Excel, cần đối soát trước khi duyệt.':'Đây mới là số liệu tham khảo trong mẫu Excel; chưa lấy điểm từ hệ thống cho kỳ hiện tại.'} Hiệu quả chung bằng tổng hiệu quả các lớp theo công thức mẫu.</p>`;
 if(!list.length){root.innerHTML=out+'<p>Chưa có phân công giáo viên hợp lệ để thống kê.</p>';return;}
 out+='<div class="hq-scroll"><table class="hq-table"><thead><tr><th>Giáo viên</th><th>Lớp phụ trách</th><th>Tổng độ lệch GK</th><th>Tổng độ lệch HK</th><th>HQ chung</th><th>Hạng</th></tr></thead><tbody>';
 for(const t of list){const rank=1+list.filter(v=>v.total>t.total+1e-10).length;
   out+=`<tr><td>${h(t.name)}</td><td>${h(t.classes.join(', '))}</td><td>${t.mid.toFixed(3)}</td><td>${t.final.toFixed(3)}</td><td>${t.total.toFixed(3)}</td><td>${rank}</td></tr>`;
 }
 root.innerHTML=out+`</tbody></table></div><p>${missing} lớp chưa được phân công · ${invalid} lớp có dữ liệu hoặc tài khoản không hợp lệ. Chưa đủ phân công thì không coi bảng này là báo cáo toàn môn.</p>`;
}

function activeSemester(){const name=book()?.name||'';return book()?.semester||(/HK2/i.test(name)?'HK2':/HK1/i.test(name)?'HK1':el('hq-template-term')?.value||'HK1');}
async function assignmentsPanel(){
 const panel=el('hq-assign-root'),context=window.HTBHQGDContext?.(),selected=sheetName;
 if(!panel||!context||!sheet()){return;}
 const serial=++assignSerial,semester=activeSemester();panel.textContent='Đang tải phân công '+semester+' / '+selected+'...';
 try{
   const [users,saved]=await Promise.all([
     window.HTBRemote('hqgdTeacherDirectory',{}),
     window.HTBRemote('hqgdAssignments',{year:context.year,semester,subject:selected})
   ]);
   if(serial!==assignSerial||!el('hq-assign-root')||sheetName!==selected)return;
   const existing=new Map(saved.map(x=>[classKey(x.className),x]));
   assignedFor=`${book()?.name}|${sheetName}|${semester}`;assignmentByClass=existing;assignmentUsers=new Map(users.map(x=>[x.authUserId,x]));renderTeacherStats();
   const eligible=users.filter(u=>String(u.subject).split(/[;,]/).some(s=>subjectKey(s)===subjectKey(selected))).sort((a,b)=>a.name.localeCompare(b.name,'vi'));
   const cls=E().describe(sheet()).classes;
   let html=`<h3>Phân công giảng dạy ${h(selected)} · ${h(semester)}</h3><p>Chọn giáo viên dạy từng lớp, không sử dụng tên giám khảo nhập điểm. Thông tin lưu trên Appwrite theo năm học và học kỳ.</p><div class="hq-scroll"><table class="hq-table"><thead><tr><th>Lớp</th><th>Giáo viên trong mẫu cũ (tham khảo)</th><th>Giáo viên được phân công</th></tr></thead><tbody>`;
   for(const c of cls){const old=existing.get(classKey(c.lop)),id=old?.teacherUserId||'';
     html+=`<tr><td>${h(c.lop)}</td><td>${h(c.teacher)}</td><td><select class="hq-assign-teacher" data-class="${h(c.lop)}" data-original="${h(id)}" data-version="${h(old?.version||'')}"><option value="">Chưa phân công</option>${eligible.map(u=>`<option value="${h(u.authUserId)}" ${u.authUserId===id?'selected':''}>${h(u.name)}</option>`).join('')}</select></td></tr>`;
   }
   panel.innerHTML=html+'</tbody></table></div><button type="button" id="hq-assign-save" disabled>Lưu phân công (0 thay đổi)</button><p id="hq-assign-note" role="status">'+cls.length+' lớp · '+eligible.length+' giáo viên đúng môn. Dữ liệu gốc Excel không bị sửa.</p>';
   const selects=[...panel.querySelectorAll('.hq-assign-teacher')],btn=el('hq-assign-save');
   const refresh=()=>{const n=selects.filter(x=>x.value!==x.dataset.original).length;btn.disabled=!n||assignBusy;btn.textContent=`Lưu phân công (${n} thay đổi)`;};
   selects.forEach(x=>x.onchange=refresh);
   btn.onclick=async()=>{if(assignBusy)return;const changes=selects.filter(x=>x.value!==x.dataset.original).map(x=>({className:x.dataset.class,teacherUserId:x.value,expectedVersion:x.dataset.version,departmentId:''}));
     if(!changes.length)return;if(changes.length>40){el('hq-assign-note').textContent='Tối đa 40 lớp trong một lần lưu. Hãy lưu theo nhóm.';return;}
     if(!confirm(`Lưu ${changes.length} phân công giáo viên của môn ${selected} · ${semester}?`))return;
     assignBusy=true;btn.disabled=true;try{await window.HTBRemote('hqgdSaveAssignments',{year:context.year,semester,subject:selected,assignments:changes});
       if(serial===assignSerial)await assignmentsPanel();
     }catch(e){el('hq-assign-note').textContent='Chưa xác nhận kết quả lưu: '+e.message+'. Hãy tải lại để kiểm tra.';}
     finally{assignBusy=false;refresh();}
   };
 }catch(e){if(serial===assignSerial&&el('hq-assign-root'))panel.textContent='Chưa tải được phân công: '+e.message;}
}
async function fromSystem({silent=false}={}){if(busy||!sheet()||mode!=='automatic')return;const targetBook=book(),targetSheet=sheet(),targetName=sheetName;const context=window.HTBHQGDContext?.();if(!context)throw Error('Không đọc được năm học đăng nhập');const gk=el('hq-live-gk').value,hk=el('hq-live-hk').value;if(gk===hk)throw Error('Hai đợt kiểm tra phải khác nhau.');const sem=activeSemester();if((/HK[12]/i.test(gk)&&!gk.toUpperCase().includes(sem))||(/HK[12]/i.test(hk)&&!hk.toUpperCase().includes(sem)))throw Error('Đợt kiểm tra không trùng học kỳ '+sem+' của mẫu Excel đang chọn.');if(!silent&&!confirm(`Lấy điểm đã xác nhận của môn ${sheetName}, năm ${context.year}: ${gk} và ${hk}? Phân công giáo viên giữ theo file mẫu.`))return;busy=true;el('hq-system').disabled=true;el('hq-info').textContent='Đang tổng hợp điểm đã xác nhận…';try{const [a,b]=await Promise.all([averages(context.year,gk,targetName),averages(context.year,hk,targetName)]);if(book()!==targetBook||sheet()!==targetSheet||window.HTBHQGDContext?.()?.year!==context.year||window.HTBHQGDContext?.()?.userId!==context.userId)throw Error('Phiên hoặc mẫu đã thay đổi, hủy tổng hợp.');const d=E().describe(targetSheet),missing=[],knownClasses=new Set(d.classes.map(r=>classKey(r.lop)));for(const [label,map] of [[gk,a],[hk,b]])for(const key of map.keys())if(!knownClasses.has(key))missing.push('Lớp '+key+' trong đợt '+label+' chưa có trong mẫu Excel');for(const r of d.classes){for(const [label,map]of [[gk,a],[hk,b]]){const g=map.get(classKey(r.lop));if(!g||g.scored!==g.total||!g.scored)missing.push(r.lop+' / '+label);}}if(missing.length)throw Error('Chưa thay số liệu: còn thiếu điểm đã xác nhận ở '+missing.slice(0,12).join(', ')+(missing.length>12?'…':'')+'. Hoàn tất điểm/danh sách lớp trước khi tính.');for(const r of d.classes){for(const [col,map]of [['D',a],['G',b]]){const g=map.get(classKey(r.lop)),ref=col+r.row;if(sheet()[ref]?.f)throw Error('Ô đầu vào có công thức, không tự ghi đè '+ref);}}
 for(const r of d.classes){for(const [col,map]of [['D',a],['G',b]]){const g=map.get(classKey(r.lop)),ref=col+r.row;sheet()[ref]={...sheet()[ref],v:g.sum/g.scored,t:'n'};delete sheet()[ref].w;}}
 targetBook.liveFromSystem=true;targetBook.sources.automatic={source:'automatic',gk,hk,year:context.year,subject:targetName,at:new Date().toISOString(),totalClasses:d.classes.length};markReportDirty();if(sheet().A2)sheet().A2.v=String(sheet().A2.v).replace(/20\d{2}\s*[-–]\s*20\d{2}/,context.year);recalc();paint();renderWorkflowStats();el('hq-info').textContent+=' Nguồn điểm: '+context.year+' / '+gk+' + '+hk+'.';}finally{busy=false;if(el('hq-system'))el('hq-system').disabled=false;}}
/* V9: two isolated HQGD workflows: approved-record aggregation vs Excel/manual inputs. */
let manualPending=null,manualImportMeta=null,historyBusy=false,saveBusy=false,snapshotRequestId='';
function syncTermPeriods(){
 const g=el('hq-live-gk'),f=el('hq-live-hk');if(!g||!f)return;
 const term=activeSemester(),mid=term==='HK2'?'Giữa HK2':'Giữa HK1',fin=term;
 if([...g.options].some(x=>x.value===mid))g.value=mid;
 if([...f.options].some(x=>x.value===fin))f.value=fin;
 if(el('hq-template-term'))el('hq-template-term').value=term;
}
function syncModeControls(){const a=el('hq-mode-automatic'),m=el('hq-mode-manual');if(!a||!m)return;a.classList.toggle('hq-mode-active',mode==='automatic');m.classList.toggle('hq-mode-active',mode==='manual');a.setAttribute('aria-pressed',String(mode==='automatic'));m.setAttribute('aria-pressed',String(mode==='manual'));if(el('hq-auto-tools'))el('hq-auto-tools').hidden=mode!=='automatic';if(el('hq-manual-tools'))el('hq-manual-tools').hidden=mode!=='manual';}
function setMode(next){
 if(!['automatic','manual'].includes(next)||next===mode)return;
 if(reportDirty&&!confirm('Chế độ hiện tại còn số liệu chưa xuất hoặc lưu bản chụp. Hai nguồn vẫn tách riêng trong phiên; tiếp tục?'))return;
 mode=next;snapshotRequestId='';reportDirty=books.some(b=>Boolean(b.dirtyByMode?.[mode]));manualPending=null;manualImportMeta=null;
 for(const b of books){if(!b.modeCopies)continue;b.wb=b.modeCopies[next];b.liveFromSystem=next==='automatic'&&Boolean(b.sources?.automatic);}
 syncModeControls();
 if(el('hq-history'))el('hq-history').hidden=true;if(book()){recalc();paint();assignmentsPanel();}renderWorkflowStats();
}
function inputNum(cell){const v=cell?.v;if(v==null||v==='')return null;const n=typeof v==='number'?v:Number(String(v).replace(',','.'));return Number.isFinite(n)&&n>=0&&n<=10?n:null;}
function reportCoverage(){
 if(!sheet())return {total:0,valid:0,missing:[],rows:[]};
 const rows=E().describe(sheet()).classes.map(r=>{const mid=inputNum(sheet()['D'+r.row]),fin=inputNum(sheet()['G'+r.row]);return {className:r.lop,teacher:r.teacher,mid,fin,row:r.row};});
 return {total:rows.length,valid:rows.filter(x=>x.mid!==null&&x.fin!==null).length,missing:rows.filter(x=>x.mid===null||x.fin===null).map(x=>x.className),rows};
}
function renderWorkflowStats(){
 const root=el('hq-workflow-stats'),save=el('hq-report-save');if(!root)return;
 if(!sheet()){root.innerHTML='<p>Chưa có mẫu HQGD. Tải mẫu đã lưu hoặc chọn Excel HK1/HK2.</p>';if(save)save.disabled=true;return;}
 const cover=reportCoverage(),source=activeSource(),done=cover.total>0&&cover.valid===cover.total&&!errors.length;
 const official=mode==='automatic'&&Boolean(source?.source==='automatic');
 const ready=done&&(mode==='manual'?source?.source==='manual':official);
 const label=mode==='manual'?'THỦ CÔNG · EXCEL':official?'TỰ ĐỘNG · PHIẾU ĐÃ XÁC NHẬN':'TỰ ĐỘNG · CHƯA ĐỒNG BỘ';
 root.innerHTML=`<div><small>Chế độ</small><strong>${label}</strong></div><div><small>Môn / kỳ</small><strong>${h(sheetName)} · ${h(activeSemester())}</strong></div><div><small>Đủ dữ liệu 2 cột</small><strong>${cover.valid} / ${cover.total} lớp</strong></div><div><small>Kiểm tra</small><strong>${errors.length?'Có '+errors.length+' lỗi công thức':cover.missing.length?'Thiếu '+cover.missing.length+' lớp':official?'Đủ điểm chính thức':mode==='manual'?'Đủ bình quân Excel':'Chưa lấy điểm hệ thống'}</strong></div>`+
 (cover.missing.length?`<p class="hq-workflow-warning">Cần kiểm tra lớp: ${h(cover.missing.slice(0,15).join(', '))}${cover.missing.length>15?'…':''}</p>`:'');
 if(save)save.disabled=!ready||saveBusy;
 if(el('hq-manual-status')&&!manualPending&&mode==='manual')el('hq-manual-status').textContent=source?'Nguồn: '+(source.description||'Excel thủ công')+' · chưa duyệt.':'Chưa ghi dữ liệu mới: đang hiển thị các số có sẵn trong mẫu Excel. Có thể sửa ô trực tiếp hoặc nhập bảng.';
}
function manualBlankTemplate(){
 if(!sheet())throw Error('Chưa chọn mẫu và môn.');const d=E().describe(sheet());
 const rows=[['TRƯỜNG THPT HỒ THỊ BI – MẪU NHẬP HQGD THỦ CÔNG'],['Năm học',window.HTBHQGDContext?.()?.year||'','Học kỳ',activeSemester()],['Chỉ điền bình quân GK và HK từ 0 đến 10; không sử dụng điểm 0 thay ô thiếu.'],['Môn','Lớp','BQ giữa kỳ','BQ học kỳ']];
 for(const c of d.classes)rows.push([sheetName,c.lop,'','']);
 const ws=XLSX.utils.aoa_to_sheet(rows);ws['!cols']=[{wch:29},{wch:15},{wch:18},{wch:18}];
 const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,ws,'HTB_NHAP_HQGD');
 XLSX.writeFile(wb,'HTB_NHAP_HQGD_'+activeSemester()+'_'+sheetName.replace(/[^a-zA-Z0-9\u00C0-\u1EF9]+/g,'_')+'.xlsx');
}
function parseManualValue(v,where){if(v==null||String(v).trim()==='')throw Error(where+': đang trống, không tự chuyển thành điểm 0.');let t=String(v).trim().replace(',','.');if(!/^\d{1,2}(?:\.\d{1,4})?$/.test(t))throw Error(where+': không phải số hợp lệ.');let n=Number(t);if(!Number.isFinite(n)||n<0||n>10)throw Error(where+': phải từ 0 đến 10.');return n;}
async function parseManualFile(file){
 if(!sheet())throw Error('Cần tải mẫu HQGD trước.');if(!file||!/\.xlsx$/i.test(file.name)||file.size>10*1024*1024)throw Error('Chỉ nhập .xlsx tối đa 10 MB.');
 await ensureExcel();const input=XLSX.read(await file.arrayBuffer(),{type:'array',sheetRows:500});
 const tab=input.Sheets.HTB_NHAP_HQGD||input.Sheets[input.SheetNames[0]];
 const raw=XLSX.utils.sheet_to_json(tab,{header:1,defval:''});
 const hdr=raw.findIndex(row=>normalize(row[0])==='mon'&&normalize(row[1])==='lop');
 if(hdr<0)throw Error('Không thấy tiêu đề Môn | Lớp | BQ giữa kỳ | BQ học kỳ. Hãy dùng biểu mẫu tải từ website.');
 const expected=new Set(E().describe(sheet()).classes.map(x=>classKey(x.lop))),rows=[],seen=new Set();
 for(let i=hdr+1;i<raw.length;i++){
  const r=raw[i],sub=String(r[0]??'').trim(),cls=String(r[1]??'').trim();if(!sub&&!cls&&String(r[2]??'').trim()===''&&String(r[3]??'').trim()==='')continue;
  if(subjectKey(sub)!==subjectKey(sheetName))throw Error('Dòng '+(i+1)+': môn '+sub+' khác '+sheetName);
  const key=classKey(cls);if(!expected.has(key))throw Error('Dòng '+(i+1)+': lớp '+cls+' không có trong mẫu môn này.');
  if(seen.has(key))throw Error('Lớp '+cls+' bị lặp trong file.');seen.add(key);
  rows.push({key,mid:parseManualValue(r[2],cls+' / giữa kỳ'),fin:parseManualValue(r[3],cls+' / học kỳ')});
 }
 if(!rows.length)throw Error('File Excel chưa có dòng điểm hợp lệ.');return rows;
}
async function previewManualImport(){
 const file=el('hq-manual-import')?.files?.[0],status=el('hq-manual-status');manualPending=null;manualImportMeta=null;el('hq-manual-apply').disabled=true;
 if(!file)return;
 try{status.textContent='Đang đọc và kiểm tra bảng Excel…';const current=book(),currentSheet=sheetName,rows=await parseManualFile(file);if(book()!==current||sheetName!==currentSheet||mode!=='manual')throw Error('Mẫu hoặc chế độ đã đổi, chọn lại file.');
  manualPending=rows;manualImportMeta={name:file.name,book:current,subject:currentSheet};status.textContent='Đã kiểm tra '+rows.length+' lớp, không có lớp trùng hoặc điểm ngoài thang. Bấm Áp dụng để cập nhật chế độ THỦ CÔNG; các ô tự động không bị ảnh hưởng.';el('hq-manual-apply').disabled=false;
 }catch(e){status.textContent='Không thể nhập: '+e.message;}
}
function applyManualImport(){
 if(!manualPending||!manualImportMeta||manualImportMeta.book!==book()||manualImportMeta.subject!==sheetName||mode!=='manual')throw Error('Mẫu đã thay đổi, nhập lại file.');
 if(!confirm('Áp dụng '+manualPending.length+' lớp từ Excel thủ công vào môn '+sheetName+'? Có thể xuất hoặc lưu bản chụp sau khi kiểm tra.'))return;
 const idx=new Map(E().describe(sheet()).classes.map(x=>[classKey(x.lop),x.row]));
 for(const x of manualPending){const row=idx.get(x.key);for(const [col,v] of [['D',x.mid],['G',x.fin]]){const ref=col+row;if(sheet()[ref]?.f)throw Error('Ô '+ref+' là công thức, không được ghi đè.');}}
 for(const x of manualPending){const row=idx.get(x.key);for(const [col,v] of [['D',x.mid],['G',x.fin]]){const ref=col+row;sheet()[ref]={...(sheet()[ref]||{}),t:'n',v};delete sheet()[ref].w;}}
 book().sources.manual={source:'manual',description:'Nhập bảng Excel '+manualImportMeta.name,at:new Date().toISOString(),count:manualPending.length};
 markReportDirty();manualPending=null;manualImportMeta=null;el('hq-manual-apply').disabled=true;el('hq-manual-import').value='';recalc();paint();renderWorkflowStats();
}
function snapshotPayload(){
 const context=window.HTBHQGDContext?.(),cover=reportCoverage();if(!context||!sheet()||errors.length)throw Error('Chưa có dữ liệu hợp lệ để lưu.');
 if(!cover.total||cover.valid!==cover.total)throw Error('Chưa có đủ BQ GK/HK tại '+cover.missing.slice(0,12).join(', '));
 const src=activeSource(),official=mode==='automatic';if(official&&(!src||src.source!=='automatic'))throw Error('Phải tổng hợp điểm đã xác nhận mới có thể lưu ở chế độ tự động.');
 const classes=cover.rows.map(r=>({className:r.className,midAvg:r.mid,finalAvg:r.fin,midDeviation:typeof sheet()['E'+r.row]?.v==='number'?sheet()['E'+r.row].v:null,finalDeviation:typeof sheet()['H'+r.row]?.v==='number'?sheet()['H'+r.row].v:null,effect:typeof sheet()['J'+r.row]?.v==='number'?sheet()['J'+r.row].v:null}));
 return {year:context.year,semester:activeSemester(),subject:sheetName,mode,midPeriod:official?src.gk:'',finalPeriod:official?src.hk:'',classes,templateName:book().name};
}
async function saveSnapshot(){if(saveBusy)return;const status=el('hq-report-status');try{
 const p=snapshotPayload();if(!confirm(`Lưu bản chụp ${p.mode==='automatic'?'tự động':'thủ công'} của ${p.subject} / ${p.semester} trên Appwrite? Đây là bản CHƯA DUYỆT.`))return;
 if(!snapshotRequestId)snapshotRequestId=crypto.randomUUID();p.requestId=snapshotRequestId;
 saveBusy=true;renderWorkflowStats();status.textContent='Đang đối soát và lưu bản chụp…';
 const result=await window.HTBRemote('hqgdReportSave',p);
 status.textContent='Đã lưu bản chụp CHƯA DUYỆT: '+result.snapshotId+'. Hệ thống giữ các bản trước, không sửa dữ liệu điểm.';markReportSaved();snapshotRequestId='';await reportHistory();
 }catch(e){status.textContent='Chưa xác nhận được kết quả lưu: '+e.message+'. Xem lịch sử trước khi lưu lại.';}
 finally{saveBusy=false;renderWorkflowStats();}}
function localWhen(ts){const d=new Date(ts);return Number.isNaN(d.getTime())?String(ts):new Intl.DateTimeFormat('vi-VN',{timeZone:'Asia/Ho_Chi_Minh',dateStyle:'short',timeStyle:'short'}).format(d);}
async function reportHistory(){
 const box=el('hq-history'),context=window.HTBHQGDContext?.();if(!box||!context||!sheet()||historyBusy)return;
 historyBusy=true;box.hidden=false;box.textContent='Đang tải kho bản chụp HQGD…';
 try{const items=await window.HTBRemote('hqgdReportList',{year:context.year,semester:activeSemester(),subject:sheetName});
 box.innerHTML='<h3>Kho bản chụp · '+h(sheetName)+'</h3>'+(items.length?items.map(x=>`<div class="hq-history-item"><span><b>${h(x.mode==='automatic'?'Tự động':'Thủ công')}</b> · ${h(localWhen(x.createdAt))} · ${h(x.createdBy)} · ${x.classCount} lớp · <b>CHƯA DUYỆT</b></span><span class="hq-history-buttons"><button type="button" data-report-id="${h(x.snapshotId)}">Xem</button><button type="button" data-report-excel="${h(x.snapshotId)}">Xuất Excel</button></span></div>`).join(''):'Chưa có bản chụp nào.');
 box.querySelectorAll('[data-report-id]').forEach(btn=>btn.onclick=async()=>{try{const item=await window.HTBRemote('hqgdReportGet',{snapshotId:btn.dataset.reportId});const title=`${item.mode==='automatic'?'Tự động':'Thủ công'} | ${item.subject} | ${item.semester} | ${item.createdAt}`;const rows=item.classes.map(x=>`${x.className}: GK ${x.midAvg} / HK ${x.finalAvg}`).join('\n');alert(title+'\nCHƯA DUYỆT — chỉ để kiểm tra, không ghi đè mẫu hiện tại.\n\n'+rows);}catch(e){alert('Không tải được: '+e.message);}});
 box.querySelectorAll('[data-report-excel]').forEach(btn=>btn.onclick=async()=>{try{const item=await window.HTBRemote('hqgdReportGet',{snapshotId:btn.dataset.reportExcel});await ensureExcel();const rows=[['THPT HỒ THỊ BI - BẢN CHỤP HIỆU QUẢ GIÁO DỤC'],['CHƯA DUYỆT - KHÔNG CÓ GIÁ TRỊ KÝ SỐ'],['Năm học',item.year,'Học kỳ',item.semester,'Môn',item.subject],['Nguồn',item.mode==='automatic'?'Điểm đã xác nhận - đối soát phía máy chủ':'Excel thủ công - chưa đối soát điểm hệ thống'],['Lưu lúc',localWhen(item.createdAt),'Mã',item.snapshotId],[],['Lớp','BQ giữa kỳ','BQ học kỳ','Độ lệch GK','Độ lệch HK','Hiệu quả lớp']];for(const x of item.classes)rows.push([x.className,x.midAvg,x.finalAvg,x.midDeviation??'',x.finalDeviation??'',x.effect??'']);const sh=XLSX.utils.aoa_to_sheet(rows);sh['!cols']=[{wch:22},{wch:20},{wch:20},{wch:18},{wch:18},{wch:24}];const wb=XLSX.utils.book_new();XLSX.utils.book_append_sheet(wb,sh,'HTB_BAN_CHUP');XLSX.writeFile(wb,'HTB_HQGD_BAN_CHUP_'+item.semester+'_'+item.snapshotId.slice(0,12)+'.xlsx');}catch(e){alert('Không xuất được bản chụp: '+e.message);}});
 }catch(e){box.textContent='Không tải được lịch sử: '+e.message;}finally{historyBusy=false;}
}
function maybeAutoSync(){if(mode==='automatic'&&el('hq-auto-sync')?.checked&&sheet())fromSystem({silent:true}).catch(e=>{if(el('hq-info'))el('hq-info').textContent='Đồng bộ tự động: '+e.message;});}
function attachWorkflow(){
 el('hq-mode-automatic').onclick=()=>setMode('automatic');el('hq-mode-manual').onclick=()=>setMode('manual');syncModeControls();
 el('hq-manual-download').onclick=()=>{try{manualBlankTemplate();}catch(e){el('hq-manual-status').textContent=e.message;}};
 el('hq-manual-confirm-template').onclick=()=>{if(mode!=='manual'||!sheet())return;if(!confirm('Xác nhận sử dụng số bình quân đang có trong mẫu Excel làm số liệu THỦ CÔNG (không phải điểm đã xác nhận trên hệ thống)?'))return;book().sources.manual={source:'manual',description:'Quản trị xác nhận số liệu có sẵn trong mẫu '+book().name,at:new Date().toISOString()};markReportDirty();renderWorkflowStats();};
 el('hq-auto-sync').onchange=()=>maybeAutoSync();
 el('hq-manual-import').onchange=previewManualImport;
 el('hq-manual-apply').onclick=()=>{try{applyManualImport();}catch(e){el('hq-manual-status').textContent=e.message;}};
 el('hq-report-save').onclick=saveSnapshot;el('hq-history-refresh').onclick=reportHistory;
 el('hq-report-print').onclick=()=>{if(!sheet())return alert('Chưa có dữ liệu in.');window.print();};
 renderWorkflowStats();
}

window.HTBHQGD={
 hasUnsaved:()=>reportDirty||books.some(b=>Object.values(b.dirtyByMode||{}).some(Boolean)),
 clear(){books=[];bookIndex=0;sheetName='';errors=[];busy=false;mode='automatic';reportDirty=false;snapshotRequestId='';templateMeta=[];templateLoadedYear='';templateSerial++;assignedFor='';assignmentByClass.clear();assignmentUsers.clear();assignSerial++;},
 render(){
  const context=window.HTBHQGDContext?.();
  const host=el('content');
  host.innerHTML=`
   <div class="hq-subnav">
    <div class="hq-subnav-title">
     <div class="hq-section-label">KHẢO THÍ · THỐNG KÊ CHUYÊN MÔN</div>
     <h2>THỐNG KÊ HIỆU QUẢ GIÁO DỤC <span>HK1 / HK2</span></h2>
     <p>Hai chế độ tính độc lập theo mẫu Excel của trường. Báo cáo chưa có giá trị phê duyệt hoặc ký số.</p>
    </div>
    <div class="hq-tabs" role="tablist" aria-label="Phân hệ hiệu quả giảng dạy">
     <button type="button" role="tab" id="hq-tab-calc" aria-controls="hq-pane-calc" aria-selected="true" tabindex="0" class="hq-tab-btn active" data-hq-tab="calc"><span aria-hidden="true">📊</span> <span>1. Tổng hợp &amp; Kết quả</span></button>
     <button type="button" role="tab" id="hq-tab-setup" aria-controls="hq-pane-setup" aria-selected="false" tabindex="-1" class="hq-tab-btn" data-hq-tab="setup"><span aria-hidden="true">⚙️</span> <span>2. Mẫu Excel &amp; Phân công</span></button>
     <button type="button" role="tab" id="hq-tab-dispatch" aria-controls="hq-pane-dispatch" aria-selected="false" tabindex="-1" class="hq-tab-btn" data-hq-tab="dispatch"><span aria-hidden="true">📩</span> <span>3. Gửi PDF &amp; Phân quyền Tổ</span></button>
    </div>
   </div>

   <section id="hq-pane-calc" class="card hq-panel hq-tab-pane active" role="tabpanel" aria-labelledby="hq-tab-calc" tabindex="0">
    <div class="hq-panel-heading"><div><h3>Tổng hợp kết quả học kỳ</h3><p>Chọn nguồn dữ liệu, môn học và đối chiếu kết quả theo từng lớp, giáo viên.</p></div><span class="hq-hk-label">${h(context?.year||'Năm học')}</span></div>
    <div class="hq-mode-select" role="group" aria-label="Chế độ thống kê">
     <button type="button" id="hq-mode-automatic" class="hq-mode-active" aria-pressed="true">⚡ Tự động từ điểm đã xác nhận</button>
     <button type="button" id="hq-mode-manual" aria-pressed="false">✍ Thủ công theo Excel</button>
    </div>
    <p class="hq-help">Hai chế độ giữ dữ liệu riêng trong phiên, không trộn điểm hoặc tự ghi đè số liệu.</p>
    <div class="hq-filters hq-main-filters">
     <label>File mẫu<select id="hq-book" aria-label="Chọn file mẫu HK1 hoặc HK2"></select></label>
     <label>Môn<select id="hq-subject" aria-label="Chọn môn học"></select></label>
     <label>Khối<select id="hq-grade"><option value="">Tất cả</option><option>10</option><option>11</option><option>12</option></select></label>
     <label>Tìm giáo viên<input id="hq-teacher-search" type="search" autocomplete="off" placeholder="Nhập tên giáo viên..."></label>
    </div>

    <section id="hq-manual-tools" class="hq-source-panel" hidden>
     <h3>Nhập số liệu thủ công từ Excel</h3>
     <p>Tải biểu mẫu cho môn đang chọn, điền bình quân giữa kỳ / học kỳ rồi nhập lại. Có thể sửa trực tiếp các ô D và G trong bảng kết quả.</p>
     <div class="hq-filters">
      <button type="button" id="hq-manual-download">Tải bảng Excel để nhập</button>
      <button type="button" id="hq-manual-confirm-template">Dùng số liệu có sẵn trong mẫu</button>
      <label>Nhập bảng số liệu Excel<input type="file" id="hq-manual-import" accept=".xlsx"></label>
      <button type="button" id="hq-manual-apply" disabled>Áp dụng số liệu đã kiểm tra</button>
     </div>
     <p id="hq-manual-status" role="status">Chọn mẫu và môn trước khi nhập.</p>
    </section>

    <section id="hq-auto-tools" class="hq-source-panel">
     <h3>Tổng hợp tự động</h3>
     <div class="hq-filters">
      <label>Đợt giữa kỳ<select id="hq-live-gk">${(context?.periods||['Giữa HK1','Giữa HK2']).map(x=>`<option>${h(x)}</option>`).join('')}</select></label>
      <label>Đợt học kỳ<select id="hq-live-hk">${(context?.periods||['HK1','HK2']).map(x=>`<option>${h(x)}</option>`).join('')}</select></label>
     </div>
     <p>Năm học lấy điểm: <b>${h(context?.year||'')}</b>. Chỉ dùng phiếu đã xác nhận, chỉ thay số liệu khi đủ điểm các lớp trong môn. Số liệu HK1 có sẵn trong mẫu HK2 được giữ nguyên.</p>
     <button type="button" id="hq-system" disabled>Tổng hợp từ phiếu đã xác nhận</button>
     <label class="hq-auto-sync-toggle"><input type="checkbox" id="hq-auto-sync"> Tự đồng bộ khi chọn môn / học kỳ (có thể tắt để giảm lượt đọc)</label>
    </section>

    <div id="hq-workflow-stats" class="hq-workflow-stats" aria-live="polite"></div>
    <div class="hq-report-toolbar">
     <button type="button" id="hq-export" disabled>Xuất Excel đã tính lại</button>
     <button type="button" id="hq-report-save" disabled>Lưu bản chụp chưa duyệt</button>
     <button type="button" id="hq-history-refresh">Xem lịch sử bản chụp</button>
     <button type="button" id="hq-report-print">In / lưu PDF</button>
    </div>
    <p id="hq-report-status" role="status"></p>
    <div id="hq-history" class="hq-history" hidden></div>
    <p id="hq-info" role="status">Chưa chọn file.</p>
    <div id="hq-result"></div>
    <div id="hq-live-teachers" class="hq-panel"><p>Chưa tải phân công giảng dạy từ Appwrite.</p></div>
   </section>

   <section id="hq-pane-setup" class="card hq-panel hq-tab-pane" role="tabpanel" aria-labelledby="hq-tab-setup" tabindex="0">
    <div class="hq-panel-heading"><div><h3>Mẫu Excel &amp; phân công giảng dạy</h3><p>Quản lý mẫu HK1/HK2 và giáo viên dạy từng lớp của năm học.</p></div></div>
    <div class="hq-setup-label">01 <span>Quản lý file mẫu HK1 / HK2 trên Appwrite</span></div>
    <p class="hq-help">Mẫu được quản trị lưu riêng theo năm học, chỉ cần tải lên một lần đầu kỳ.</p>
    <div class="hq-filters">
     <label>File Excel HK1 / HK2<input id="hq-file" type="file" accept=".xlsx" multiple></label>
     <label>Học kỳ mẫu cần lưu<select id="hq-template-term"><option value="HK1">HK1</option><option value="HK2">HK2</option></select></label>
     <button type="button" id="hq-template-save">Lưu mẫu lên Appwrite</button>
     <button type="button" id="hq-template-refresh">Tải mẫu đã lưu</button>
    </div>
    <p id="hq-template-status" role="status">Mẫu được quản trị lưu riêng theo năm học. Chỉ tài khoản quản trị được tải và cập nhật.</p>
    <div class="hq-setup-label">02 <span>Phân công giáo viên theo lớp</span></div>
    <div id="hq-assign-root" class="hq-assign-root"><p>Đọc phân công giáo viên từ Appwrite khi chọn mẫu và môn.</p></div>
   </section>

   <section id="hq-pane-dispatch" class="hq-tab-pane" role="tabpanel" aria-labelledby="hq-tab-dispatch" tabindex="0">
    ${window.HTBHQGDDispatch?.render()||'<div class="card hq-panel">Chức năng gửi PDF chưa được tải.</div>'}
   </section>`;

  // Dispatch pane uses server permissions. Defer its API reads until tab 3 is actually opened.
  let dispatchReady=false;
  const tabs=[...host.querySelectorAll('[data-hq-tab]')];
  const activateTab=(name,focus=false)=>{
   if(!['calc','setup','dispatch'].includes(name))return;
   for(const btn of tabs){const active=btn.dataset.hqTab===name;btn.classList.toggle('active',active);btn.setAttribute('aria-selected',String(active));btn.tabIndex=active?0:-1;}
   host.querySelectorAll('.hq-tab-pane').forEach(p=>p.classList.toggle('active',p.id==='hq-pane-'+name));
   if(name==='dispatch'&&!dispatchReady){dispatchReady=true;window.HTBHQGDDispatch?.attach();}
   if(focus)host.querySelector('[data-hq-tab="'+name+'"]')?.focus();
  };
  tabs.forEach((btn,i)=>{
   btn.onclick=()=>activateTab(btn.dataset.hqTab);
   btn.onkeydown=e=>{if(!['ArrowLeft','ArrowRight','Home','End'].includes(e.key))return;e.preventDefault();const j=e.key==='Home'?0:e.key==='End'?tabs.length-1:(i+(e.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;activateTab(tabs[j].dataset.hqTab,true);};
  });
 if(context?.periods?.includes('HK1'))el('hq-live-hk').value='HK1';
 el('hq-template-save').onclick=()=>saveTemplate(el('hq-template-term').value).catch(e=>{el('hq-template-status').textContent=e.message;});
 el('hq-template-refresh').onclick=()=>loadTemplates();
 el('hq-file').onchange=async()=>{try{const files=[...el('hq-file').files];if(!files.length)return;if(files.length>2)throw Error('Chọn tối đa hai file HK1/HK2');await ensureExcel();const next=[];for(const f of files){if(f.size>20*1024*1024)throw Error('File vượt 20 MB');next.push(decodeBook(f.name,await f.arrayBuffer()));}++templateSerial;books=next;bookIndex=0;picker();syncTermPeriods();recalc();paint();assignmentsPanel();reportDirty=false;}catch(e){el('hq-info').textContent=e.message;}};
 el('hq-book').onchange=()=>{bookIndex=+el('hq-book').value;picker();syncTermPeriods();recalc();paint();assignmentsPanel();reportDirty=books.some(b=>Boolean(b.dirtyByMode?.[mode]));maybeAutoSync();};el('hq-subject').onchange=()=>{sheetName=el('hq-subject').value;paint();assignmentsPanel();renderWorkflowStats();maybeAutoSync();};el('hq-grade').onchange=paint;el('hq-teacher-search').oninput=paint;
 el('hq-system').onclick=()=>fromSystem().catch(e=>{if(el('hq-info'))el('hq-info').textContent=e.message;});el('hq-export').onclick=()=>{try{exportWithAssignments();}catch(e){el('hq-info').textContent=e.message;}};attachWorkflow();if(books.length){for(const b of books){b.wb=b.modeCopies?.[mode]||b.wb;b.liveFromSystem=mode==='automatic'&&Boolean(b.sources?.automatic);}picker();syncTermPeriods();recalc();paint();assignmentsPanel();}if(!books.length||templateLoadedYear!==context?.year)loadTemplates();
}};
})();
