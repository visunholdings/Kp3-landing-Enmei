const menuButton = document.querySelector('.menu-toggle');
const menu = document.querySelector('.main-nav');

menuButton?.addEventListener('click', () => {
  const open = menu.classList.toggle('is-open');
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label', open ? 'Đóng menu' : 'Mở menu');
});

menu?.querySelectorAll('a').forEach((link) => {
  link.addEventListener('click', () => {
    menu.classList.remove('is-open');
    menuButton?.setAttribute('aria-expanded', 'false');
  });
});

document.querySelectorAll('.accordion__trigger').forEach((trigger) => {
  trigger.addEventListener('click', () => {
    const open = trigger.getAttribute('aria-expanded') === 'true';
    const panel = trigger.nextElementSibling;
    trigger.setAttribute('aria-expanded', String(!open));
    trigger.querySelector('b').textContent = open ? '+' : '−';
    panel.hidden = open;
  });
});

document.querySelectorAll('[data-product]').forEach((button) => {
  button.addEventListener('click', () => {
    const selectedProduct = button.dataset.product;
    const productSelect = document.querySelector('select[name="need"]');
    if (productSelect) productSelect.value = selectedProduct;
    document.querySelector('#tu-van')?.scrollIntoView({ behavior: 'smooth' });
  });
});

const form = document.querySelector('#consult-form');
const formMessage = form?.querySelector('.form-message');
const formFields = form?.querySelector('.form-fields');
const formSuccess = form?.querySelector('.form-success');
const leadEndpoint = 'https://script.google.com/macros/s/AKfycbwUXxtV-t8P3TDleQKI5q-Sw15YVbyUDCL72-iilDwZhw44zQIJp8cXjA4VVhQgAEpugg/exec';

const createSubmissionId = () => {
  if (window.crypto?.randomUUID) return window.crypto.randomUUID();
  return `lead-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

document.querySelector('[data-order-channel="form"]')?.addEventListener('click', () => {
  window.setTimeout(() => form?.elements.name.focus(), 350);
});

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
  const submitButton = form.querySelector('button[type="submit"]');
  const fields = [...form.querySelectorAll('[required]')];
  const emptyField = fields.find((field) => !field.value.trim());

  if (emptyField) {
    formMessage.textContent = 'Vui lòng điền đầy đủ các thông tin để chúng tôi có thể tư vấn chính xác hơn.';
    formMessage.className = 'form-message is-visible is-error';
    emptyField.focus();
    return;
  }

  const phone = form.elements.phone.value.replace(/[\s.-]/g, '');
  if (!/^(?:0\d{9}|\+84\d{9})$/.test(phone)) {
    formMessage.textContent = 'Số điện thoại chưa đúng định dạng. Vui lòng kiểm tra lại.';
    formMessage.className = 'form-message is-visible is-error';
    form.elements.phone.focus();
    return;
  }

  const params = new URLSearchParams(window.location.search);
  const payload = {
    submissionId: createSubmissionId(),
    name: form.elements.name.value.trim(),
    phone,
    age: form.elements.age.value,
    need: form.elements.need.value,
    website: form.elements.website.value,
    pageUrl: window.location.href,
    referrer: document.referrer,
    utmSource: params.get('utm_source') || '',
    utmMedium: params.get('utm_medium') || '',
    utmCampaign: params.get('utm_campaign') || '',
  };

  if (payload.website) return;

  const originalButtonContent = submitButton.innerHTML;
  submitButton.disabled = true;
  submitButton.textContent = 'Đang gửi...';
  formMessage.className = 'form-message';

  try {
    await fetch(leadEndpoint, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });

    form.reset();
    formFields.hidden = true;
    formSuccess.hidden = false;
    formSuccess.focus?.();
  } catch (error) {
    formMessage.textContent = 'Chưa gửi được thông tin. Vui lòng thử lại hoặc gọi 0946 375 566.';
    formMessage.className = 'form-message is-visible is-error';
  } finally {
    submitButton.disabled = false;
    submitButton.innerHTML = originalButtonContent;
  }
});

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.classList.add('is-visible');
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

document.querySelectorAll('.reveal').forEach((element) => observer.observe(element));
