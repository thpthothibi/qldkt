import {className,number,norm,SUBJECTS} from './engine.mjs';
// Uses text positions and the actual teacher-cell borders, including merged cells.
export function parsePage(content,ops,OPS,pageNumber){
 const items=content.items.filter(t=>t.str?.trim()).map(t=>({s:norm(t.str),x:t.transform[4],y:t.transform[5],w:t.width,h:t.height||10}));
 const text=items.map(t=>t.s).join(' '),summary=/KQ/.test(text)&&/Lần 1/.test(text),distribution=/Thống kê điểm số/.test(text);
 if(!summary&&!distribution)return {page:pageNumber,format:'unsupported',rows:[],warnings:['Không nhận diện được mẫu bảng']};
 const classItems=items.filter(t=>/^(10|11|12)[A-Z]{1,5}\d{1,3}$/.test(t.s));
 const lines=[];let ctm=[1,0,0,1,0,0],stack=[];
 const point=(x,y)=>[ctm[0]*x+ctm[2]*y+ctm[4],ctm[1]*x+ctm[3]*y+ctm[5]];
 for(let i=0;i<ops.fnArray.length;i++){
  let fn=ops.fnArray[i],a=ops.argsArray[i];if(fn===OPS.save)stack.push([...ctm]);else if(fn===OPS.restore)ctm=stack.pop()||ctm;else if(fn===OPS.transform){let [a0,b,c,d,e,f]=a,[aa,bb,cc,dd,ee,ff]=ctm;ctm=[aa*a0+cc*b,bb*a0+dd*b,aa*c+cc*d,bb*c+dd*d,aa*e+cc*f+ee,bb*e+dd*f+ff];}
  else if(fn===OPS.constructPath&&a[2]?.length===4){let b=a[2],p=point(b[0],b[1]),q=point(b[2],b[3]);lines.push({x0:Math.min(p[0],q[0]),x1:Math.max(p[0],q[0]),y0:Math.min(p[1],q[1]),y1:Math.max(p[1],q[1])});}
 }
 const vertical=lines.filter(l=>Math.abs(l.x1-l.x0)<.8&&l.y1-l.y0>20),xs=[...new Set(vertical.map(l=>Math.round(l.x0*10)/10))].sort((a,b)=>a-b);
 const rows=[],warnings=[];
 for(let c of classItems){
  let ci=xs.findIndex((x,i)=>x<c.x+1&&xs[i+1]>c.x+c.w-1);if(ci<0){warnings.push(`${c.s}: không xác định được cột`);continue;}
  const cell=(index)=>items.filter(t=>t.x+t.w/2>xs[index]+.8&&t.x+t.w/2<xs[index+1]-.8&&Math.abs(t.y-c.y)<4).sort((a,b)=>a.x-b.x).map(t=>t.s).join(' ');
  let teacher='',mid=null,final=null,n=null;
  if(summary){
   let left=xs[ci-1],right=xs[ci],bounds=lines.filter(l=>Math.abs(l.y1-l.y0)<.8&&l.x0<=left+1&&l.x1>=right-1).map(l=>l.y0);
   let cy=c.y+c.h*.4,lo=Math.max(-Infinity,...bounds.filter(y=>y<cy)),hi=Math.min(Infinity,...bounds.filter(y=>y>cy));
   if(Number.isFinite(lo)&&Number.isFinite(hi))teacher=items.filter(t=>t.x>=left+1&&t.x+t.w<=right+1&&t.y+t.h*.4>lo&&t.y+t.h*.4<hi).sort((a,b)=>b.y-a.y||a.x-b.x).map(t=>t.s).join(' ');
   mid=number(cell(ci+1));final=number(cell(ci+2));
  }else{
   n=number(cell(ci+1));final=number(cell(ci+10));teacher=cell(ci+11);
   let bins=Array.from({length:6},(_,j)=>number(cell(ci+2+j))),count=bins.every(x=>x!==null)?bins.reduce((a,b)=>a+b,0):null;
   if(count!==null&&count!==n)warnings.push(`${c.s}: Số HS dự KT (${n}) khác tổng nhóm điểm (${count}); giữ nguyên điểm BQ nguồn, cần kiểm tra VietSchool`);
  }
  rows.push({subject:'',class:className(c.s),teacher:norm(teacher),mid,final,n,page:pageNumber});
 }
 let detected=SUBJECTS.find(s=>new RegExp(`(?:MÔN|Môn)\\s*[:：]?\\s*${s}(?:\\s|$)`,'iu').test(text))||'';
 return {page:pageNumber,format:summary?'summary':'distribution',sourceTerm:Number(text.match(/HỌC KỲ\s*([12])/iu)?.[1])||null,subject:detected,rows,warnings};
}
export async function readPDF(data,pdfjs,progress=()=>{}){
 const doc=await pdfjs.getDocument({data,useSystemFonts:true}).promise,pages=[];
 if(doc.numPages>200)throw Error('Tối đa 200 trang mỗi lần nhập');
 try{for(let i=1;i<=doc.numPages;i++){let p=await doc.getPage(i);pages.push(parsePage(await p.getTextContent(),await p.getOperatorList(),pdfjs.OPS,i));progress(i,doc.numPages);p.cleanup();}}finally{await doc.destroy();}return pages;
}
