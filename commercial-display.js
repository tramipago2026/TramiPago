(function(){
  "use strict";

  function cleanCommercialCopy(){
    document.querySelectorAll('.service-summary-row').forEach(row=>{
      const label=(row.querySelector('span')?.textContent||'').trim();
      if(/costo oficial|tasa[s]? oficial/i.test(label))row.remove();
    });

    document.querySelectorAll('.service-summary-block li').forEach(item=>{
      const text=(item.textContent||'').trim();
      if(/costo oficial|tr[aá]mite oficial gratuito|arancel oficial/i.test(text))item.remove();
    });
  }

  let queued=false;
  function queue(){
    if(queued)return;
    queued=true;
    requestAnimationFrame(()=>{queued=false;cleanCommercialCopy();});
  }

  const target=document.getElementById('app')||document.body;
  new MutationObserver(queue).observe(target,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',queue);
  window.addEventListener('hashchange',queue);
  queue();
})();