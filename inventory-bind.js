/*! inventory-bind.js — binds sidebar "Inventario" button to the drawer (non-invasive) */
(function(){
  'use strict';
  function attach(){
    // Prefer explicit selectors if presenti
    let el = document.querySelector('#menu-inventory, #sidebar-inventory, [data-open="inventory"], [data-inventory]');
    if(!el){
      // Fallback: first anchor/button whose visible text is "Inventario" (case-insensitive)
      const cands = document.querySelectorAll('a,button,[role="button"]');
      for(const c of cands){
        const t = (c.textContent || '').trim().toLowerCase();
        if(t === 'inventario'){ el = c; break; }
      }
    }
    if(!el) return; // nothing to bind; safe no-op
    if(el.__invBound) return;
    el.__invBound = true;
    el.addEventListener('click', function(e){
      // Prevent default nav if it's a link
      if(e) e.preventDefault();
      // Click the floating toggle created by inventory-ui.js
      const toggle = document.getElementById('invUIToggle');
      if(toggle){ try{ toggle.click(); }catch(_){ /* ignore */ } }
    }, false);
  }
  if(document.readyState === 'loading'){
    document.addEventListener('DOMContentLoaded', attach);
  }else{
    attach();
  }
  // If the sidebar is injected later, try again after a tick
  setTimeout(attach, 1000);
})();