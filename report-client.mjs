// In-memory data is cleared at every account change; no JWT is persisted.
export function sessionToken(create,clock=Date.now){
 let saved=null,expires=0,pending=null,generation=0;
 return {clear(){generation++;saved=null;expires=0;pending=null;},async get(){
  if(saved&&clock()<expires)return saved;
  if(pending)return pending;
  const own=generation;
  const request=Promise.resolve().then(create).then(value=>{
   if(own!==generation)throw Error('Phiên đăng nhập đã thay đổi. Hãy thử lại.');
   saved=value;expires=clock()+60000;return value;
  }).finally(()=>{if(own===generation)pending=null;});
  pending=request;return request;
 }};
}
export function reportClient(api,clock=Date.now){
 let generation=0;const reports=new Map(),lists=new Map(),pending=new Map();
 async function once(key,read){if(pending.has(key))return pending.get(key);const own=generation;
  const request=Promise.resolve().then(read).then(value=>{if(own!==generation)throw Error('Phiên đăng nhập đã thay đổi');return value;}).finally(()=>{if(own===generation)pending.delete(key);});pending.set(key,request);return request;
 }
 function remember(item){if(!item?.id)return;reports.delete(item.id);reports.set(item.id,structuredClone(item));if(reports.size>8)reports.delete(reports.keys().next().value);}
 return {
  clear(){generation++;reports.clear();lists.clear();pending.clear();},
  invalidateLists(){lists.clear();},
  async list(year,term='',before=null,refresh=false){
   const query=new URLSearchParams({year});if(term)query.set('term',term);if(before)query.set('before',before);
   const key=query.toString(),cached=lists.get(key);if(!refresh&&cached&&clock()-cached.at<30000)return structuredClone(cached.value);
   const value=await once('list:'+key,()=>api('/reports?'+key));lists.set(key,{at:clock(),value:structuredClone(value)});return structuredClone(value);
  },
  async get(id){if(reports.has(id)){const item=reports.get(id);remember(item);return structuredClone(item);}
   const item=await once('report:'+id,()=>api('/reports/'+encodeURIComponent(id)+'?view=raw'));remember(item);return structuredClone(item);
  },
  async latest(year){const r=await once('latest:'+year,()=>api('/reports/latest?year='+encodeURIComponent(year)));r.items.forEach(remember);return structuredClone(r.items);}
 };
}
