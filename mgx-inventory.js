/*! mgx-inventory.js — standalone, isolated */
(function(){
  const API = (typeof window.API_ORIGIN!=='undefined' && window.API_ORIGIN) ? window.API_ORIGIN : 'https://api.malgax.com';

  // Inject CSS (isolated classes prefixed with mgx-)
  const style = document.createElement('style');
  style.id = 'mgxInvStyles';
  style.textContent = `
    .mgx-inv-mask{position:fixed;inset:0;background:rgba(0,0,0,.45);opacity:0;pointer-events:none;transition:opacity .2s ease;z-index:9800}
    .mgx-inv-drawer{position:fixed;top:0;right:-380px;width:360px;max-width:92vw;height:100%;background:#14141c;color:#e9e9f4;
      border-left:1px solid rgba(255,255,255,.12);box-shadow:0 10px 28px rgba(0,0,0,.45);transition:right .24s ease;z-index:9810;display:flex;flex-direction:column}
    .mgx-inv-header{display:flex;align-items:center;justify-content:space-between;padding:12px 14px;border-bottom:1px solid rgba(255,255,255,.12)}
    .mgx-inv-header h3{margin:0;font:600 15px/1.2 system-ui,Segoe UI,Roboto,Arial}
    .mgx-inv-close{background:#1b1b24;border:1px solid rgba(255,255,255,.12);color:#e9e9f4;border-radius:10px;padding:6px 10px;cursor:pointer}
    .mgx-inv-body{padding:12px;overflow:auto;flex:1}
    .mgx-inv-empty{padding:16px;border:1px dashed rgba(255,255,255,.15);border-radius:12px;color:#a4a4b5;text-align:center}
    .mgx-inv-grid{display:grid;grid-template-columns:1fr;gap:10px}
    .mgx-inv-card{display:grid;grid-template-columns:84px 1fr;gap:10px;background:#171722;border:1px solid rgba(255,255,255,.12);border-radius:12px;overflow:hidden}
    .mgx-inv-thumb{background:#0f0f14;display:grid;place-items:center}
    .mgx-inv-thumb img{max-width:100%;max-height:100%;object-fit:contain}
    .mgx-inv-info{padding:8px 8px 0}
    .mgx-inv-q{font-weight:800}
    .mgx-badge{font-size:11px;padding:3px 8px;border-radius:999px;border:1px solid rgba(255,255,255,.12);color:#a4a4b5}
    .mgx-inv-actions{display:flex;gap:8px;padding:8px}
    .mgx-inv-btn{border:1px solid rgba(255,255,255,.12);background:#6441a5;color:#fff;font-weight:800;padding:8px 10px;border-radius:10px;cursor:pointer}
    .mgx-inv-fab{position:fixed;bottom:18px;right:18px;z-index:9700;border:1px solid rgba(255,255,255,.12);background:#14141c;color:#e9e9f4;
      padding:10px 14px;border-radius:12px;cursor:pointer;box-shadow:0 8px 22px rgba(0,0,0,.35)}
    body.mgx-inv-open .mgx-inv-mask{opacity:1;pointer-events:auto}
    body.mgx-inv-open .mgx-inv-drawer{right:0}
  `;
  document.head.appendChild(style);

  // Drawer markup (mask + drawer + body + close + floating button)
  const mask   = document.createElement('div');   mask.id='mgxInvMask';   mask.className='mgx-inv-mask';
  const drawer = document.createElement('aside'); drawer.id='mgxInvDrawer';drawer.className='mgx-inv-drawer'; drawer.setAttribute('aria-hidden','true');
  const header = document.createElement('div');   header.className='mgx-inv-header';
  const h3     = document.createElement('h3');    h3.textContent='🎒 Inventario';
  const close  = document.createElement('button');close.id='mgxInvClose'; close.className='mgx-inv-close'; close.type='button'; close.textContent='Chiudi';
  header.appendChild(h3); header.appendChild(close);
  const body   = document.createElement('div');   body.id='mgxInvBody'; body.className='mgx-inv-body';
  body.innerHTML = '<div class="mgx-inv-empty">Apri per caricare…</div>';
  drawer.appendChild(header); drawer.appendChild(body);
  const toggle = document.createElement('button');toggle.id='mgxInvToggle'; toggle.className='mgx-inv-fab'; toggle.type='button'; toggle.setAttribute('aria-controls','mgxInvDrawer'); toggle.setAttribute('aria-expanded','false'); toggle.textContent='Inventario';

  document.body.appendChild(mask);
  document.body.appendChild(drawer);
  document.body.appendChild(toggle);

  function openInv(){
    document.body.classList.add('mgx-inv-open');
    drawer.setAttribute('aria-hidden','false');
    toggle.setAttribute('aria-expanded','true');
    loadInv();
  }
  function closeInv(){
    document.body.classList.remove('mgx-inv-open');
    drawer.setAttribute('aria-hidden','true');
    toggle.setAttribute('aria-expanded','false');
  }

  async function loadInv(){
    body.innerHTML = '<div class="mgx-inv-empty">Caricamento…</div>';
    try{
      const meRes = await fetch(`${API}/me`, { credentials:'include', cache:'no-store' });
      if(!meRes.ok){ body.innerHTML = '<div class="mgx-inv-empty">Devi accedere con Twitch per vedere l\u2019inventario.</div>'; return; }
      const r = await fetch(`${API}/inventory`, { credentials:'include', cache:'no-store' });
      if(r.status===401){ body.innerHTML = '<div class="mgx-inv-empty">Devi accedere con Twitch per vedere l\u2019inventario.</div>'; return; }
      if(!r.ok){ body.innerHTML = '<div class="mgx-inv-empty">Errore nel caricamento.</div>'; return; }
      let items = await r.json().catch(()=>[]);
      if(!Array.isArray(items)) items = [];
      items = items.filter(it => (it.quantity||0) > 0);
      if(!items.length){ body.innerHTML = '<div class="mgx-inv-empty">Inventario vuoto.</div>'; return; }

      const grid = document.createElement('div');
      grid.className = 'mgx-inv-grid';
      items.forEach(it => {
        const id = it.item_id || it.id;
        const card = document.createElement('div');
        card.className = 'mgx-inv-card';
        card.setAttribute('data-id', String(id));
        card.innerHTML = [
          '<div class="mgx-inv-thumb"><img src="'+(it.image_url||'')+'" alt="'+(it.name||'')+'"></div>',
          '<div class="mgx-inv-info">',
            '<div style="display:flex;align-items:center;justify-content:space-between;gap:8px">',
              '<div style="font-weight:800">'+(it.name||'')+'</div>',
              '<div class="mgx-inv-q" id="mgxQ'+id+'">x'+(it.quantity||0)+'</div>',
            '</div>',
            '<div style="display:flex;align-items:center;justify-content:space-between">',
              '<span class="mgx-badge">'+((it.kind||'')+'')+'</span>',
            '</div>',
          '</div>',
          '<div class="mgx-inv-actions">',
            '<button class="mgx-inv-btn mgx-use" data-id="'+id+'">Usa</button>',
          '</div>'
        ].join('');
        grid.appendChild(card);
      });
      body.innerHTML = '';
      body.appendChild(grid);
    }catch(e){
      body.innerHTML = '<div class="mgx-inv-empty">Errore nel caricamento.</div>';
    }
  }

  // Use action
  body.addEventListener('click', async (e)=>{
    const btn = e.target.closest && e.target.closest('.mgx-use');
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
      const qEl = document.getElementById('mgxQ'+id);
      if(qEl){
        const cur = Number((qEl.textContent||'0').replace(/^x/,'')) || 0;
        const nv = Math.max(0, cur - 1);
        qEl.textContent = 'x'+nv;
        if(nv <= 0){
          const card = qEl.closest('.mgx-inv-card');
          if(card) card.remove();
          if(!body.querySelector('.mgx-inv-card')){
            body.innerHTML = '<div class="mgx-inv-empty">Inventario vuoto.</div>';
          }
        }
      }
    }catch(_){}
    finally{ if(btn.isConnected) btn.disabled = false; }
  });

  // Wiring
  toggle.addEventListener('click', openInv);
  close .addEventListener('click', closeInv);
  mask  .addEventListener('click', closeInv);
  window.addEventListener('keydown', (e)=>{ if(e.key==='Escape') closeInv(); });

  // React to popup login/logout messages if presenti
  window.addEventListener('message', (ev)=>{
    // Non assumiamo origin esatto, ma se vuoi limita a API
    const d = ev.data||{};
    if(d.type==='login'){ /* ricarica se drawer aperto */ if(document.body.classList.contains('mgx-inv-open')) loadInv(); }
    if(d.type==='logout'){ body.innerHTML = '<div class="mgx-inv-empty">Devi accedere con Twitch per vedere l\u2019inventario.</div>'; }
  });
})();
