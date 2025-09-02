
/*! inventory-ui.js — standalone drawer (ABSOLUTE API, NO floating button) */
(function(){
  'use strict';
  const API = 'https://api.malgax.com'; // usare sempre l'API assoluta

  // Inject CSS once
  if(!document.getElementById('invUIStyles')){
    const style = document.createElement('style');
    style.id = 'invUIStyles';
    style.textContent = `
      .invUI-mask{position:fixed;inset:0;background:rgba(0,0,0,.45);opacity:0;pointer-events:none;transition:opacity .2s;z-index:9800}
      .invUI-drawer{position:fixed;top:0;right:-380px;width:360px;max-width:92vw;height:100%;background:#14141c;color:#e9e9f4;
        border-left:1px solid rgba(255,255,255,.12);box-shadow:0 10px 28px rgba(0,0,0,.45);transition:right .24s;z-index:9810;display:flex;flex-direction:column}
      .invUI-header{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid rgba(255,255,255,.12)}
      .invUI-header h3{margin:0;font:600 15px/1.2 system-ui,Segoe UI,Roboto,Arial}
      .invUI-close{background:#1b1b24;border:1px solid rgba(255,255,255,.12);color:#e9e9f4;border-radius:10px;padding:6px 10px;cursor:pointer}
      .invUI-body{padding:12px;overflow:auto;flex:1}
      .invUI-empty{padding:16px;border:1px dashed rgba(255,255,255,.15);border-radius:12px;color:#a4a4b5;text-align:center}
      .invUI-grid{display:grid;grid-template-columns:1fr;gap:10px}
      .invUI-card{display:grid;grid-template-columns:84px 1fr;gap:10px;background:#171722;border:1px solid rgba(255,255,255,.12);border-radius:12px;overflow:hidden}
      .invUI-thumb{background:#0f0f14;display:grid;place-items:center}
      .invUI-thumb img{max-width:100%;max-height:100%;object-fit:contain}
      .invUI-info{padding:8px 8px 0}
      .invUI-q{font-weight:800}
      .invUI-badge{font-size:11px;padding:3px 8px;border-radius:999px;border:1px solid rgba(255,255,255,.12);color:#a4a4b5}
      .invUI-actions{display:flex;gap:8px;padding:8px}
      .invUI-btn{border:1px solid rgba(255,255,255,.12);background:#6441a5;color:#fff;font-weight:800;padding:8px 10px;border-radius:10px;cursor:pointer}
      body.invUI-open .invUI-mask{opacity:1;pointer-events:auto}
      body.invUI-open .invUI-drawer{right:0}
    `;
    document.head.appendChild(style);
  }

  // Skip if already mounted
  if(!document.getElementById('invUIDrawer')){
    // Build UI nodes
    const mask   = document.createElement('div');   mask.id='invUIMask';   mask.className='invUI-mask';
    const drawer = document.createElement('aside'); drawer.id='invUIDrawer';drawer.className='invUI-drawer'; drawer.setAttribute('aria-hidden','true');
    const header = document.createElement('div');   header.className='invUI-header';
    const h3     = document.createElement('h3');    h3.textContent='🎒 Inventario';
    const closeB = document.createElement('button');closeB.id='invUIClose'; closeB.className='invUI-close'; closeB.type='button'; closeB.textContent='Chiudi';
    header.appendChild(h3); header.appendChild(closeB);
    const body   = document.createElement('div');   body.id='invUIBody'; body.className='invUI-body';
    body.innerHTML = '<div class="invUI-empty">Apri per caricare…</div>';
    drawer.appendChild(header); drawer.appendChild(body);

    document.body.appendChild(mask);
    document.body.appendChild(drawer);

    // Events
    function openInv(){
      document.body.classList.add('invUI-open');
      drawer.setAttribute('aria-hidden','false');
      loadInv();
    }
    function closeInv(){
      document.body.classList.remove('invUI-open');
      drawer.setAttribute('aria-hidden','true');
    }

    async function loadInv(){
      body.innerHTML = '<div class="invUI-empty">Caricamento…</div>';
      try{
        const meRes = await fetch(`${API}/me`, { credentials:'include', cache:'no-store' });
        if(!meRes.ok){ body.innerHTML = '<div class="invUI-empty">Devi accedere con Twitch per vedere l\\u2019inventario.</div>'; return; }
        const r = await fetch(`${API}/inventory`, { credentials:'include', cache:'no-store' });
        if(r.status===401){ body.innerHTML = '<div class="invUI-empty">Devi accedere con Twitch per vedere l\\u2019inventario.</div>'; return; }
        if(!r.ok){ body.innerHTML = '<div class="invUI-empty">Errore nel caricamento.</div>'; return; }
        let items = await r.json().catch(()=>[]);
        if(!Array.isArray(items)) items = [];
        items = items.filter(it => (it.quantity||0) > 0);
        if(!items.length){ body.innerHTML = '<div class="invUI-empty">Inventario vuoto.</div>'; return; }

        const grid = document.createElement('div');
        grid.className = 'invUI-grid';
        items.forEach(it => {
          const id = it.item_id || it.id;
          const card = document.createElement('div');
          card.className = 'invUI-card';
          card.setAttribute('data-id', String(id));
          card.innerHTML = [
            '<div class="invUI-thumb"><img src="'+(it.image_url||'')+'" alt="'+(it.name||'')+'"></div>',
            '<div class="invUI-info">',
              '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px">',
                '<div style="font-weight:800">'+(it.name||'')+'</div>',
                '<div class="invUI-q" id="invQ'+id+'">x'+(it.quantity||0)+'</div>',
              '</div>',
              '<div style="display:flex;align-items:center;justify-content:space-between">',
                '<span class="invUI-badge">'+((it.kind||'')+'')+'</span>',
              '</div>',
            '</div>',
            '<div class="invUI-actions">',
              '<button class="invUI-btn inv-use" data-id="'+id+'">Usa</button>',
            '</div>'
          ].join('');
          grid.appendChild(card);
        });
        body.innerHTML = '';
        body.appendChild(grid);
      }catch(e){
        body.innerHTML = '<div class="invUI-empty">Errore nel caricamento.</div>';
      }
    }

    // Use action
    body.addEventListener('click', async (e)=>{
      const btn = e.target.closest && e.target.closest('.inv-use');
      if(!btn) return;
      const id = Number(btn.dataset.id);
      btn.disabled = true;
      try{
        const res = await fetch(`${API}/inventory/use`, {
          method:'POST', credentials:'include',
          headers:{ 'Content-Type':'application/json' },
          body: JSON.stringify({ item_id: id, quantity: 1 })
        });
        const j = await res.json().catch(()=>({}));
        if(!res.ok){ throw new Error(j.error || 'use_failed'); }
        const qEl = document.getElementById('invQ'+id);
        if(qEl){
          const cur = Number((qEl.textContent||'0').replace(/^x/,'')) || 0;
          const nv = Math.max(0, cur - 1);
          qEl.textContent = 'x'+nv;
          if(nv <= 0){
            const card = qEl.closest('.invUI-card');
            if(card) card.remove();
            if(!body.querySelector('.invUI-card')){
              body.innerHTML = '<div class="invUI-empty">Inventario vuoto.</div>';
            }
          }
        }
      }catch(_){ /* opzionale */ }
      finally{ if(btn.isConnected) btn.disabled = false; }
    });

    // Close wiring
    closeB.addEventListener('click', closeInv);
    mask  .addEventListener('click', closeInv);
    window.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeInv(); });

    // Expose public API
    window.invUI = {
      open: openInv,
      close: closeInv,
      isOpen: function(){ return document.body.classList.contains('invUI-open'); }
    };
  }
})();
