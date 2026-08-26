(function () {
  const checkoutLinks = {
    'landing-page-rescue': '',
    'spreadsheet-to-dashboard': '',
    'repository-to-live-demo': ''
  };

  document.querySelectorAll('[data-checkout]').forEach((button) => {
    const offer = button.dataset.checkout;
    const link = checkoutLinks[offer];
    if (link) {
      button.href = link;
      button.removeAttribute('aria-disabled');
      return;
    }
    button.href = '#checkout-pending';
    button.setAttribute('aria-disabled', 'true');
    button.addEventListener('click', (event) => {
      event.preventDefault();
      const notice = document.querySelector('[data-checkout-notice]');
      if (notice) notice.textContent = 'Secure checkout is being connected before this offer is opened for purchase.';
    });
  });

  const params = new URLSearchParams(window.location.search);
  const selectedOffer = params.get('offer');
  const offerField = document.querySelector('[name="offer"]');
  if (offerField && selectedOffer) offerField.value = selectedOffer;

  const year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
