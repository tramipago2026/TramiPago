(async function(){
  "use strict";
  try{
    const response=await fetch("admin-mfa.js?v=20260914-security2",{cache:"no-store"});
    if(!response.ok)throw new Error(`No se pudo cargar el panel base (${response.status})`);
    let source=await response.text();
    const sessionBlock=/  async function showSession\(session\)\{[\s\S]*?\n  async function loadRequests\(\)\{/;
    if(!sessionBlock.test(source))throw new Error("No se encontró el bloque de sesión del panel");
    source=source.replace(sessionBlock,`  async function showSession(session){
    currentUser=session?.user||null;
    if(!currentUser){loginPanel.hidden=false;mfaPanel.hidden=true;dashboard.hidden=true;logoutButton.hidden=true;sessionLabel.textContent="";return;}
    mfaPanel.hidden=true;
    let allowed=false;
    try{allowed=await isAdmin();}catch(error){console.error(error);}
    if(!allowed){await supabase.auth.signOut();setMessage(loginMessage,"La cuenta no está habilitada como administradora.","error");loginPanel.hidden=false;dashboard.hidden=true;logoutButton.hidden=true;return;}
    loginPanel.hidden=true;dashboard.hidden=false;logoutButton.hidden=false;sessionLabel.textContent=currentUser.email||"Administrador";await loadRequests();
  }

  async function loadRequests(){`);
    (0,eval)(source+"\n//# sourceURL=admin-test-runtime.js");
  }catch(error){
    console.error("TramiPago Admin modo prueba:",error);
    const node=document.getElementById("login-message");
    if(node){node.textContent="No se pudo iniciar el panel en modo de prueba.";node.className="message error";}
  }
})();