// MusePlayer — interactions du site (vanilla JS, aucune dépendance)

document.addEventListener('DOMContentLoaded', () => {
  /* --- Barre de progression façon lecteur audio --- */
  const fill = document.querySelector('.scrubber__fill');
  const label = document.querySelector('.scrubber__label');
  const sections = document.querySelectorAll('[data-track-label]');

  function onScroll(){
    if (!fill) return;
    const doc = document.documentElement;
    const scrollTop = doc.scrollTop || document.body.scrollTop;
    const scrollHeight = (doc.scrollHeight || document.body.scrollHeight) - doc.clientHeight;
    const pct = scrollHeight > 0 ? Math.min(100, (scrollTop / scrollHeight) * 100) : 0;
    fill.style.width = pct.toFixed(1) + '%';

    if (label){
      if (scrollTop > 40){
        label.classList.add('is-visible');
      } else {
        label.classList.remove('is-visible');
      }
      let current = null;
      sections.forEach(sec => {
        const rect = sec.getBoundingClientRect();
        if (rect.top <= 120) current = sec;
      });
      if (current){
        label.textContent = current.getAttribute('data-track-label');
      }
    }
  }

  document.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  /* --- Apparition au scroll --- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && revealEls.length){
    const io = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting){
          entry.target.classList.add('is-visible');
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });
    revealEls.forEach(el => io.observe(el));
  } else {
    revealEls.forEach(el => el.classList.add('is-visible'));
  }
});
