export const PERIOD_IDS=['gk1','hk1','gk2','hk2'];
export function defaultSettings(year){return {year,version:0,enabled:[...PERIOD_IDS],defaultPeriod:'gk1',updatedAt:null};}
export function validYear(year){return typeof year==='string'&&/^20\d{2}-20\d{2}$/.test(year)&&Number(year.slice(5))===Number(year.slice(0,4))+1;}
export function validateSettings(input){
 if(!input||!validYear(input.year))throw Error('Năm học phải theo dạng 2026-2027 và gồm hai năm liên tiếp');
 if(!Number.isSafeInteger(input.version)||input.version<0)throw Error('Phiên bản cấu hình không hợp lệ');
 if(!Array.isArray(input.enabled)||!input.enabled.length||input.enabled.length>4||new Set(input.enabled).size!==input.enabled.length||input.enabled.some(p=>!PERIOD_IDS.includes(p)))throw Error('Cần chọn ít nhất một đợt hợp lệ, không trùng');
 if(!input.enabled.includes(input.defaultPeriod))throw Error('Đợt mặc định phải thuộc các đợt đang hiển thị');
 return {year:input.year,version:input.version,enabled:PERIOD_IDS.filter(p=>input.enabled.includes(p)),defaultPeriod:input.defaultPeriod};
}
export async function loadYearSettings(DB,year){
 if(!validYear(year))throw Error('Năm học không hợp lệ');
 const row=await DB.prepare('SELECT version,payload,updated_at FROM year_settings WHERE year=?').bind(year).first();
 return row?{year,version:row.version,...JSON.parse(row.payload),updatedAt:row.updated_at}:defaultSettings(year);
}
export async function saveYearSettings(DB,input,user){
 const s=validateSettings(input),time=new Date().toISOString(),payload=JSON.stringify({enabled:s.enabled,defaultPeriod:s.defaultPeriod});let r;
 if(s.version===0)r=await DB.prepare('INSERT INTO year_settings(year,version,payload,updated_by,updated_at) VALUES(?,1,?,?,?) ON CONFLICT(year) DO NOTHING').bind(s.year,payload,user,time).run();
 else r=await DB.prepare('UPDATE year_settings SET version=version+1,payload=?,updated_by=?,updated_at=? WHERE year=? AND version=?').bind(payload,user,time,s.year,s.version).run();
 if(!r.meta?.changes)throw Object.assign(Error('Cấu hình đã được người khác thay đổi. Bấm Tải cấu hình rồi thử lại.'),{status:409});
 return {...s,version:s.version+1,updatedAt:time};
}
