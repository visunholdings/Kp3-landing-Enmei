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

  const email = form.elements.email ? form.elements.email.value.trim() : '';
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    formMessage.textContent = 'Địa chỉ email chưa đúng định dạng. Vui lòng kiểm tra lại.';
    formMessage.className = 'form-message is-visible is-error';
    if (form.elements.email) form.elements.email.focus();
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
    email,
    buyer,
    need,
    usedBefore,
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
    // 1. Gửi sang Google Sheets (hạ tầng cũ)
    fetch(leadEndpoint, {
      method: 'POST',
      mode: 'no-cors',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    }).catch(() => {});

    // 2. Đồng bộ khách hàng vào Cloud CRM (dùng chung cho Admin đa trình duyệt)
    try {
      const cloudRes = await fetch('https://extendsclass.com/api/json-storage/bin/bfebddd');
      if (cloudRes.ok) {
        const cloudData = await cloudRes.json();
        if (!cloudData.customers) cloudData.customers = [];
        const exist = cloudData.customers.find(c => c.phone === phone || c.email === email);
        if (!exist) {
          cloudData.customers.unshift({
            id: Date.now(),
            name: payload.name,
            phone,
            email,
            tier: 'lead',
            total_spent: 0,
            survey: `Mua cho: ${buyer}; Nhu cầu: ${need}`,
            created_at: new Date().toLocaleString('vi-VN')
          });
          await fetch('https://extendsclass.com/api/json-storage/bin/bfebddd', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cloudData)
          });
        }
      }
    } catch (e) {
      console.warn('Lỗi lưu Cloud CRM:', e);
    }

    // 3. Kích hoạt chuỗi Email Sequences (Resend API)
    try {
      const isTest = email.includes('+test') || email.includes('test');
      
      // Gửi Email 1 (Welcome)
      await fetch('/api/send-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: email,
          name: payload.name,
          type: 'sequence_1',
          subject: 'Chào mừng bạn đến với Enmei — Lời cảm ơn và bí quyết êm bụng mỗi ngày 🌿',
          html: `<div style="font-family:sans-serif; max-width:600px; margin:0 auto; padding:20px; border:1px solid #e2e8f0; border-radius:8px;">
            <h2 style="color:#063b80;">Chào bạn ${payload.name},</h2>
            <p>Cảm ơn bạn đã tin tưởng để lại thông tin tại Enmei. Chúng tôi hiểu rằng việc lựa chọn giải pháp dinh dưỡng êm bụng cho bản thân và cha mẹ là quyết định vô cùng quan trọng.</p>
            <p>Đội ngũ chuyên gia dinh dưỡng của Enmei đã tiếp nhận thông tin khảo sát và sẽ liên hệ hỗ trợ bạn trong vòng 24 giờ tới.</p>
            <p style="background:#f0fdf4; padding:12px; border-left:4px solid #10b981;">🌿 <strong>Hệ đạm thực vật thủy phân Enmei:</strong> Hấp thu nhẹ nhàng sau 15 phút, không lo đầy hơi trướng bụng.</p>
            <p>Trân trọng,<br><strong>Đội ngũ Enmei Dinh Dưỡng Thực Dưỡng</strong><br><small>Hotline: 0946 375 566</small></p>
          </div>`
        })
      });

      // Nếu chứa +test: Gửi luôn Email 2 và Email 3 tức thì!
      if (isTest) {
        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: email,
            name: payload.name,
            type: 'sequence_2',
            subject: '[Test Sequence 2] Vì sao người lớn tuổi uống sữa hay bị đầy bụng, khó tiêu? Góc nhìn khoa học 💡',
            html: `<div style="font-family:sans-serif; max-width:600px; margin:0 auto; padding:20px; border:1px solid #e2e8f0; border-radius:8px;">
              <h2 style="color:#063b80;">[Test Nurture 2] Chào bạn ${payload.name},</h2>
              <p>Rất nhiều người lớn tuổi sau 50 tuổi bị thiếu men lactase tự nhiên và khó dung nạp đạm casein động vật, dẫn đến sôi bụng và khó tiêu.</p>
              <p>Hệ đạm thực vật thủy phân enzym phân tử nhỏ từ hạt nảy mầm Enmei chính là giải pháp tự nhiên giúp ruột non hấp thu êm dịu nhất.</p>
              <p>Thân mến,<br><strong>Trịnh Minh Hùng - Co-founder Enmei</strong></p>
            </div>`
          })
        });

        await fetch('/api/send-email', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            to: email,
            name: payload.name,
            type: 'sequence_3',
            subject: '[Test Sequence 3] Dành riêng cho bạn: Món quà trải nghiệm Sữa Hạt Enmei êm bụng chuẩn y khoa 🎁',
            html: `<div style="font-family:sans-serif; max-width:600px; margin:0 auto; padding:20px; border:1px solid #e2e8f0; border-radius:8px;">
              <h2 style="color:#063b80;">[Test Offer 3] Chào bạn ${payload.name},</h2>
              <p>Ưu đãi tuần này: Tặng 1 bình lắc và miễn phí vận chuyển khi đặt Combo 2 hộp Enmei bất kỳ.</p>
              <p><a href="https://www.enmei.asia/thanh-toan" style="background:#10b981; color:#fff; padding:10px 20px; text-decoration:none; border-radius:6px; font-weight:bold; display:inline-block;">ĐẶT HÀNG &amp; THANH TOÁN VIETQR NGAY →</a></p>
              <p>Trân trọng,<br><strong>Đội ngũ Enmei Vietnam</strong></p>
            </div>`
          })
        });
      }

      // Ghi nhật ký vào email_logs trên Cloud DB
      try {
        const cRes = await fetch('https://extendsclass.com/api/json-storage/bin/bfebddd');
        if (cRes.ok) {
          const cData = await cRes.json();
          if (!cData.email_logs) cData.email_logs = [];
          cData.email_logs.unshift({
            time: new Date().toLocaleString('vi-VN'),
            to: email,
            type: 'Sequence 1 (Chào mừng)',
            subject: 'Chào mừng bạn đến với Enmei — Lời cảm ơn và bí quyết êm bụng mỗi ngày 🌿',
            status: 'Thành công (Đã gửi)'
          });
          if (isTest) {
            cData.email_logs.unshift({
              time: new Date().toLocaleString('vi-VN'),
              to: email,
              type: 'Sequence 2 (Nurture - Giá trị)',
              subject: '[Test Sequence 2] Vì sao người lớn tuổi uống sữa hay bị đầy bụng, khó tiêu?',
              status: 'Thành công (Đã gửi)'
            });
            cData.email_logs.unshift({
              time: new Date().toLocaleString('vi-VN'),
              to: email,
              type: 'Sequence 3 (Offer - Chốt deal)',
              subject: '[Test Sequence 3] Dành riêng cho bạn: Món quà trải nghiệm Sữa Hạt Enmei',
              status: 'Thành công (Đã gửi)'
            });
          }
          await fetch('https://extendsclass.com/api/json-storage/bin/bfebddd', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(cData)
          });
        }
      } catch (logErr) {}
    } catch (e) {
      console.warn('Lỗi gửi email sequence:', e);
    }

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

