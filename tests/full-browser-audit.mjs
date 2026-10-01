import { chromium } from "playwright";

const expectedPath="assets/promo-tramite-online-exact-20261001.png";
const expectedHash="2acbad4c9c3f6539f81faea2373ad103f4c92986ce23b095eea7522d04a41771";
const browser=await chromium.launch({headless:true});
const page=await browser.newPage({viewport:{width:1365,height:768}});
const failures=[];
const ok=(cond,msg)=>{if(!cond)failures.push(msg);};

await page.goto("https://tramipago.com.ar/#/",{waitUntil:"networkidle"});
await page.waitForTimeout(800);

const card=page.locator(".promo-rail-card");
const next=page.locator(".promo-rail-arrow.next");
ok(await card.count()===1,"No se encontró la tarjeta visible del carrusel");
ok(await next.count()===1,"No se encontró la flecha siguiente del carrusel");

let found=false;
let details=null;
for(let i=0;i<20;i++){
  const img=card.locator("img");
  const src=(await img.getAttribute("src"))||"";
  if(src.includes(expectedPath)){
    found=true;
    const href=(await card.getAttribute("href"))||"";
    const visible=await img.evaluate(el=>{
      const s=getComputedStyle(el), r=el.getBoundingClientRect();
      const c=document.createElement("canvas"); c.width=96; c.height=96;
      const ctx=c.getContext("2d"); ctx.drawImage(el,0,0,96,96);
      const d=ctx.getImageData(0,0,96,96).data;
      let min=255,max=0,sum=0,n=0;
      for(let j=0;j<d.length;j+=4){
        const y=(d[j]+d[j+1]+d[j+2])/3;
        min=Math.min(min,y); max=Math.max(max,y); sum+=y; n++;
      }
      const cx=r.left+r.width/2, cy=r.top+r.height/2;
      const top=document.elementFromPoint(cx,cy);
      return {
        complete:el.complete,naturalWidth:el.naturalWidth,naturalHeight:el.naturalHeight,
        width:r.width,height:r.height,display:s.display,visibility:s.visibility,opacity:Number(s.opacity),
        objectFit:s.objectFit,contrast:max-min,average:sum/n,
        centerCovered:!(top===el || el.contains(top) || el.parentElement?.contains(top))
      };
    });
    const hash=await page.evaluate(async src=>{
      const response=await fetch(src,{cache:"no-store"});
      if(!response.ok)return "HTTP_"+response.status;
      const buf=await response.arrayBuffer();
      const digest=await crypto.subtle.digest("SHA-256",buf);
      return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,"0")).join("");
    },src);
    details={src,href,hash,visible};
    ok(hash===expectedHash,"El archivo servido en producción no coincide byte por byte con la imagen adjunta");
    ok(visible.complete && visible.naturalWidth===1254 && visible.naturalHeight===1254,"La imagen no carga con dimensiones originales 1254x1254");
    ok(visible.display!=="none" && visible.visibility!=="hidden" && visible.opacity>0.99,"La imagen está oculta o transparente");
    ok(Math.abs(visible.width-visible.height)<2,"La imagen se muestra deformada: "+visible.width+"x"+visible.height);
    ok(visible.contrast>80 && visible.average<245,"La imagen visible parece en blanco o sin contenido");
    ok(!visible.centerCovered,"La imagen está tapada por otro elemento en el centro");
    ok(href.startsWith("https://wa.me/5491167083232?text="),"La publicidad no abre el WhatsApp correcto");
    ok(decodeURIComponent(href).includes("Quiero consultar por un trámite online."),"El mensaje de WhatsApp no es el solicitado");
    break;
  }
  await next.click();
  await page.waitForTimeout(180);
}
ok(found,"La publicidad exacta no apareció al recorrer el carrusel");

console.log("PRODUCTION_EXACT_PROMO",JSON.stringify(details));
await browser.close();
if(failures.length){
  for(const f of failures)console.error("ERROR",f);
  process.exit(1);
}
console.log("PASS: producción muestra el archivo exacto, visible, sin deformación y con WhatsApp correcto.");
