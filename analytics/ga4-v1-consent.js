/* Aviso opcional, sin Google Analytics si se rechaza o no se responde. */
(function(){
'use strict';
const key='tramipago_analytics_consent_v1',api=window.TramiPagoGA4,cfg=window.TramiPagoAnalyticsConfig;
if(!api||!cfg||!cfg.enabled)return;
function choice(){try{const v=localStorage.getItem(key);return v==='yes'||v==='no'?v:null;}catch{return null;}}
function save(v){try{localStorage.setItem(key,v);}catch{}}
function make(tag,cls,txt){const e=document.createElement(tag);e.className=cls;e.textContent=txt||'';return e;}
const root=make('div','tp-ga4-root');root.id='tp-ga4-ui';
const panel=make('section','tp-ga4-panel');panel.setAttribute('role','dialog');panel.setAttribute('aria-label','Preferencias de analítica');
const desc=make('div','tp-ga4-desc');
desc.appendChild(make('strong','','Analítica opcional'));
desc.appendChild(make('p','','Usamos Google Analytics 4 para medir visitas y páginas consultadas. Solo se activa si aceptás. Podés cambiar tu elección cuando quieras.'));
const info=make('a','','Política de Privacidad');info.href='/politica-privacidad.html';desc.appendChild(info);
const controls=make('div','tp-ga4-actions');
const reject=make('button','tp-ga4-no','Rechazar');reject.type='button';
const accept=make('button','tp-ga4-yes','Aceptar analítica');accept.type='button';
controls.append(reject,accept);panel.append(desc,controls);
const reopen=make('button','tp-ga4-reopen','Privacidad');reopen.type='button';
reopen.setAttribute('aria-label','Cambiar preferencia de analítica');
root.append(panel,reopen);document.body.appendChild(root);
function update(){
 const c=choice();panel.hidden=c!==null;reopen.hidden=c===null;
 reopen.textContent=c==='yes'?'Analítica: aceptada':'Privacidad';
}
function decide(v){
 const old=choice();save(v);
 if(v==='yes')api.start(cfg.measurementId,{consentGranted:true});
 else if(old==='yes'){api.revokeConsent();window.location.reload();return;}
 update();
}
reject.addEventListener('click',()=>decide('no'));
accept.addEventListener('click',()=>decide('yes'));
reopen.addEventListener('click',()=>{panel.hidden=false;reopen.hidden=true;});
if(choice()==='yes')api.start(cfg.measurementId,{consentGranted:true});
update();
})();