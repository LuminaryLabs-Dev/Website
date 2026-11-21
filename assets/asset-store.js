(() => {
  const cards = [...document.querySelectorAll('[data-store-card]')];
  const buttons = [...document.querySelectorAll('[data-store-filter]')];
  const search = document.querySelector('[data-store-search]');
  const empty = document.querySelector('[data-store-empty]');
  const counter = document.querySelector('[data-store-count]');
  if (!cards.length || !search) return;
  let category = 'all';
  function update() {
    const query = search.value.trim().toLocaleLowerCase();
    let count = 0;
    cards.forEach(card => {
      const matched = (category === 'all' || card.dataset.category === category) &&
        (card.dataset.search || '').toLocaleLowerCase().includes(query);
      card.hidden = !matched;
      if (matched) count += 1;
    });
    if (empty) empty.hidden = count !== 0;
    if (counter) counter.textContent = String(count) + ' asset collection' + (count === 1 ? '' : 's');
  }
  buttons.forEach(button => {
    button.addEventListener('click', () => {
      category = button.dataset.storeFilter;
      buttons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      update();
    });
  });
  search.addEventListener('input', update);
  update();
})();
