(() => {
  const carousel = document.querySelector('[data-apex-carousel]');
  if (carousel) {
    const step = () => (carousel.querySelector('article')?.getBoundingClientRect().width || 390) + 20;
    document.querySelector('[data-apex-next]')?.addEventListener('click', () => carousel.scrollBy({left: step(), behavior: 'smooth'}));
    document.querySelector('[data-apex-prev]')?.addEventListener('click', () => carousel.scrollBy({left: -step(), behavior: 'smooth'}));
  }

  const form = document.querySelector('[data-apex-form]');
  if (!form) return;
  const status = form.querySelector('[data-apex-status]');
  const value = name => form.elements[name]?.value?.trim() || '';
  form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const services = [...form.querySelectorAll('input[name="service"]:checked')].map(input => input.value).join(', ') || 'Not selected';
    const body = [
      'APEX Benchworks repair request',
      '',
      \`Name: \${value('name')}\`,
      \`Email: \${value('email')}\`,
      \`Computer: \${value('computer')}\`,
      \`Operating system: \${value('os')}\`,
      \`Known specifications: \${value('specs') || 'Not provided'}\`,
      \`Requested work: \${services}\`,
      \`Problem / desired outcome: \${value('goal')}\`,
      \`Approximate budget: \${value('budget')}\`,
      \`Main priority: \${value('priority')}\`,
      \`Additional notes: \${value('notes') || 'None'}\`
    ].join('\\n');
    const subject = \`APEX Benchworks repair request — \${value('name')}\`;
    status.textContent = 'Opening a draft in your email app. Review the message before sending.';
    window.location.href = \`mailto:admin@luminarylabs.dev?subject=\${encodeURIComponent(subject)}&body=\${encodeURIComponent(body)}\`;
  });
})();
