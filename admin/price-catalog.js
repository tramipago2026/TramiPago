(function(){
  "use strict";

  const PROJECT_URL="https://injimzsxbnawnekybfpm.supabase.co";
  const PUBLISHABLE_KEY="sb_publishable__bYVmN8G7g1fJG28C0SN0g_WbRJ23Ua";
  const SDK_URL="https://esm.sh/@supabase/supabase-js@2.105.0";
  const fmt=value=>`$ ${Number(value||0).toLocaleString("es-AR")}`;
  const esc=value=>String(value??"").replace(/[&<>"']/g,char=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[char]));
  let priceClient=null;

  function ensureUi(){
    const head=document.querySelector('.dashboard-head');
    if(!head||document.getElementById('price-catalog-open'))return;
    const refresh=document.getElementById('refresh');
    const button=document.createElement('button');
    button.id='price-catalog-open';
    button.className='secondary';
    button.type='button';
    button.textContent='Tarifario';
    if(refresh?.parentElement) refresh.parentElement.insertBefore(button,refresh);
    else head.appendChild(button);

    const panel=document.createElement('section');
    panel.id='price-catalog-panel';
    panel.hidden=true;
    panel.style.cssText='margin:0 0 18px;padding:16px;border:1px solid #c9dce8;border-radius:10px;background:#fff;';
    panel.innerHTML='<div style="display:flex;justify-content:space-between;align-items:center;gap:12px"><div><h2 style="margin:0">Tarifario interno</h2><p style="margin:4px 0 0">Importes publicados que debe pagar el cliente.</p></div><button id="price-catalog-close" class="secondary" type="button">Cerrar</button></div><div id="price-catalog-body" style="margin-top:14px">Cargando…</div>';
    head.insertAdjacentElement('afterend',panel);

    button.addEventListener('click',async()=>{panel.hidden=false;await loadPrices();});
    panel.querySelector('#price-catalog-close').addEventListener('click',()=>{panel.hidden=true;});
  }

  async function getClient(){
    if(priceClient)return priceClient;
    if(window.TRAMI_ADMIN_SUPABASE){
      priceClient=window.TRAMI_ADMIN_SUPABASE;
      return priceClient;
    }
    throw new Error("La sesión de administrador todavía no está disponible. Cerrá Tarifario y volvé a abrirlo.");
  }

  async function loadPrices(){
    const body=document.getElementById('price-catalog-body');
    if(!body)return;
    body.textContent='Cargando…';
    try{
      const client=await getClient();
      const {data:rows,error}=await client
        .from('service_price_options')
        .select('service_id,selector_field,selector_value,amount,services(name)')
        .eq('active',true)
        .order('service_id',{ascending:true})
        .order('amount',{ascending:true});
      if(error)throw error;
      if(!Array.isArray(rows)||!rows.length){body.innerHTML='<p>No hay precios activos.</p>';return;}
      const grouped=new Map();
      rows.forEach(row=>{
        const name=row.services?.name||row.service_id;
        if(!grouped.has(name))grouped.set(name,[]);
        grouped.get(name).push(row);
      });
      body.innerHTML=`<div style="display:grid;gap:8px">${[...grouped.entries()].map(([name,items])=>`
        <div style="display:grid;grid-template-columns:minmax(0,1fr) auto;gap:8px 16px;align-items:center;padding:10px 12px;border:1px solid #e0e8ed;border-radius:8px">
          <strong>${esc(name)}</strong>
          <strong>${items.length===1?fmt(items[0].amount):items.map(item=>fmt(item.amount)).join(' / ')}</strong>
          ${items.length>1?`<small style="grid-column:1/-1;color:#607789">${items.map(item=>`${esc(item.selector_value)}: ${fmt(item.amount)}`).join(' · ')}</small>`:''}
        </div>`).join('')}</div>`;
    }catch(error){body.innerHTML=`<p class="error">${esc(error.message||'No se pudo cargar el tarifario.')}</p>`;}
  }

  const observer=new MutationObserver(ensureUi);
  observer.observe(document.documentElement,{childList:true,subtree:true});
  document.addEventListener('DOMContentLoaded',ensureUi);
  ensureUi();
})();