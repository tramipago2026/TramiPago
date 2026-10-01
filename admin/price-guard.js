(function(){
  "use strict";

  function expectedAmountText(){
    const fields=[...document.querySelectorAll('#request-detail .detail-grid .field')];
    for(const field of fields){
      const label=field.querySelector('small');
      if(!label)continue;
      const text=(label.textContent||'').trim().toLowerCase();
      if(text==='importe'||text==='importe esperado'){
        label.textContent='Importe esperado';
        return (field.querySelector('strong')?.textContent||'').trim()||'Sin importe';
      }
    }
    return 'Sin importe';
  }

  function refreshLabel(){expectedAmountText();}

  document.addEventListener('submit',event=>{
    const form=event.target;
    if(!(form instanceof HTMLFormElement)||form.id!=='status-form')return;
    const submitter=event.submitter;
    if(!submitter||submitter.value!=='payment_confirmed')return;
    const amount=expectedAmountText();
    const ok=window.confirm(`Importe esperado: ${amount}\n\nConfirmá solamente si el comprobante coincide con este importe.`);
    if(!ok){
      event.preventDefault();
      event.stopImmediatePropagation();
    }
  },true);

  const detail=document.getElementById('request-detail');
  if(detail){
    new MutationObserver(refreshLabel).observe(detail,{childList:true,subtree:true});
    refreshLabel();
  }
})();