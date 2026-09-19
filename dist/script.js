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
  const buyer = form.elements.buyer.value;
  const need = form.elements.need.value;
  const usedBefore = form.elements.usedBefore.value;
  const payload = {
    submissionId: createSubmissionId(),
    name: form.elements.name.value.trim(),
    phone,
    buyer,
    need,
    usedBefore,
    // Giữ dữ liệu đọc được trong cấu trúc lead cũ, đồng thời gửi các trường mới ở trên.
    age: `Mua cho: ${buyer}`,
    surveyNeed: `${need}; Đã từng dùng: ${usedBefore}`,
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

/* ==========================================================
   ENMEI SALES CHATBOT 24/7 INTERACTION LOGIC
   ========================================================== */
const chatWidget = document.querySelector('#enmei-chat-widget');
const chatToggle = document.querySelector('#chat-toggle');
const chatClose = document.querySelector('#chat-close');
const chatBody = document.querySelector('#chat-body');
const chatForm = document.querySelector('#chat-form');
const chatInput = document.querySelector('#chat-input');
const chatWindow = document.querySelector('#chat-window');

// Toggle chat window
const toggleChat = (open) => {
  const isOpen = typeof open === 'boolean' ? open : !chatWidget.classList.contains('is-open');
  chatWidget.classList.toggle('is-open', isOpen);
  chatWindow.setAttribute('aria-hidden', String(!isOpen));
  if (isOpen) {
    chatInput.focus();
    scrollChatBottom();
  }
};

chatToggle?.addEventListener('click', () => toggleChat());
chatClose?.addEventListener('click', () => toggleChat(false));

const scrollChatBottom = () => {
  if (chatBody) {
    chatBody.scrollTop = chatBody.scrollHeight;
  }
};

// Response knowledge base based on sales_script.md
const getBotResponse = (rawQuery) => {
  const q = rawQuery.toLowerCase().trim();

  if (q.includes('giá') || q.includes('bao nhiêu') || q.includes('tiền') || q.includes('khuyến mãi') || q.includes('ưu đãi') || q.includes('combo')) {
    return {
      text: `<p>Dạ Enmei có giá niêm yết là <strong>590.000đ / lon lớn 850g</strong> (pha được 21–22 ly chuẩn dinh dưỡng y khoa).</p>
             <p>Hiện bên em đang có chính sách trợ giá tốt nhất cho gia đình dùng đều đặn:</p>
             <p>• <strong>Combo 2 lon:</strong> Chỉ còn <strong>1.100.000đ</strong> (550.000đ/lon — Miễn phí vận chuyển toàn quốc).<br>
             • <strong>Combo 3 lon:</strong> Chỉ <strong>1.590.000đ</strong> (Tặng kèm 01 bình lắc chuyên dụng Enmei).</p>`,
      actions: [
        { label: '👉 Đặt mua Combo / Nhận tư vấn', target: '#tu-van' },
        { label: '📞 Gọi Hotline: 0946 375 566', href: 'tel:0946375566' }
      ]
    };
  }

  if (q.includes('đầy bụng') || q.includes('sôi bụng') || q.includes('tiêu chảy') || q.includes('bụng yếu') || q.includes('lactose') || q.includes('êm bụng') || q.includes('dị ứng')) {
    return {
      text: `<p>Dạ anh/chị hoàn toàn an tâm! Tình trạng đi ngoài hay sôi bụng là do người lớn tuổi thiếu men tiêu hóa đường lactose trong sữa bò công nghiệp.</p>
             <p>Enmei sử dụng <strong>100% đạm thực vật tinh sạch &amp; hạt cao cấp (0% lactose)</strong>. Sản phẩm hấp thu êm ái sau 15 phút, giải quyết dứt điểm nỗi sợ trướng bụng, đầy hơi. Hơn <strong>94% khách hàng</strong> bụng yếu phản hồi uống rất êm ngay từ ly đầu tiên ạ!</p>`,
      actions: [
        { label: '👉 Đăng ký tư vấn dùng thử êm bụng', target: '#tu-van' }
      ]
    };
  }

  if (q.includes('tiểu đường') || q.includes('đường huyết') || q.includes('type 2') || q.includes('tiền tiểu đường') || q.includes('diabetes')) {
    return {
      text: `<p>Dạ đối với người tiểu đường và tiền tiểu đường, dòng <strong>Enmei Diabetes (lon tím)</strong> là giải pháp chuyên biệt nhất:</p>
             <p>1. <strong>Chỉ số GI &lt; 35 (Low GI):</strong> Sử dụng hệ đường hấp thu chậm Isomalt &amp; Palatinose, giúp ổn định đường huyết, không làm đường tăng vọt sau ăn.<br>
             2. <strong>Hệ đạm hạt thanh nhẹ:</strong> Êm bụng tuyệt đối, giải quyết chứng đầy hơi khó tiêu.<br>
             3. <strong>Vị bùi thanh tự nhiên:</strong> Không ngọt gắt nhân tạo, uống thanh mát mỗi ngày mà không bị ngán.</p>`,
      actions: [
        { label: '👉 Tư vấn chuyên sâu Enmei Diabetes', target: '#tu-van' }
      ]
    };
  }

  if (q.includes('glucerna') || q.includes('sữa ngoại') || q.includes('sữa mỹ') || q.includes('abbott') || q.includes('so sánh')) {
    return {
      text: `<p>Dạ Glucerna là sản phẩm quốc tế rất tốt. Tuy nhiên mức giá gần 1 triệu/lon sẽ là gánh nặng lớn nếu uống đều đặn 2–3 lon/tháng (mất 2–3 triệu/tháng), chưa kể đạm sữa bò của Glucerna dễ gây trướng bụng cho người cao tuổi.</p>
             <p><strong>Enmei</strong> chuẩn y khoa kiểm soát đường huyết tương đương nhưng dùng <strong>đạm hạt thanh nhẹ êm bụng</strong> và chi phí <strong>tiết kiệm hơn gần 40%</strong> (590k/lon), giúp gia đình duy trì đều đặn quanh năm mà không lo gánh nặng tiền bạc ạ!</p>`,
      actions: [
        { label: '👉 Xem bảng so sánh & Nhận tư vấn', target: '#tu-van' }
      ]
    };
  }

  if (q.includes('nghĩ thêm') || q.includes('suy nghĩ') || q.includes('hỏi lại') || q.includes('chưa mua') || q.includes('cân nhắc')) {
    return {
      text: `<p>Dạ vâng ạ, sức khỏe của bản thân và cha mẹ là quan trọng nhất, mình cứ cân nhắc và trao đổi thêm với người nhà cho thật an tâm ạ!</p>
             <p>Hiện tại Enmei có <strong>Cẩm nang dinh dưỡng đường huyết &amp; Thực đơn 14 ngày cho người lớn tuổi</strong> hoàn toàn miễn phí. Anh/chị chỉ cần để lại thông tin tại Form tư vấn bên dưới, chuyên viên sẽ gửi cẩm nang qua Zalo cho gia đình tham khảo trước nhé!</p>`,
      actions: [
        { label: '📘 Nhận Cẩm nang dinh dưỡng miễn phí', target: '#tu-van' }
      ]
    };
  }

  if (q.includes('xương khớp') || q.includes('khớp') || q.includes('tê bì') || q.includes('thoái hóa') || q.includes('bone')) {
    return {
      text: `<p>Dạ đối với vấn đề đau nhức xương khớp và vận động khó khăn, anh/chị nên chọn dòng <strong>Enmei Bone+ (lon xanh lá)</strong> ạ.</p>
             <p>Sản phẩm kết hợp bộ ba <strong>Canxi Nano + Vitamin D3 + MK7</strong> giúp gắn canxi trực tiếp vào xương, cùng <strong>Collagen Type II thủy phân</strong> giúp tái tạo sụn khớp, giảm hẳn cảm giác khô khớp và lục cục khi đi lại ạ.</p>`,
      actions: [
        { label: '👉 Tư vấn Enmei Bone+ Xương Khớp', target: '#tu-van' }
      ]
    };
  }

  if (q.includes('người già') || q.includes('lớn tuổi') || q.includes('chán ăn') || q.includes('sút cân') || q.includes('mệt mỏi') || q.includes('gold elder')) {
    return {
      text: `<p>Dạ với người cao tuổi cần bồi bổ thể trạng toàn diện, dòng <strong>Enmei Gold Elder (lon xanh dương)</strong> là phù hợp nhất ạ.</p>
             <p>Sản phẩm bổ sung hợp chất <strong>CaHMB</strong> giúp chống teo cơ, phục hồi sức khỏe nhanh, cùng chất xơ FOS và Omega 3 giúp kích thích ăn ngon miệng, ngủ sâu giấc và tăng sức đề kháng ạ.</p>`,
      actions: [
        { label: '👉 Tư vấn Enmei Gold Elder', target: '#tu-van' }
      ]
    };
  }

  if (q.includes('cách pha') || q.includes('uống thế nào') || q.includes('hướng dẫn')) {
    return {
      text: `<p>Dạ cách pha sữa Enmei rất đơn giản ạ:</p>
             <p>• Cho <strong>4 muỗng gạt ngang (khoảng 40g)</strong> vào ly.<br>
             • Rót <strong>180ml nước ấm (khoảng 45°C - 50°C)</strong>, khuấy đều cho tan hoàn toàn.<br>
             • Uống 2 ly mỗi ngày vào bữa phụ (9h sáng và 3h chiều) hoặc thay thế bữa sáng khi bận rộn ạ.</p>`,
      actions: [
        { label: '👉 Nhận cẩm nang hướng dẫn chi tiết', target: '#tu-van' }
      ]
    };
  }

  // Mặc định
  return {
    text: `<p>Dạ Enmei cung cấp bộ ba giải pháp dinh dưỡng chuẩn y khoa từ <strong>đạm thực vật &amp; hạt cao cấp</strong>:</p>
           <p>1. <strong>Enmei Diabetes:</strong> Kiểm soát đường huyết êm bụng (GI &lt; 35).<br>
           2. <strong>Enmei Bone+:</strong> Chăm sóc xương chắc, khớp linh hoạt.<br>
           3. <strong>Enmei Gold Elder:</strong> Phục hồi thể lực, cơ bắp cho người lớn tuổi.</p>
           <p>Giá niêm yết: <strong>590.000đ / lon 850g</strong> (Combo 2 lon: 1.100.000đ freeship). Anh/chị có thể để lại thông tin để chuyên viên tư vấn gọi hỗ trợ chi tiết nhé!</p>`,
    actions: [
      { label: '👉 Để lại thông tin nhận tư vấn ngay', target: '#tu-van' },
      { label: '📞 Gọi Hotline: 0946 375 566', href: 'tel:0946375566' }
    ]
  };
};

const appendMessage = (sender, contentObj) => {
  const msgDiv = document.createElement('div');
  msgDiv.className = `chat-msg chat-msg--${sender}`;

  const bubble = document.createElement('div');
  bubble.className = 'chat-msg__bubble';

  if (typeof contentObj === 'string') {
    bubble.innerHTML = `<p>${contentObj}</p>`;
  } else {
    bubble.innerHTML = contentObj.text || '';
    if (contentObj.actions && contentObj.actions.length > 0) {
      const actionsDiv = document.createElement('div');
      actionsDiv.className = 'chat-msg__actions';
      contentObj.actions.forEach(action => {
        const btn = document.createElement('a');
        btn.className = 'chat-action-btn';
        btn.innerHTML = action.label;
        if (action.href) {
          btn.href = action.href;
        } else if (action.target) {
          btn.href = action.target;
          btn.addEventListener('click', (e) => {
            e.preventDefault();
            toggleChat(false);
            const targetEl = document.querySelector(action.target);
            targetEl?.scrollIntoView({ behavior: 'smooth' });
            window.setTimeout(() => {
              form?.elements.name?.focus();
            }, 500);
          });
        }
        actionsDiv.appendChild(btn);
      });
      bubble.appendChild(actionsDiv);
    }
  }

  msgDiv.appendChild(bubble);
  chatBody?.appendChild(msgDiv);
  scrollChatBottom();
};

const showTypingIndicator = () => {
  const typingDiv = document.createElement('div');
  typingDiv.className = 'chat-msg chat-msg--bot chat-typing-wrap';
  typingDiv.innerHTML = `<div class="chat-typing"><span></span><span></span><span></span></div>`;
  chatBody?.appendChild(typingDiv);
  scrollChatBottom();
  return typingDiv;
};

const handleUserSend = (text) => {
  if (!text || !text.trim()) return;
  const userText = text.trim();
  appendMessage('user', userText);
  if (chatInput) chatInput.value = '';

  const typingEl = showTypingIndicator();

  window.setTimeout(() => {
    typingEl?.remove();
    const botReply = getBotResponse(userText);
    appendMessage('bot', botReply);
  }, 450);
};

chatForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  handleUserSend(chatInput?.value);
});

document.querySelectorAll('.chip')?.forEach(chip => {
  chip.addEventListener('click', () => {
    const question = chip.getAttribute('data-question');
    if (question) {
      handleUserSend(question);
    }
  });
});

