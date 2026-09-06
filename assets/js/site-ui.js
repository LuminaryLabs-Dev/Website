(() => {
  const year = document.getElementById('year');
  if (year) year.textContent = String(new Date().getFullYear());
  const reduced = () => matchMedia('(prefers-reduced-motion: reduce)').matches;
  // Native details remain usable without JavaScript; animate height only when enhanced.
  document.querySelectorAll('[data-disclosure]').forEach(details => {
    const summary = details.querySelector('summary');
    let animation = null;
    let intendedOpen = details.open;
    summary.addEventListener('click', event => {
      if (!details.animate || reduced()) return;
      event.preventDefault();
      intendedOpen = !intendedOpen;
      const start = details.getBoundingClientRect().height;
      animation?.cancel();
      details.style.height = '';
      details.style.overflow = 'hidden';
      details.open = true;
      const end = intendedOpen ? details.getBoundingClientRect().height : summary.getBoundingClientRect().height + 1;
      animation = details.animate({height:[`${start}px`,`${end}px`]}, {duration:250,easing:'ease-out'});
      animation.onfinish = () => {details.open=intendedOpen;details.style.overflow='';animation=null;};
      animation.oncancel = () => {details.style.overflow='';};
    });
    details.addEventListener('toggle', () => { if (!animation) intendedOpen=details.open; });
  });
  const dialog = document.querySelector('.media-dialog');
  let launcher = null;
  if (dialog && typeof dialog.showModal === 'function') {
    document.querySelectorAll('[data-image-open]').forEach(button => {
      button.hidden = false;
      button.addEventListener('click', () => {
        launcher = button;
        const original = button.closest('figure').querySelector('img');
        dialog.querySelector('img').src = button.dataset.imageOpen;
        dialog.querySelector('img').alt = original.alt;
        dialog.querySelector('p').textContent = original.alt;
        dialog.showModal();
        dialog.querySelector('.dialog-close').focus();
      });
    });
    dialog.querySelector('.dialog-close').addEventListener('click', () => dialog.close());
    dialog.addEventListener('click', event => { if (event.target===dialog) { const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close(); } });
    dialog.addEventListener('close', () => launcher?.focus());
  }
  const copy = document.querySelector('[data-copy-email]');
  if (copy) {
    copy.hidden = false;
    copy.addEventListener('click', async () => {
      const status = document.querySelector('.copy-status');
      try {
        await navigator.clipboard.writeText('admin@luminarylabs.dev');
        status.textContent='Email address copied.';
      } catch {
        const address=document.querySelector('.contact-address');
        const range=document.createRange();range.selectNodeContents(address);
        const selection=getSelection();selection.removeAllRanges();selection.addRange(range);
        status.textContent='Select and copy admin@luminarylabs.dev, or open the email link above.';
      }
    });
  }
  const form = document.querySelector('[data-draft-form]');
  if (form) {
    form.hidden = false;
    const service = form.querySelector('select');
    const prompt = form.querySelector('textarea');
    const params = new URLSearchParams(location.search);
    const requested = params.get('service');
    if ([...service.options].some(option=>option.value===requested)) service.value=requested;
    const project = params.get('project');
    if (project) prompt.value=`I'd like to discuss work similar to ${project.slice(0,200)}.`;
    const update = () => {
      const subject=service.value ? `Project inquiry: ${service.value}` : 'Project inquiry — Luminary Labs';
      const body=[service.value&&`Area: ${service.value}`,prompt.value.trim()].filter(Boolean).join('\n\n');
      form.querySelector('[data-draft-link]').href=`mailto:admin@luminarylabs.dev?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    };
    form.addEventListener('input', update);form.addEventListener('change',update);
    form.addEventListener('submit',event=>event.preventDefault());update();
  }
})();
