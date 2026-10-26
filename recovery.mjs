// IndexedDB keeps original File objects so an unfinished source upload can resume.
export function draftStore(factory=globalThis.indexedDB){
 let connection;
 function db(){return connection??=new Promise((resolve,reject)=>{if(!factory)return reject(Error('IndexedDB unavailable'));let r=factory.open('htb-hqgd-drafts',1);r.onupgradeneeded=()=>r.result.createObjectStore('drafts');r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});}
 async function transaction(mode,action){const d=await db();return new Promise((resolve,reject)=>{let tx=d.transaction('drafts',mode),r=action(tx.objectStore('drafts'));tx.oncomplete=()=>resolve(r.result);tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||Error('Draft transaction aborted'));});}
 return {get:key=>transaction('readonly',s=>s.get(key)),put:(key,value)=>transaction('readwrite',s=>s.put(value,key))};
}
export async function latestReports(api,year){
 const found=new Map();let cursor=null;const seen=new Set();
 do{let r=await api('/reports'+(cursor?'?before='+encodeURIComponent(cursor):''));for(let item of r.items){if(item.year===year&&[1,2].includes(item.term)&&!found.has(item.term))found.set(item.term,item);}cursor=r.next;if(cursor&&seen.has(cursor))throw Error('Phân trang báo cáo bị lặp');if(cursor)seen.add(cursor);}while(cursor&&found.size<2);
 return [...found.values()];
}
