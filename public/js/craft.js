(function(){
  const L=(en,ar)=>document.documentElement.lang==='ar'?ar:en;
  function enhance(){
    const main=document.querySelector('#main');
    if(main){
      main.tabIndex=-1;
      let skip=document.querySelector('.skip-link');
      if(!skip){skip=document.createElement('a');skip.className='skip-link';skip.href='#main';document.body.prepend(skip);}
      skip.textContent=L('Skip to content','انتقل إلى المحتوى');
      skip.onclick=e=>{e.preventDefault();main.focus();};
      document.querySelectorAll('.nav [data-view]').forEach(b=>{if(b.classList.contains('active'))b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
    }else document.querySelector('.skip-link')?.remove();
    document.querySelectorAll('input[type=email]').forEach(i=>{i.autocomplete='email';i.autocapitalize='none';i.spellcheck=false;});
    document.querySelectorAll('#auth-body input[type=password]').forEach(input=>{
      if(input.parentElement.classList.contains('credential-wrap'))return;
      const wrap=document.createElement('div');wrap.className='credential-wrap';input.before(wrap);wrap.append(input);
      const b=document.createElement('button');b.type='button';b.className='credential-toggle';b.textContent=L('Show','إظهار');b.setAttribute('aria-label',L('Show password','إظهار كلمة المرور'));b.setAttribute('aria-pressed','false');
      b.onclick=()=>{const show=input.type==='password';input.type=show?'text':'password';b.textContent=show?L('Hide','إخفاء'):L('Show','إظهار');b.setAttribute('aria-label',show?L('Hide password','إخفاء كلمة المرور'):L('Show password','إظهار كلمة المرور'));b.setAttribute('aria-pressed',String(show));};wrap.append(b);
    });
    document.querySelectorAll('.campus-table').forEach(table=>{
      const parent=table.parentElement;
      if(parent.tagName==='MAIN')return;
      parent.classList.add('scroll-region');parent.tabIndex=0;parent.setAttribute('role','region');parent.setAttribute('aria-label',L('Data table. Scroll horizontally for more columns.','جدول البيانات. مرّر أفقياً لعرض الأعمدة الأخرى.'));
      if(!parent.previousElementSibling?.classList.contains('scroll-hint') && table.scrollWidth>parent.clientWidth){const note=document.createElement('p');note.className='scroll-hint';note.textContent=L('Swipe or scroll to see all columns →','مرّر أفقياً لعرض جميع الأعمدة ←');parent.before(note);}
      table.querySelectorAll('thead th').forEach(th=>th.scope='col');
    });
    syncMenu();
  }
  function syncMenu(){
    const sidebar=document.querySelector('#sidebar'),button=document.querySelector('#menu-btn');
    if(!sidebar)return;
    const mobile=matchMedia('(max-width: 860px)').matches,open=sidebar.classList.contains('open');
    sidebar.inert=mobile&&!open;
    if(button){button.setAttribute('aria-label',L('Open navigation','فتح قائمة التنقل'));button.setAttribute('aria-controls','sidebar');button.setAttribute('aria-expanded',String(open));}
  }
  document.addEventListener('keydown',e=>{
    const sidebar=document.querySelector('#sidebar');if(!sidebar?.classList.contains('open'))return;
    if(e.key==='Escape'){document.querySelector('#scrim')?.click();document.querySelector('#menu-btn')?.focus();}
    if(e.key==='Tab'){
      const items=[...sidebar.querySelectorAll('button,a,[tabindex="0"]')].filter(el=>!el.disabled);
      const first=items[0],last=items.at(-1);
      if(e.shiftKey&&document.activeElement===first){e.preventDefault();last?.focus();}
      else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first?.focus();}
    }
  });
  window.addEventListener('resize',syncMenu,{passive:true});
  window.Craft={enhance,syncMenu};
})();
