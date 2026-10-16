/* Q20 Voice Entry — optional UI enhancement, never writes directly to API. */
(()=>{'use strict';
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
const state={recognition:null,reading:false,index:0,active:false,paused:false,token:0,verified:new Set(),issues:new Set()};
const $=s=>document.querySelector(s);
const norm=s=>(s||'').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/đ/g,'d').replace(/[.,;:]/g,' ').replace(/\s+/g,' ').trim();
const words={khong:0,mot:1,hai:2,ba:3,bon:4,tu:4,nam:5,lam:5,sau:6,bay:7,tam:8,chin:9,muoi:10};
function num(v){v=norm(v).replace(/\bmuoi\s+(mot|hai|ba|bon|nam|sau|bay|tam|chin)\b/g,(_,a)=>'1'+words[a]);if(/^\d+$/.test(v))return Number(v);if(Object.prototype.hasOwnProperty.call(words,v))return words[v];const m=v.match(/^(\w+)\s+muoi(?:\s+(\w+))?$/);if(m&&words[m[1]]!==undefined)return words[m[1]]*10+(m[2]?(words[m[2]]??NaN):0);const t=v.match(/^muoi\s+(\w+)$/);if(t&&words[t[1]]!==undefined)return 10+words[t[1]];return NaN;}
function parseScore(v){
 let s=norm(v).replace(/\b(phai|phay|phẩy|phải)\b/g,'phay').replace(/\b(ruoi|rưỡi)\b/g,'phay nam').replace(/\b(phay|cham)\b/g,' phay ').replace(/\s+/g,' ').trim();
 let n=s.match(/^(\d+)\s+(\d+)$/); if(n) s=n[1]+' phay '+n[2];
 const parts=s.split(' phay ');if(parts.length>2)return null;
 const a=num(parts[0]);if(!Number.isFinite(a))return null;
 let result=a;
 if(parts.length===2){const p=parts[1].split(' ').map(x=>num(x));if(!p.length||p.some(x=>!Number.isInteger(x)||x<0||x>9))return null; result=a+Number('0.'+p.join(''));}
 if(result<0||result>10||Math.round(result*100)!==result*100)return null;
 return String(result).replace('.',',');
}
function parseLine(raw,defaultRow){
 const s=norm(raw).replace(/^sua\s+/, '').replace(/^diem\s+/, '');
 let row=defaultRow,point=s;
 const m=s.match(/^(?:bai|stt|so|dong)\s+(.+?)\s+(?:diem|la|duoc)\s+(.+)$/);
 if(m){row=num(m[1]);point=m[2];}
 else{const t=s.match(/^(?:diem|duoc|la)\s+(.+)$/);if(t)point=t[1];}
 if(!Number.isInteger(row)||row<1||row>50)return {error:'Không xác định được STT bài từ 1 đến 50.'};
 const value=parseScore(point);
 return value===null?{error:'Không nhận rõ điểm. Hãy đọc “bài 12 điểm tám phẩy năm”.'}:{row,value};
}
// Read explicit Vietnamese words so decimal punctuation is never device-dependent.
const spokenDigits=['không','một','hai','ba','bốn','năm','sáu','bảy','tám','chín'];
function spokenNumber(value){
 const n=Number(value);
 if(!Number.isInteger(n)||n<0||n>99)return String(value);
 if(n<10)return spokenDigits[n];
 if(n===10)return 'mười';
 const tens=Math.floor(n/10),unit=n%10;
 const head=tens===1?'mười':spokenDigits[tens]+' mươi';
 return head+(unit?' '+(unit===5?'lăm':unit===1&&tens>1?'mốt':spokenDigits[unit]):'');
}
function scorePhrase(row,value){
 const raw=String(value??'').trim().replace('.',',');
 if(!raw)return `Bài ${spokenNumber(row)}, chưa có điểm`;
 if(!/^\d+(?:,\d{1,2})?$/.test(raw)||Number(raw.replace(',','.'))>10)
   return `Bài ${spokenNumber(row)}, điểm không hợp lệ`;
 const [whole,fraction]=raw.split(',');
 const decimal=fraction?' phẩy '+[...fraction].map(d=>spokenDigits[Number(d)]).join(' '):'';
 return `Bài ${spokenNumber(row)}, ${spokenNumber(whole)}${decimal} điểm`;
}
function config(){
 const rate=Number($('#q21-rate')?.value||1);
 const delay=Number($('#q21-gap')?.value||1200);
 const name=$('#q21-voice')?.value||'';
 const voices=window.speechSynthesis?.getVoices?.()||[];
 return {rate,delay,voice:voices.find(v=>v.voiceURI===name)||null};
}
function voiceList(){
 const el=$('#q21-voice');if(!el||!window.speechSynthesis)return;
 const previous=el.value;
 const voices=speechSynthesis.getVoices().filter(v=>/^vi(?:-|$)/i.test(v.lang));
 el.replaceChildren();
 const auto=new Option('Tự động – tiếng Việt theo thiết bị','');el.add(auto);
 voices.forEach(v=>el.add(new Option(`${v.name} (${v.lang})`,v.voiceURI)));
 if([...el.options].some(x=>x.value===previous))el.value=previous;
 else if(voices.length===1)el.value=voices[0].voiceURI;
 $('#q21-voice-note').textContent=voices.length
  ? 'Đọc theo STT bài, tốc độ và cao độ bình thường. Giọng tiếng Việt theo thiết bị.'
  : 'Chưa tìm thấy giọng tiếng Việt trên thiết bị. Có thể cần cài giọng tiếng Việt hoặc dùng trình duyệt khác.';
}
function say(txt,then){
 if(!('speechSynthesis' in window)){then?.();return;}
 speechSynthesis.cancel();
 const u=new SpeechSynthesisUtterance(txt);
 const c=config();u.lang='vi-VN';u.rate=c.rate;u.pitch=1;u.volume=1;if(c.voice)u.voice=c.voice;
 let completed=false;
 const done=()=>{if(!completed){completed=true;then?.();}};
 u.onend=done;u.onerror=done;
 speechSynthesis.speak(u);
}
function status(s){const e=$('#q20-status');if(e)e.textContent=s;}
function inputs(){return [...document.querySelectorAll('.scores input.score')];}
function current(){return inputs().findIndex(e=>!e.value.trim())+1||50;}
function inputScore(row,value){
 const el=inputs()[row-1];if(!el||el.disabled)return status('Phiếu đang khóa hoặc không thể sửa.');
 if(el.value.trim()&&el.value.trim()!==value&&!window.confirm(`Bài ${row} đã có điểm ${el.value}. Thay thành ${value}?`))return;
 state.verified.delete(row);storeVerified();el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('blur',{bubbles:true}));
 el.focus();updateAudit();status(`Đã điền bài ${row}: ${value}. Kiểm tra trước khi lưu.`);if($('#q20-echo')?.checked)say(scorePhrase(row,value));
}
function consume(s){
 const p=parseLine(s,current());if(p.error){status(`${p.error} Nhận được: “${s}”`);return;}
 if(!window.confirm(`Giọng nói nhận được: “${s}”.\nNhập bài ${p.row}: ${p.value}?`)){status('Đã bỏ lượt nhận dạng, không thay đổi điểm.');return;}
 inputScore(p.row,p.value);
}
function stopVoice(){state.recognition?.stop();state.recognition=null;const b=$('#q20-mic');if(b)b.textContent='🎙️ Bắt đầu đọc điểm';}
function listen(){
 if(!SR){status('Trình duyệt này chưa hỗ trợ nhận dạng giọng nói. Có thể dùng Chrome máy tính hoặc nhập tay.');return;}
 if(state.recognition){stopVoice();return;}
 const r=new SR();state.recognition=r;r.lang='vi-VN';r.continuous=false;r.interimResults=false;r.maxAlternatives=1;
 r.onresult=e=>{const t=e.results?.[0]?.[0]?.transcript;if(t)consume(t);};
 r.onerror=e=>status(`Không nhận giọng nói (${e.error}). Vui lòng thử lại hoặc nhập tay.`);
 r.onend=()=>{if(state.recognition===r)state.recognition=null;const b=$('#q20-mic');if(b)b.textContent='🎙️ Bắt đầu đọc điểm';};
 r.start();$('#q20-mic').textContent='■ Dừng micro';status('Đang nghe một điểm. Ví dụ: “Bài 5 điểm bảy phẩy năm”.');
}
function audit(){
 const all=inputs();const missing=[],invalid=[],done=[];
 all.forEach((el,i)=>{const v=el.value.trim();if(!v){missing.push(i+1);return;}
 const n=Number(v.replace(',','.'));if(!/^\d{1,2}(?:[.,]\d{1,2})?$/.test(v)||!Number.isFinite(n)||n<0||n>10){invalid.push(i+1);return;}
 done.push(i+1);});return {missing,invalid,done,total:all.length};
}
function updateAudit(){
 const el=$('#q22-audit');if(!el)return;
 const a=audit();const checked=a.done.filter(i=>state.verified.has(i)).length;
 el.textContent=`Đã nhập ${a.done.length}/${a.total} · Đã đối chiếu ${checked}/${a.total} · Trống ${a.missing.length} · Sai định dạng ${a.invalid.length}`;
 const warn=$('#q22-warning');if(warn){const parts=[];
 if(a.missing.length)parts.push(`Chưa nhập: ${a.missing.slice(0,12).join(', ')}${a.missing.length>12?'…':''}`);
 if(a.invalid.length)parts.push(`Sai điểm: ${a.invalid.join(', ')}`);
 warn.textContent=parts.join(' | ')||'Đã có điểm hợp lệ ở tất cả các dòng. Vẫn cần đối chiếu với bài giấy.';}
}
// Q23: Session-scoped verification snapshots; do not store grades or student names.
const fingerprint=v=>{let h=2166136261;for(let i=0;i<v.length;i++){h^=v.charCodeAt(i);h=Math.imul(h,16777619);}return (h>>>0).toString(36);};
function sheetKey(){
 const meta=['grade','subject','examDate','phach'].map(id=>$('#'+id)?.value||'').join('|');
 if(!$('#phach')?.value.trim())return null;
 return 'htb-q23-review-'+fingerprint([location.pathname,meta].join('|'));
}
function restoreVerified(){
 state.verified.clear();
 const key=sheetKey();if(!key)return updateAudit();
 try{const saved=JSON.parse(sessionStorage.getItem(key)||'{}');
  const vals=saved.rows||{};
  inputs().forEach((el,i)=>{if(typeof vals[i+1]==='string'&&vals[i+1]===el.value.trim()&&auditValid(el.value))state.verified.add(i+1);});
 }catch(_){}
 updateAudit();
}
function auditValid(v){const s=String(v||'').trim();const n=Number(s.replace(',','.'));return /^\d{1,2}(?:[.,]\d{1,2})?$/.test(s)&&Number.isFinite(n)&&n>=0&&n<=10;}
function storeVerified(){
 const key=sheetKey();if(!key)return;
 const a=inputs(), rows={};
 state.verified.forEach(i=>{if(a[i-1]&&auditValid(a[i-1].value))rows[i]=a[i-1].value.trim();});
 try{sessionStorage.setItem(key,JSON.stringify({rows}));}catch(_){}
}
function preflight(){
 const a=audit(),n=a.done.filter(i=>state.verified.has(i)).length;
 let msg=`Kiểm tra trước xác nhận: ${a.done.length}/${a.total} bài có điểm, ${n} bài đã được giáo viên đối chiếu, ${a.missing.length} ô trống, ${a.invalid.length} điểm sai định dạng.`;
 if(a.missing.length)msg+='\\nDòng trống: '+a.missing.slice(0,15).join(', ')+(a.missing.length>15?'…':'')+'.';
 if(a.invalid.length)msg+='\\nĐiểm sai: '+a.invalid.slice(0,15).join(', ')+'.';
 if(n<a.done.length)msg+='\\nCòn '+(a.done.length-n)+' bài có điểm chưa được đánh dấu đã đối chiếu.';
 msg+='\\nChỉ giáo viên mới có thể quyết định xác nhận phiếu. Báo cáo này không tự lưu và không khóa phiếu.';
 alert(msg);
 status('Đã hiển thị báo cáo kiểm tra trước xác nhận.');
}
function verifyCurrent(){
 const a=inputs();let i=Math.max(0,Math.min(a.length-1,Number($('#q20-from')?.value||1)-1));
 if(!a[i]||!a[i].value.trim())return status(`Bài ${i+1} chưa có điểm, không thể đánh dấu đã dò.`);
 const n=Number(a[i].value.replace(',','.'));if(!Number.isFinite(n)||n<0||n>10)return status('Điểm không hợp lệ. Hãy sửa trước khi đánh dấu.');
 state.verified.add(i+1);storeVerified();updateAudit();status(`Đã đánh dấu bài ${i+1} được giáo viên đối chiếu. Không tự xác nhận phiếu.`);
}
function clearVerified(){state.verified.clear();storeVerified();updateAudit();status('Đã đặt lại dấu đối chiếu trên màn hình. Không thay đổi điểm.');}
function stopRead(quiet=false){
 state.reading=false;state.paused=false;state.token++;
 if('speechSynthesis' in window)speechSynthesis.cancel();
 if(!quiet)status('Đã dừng đọc dò điểm.');
 const pause=$('#q21-pause');if(pause)pause.textContent='⏸ Tạm dừng';
}
function readNext(){
 if(!state.reading||state.paused)return;
 const a=inputs();if(!a.length){stopRead();return;}
 if(state.index>=a.length){stopRead(true);status(`Đã đọc xong ${a.length} dòng. Hãy đối chiếu với bài giấy trước khi xác nhận.`);return;}
 const i=state.index++, token=state.token;
 const v=a[i].value.trim();a[i].closest('tr')?.scrollIntoView({block:'nearest',behavior:'smooth'});
 $('#q20-from').value=i+1;status(`Đang dò bài ${i+1}/${a.length} — ${v||'chưa nhập'}`);
 say(scorePhrase(i+1,v),()=>{
   if(!state.reading||token!==state.token)return;
   window.setTimeout(()=>{if(state.reading&&!state.paused&&token===state.token)readNext();},config().delay);
 });
}
function startRead(){
 stopVoice();
 if(!('speechSynthesis' in window)){status('Trình duyệt không hỗ trợ phát âm.');return;}
 stopRead(true);
 state.reading=true;state.index=Math.max(0,Math.min(inputs().length-1,Number($('#q20-from').value||1)-1));readNext();
}
function togglePause(){
 if(!state.reading)return status('Hãy chọn Dò điểm trước.');
 state.paused=!state.paused;state.token++;
 if('speechSynthesis' in window)speechSynthesis.cancel();
 const btn=$('#q21-pause');if(btn)btn.textContent=state.paused?'▶ Tiếp tục':'⏸ Tạm dừng';
 if(state.paused){state.index=Math.max(0,state.index-1);status('Đã tạm dừng. Nhấn Tiếp tục để đọc lại bài hiện tại.');}
 else readNext();
}
function move(delta){
 const a=inputs();if(!a.length)return;
 const target=state.reading?state.index-1+delta:Number($('#q20-from')?.value||1)-1+delta;
 state.index=Math.max(0,Math.min(a.length-1,target));
 $('#q20-from').value=state.index+1;
 if(state.reading){stopRead(true);state.reading=true;readNext();}
 else status(`Đã chọn bài số ${state.index+1}. Nhấn Dò điểm để bắt đầu.`);
}
function mount(){
 if(!$('.scores input.score')||$('#q20-panel'))return;
 const toolbar=$('.table-toolbar');if(!toolbar)return;
 const locked=!inputs().some(e=>!e.disabled);
 const node=document.createElement('section');node.id='q20-panel';node.className='q20-panel screen-only';
 node.innerHTML=`<div class="q20-title"><strong>🎙️ Nhập điểm bằng giọng nói & dò điểm</strong><span>Hỗ trợ · không tự lưu</span></div>
 <div class="q20-controls"><button type="button" class="q20-btn" id="q20-mic" ${locked?'disabled':''}>🎙️ Bắt đầu đọc điểm</button><label><input type="checkbox" id="q20-echo" checked> Đọc lại điểm đã nhận</label><label>Từ bài <input id="q20-from" type="number" min="1" max="50" value="1" aria-label="Bắt đầu đọc dò từ bài"></label><button class="q20-btn" type="button" id="q20-read">🔊 Dò điểm 50 bài</button><button class="q20-btn" type="button" id="q20-stop">■ Dừng đọc</button></div>
 <div class="q21-settings"><label>Giọng đọc <select id="q21-voice" aria-label="Giọng đọc tiếng Việt"><option value="">Tự động – tiếng Việt theo thiết bị</option></select></label><label>Tốc độ <select id="q21-rate"><option value="0.8">Chậm</option><option value="1" selected>Bình thường</option><option value="1.1">Nhanh</option></select></label><label>Nghỉ giữa bài <select id="q21-gap"><option value="800">0,8 giây</option><option value="1200" selected>1,2 giây</option><option value="1600">1,6 giây</option><option value="2000">2 giây</option></select></label><div class="q21-buttons"><button type="button" class="q20-btn" id="q21-preview">🔊 Nghe giọng mẫu</button><button type="button" class="q20-btn" id="q21-prev">◀ Bài trước</button><button type="button" class="q20-btn" id="q21-pause">⏸ Tạm dừng</button><button type="button" class="q20-btn" id="q21-next">Bài tiếp ▶</button></div></div><p id="q21-voice-note" class="q21-note"></p>
 <div class="q22-review"><strong>Kiểm tra phiếu trước khi lưu</strong><p id="q22-audit" aria-live="polite">Đang kiểm tra…</p><p id="q22-warning"></p><div class="q21-buttons"><button type="button" class="q20-btn" id="q22-check">✓ Đã đối chiếu bài đang chọn</button><button type="button" class="q20-btn" id="q22-scan">↻ Kiểm tra thiếu/sai điểm</button><button type="button" class="q20-btn" id="q22-reset">Xóa dấu đã dò</button><button type="button" class="q20-btn" id="q23-report">📋 Báo cáo trước xác nhận</button></div><small>Dấu đối chiếu được nhớ trong phiên trình duyệt cho cùng phiếu và cùng điểm; tự hủy khi điểm thay đổi. Không đồng bộ lên máy chủ hoặc thay thế xác nhận chính thức. Mọi điểm vẫn phải được kiểm tra với bài giấy.</small></div>
 <p id="q20-status" role="status">Nên đọc “Bài 1 điểm tám phẩy năm”. Mỗi lần nhận một điểm và xác nhận trước khi nhập. Dò điểm chỉ đọc dữ liệu đang có trên phiếu.</p>`;
 toolbar.insertAdjacentElement('afterend',node);
 $('#q20-mic').onclick=listen;$('#q20-read').onclick=startRead;$('#q20-stop').onclick=()=>{stopVoice();stopRead();};
 $('#q22-check').onclick=verifyCurrent;$('#q22-scan').onclick=updateAudit;$('#q22-reset').onclick=clearVerified;$('#q23-report').onclick=preflight;
 $('.scores')?.addEventListener('input',e=>{if(e.target.matches('input.score')){const idx=inputs().indexOf(e.target);state.verified.delete(idx+1);storeVerified();updateAudit();}}, {signal:undefined});
 restoreVerified();
 $('#q21-pause').onclick=togglePause;
 $('#q21-prev').onclick=()=>move(-1);$('#q21-next').onclick=()=>move(1);
 $('#q21-preview').onclick=()=>{stopRead(true);say(scorePhrase(1,'7,5')+'. '+scorePhrase(2,'8')+'.');status('Đang phát giọng mẫu từ trình duyệt của bạn.');};
 voiceList();
 if(window.speechSynthesis)window.speechSynthesis.addEventListener?.('voiceschanged',voiceList);

}
const obs=new MutationObserver(()=>{if(!$('.scores')){if(state.recognition)stopVoice();if(state.reading)stopRead();}else mount();});
function init(){obs.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});mount();}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
