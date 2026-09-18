/* ============================================================
   ABHRANIL PORTFOLIO — slide controller v8
   - restored 800 ms original cadence
   - one physical wheel/touchpad gesture = one logical page
   - fixed stack layers remain stationary; only incoming/outgoing panel moves
   - direct nav links still jump vertically to their destination
   ============================================================ */
(function(){
  'use strict';

  const slides = document.querySelectorAll('.slide');
  const dots = document.querySelectorAll('.dot');
  const TOTAL = slides.length;
  const DUR = 800;
  const STACK_FIRST = 2;
  const STACK_LAST = 5;
  const stackMaster = slides[STACK_FIRST];
  const stack = stackMaster.querySelector('.swipe-stack');

  let current = 0;
  let isAnimating = false;

  const transitions = [
    { enterFrom:'bottom', exitTo:'top' },
    { enterFrom:'left', exitTo:'right' },
    { enterFrom:'right', exitTo:'left' },
    { enterFrom:'right', exitTo:'left' },
    { enterFrom:'right', exitTo:'left' },
    { enterFrom:'bottom', exitTo:'top' }
  ];
  const reverse = { top:'bottom', bottom:'top', left:'right', right:'left' };

  function isStackIndex(i){ return i>=STACK_FIRST && i<=STACK_LAST; }
  function stackStateForIndex(i){ return i-STACK_FIRST+1; }
  function visualSlideForIndex(i){ return isStackIndex(i) ? stackMaster : slides[i]; }
  function clearClasses(el){
    if(!el) return;
    el.classList.remove('enter-from-top','enter-from-bottom','enter-from-left','enter-from-right','exit-to-top','exit-to-bottom','exit-to-left','exit-to-right','animating','at-center','transitioning');
  }
  function setStackStateByIndex(i){
    const st=stackStateForIndex(i);
    for(let n=1;n<=4;n++) stack.classList.remove('stack-state-'+n);
    stack.classList.add('stack-state-'+st);
  }
  function updateDots(i){ dots.forEach((d,n)=>d.classList.toggle('active',n===i)); }
  function finish(target){ current=target; updateDots(current); isAnimating=false; }

  function animateStackStep(target){
    const forward=target>current;
    const panelNumber=forward ? stackStateForIndex(target) : stackStateForIndex(current);
    const moving=stackMaster.querySelector('.panel-'+panelNumber);
    if(!moving){ isAnimating=false; return; }
    stackMaster.classList.add('active');
    clearClasses(stackMaster);
    stackMaster.style.transform='';
    moving.classList.remove('panel-moving'); moving.style.left='';
    if(forward){
      moving.style.left='100vw';
      setStackStateByIndex(target);
      moving.classList.add('panel-moving');
      void moving.offsetHeight;
      requestAnimationFrame(()=>{ moving.style.left=''; });
      setTimeout(()=>{ moving.classList.remove('panel-moving'); moving.style.left=''; finish(target); },DUR+45);
    } else {
      moving.classList.add('panel-moving');
      void moving.offsetHeight;
      requestAnimationFrame(()=>{ moving.style.left='100vw'; });
      setTimeout(()=>{ setStackStateByIndex(target); moving.classList.remove('panel-moving'); moving.style.left=''; finish(target); },DUR+45);
    }
  }

  function animateGeneric(target){
    const forward=target>current;
    const outSlide=visualSlideForIndex(current), inSlide=visualSlideForIndex(target);
    if(isStackIndex(target)) setStackStateByIndex(target);
    let enterClass,exitClass;
    if(forward){
      const map=transitions[Math.min(target-1,transitions.length-1)];
      enterClass='enter-from-'+map.enterFrom; exitClass='exit-to-'+map.exitTo;
    }else{
      const map=transitions[Math.min(current-1,transitions.length-1)];
      enterClass='enter-from-'+reverse[map.enterFrom]; exitClass='exit-to-'+reverse[map.exitTo];
    }
    clearClasses(inSlide); clearClasses(outSlide); inSlide.style.transform=''; outSlide.style.transform='';
    inSlide.classList.add(enterClass,'transitioning'); void inSlide.offsetHeight;
    requestAnimationFrame(()=>{
      inSlide.classList.add('animating'); inSlide.classList.remove(enterClass); inSlide.classList.add('at-center');
      outSlide.classList.add('animating',exitClass); outSlide.classList.remove('at-center');
      setTimeout(()=>{
        outSlide.classList.remove('active'); clearClasses(outSlide); outSlide.style.transform='';
        inSlide.classList.remove('transitioning'); inSlide.classList.add('active'); clearClasses(inSlide); inSlide.style.transform='';
        finish(target);
      },DUR+45);
    });
  }

  function goToSlide(target){
    if(window.portfolioMobile?.isActive()) return window.portfolioMobile.goTo(target);
    if(target<0||target>=TOTAL||target===current||isAnimating) return false;
    isAnimating=true;
    if(isStackIndex(current)&&isStackIndex(target)&&Math.abs(target-current)===1) animateStackStep(target);
    else animateGeneric(target);
    return true;
  }

  function jumpToSlide(target){
    if(window.portfolioMobile?.isActive()) return window.portfolioMobile.goTo(target);
    if(target<0||target>=TOTAL||target===current||isAnimating) return false;
    isAnimating=true;
    const outSlide=visualSlideForIndex(current), inSlide=visualSlideForIndex(target);
    if(isStackIndex(target)) setStackStateByIndex(target);
    clearClasses(outSlide); clearClasses(inSlide); outSlide.style.transform=''; inSlide.style.transform='';
    const forward=target>current;
    const enterClass=forward?'enter-from-bottom':'enter-from-top';
    const exitClass=forward?'exit-to-top':'exit-to-bottom';
    inSlide.classList.add(enterClass,'transitioning'); void inSlide.offsetHeight;
    requestAnimationFrame(()=>{
      inSlide.classList.add('animating'); inSlide.classList.remove(enterClass); inSlide.classList.add('at-center');
      outSlide.classList.add('animating',exitClass);
      setTimeout(()=>{
        outSlide.classList.remove('active'); clearClasses(outSlide); outSlide.style.transform='';
        inSlide.classList.remove('transitioning'); inSlide.classList.add('active'); clearClasses(inSlide); inSlide.style.transform=''; finish(target);
      },DUR+45);
    });
    return true;
  }

  function nextSlide(){ return current<TOTAL-1 ? goToSlide(current+1) : false; }
  function prevSlide(){ return current>0 ? goToSlide(current-1) : false; }

  /* One gesture, one page. Recognize a fresh gesture from the wheel input
     itself so a pending unlock timer cannot keep swallowing new scrolls. */
  let wheelLocked=false;
  let lastWheelAt=-Infinity;
  let lastWheelDelta=0;
  const WHEEL_IDLE=180;
  function normalizedDelta(e){
    let d=e.deltaY;
    if(e.deltaMode===1)d*=16;
    else if(e.deltaMode===2)d*=window.innerHeight;
    return d;
  }
  function onWheel(e){
    if(window.portfolioMobile?.isActive()) return;
    if(e.ctrlKey) return;
    const dy=normalizedDelta(e);
    if(Math.abs(dy)<2 || Math.abs(e.deltaX)>Math.abs(e.deltaY)*1.4) return;
    e.preventDefault();

    const now=performance.now();
    const previousMagnitude=Math.abs(lastWheelDelta);
    const freshGesture=now-lastWheelAt>WHEEL_IDLE
      || Math.sign(dy)!==Math.sign(lastWheelDelta)
      || (previousMagnitude<=12 && Math.abs(dy)>=Math.max(16,previousMagnitude*2));
    lastWheelAt=now;
    lastWheelDelta=dy;

    // Consume animation-time input and its momentum without skipping pages.
    if(isAnimating){ wheelLocked=true; return; }
    if(freshGesture) wheelLocked=false;
    if(wheelLocked) return;
    wheelLocked=true;
    if(dy>0) nextSlide(); else prevSlide();
  }
  window.addEventListener('wheel',onWheel,{passive:false,capture:true});

  document.addEventListener('keydown',e=>{
    if(window.portfolioMobile?.isActive()) return;
    if(e.key==='ArrowDown'||e.key==='PageDown'||e.key===' '){e.preventDefault();nextSlide();}
    else if(e.key==='ArrowUp'||e.key==='PageUp'){e.preventDefault();prevSlide();}
  });

  let tsY=0,tsX=0;
  document.addEventListener('touchstart',e=>{tsY=e.changedTouches[0].screenY;tsX=e.changedTouches[0].screenX},{passive:true});
  document.addEventListener('touchend',e=>{
    if(window.portfolioMobile?.isActive()) return;
    if(isAnimating)return;
    const dy=tsY-e.changedTouches[0].screenY,dx=tsX-e.changedTouches[0].screenX;
    if(Math.abs(dy)>Math.abs(dx)){if(dy>50)nextSlide();else if(dy<-50)prevSlide();}
    else{if(dx>50)nextSlide();else if(dx<-50)prevSlide();}
  },{passive:true});

  dots.forEach(dot=>dot.addEventListener('click',function(){jumpToSlide(parseInt(this.dataset.slide,10));}));
  document.querySelectorAll('[data-goto]').forEach(link=>link.addEventListener('click',function(e){e.preventDefault();jumpToSlide(parseInt(this.dataset.goto,10));}));

  for(let i=STACK_FIRST+1;i<=STACK_LAST;i++){
    slides[i].classList.remove('active','transitioning'); slides[i].setAttribute('aria-hidden','true');
  }
  setStackStateByIndex(STACK_FIRST); updateDots(current);
  window.__portfolio={goTo:jumpToSlide,next:nextSlide,prev:prevSlide,current:()=>current,isAnimating:()=>isAnimating};
})();
