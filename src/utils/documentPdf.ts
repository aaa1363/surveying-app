import html2canvas from 'html2canvas-pro';
import {jsPDF} from 'jspdf';
import {Capacitor} from '@capacitor/core';
import {Share} from '@capacitor/share';
import {AppCacheFile} from '../services/appCacheFile';

export interface PdfResult {bytes: Uint8Array; fileName: string; pages: number;}

export function safeDocumentFileName(type: string, documentNumber?: string): string {
  const safe=(documentNumber||'draft').replace(/[^A-Za-z0-9_-]/g,'-').replace(/-+/g,'-');
  return `${type}-${safe}.pdf`;
}

export async function generateDocumentPdf(element: HTMLElement, fileName: string): Promise<PdfResult> {
  // Keep the binary asset lazy: the Node test runner can import this module
  // without trying to interpret a TTF file, while Vite still bundles it.
  const {default:vazirmatnUrl}=await import('vazirmatn/fonts/ttf/Vazirmatn-Regular.ttf?url');
  const fontBytes=new Uint8Array(await (await fetch(vazirmatnUrl)).arrayBuffer());
  const canvas=await html2canvas(element,{scale:2,backgroundColor:'#ffffff',useCORS:false,logging:false,windowWidth:794});
  if(!canvas.width||!canvas.height)throw new Error('محتوای سند برای تولید PDF در دسترس نیست.');
  const pdf=new jsPDF({orientation:'portrait',unit:'mm',format:'a4',compress:true});
  pdf.addFileToVFS('Vazirmatn-Regular.ttf',bytesToBase64(fontBytes));
  pdf.addFont('Vazirmatn-Regular.ttf','Vazirmatn','normal');
  const pageWidth=210,pageHeight=297,margin=10,usableWidth=pageWidth-margin*2,usableHeight=pageHeight-margin*2;
  const imageHeight=canvas.height*usableWidth/canvas.width;
  let remaining=imageHeight,position=margin,page=1;
  const image=canvas.toDataURL('image/jpeg',0.94);
  pdf.addImage(image,'JPEG',margin,position,usableWidth,imageHeight,undefined,'FAST');
  while(remaining>usableHeight){remaining-=usableHeight;position=margin-usableHeight*page;pdf.addPage();page+=1;pdf.addImage(image,'JPEG',margin,position,usableWidth,imageHeight,undefined,'FAST');}
  const total=pdf.getNumberOfPages();
  for(let index=1;index<=total;index++){pdf.setPage(index);pdf.setFont('Vazirmatn');pdf.setFontSize(9);pdf.text(`صفحه ${index} از ${total}`,105,292,{align:'center'});}
  const bytes=new Uint8Array(pdf.output('arraybuffer'));
  if(bytes.length<1000||String.fromCharCode(...bytes.slice(0,5))!=='%PDF-')throw new Error('فایل PDF تولیدشده معتبر نیست.');
  return {bytes,fileName,pages:total};
}

export async function issueOnlyAfterPdfPreflight<T>(generate:()=>Promise<PdfResult>,issue:()=>Promise<T>):Promise<T>{
  const result=await generate();
  if(result.bytes.length<1000||String.fromCharCode(...result.bytes.slice(0,5))!=='%PDF-')throw new Error('فایل PDF تولیدشده معتبر نیست.');
  return issue();
}

function bytesToBase64(bytes:Uint8Array):string {let binary='';for(let i=0;i<bytes.length;i+=0x8000)binary+=String.fromCharCode(...bytes.subarray(i,i+0x8000));return btoa(binary);}

export async function saveOrSharePdf(result:PdfResult):Promise<'downloaded'|'shared'> {
  if(Capacitor.isNativePlatform()){
    const saved=await AppCacheFile.writePdf({fileName:result.fileName,data:bytesToBase64(result.bytes)});
    await Share.share({title:'سند آزمایشی نقشه‌برداری',text:'این سند آزمایشی است و اعتبار حقوقی ندارد.',url:saved.uri,dialogTitle:'ارسال یا چاپ سند'});
    return 'shared';
  }
  const copy=new Uint8Array(result.bytes);
  const url=URL.createObjectURL(new Blob([copy.buffer],{type:'application/pdf'}));
  const anchor=document.createElement('a');anchor.href=url;anchor.download=result.fileName;anchor.click();setTimeout(()=>URL.revokeObjectURL(url),1000);
  return 'downloaded';
}
