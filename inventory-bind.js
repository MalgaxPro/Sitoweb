
/*! inventory-bind.js — bind sidebar "Inventario" to drawer; remove old behavior */
(function(){
  'use strict';

  function findButton(){
    // Prefer explicit selectors if presenti
    let el = document.querySelector('#menu-inventory, #sidebar-inventory, [data-open="inventory"], [data-inventory], [data-nav="inventory"]');
    if(!el){
      // Fallback: first anchor/button whose visible text is "Inventario" (case-insensitive, trimmed)
      const cands = document.querySelectorAll('a,button,[role="button"]');
      for(const c of cands){
        const t = (c.textContent || '').replace(/\s+/g,' ').trim().toLowerCase();
        if(t === 'inventario'){ el = c; break; }
      }
    }
    return el || null;
  }

  function neutralize(el){
    // Rimuovi eventuali listener attaccati in precedenza clonando il nodo
    const clone = el.cloneNode(true);
    el.parentNode && el.parentNode.replaceChild(clone, el);
    return clone;
  }

  function attach(){
    // Nascondi/Elimina il bottone flottante se presente (backward compatibility)
    const floatBtn = document.getElementById('invUIToggle');
    if(floatBtn && floatBtn.remove) try{ floatBtn.remove(); }catch(_){ floatBtn.style.display='none'; }

    let el = findButton();
    if(!el) return; // niente da fare
    if(el.__invBound) return;

    el = neutralize(el); // rimuove vecchi handler che aprivano l'inventario "vecchio"
    el.__invBound = true;

    // Aggancia il nostro handler in cattura per bloccare qualsiasi altro
    el.addEventListener('click', function(e){
      try{
        e.preventDefault();
        e.stopImmediatePropagation();
        e.stopPropagation();
      }catch(_){}

      // Chiudi eventuali modali "vecchie" molto comuni, se aperte
      document.querySelectorAll('#inventoryModal,.inventory-modal,.modal-inventory,[data-modal="inventory"]').forEach(n=>{
        if(n && n.remove) n.remove();
        else if(n) n.style.display='none';
      });

      // Apri il nostro drawer
      if(window.invUI && typeof window.invUI.open === 'function'){
        window.invUI.open();
      }else{
        // Se per qualche motivo invUI non è pronto, prova a caricare lo script on-demand
        if(!document.querySelector('script[src*="inventory-ui.js"]')){
          var s=document.createElement('script'); s.src='/inventory-ui.js?v='+(Date.now()); s.onload=function(){ window.invUI && window.invUI.open && window.invUI.open(); };
          document.body.appendChild(s);
        }
      }
      return false;
    }, true); // capture
  }

  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', attach);
  }else{
    attach();
  }
  // Fallback: ritenta tra 1s nel caso il menu venga montato tardi
  setTimeout(attach, 1000);
})();
