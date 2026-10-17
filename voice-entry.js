/* Q20 Voice Entry — optional UI enhancement, never writes directly to API. */
(()=>{'use strict';
const SR=window.SpeechRecognition||window.webkitSpeechRecognition;
const state={recognition:null,reading:false,index:0,active:false,paused:false,token:0,listening:false,listenTimer:null,listenSession:0};
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
 if(!Number.isInteger(row)||row<1||row>50)return {error:'Hãy đọc rõ STT bài từ 1 đến 50, ví dụ “Bài 12 điểm tám phẩy năm”.'};
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
 const name=$('#q21-voice')?.value??'recorded';
 const voices=window.speechSynthesis?.getVoices?.()||[];
 return {rate,delay,recorded:name==='recorded',voice:voices.find(v=>v.voiceURI===name)||null};
}
function voiceList(){
 const el=$('#q21-voice');if(!el)return;
 const previous=el.value;
 const voices=(window.speechSynthesis?.getVoices?.()||[]).filter(v=>/^vi(?:-|$)/i.test(v.lang));
 el.replaceChildren();
 el.add(new Option('Tiếng Việt rõ chữ – có sẵn','recorded'));
 const auto=new Option('Giọng theo thiết bị','');el.add(auto);
 voices.forEach(v=>el.add(new Option(`${v.name} (${v.lang})`,v.voiceURI)));
 if([...el.options].some(x=>x.value===previous))el.value=previous;
 else el.value='recorded';
 $('#q21-voice-note').textContent='';
}
// Q27: generic Vietnamese clips served with the site; no grades sent to a TTS service.
let audioContext=null,audioSource=null,audioGeneration=0;
const audioCache=new Map();
function stopPlayback(){
 audioGeneration++;state.active=false;
 if(audioSource){audioSource.onended=null;try{audioSource.stop();}catch(_){}audioSource=null;}
 if(window.speechSynthesis)window.speechSynthesis.cancel();
}
function scoreClips(row,value){
 const raw=String(value??'').trim().replace(',','.');
 const files=['row-'+row];
 if(!raw)return [...files,'empty'];
 if(!/^\d+(?:\.\d{1,2})?$/.test(raw)||Number(raw)>10)return [...files,'invalid'];
 const cents=Math.round(Number(raw)*100);
 if(cents%25===0)return [...files,'score-'+cents];
 const [whole,fraction='']=raw.split('.');
 const f=fraction.replace(/0+$/,'');
 if(!f)return [...files,'integer-'+Number(whole)];
 return [...files,'whole-'+Number(whole),'fraction-'+f];
}
async function playClips(files,then,onFailure){
 stopPlayback();state.active=true;const generation=audioGeneration;
 try{
  const Context=window.AudioContext||window.webkitAudioContext;
  if(!Context)throw new Error('audio-unavailable');
  audioContext ||= new Context();
  await audioContext.resume();
  const buffers=await Promise.all(files.map(name=>{
   if(!audioCache.has(name))audioCache.set(name,fetch(new URL('./audio/vi/'+name+'.mp3',document.baseURI)).then(r=>{if(!r.ok)throw new Error('audio-missing');return r.arrayBuffer();}).then(b=>audioContext.decodeAudioData(b)).catch(e=>{audioCache.delete(name);throw e;}));
   return audioCache.get(name);
  }));
  if(generation!==audioGeneration)return;
  // One buffer avoids autoplay restrictions and gaps between separate audio elements.
  const gaps=buffers.map((_,i)=>i===0&&buffers.length>1?Math.round(audioContext.sampleRate*0.16):0);
  const length=buffers.reduce((n,b,i)=>n+b.length+gaps[i],0);
  const joined=audioContext.createBuffer(1,length,audioContext.sampleRate);
  let offset=0;buffers.forEach((b,i)=>{joined.copyToChannel(b.getChannelData(0),0,offset);offset+=b.length+gaps[i];});
  const source=audioContext.createBufferSource();source.buffer=joined;source.playbackRate.value=config().rate;source.connect(audioContext.destination);audioSource=source;
  source.onended=()=>{if(generation===audioGeneration){audioSource=null;state.active=false;then?.();}};
  source.start();
 }catch(_){
  if(generation!==audioGeneration)return;
  state.reading=false;state.paused=false;state.active=false;state.token++;
  status('Chưa phát được âm thanh. Kiểm tra đã chép thư mục audio lên web rồi bấm Dò điểm hoặc Nghe mẫu lại.');
  onFailure?.();
 }
}
function speakScore(row,value,then,onFailure){
 if(config().recorded)return playClips(scoreClips(row,value),then,onFailure);
 say(scorePhrase(row,value),then);
}
function say(txt,then){
 if(!('speechSynthesis' in window)){then?.();return;}
 stopPlayback();
 const u=new SpeechSynthesisUtterance(txt);
 const c=config();u.lang='vi-VN';u.rate=c.rate;u.pitch=1;u.volume=1;if(c.voice)u.voice=c.voice;
 let completed=false;
 const done=()=>{if(!completed){completed=true;then?.();}};
 u.onend=done;u.onerror=done;
 speechSynthesis.speak(u);
}
function status(s){const e=$('#q20-status');if(e)e.textContent=s;}
function inputs(){return [...document.querySelectorAll('.scores input.score')];}
function current(){return inputs().findIndex(e=>!e.value.trim())+1;}
function inputScore(row,value){
 const el=inputs()[row-1];if(!el||el.disabled)return status('Phiếu đang khóa hoặc không thể sửa.');
 el.value=value;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('blur',{bubbles:true}));
 el.focus();status(`Đã điền bài ${row}: ${value}. Kiểm tra trước khi lưu.`);if(!state.listening&&$('#q20-echo')?.checked)speakScore(row,value);
 return {row,value};
}
function consume(s){
 const p=parseLine(s,current());if(p.error){status(`${p.error} Nhận được: “${s}”`);return;}
 return inputScore(p.row,p.value);
}
function stopVoice(){
 state.listening=false;state.listenSession++;
 if(state.listenTimer!==null){window.clearTimeout(state.listenTimer);state.listenTimer=null;}
 const r=state.recognition;state.recognition=null;
 if(r){r.onresult=null;r.onend=null;r.onerror=null;try{r.abort();}catch(_){try{r.stop();}catch(_){}}}
 stopPlayback();
 const b=$('#q20-mic');if(b){b.textContent='🎙️ Đọc điểm liên tục';b.setAttribute('aria-pressed','false');}
}
function queueListen(session,delay=350){
 if(!state.listening||session!==state.listenSession)return;
 if(state.listenTimer!==null)window.clearTimeout(state.listenTimer);
 state.listenTimer=window.setTimeout(()=>{state.listenTimer=null;beginListen(session);},delay);
}
function beginListen(session){
 if(!state.listening||session!==state.listenSession||state.recognition)return;
 if(!inputs().some(el=>!el.disabled)){stopVoice();status('Phiếu đang khóa hoặc không thể sửa.');return;}
 const r=new SR();state.recognition=r;r.lang='vi-VN';
 // Restart after each final phrase; pause the microphone while echo is playing.
 r.continuous=false;r.interimResults=false;r.maxAlternatives=1;
 let accepted=null,handled=false;
 const valid=()=>state.listening&&session===state.listenSession&&state.recognition===r;
 r.onresult=e=>{
  if(!valid()||handled)return;
  const result=e.results?.[e.resultIndex??0];
  if(result?.isFinal===false)return;
  const text=result?.[0]?.transcript;if(!text)return;
  handled=true;accepted=consume(text)||null;
 };
 r.onerror=e=>{
  if(!valid())return;
  if(e.error==='no-speech')return;
  stopVoice();status(`Micro đã dừng (${e.error}). Kiểm tra quyền micro hoặc kết nối rồi bấm Đọc điểm liên tục lại.`);
 };
 r.onend=()=>{
  if(!valid())return;
  state.recognition=null;
  const resume=()=>queueListen(session,350);
  if(accepted&&$('#q20-echo')?.checked){
   status(`Đã điền bài ${accepted.row}: ${accepted.value}. Đang đọc lại; chờ máy đọc xong để đọc bài tiếp.`);
   speakScore(accepted.row,accepted.value,resume,resume);
  }else queueListen(session,handled?350:800);
 };
 try{r.start();status('🎙️ Đang nghe liên tục. Đọc từng bài, ví dụ “Bài 1 điểm bảy phẩy năm”.');}
 catch(_){stopVoice();status('Không mở được micro. Kiểm tra quyền micro rồi thử lại.');}
}
function listen(){
 if(state.listening){stopVoice();status('Đã dừng micro.');return;}
 if(!SR){status('Trình duyệt này chưa hỗ trợ nhận dạng giọng nói. Có thể dùng Chrome máy tính hoặc nhập tay.');return;}
 stopRead(true);state.listening=true;const session=++state.listenSession;
 const b=$('#q20-mic');if(b){b.textContent='■ Dừng micro';b.setAttribute('aria-pressed','true');}
 beginListen(session);
}
function stopRead(quiet=false){
 state.reading=false;state.paused=false;state.token++;
 stopPlayback();
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
 speakScore(i+1,v,()=>{
   if(!state.reading||token!==state.token)return;
   window.setTimeout(()=>{if(state.reading&&!state.paused&&token===state.token)readNext();},config().delay);
 });
}
function startRead(){
 stopVoice();
 if(!config().recorded&&!('speechSynthesis' in window)){status('Trình duyệt không hỗ trợ giọng theo thiết bị. Hãy chọn giọng có sẵn.');return;}
 stopRead(true);
 state.reading=true;state.index=Math.max(0,Math.min(inputs().length-1,Number($('#q20-from').value||1)-1));readNext();
}
function togglePause(){
 if(!state.reading)return status('Hãy chọn Dò điểm trước.');
 state.paused=!state.paused;state.token++;
 stopPlayback();
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
 if(state.listening||state.recognition)stopVoice();
 if(state.reading||state.active)stopRead(true);
 const locked=!inputs().some(e=>!e.disabled);
 const node=document.createElement('section');node.id='q20-panel';node.className='q20-panel screen-only';
 node.innerHTML=`<div class="q20-title"><strong>🎙️ Nhập & dò điểm</strong><span>Không tự lưu</span></div>
 <div class="q20-controls"><button type="button" class="q20-btn" id="q20-mic" ${locked?'disabled':''} aria-pressed="false">🎙️ Đọc điểm liên tục</button><label><input type="checkbox" id="q20-echo" checked> Đọc lại</label><label>Từ bài <input id="q20-from" type="number" min="1" max="50" value="1" aria-label="Bắt đầu đọc dò từ bài"></label><button class="q20-btn" type="button" id="q20-read">🔊 Dò điểm</button><button class="q20-btn" type="button" id="q21-prev" aria-label="Bài trước">◀ Trước</button><button class="q20-btn" type="button" id="q21-pause">⏸ Tạm dừng</button><button class="q20-btn" type="button" id="q21-next" aria-label="Bài tiếp">Tiếp ▶</button><button class="q20-btn" type="button" id="q20-stop">■ Dừng</button></div>
 <div class="q21-settings"><label>Giọng <select id="q21-voice" aria-label="Giọng đọc tiếng Việt"><option value="recorded" selected>Tiếng Việt rõ chữ – có sẵn</option></select></label><label>Tốc độ <select id="q21-rate"><option value="0.8">Chậm</option><option value="1" selected>Bình thường</option><option value="1.1">Nhanh</option></select></label><label>Nghỉ <select id="q21-gap"><option value="800">0,8 giây</option><option value="1200" selected>1,2 giây</option><option value="1600">1,6 giây</option><option value="2000">2 giây</option></select></label><button type="button" class="q20-btn" id="q21-preview">🔊 Nghe mẫu</button></div>
 <p id="q21-voice-note" class="q21-note"></p><p id="q20-status" role="status"></p>`;
 toolbar.insertAdjacentElement('afterend',node);
 $('#q20-mic').onclick=listen;$('#q20-read').onclick=startRead;$('#q20-stop').onclick=()=>{stopVoice();stopRead();};
 $('#q21-pause').onclick=togglePause;
 $('#q21-prev').onclick=()=>move(-1);$('#q21-next').onclick=()=>move(1);
 $('#q21-preview').onclick=()=>{stopVoice();stopRead(true);status('Đang phát mẫu giọng đọc…');if(config().recorded)playClips(['sample'],()=>status('Đã phát xong mẫu.'));else say(scorePhrase(1,'7,5')+'. '+scorePhrase(2,'8')+'.');};
 voiceList();
 if(window.speechSynthesis)window.speechSynthesis.addEventListener?.('voiceschanged',voiceList);

}
const obs=new MutationObserver(()=>{if(!$('.scores')){if(state.listening||state.recognition)stopVoice();if(state.reading||state.active||audioSource)stopRead();}else mount();});
function init(){obs.observe(document.getElementById('app')||document.body,{childList:true,subtree:true});mount();}
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();
