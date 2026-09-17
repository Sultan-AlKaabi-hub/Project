// Adapted from React Bits CardNav (MIT + Commons Clause; see docs/REACT-BITS-LICENSE.md). Native DOM integration preserves Rasid's router.
(function(){
 let dispose=()=>{};
 const L=(en,ar)=>document.documentElement.lang==='ar'?ar:en;
 function mount(app){
  dispose();
  const sidebar=app.querySelector('#sidebar'); if(!sidebar)return;
  sidebar.hidden=true;sidebar.inert=true;
  const container=document.createElement('header');container.className='card-nav-container';
  container.innerHTML=`<nav class="card-nav" aria-label="${L('Main navigation','التنقل الرئيسي')}"><div class="card-nav-top"><button class="hamburger-menu" type="button" aria-expanded="false" aria-controls="card-nav-content" aria-label="${L('Open menu','فتح القائمة')}"><span></span><span></span></button><button class="card-nav-brand" type="button" aria-label="${L('Open intro','فتح المقدمة')}"><img src="icons/icon.svg" alt=""><strong>RASID AI</strong></button><button class="card-nav-cta" type="button">${L('My space','مساحتي')} ↗</button></div><div class="card-nav-content" id="card-nav-content" hidden inert></div></nav>`;
  app.prepend(container);app.classList.add('has-card-nav');
  const nav=container.querySelector('nav'),toggle=container.querySelector('.hamburger-menu'),content=container.querySelector('.card-nav-content');
  const groups=[{title:L('Discover','اكتشف'),keys:['home','coach','course','lab','vision','experiments','guide','news','hub']},{title:L('Your campus','مساحتك الدراسية'),keys:['progress','calendar','alerts','messages']},{title:L('Manage','الإدارة'),keys:['administration','staff','people','privacy','settings']}];
  for(const [i,group] of groups.entries()){
   const card=document.createElement('section');card.className='nav-card nav-card-'+i;
   const title=document.createElement('h2');title.textContent=group.title;card.append(title);
   for(const key of group.keys){const original=sidebar.querySelector(`[data-view="${key}"]`);if(!original)continue;const link=document.createElement('button');link.dataset.destination=key;link.type='button';link.className='nav-card-link';link.textContent='↗ '+original.textContent.trim();if(original.classList.contains('active'))link.setAttribute('aria-current','page');link.onclick=()=>original.click();card.append(link);}
   content.append(card);
  }
  const badgeObserver=new MutationObserver(()=>{const source=sidebar.querySelector('[data-view=alerts] span'),target=container.querySelector('[data-destination=alerts]');if(source&&target)target.textContent='↗ '+source.textContent;});
  badgeObserver.observe(sidebar,{subtree:true,childList:true,characterData:true});
  let open=false;
  const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
  function setOpen(value){
   open=value;toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?L('Close menu','إغلاق القائمة'):L('Open menu','فتح القائمة'));nav.classList.toggle('open',open);
   window.gsap?.killTweensOf([nav,content,...content.children]);
   if(open){
    content.hidden=false;content.inert=false;
    if(!reduced()&&window.gsap){gsap.fromTo(nav,{height:64},{height:64+content.offsetHeight,duration:.4,ease:'power3.out',clearProps:'height'});gsap.fromTo(content.children,{y:18,opacity:0},{y:0,opacity:1,duration:.4,delay:.1,stagger:.07,ease:'power3.out',clearProps:'all'});}
   } else {
    content.inert=true;
    if(!reduced()&&window.gsap)gsap.to(nav,{height:64,duration:.25,ease:'power3.out',onComplete:()=>{content.hidden=true;nav.style.height='';}});
    else {content.hidden=true;nav.style.height='';}
   }
  }
  toggle.onclick=()=>setOpen(!open);
  container.querySelector('.card-nav-brand').onclick=()=>sidebar.querySelector('.brand').click();
  container.querySelector('.card-nav-cta').onclick=()=>sidebar.querySelector('[data-view="home"]').click();
  function key(e){if(e.key==='Escape'&&open){setOpen(false);toggle.focus();}}
  function outside(e){if(open&&!container.contains(e.target))setOpen(false);}
  document.addEventListener('keydown',key);document.addEventListener('click',outside);
  dispose=()=>{badgeObserver.disconnect();document.removeEventListener('keydown',key);document.removeEventListener('click',outside);window.gsap?.killTweensOf([nav,...content.children]);};
 }
 window.CardNav={mount};
})();
