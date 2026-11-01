/* TramiPago V1: medición opcional. No envía datos antes del consentimiento. */
(function(){
'use strict';
const w=window,marker='tramipago_v1_internal_analytics_test';
let active=false,loading=false,id='';
function isTestBrowser(){try{return w.localStorage.getItem(marker)==='1';}catch{return false;}}
function markTestBrowser(){try{w.localStorage.setItem(marker,'1');if(active||loading){revokeConsent();w.location.reload();}return true;}catch{return false;}}
function unmarkTestBrowser(){try{w.localStorage.removeItem(marker);return true;}catch{return false;}}
function safePage(){
  const h=String(w.location.hash||'');
  // Sólo nombres de rutas conocidos. Evitar consultas, números de solicitud y datos de formularios.
  const match=/^#\/(tramite|familia|seguimiento|ayuda|contacto|inicio)(?:\/([a-z][a-z-]{2,50}))?(?:$|\?)/i.exec(h);
  let route=match?'#/'+match[1]:'#/';
  if(match&&match[1]==='tramite'&&match[2]&&h==='#/tramite/'+match[2])route+='/'+match[2];
  return w.location.origin+w.location.pathname+route;
}
function safeReferrer(){try{const r=new URL(document.referrer);return /^https?:$/.test(r.protocol)?r.origin+'/':'';}catch{return '';}}
function gtag(){w.dataLayer.push(arguments);}
function view(){
  if(!active||isTestBrowser())return;
  gtag('event','page_view',{page_location:safePage(),page_referrer:safeReferrer(),page_title:'TramiPago',debug_mode:isTestBrowser()});
}
function start(measurementId,opts){
  if(isTestBrowser()||!opts||opts.consentGranted!==true||!/^G-[A-Z0-9]{4,15}$/.test(measurementId)||loading||active)return false;
  id=measurementId;loading=true;w.dataLayer=w.dataLayer||[];
  gtag('consent','default',{analytics_storage:'denied',ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied'});
  const s=document.createElement('script');s.async=true;
  s.src='https://www.googletagmanager.com/gtag/js?id='+encodeURIComponent(id);
  s.onload=function(){
    if(!loading||isTestBrowser()){loading=false;return;}
    loading=false;active=true;
    gtag('consent','update',{analytics_storage:'granted'});
    gtag('js',new Date());
    gtag('config',id,{send_page_view:false,debug_mode:isTestBrowser(),page_location:safePage(),page_referrer:safeReferrer(),page_title:'TramiPago',allow_google_signals:false,allow_ad_personalization_signals:false});
    view();
  };
  s.onerror=function(){loading=false;id='';};
  document.head.appendChild(s);return true;
}
function revokeConsent(){
  active=false;loading=false;id='';
  if(w.dataLayer)gtag('consent','update',{analytics_storage:'denied'});
}
w.addEventListener('hashchange',view);
w.TramiPagoGA4=Object.freeze({start,revokeConsent,markTestBrowser,unmarkTestBrowser,isTestBrowser});
})();