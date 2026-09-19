// Vercel Serverless Function: /api/orders
// Quản lý và đồng bộ cơ sở dữ liệu Cloud Orders, Customers & Inventory thời gian thực

const CLOUD_BIN_URL = 'https://extendsclass.com/api/json-storage/bin/bfebddd';
const GOOGLE_SHEET_LEAD_URL = 'https://script.google.com/macros/s/AKfycbwUXxtV-t8P3TDleQKI5q-Sw15YVbyUDCL72-iilDwZhw44zQIJp8cXjA4VVhQgAEpugg/exec';

const DEFAULT_STATE = {
  products: [
    { id: 1, name: 'Sữa Hạt Dinh Dưỡng Thực Dưỡng Enmei Gold (Hộp 400g)', type: 'physical', price: 450000, stock: 50, description: 'Đạm thực vật phân tử nhỏ thủy phân từ hạt nảy mầm, êm bụng cho người già' },
    { id: 2, name: 'Sữa Hạt Enmei Diabetes Kiểm Soát Đường Huyết (Hộp 400g)', type: 'physical', price: 480000, stock: 35, description: 'Đường Isomalt chỉ số GI thấp, dinh dưỡng chuẩn y khoa cho người tiểu đường' },
    { id: 3, name: 'Hạt Granola Siêu Hạt Nướng Mật Ong Enmei (Hũ 500g)', type: 'physical', price: 180000, stock: 80, description: 'Hạt cao cấp nhập khẩu sấy giòn, giàu chất xơ hòa tan và omega 3-6' },
    { id: 4, name: 'Cẩm Nang Dinh Dưỡng Đường Huyết 14 Ngày (Ebook PDF)', type: 'digital', price: 2000, stock: 9999, description: 'Tài liệu số hướng dẫn thực đơn phục hồi hệ tiêu hóa và kiểm soát đường huyết (Test 2.000đ)' }
  ],
  customers: [
    { id: 1, name: 'Bác Nguyễn Văn An', phone: '0912345678', email: 'vanan.nguyen@gmail.com', tier: 'vip', total_spent: 1440000 },
    { id: 2, name: 'Chị Lê Thị Mai', phone: '0987654321', email: 'maile88@yahoo.com', tier: 'regular', total_spent: 450000 },
    { id: 3, name: 'Reviewer KP3', phone: '0946375566', email: 'reviewer.kp3@focus.camp', tier: 'lead', total_spent: 4000 }
  ],
  orders: [
    {
      id: 1726750000001,
      order_code: 'ENM7341',
      customer_name: 'Reviewer KP3 (Đơn Test Review)',
      customer_phone: '0946375566',
      customer_email: 'reviewer.kp3@focus.camp',
      product_id: 4,
      product_name: 'Cẩm Nang Dinh Dưỡng Đường Huyết 14 Ngày (Ebook PDF)',
      product_type: 'digital',
      amount: 2000,
      status: 'pending',
      created_at: new Date().toLocaleString('vi-VN')
    },
    {
      id: 1726740000000,
      order_code: 'ENM7633',
      customer_name: 'Reviewer KP3',
      customer_phone: '0946375566',
      customer_email: 'reviewer.kp3@focus.camp',
      product_id: 4,
      product_name: 'Cẩm Nang Dinh Dưỡng Đường Huyết 14 Ngày (Ebook PDF)',
      product_type: 'digital',
      amount: 2000,
      status: 'completed',
      created_at: '2026-09-19 16:00:00'
    },
    {
      id: 1726650000000,
      order_code: 'ENM-1024',
      customer_name: 'Bác Nguyễn Văn An',
      customer_phone: '0912345678',
      customer_email: 'vanan.nguyen@gmail.com',
      product_id: 2,
      product_name: 'Sữa Hạt Enmei Diabetes Kiểm Soát Đường Huyết (Hộp 400g)',
      product_type: 'physical',
      amount: 480000,
      status: 'completed',
      created_at: '2026-09-18 09:30:00'
    }
  ],
  email_logs: [
    {
      time: new Date().toLocaleString('vi-VN'),
      to: 'reviewer.kp3@focus.camp',
      type: 'Transactional',
      subject: '[Enmei] Thông báo ghi nhận đơn hàng #ENM7341',
      status: 'Đã gửi'
    }
  ]
};

// In-memory fallback cache across warm lambda invocations
let memoryCache = null;

async function getCloudData() {
  try {
    const res = await fetch(CLOUD_BIN_URL + '?nocache=' + Date.now(), {
      headers: { 'Cache-Control': 'no-cache' }
    });
    if (res.ok) {
      const data = await res.json();
      if (data && Array.isArray(data.orders) && data.orders.length > 0) {
        memoryCache = data;
        return data;
      }
    }
  } catch (err) {
    console.error('Lỗi fetch Cloud Bin:', err.message);
  }

  if (memoryCache) return memoryCache;
  return DEFAULT_STATE;
}

