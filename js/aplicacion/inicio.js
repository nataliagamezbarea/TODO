(() => {
  const espera = (ms) => new Promise(r => setTimeout(r, ms));
  async function arrancar(){
    for(let i=0;i<100;i++){
      if(window.supabaseClient || sessionStorage.getItem('esInvitado')==='true' || window.__VISTA_ACTUAL==='login') break;
      await espera(50);
    }
    const invitado=sessionStorage.getItem('esInvitado')==='true';
    let vista=(window.sesionActual?.user || invitado) ? 'inicio' : 'login';
    try { await window.AppNavegacion.cargar(vista,{}); } catch(e) { console.error('No se pudo cargar la vista inicial:',e); }
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',arrancar,{once:true}); else arrancar();
})();
