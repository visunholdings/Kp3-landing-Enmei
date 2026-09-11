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

let quantity = 1;
const quantityOutput = document.querySelector('#quantity');
document.querySelectorAll('[data-action]').forEach((button) => {
  button.addEventListener('click', () => {
    quantity = button.dataset.action === 'plus' ? Math.min(quantity + 1, 9) : Math.max(quantity - 1, 1);
    quantityOutput.textContent = String(quantity);
  });
});

const form = document.querySelector('#consult-form');
const formMessage = form?.querySelector('.form-message');
form?.addEventListener('submit', (event) => {
  event.preventDefault();
  const fields = [...form.querySelectorAll('[required]')];
  const emptyField = fields.find((field) => !field.value.trim());

  if (emptyField) {
    formMessage.textContent = 'Vui lòng điền đầy đủ các thông tin để chúng tôi có thể tư vấn chính xác hơn.';
    formMessage.className = 'form-message is-visible is-error';
    emptyField.focus();
    return;
  }

  const phone = form.elements.phone.value.replace(/\s/g, '');
  if (!/^(0|\+84)\d{9,10}$/.test(phone)) {
    formMessage.textContent = 'Số điện thoại chưa đúng định dạng. Vui lòng kiểm tra lại.';
    formMessage.className = 'form-message is-visible is-error';
    form.elements.phone.focus();
    return;
  }

  formMessage.textContent = `Cảm ơn ${form.elements.name.value.trim()}! Yêu cầu đã được ghi nhận trên bản demo.`;
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