async function saveCloudData(data) {
  memoryCache = data;
  try {
    // Server-to-Server PUT: KHÔNG BAO GIỜ bị CORS!
    const res = await fetch(CLOUD_BIN_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return res.ok;
  } catch (err) {
    console.error('Lỗi save Cloud Bin:', err.message);
    return false;
  }
}

export default async function handler(req, res) {
  // Bật CORS cho mọi origin & method
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // 1. GET: Lấy danh sách đơn hàng hoặc kiểm tra 1 đơn cụ thể
  if (req.method === 'GET') {
    const { order_code } = req.query || {};
    const data = await getCloudData();

    if (order_code) {
      const cleanCode = order_code.trim().toUpperCase();
      const found = (data.orders || []).find(o => 
        o.order_code.toUpperCase() === cleanCode || 
        o.order_code.replace(/[^A-Z0-9]/g, '') === cleanCode.replace(/[^A-Z0-9]/g, '')
      );
      if (found) {
        return res.status(200).json({ ok: true, order: found });
      } else {
        return res.status(404).json({ ok: false, message: 'Không tìm thấy đơn hàng' });
      }
    }

    return res.status(200).json({
      ok: true,
      orders: data.orders || [],
      customers: data.customers || [],
      products: data.products || [],
      email_logs: data.email_logs || []
    });
  }

  // 2. POST: Khởi tạo đơn hàng mới từ trang thanh toán
  if (req.method === 'POST') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const {
        order_code,
        customer_name,
        customer_phone,
        customer_email,
        product_id,
        product_name,
        product_type,
        amount
      } = body || {};

      if (!order_code || !customer_name || !customer_phone) {
        return res.status(400).json({ ok: false, message: 'Thiếu thông tin bắt buộc' });
      }

      const newOrder = {
        id: Date.now(),
        order_code: order_code.trim().toUpperCase(),
        customer_name: customer_name.trim(),
        customer_phone: customer_phone.trim(),
        customer_email: (customer_email || '').trim(),
        product_id: product_id || 4,
        product_name: product_name || 'Cẩm Nang Dinh Dưỡng Đường Huyết 14 Ngày (Ebook PDF)',
        product_type: product_type || 'digital',
        amount: Number(amount) || 2000,
        status: 'pending',
        created_at: new Date().toLocaleString('vi-VN')
      };

      const data = await getCloudData();
      if (!data.orders) data.orders = [];
      if (!data.customers) data.customers = [];

      // Kiểm tra trùng mã đơn
      const existingIdx = data.orders.findIndex(o => o.order_code === newOrder.order_code);
      if (existingIdx >= 0) {
        data.orders[existingIdx] = newOrder;
      } else {
        data.orders.unshift(newOrder);
      }

      // Thêm hoặc cập nhật khách hàng
      const custIdx = data.customers.findIndex(c => c.phone === newOrder.customer_phone);
      if (custIdx === -1) {
        data.customers.unshift({
          id: Date.now(),
          name: newOrder.customer_name,
          phone: newOrder.customer_phone,
          email: newOrder.customer_email,
          tier: 'lead',
          total_spent: newOrder.amount,
          created_at: new Date().toLocaleString('vi-VN')
        });
      } else {
        data.customers[custIdx].total_spent = (data.customers[custIdx].total_spent || 0) + newOrder.amount;
      }

      await saveCloudData(data);

      // Async sync sang Google Sheets Webhook (Background)
      try {
        fetch(GOOGLE_SHEET_LEAD_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            name: newOrder.customer_name,
            phone: newOrder.customer_phone,
            email: newOrder.customer_email,
            order_code: newOrder.order_code,
            product: newOrder.product_name,
            amount: newOrder.amount,
            status: 'pending',
            created_at: newOrder.created_at
          })
        }).catch(() => {});
      } catch (e) {}

      return res.status(201).json({
        ok: true,
        message: 'Khởi tạo đơn hàng thành công trên Cloud Database!',
        order: newOrder
      });
    } catch (err) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  }

  // 3. PATCH: Duyệt đơn hàng (Admin duyệt hoặc SePay webhook)
  if (req.method === 'PATCH') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      const { order_code, status } = body || {};

      if (!order_code) {
        return res.status(400).json({ ok: false, message: 'Thiếu order_code' });
      }

      const cleanCode = order_code.trim().toUpperCase();
      const data = await getCloudData();
      const targetOrder = (data.orders || []).find(o => 
        o.order_code.toUpperCase() === cleanCode || 
        o.order_code.replace(/[^A-Z0-9]/g, '') === cleanCode.replace(/[^A-Z0-9]/g, '')
      );

      if (!targetOrder) {
        return res.status(404).json({ ok: false, message: 'Không tìm thấy đơn hàng để duyệt' });
      }

      targetOrder.status = status || 'completed';

      // Trừ kho nếu là hàng vật lý
      if (targetOrder.product_type === 'physical' && targetOrder.product_id) {
        const prod = (data.products || []).find(p => p.id === targetOrder.product_id);
        if (prod && typeof prod.stock === 'number' && prod.stock > 0) {
          prod.stock -= 1;
        }
      }

      await saveCloudData(data);

      return res.status(200).json({
        ok: true,
        message: 'Đã cập nhật trạng thái đơn hàng thành công!',
        order: targetOrder
      });
    } catch (err) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  }

  // 4. PUT: Thay thế toàn bộ dữ liệu (Khôi phục dữ liệu mẫu)
  if (req.method === 'PUT') {
    try {
      const body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
      await saveCloudData(body);
      return res.status(200).json({ ok: true, message: 'Đã ghi đè Cloud DB thành công' });
    } catch (err) {
      return res.status(500).json({ ok: false, error: err.message });
    }
  }

  return res.status(405).json({ ok: false, message: 'Method Not Allowed' });
}
