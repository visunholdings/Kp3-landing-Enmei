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
const zaloUrl = 'https://zalo.me/0946375566';

const copyOrderDetails = (text) => {
  const textarea = document.createElement('textarea');
  textarea.value = text;
  textarea.setAttribute('readonly', '');
  textarea.style.position = 'fixed';
  textarea.style.opacity = '0';
  document.body.appendChild(textarea);
  textarea.select();

  let copied = false;
  try {
    copied = document.execCommand('copy');
  } catch (error) {
    copied = false;
  }
  textarea.remove();

  if (copied) return Promise.resolve(true);
  if (!navigator.clipboard || !window.isSecureContext) return Promise.resolve(false);

  return navigator.clipboard.writeText(text)
    .then(() => true)
    .catch(() => false);
};

const openZalo = () => {
  const link = document.createElement('a');
  link.href = zaloUrl;
  link.target = '_blank';
  link.rel = 'noopener noreferrer';
  document.body.appendChild(link);
  link.click();
  link.remove();
};

document.querySelector('[data-order-channel="form"]')?.addEventListener('click', () => {
  window.setTimeout(() => form?.elements.name.focus(), 350);
});

form?.addEventListener('submit', async (event) => {
  event.preventDefault();
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

  const orderDetails = [
    'YÊU CẦU TƯ VẤN ENMEI',
    `Họ và tên: ${form.elements.name.value.trim()}`,
    `Số điện thoại/Zalo: ${phone}`,
    `Đối tượng sử dụng: ${form.elements.age.value}`,
    `Sản phẩm quan tâm: ${form.elements.need.value}`,
    'Nguồn: www.enmei.asia',
  ].join('\n');

  const copyResult = copyOrderDetails(orderDetails);
  openZalo();
  const copied = await copyResult;

  formMessage.textContent = copied
    ? 'Đã sao chép thông tin và mở Zalo 0946 375 566. Hãy dán nội dung, kiểm tra và bấm Gửi để hoàn tất.'
    : 'Zalo 0946 375 566 đã được mở. Trình duyệt chưa cho phép sao chép tự động; vui lòng gửi các thông tin vừa điền qua cửa sổ Zalo.';
  formMessage.className = 'form-message is-visible';
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
