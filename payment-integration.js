

const UntunginPayment = (() => {

  // ── KONFIGURASI ──────────────────────────────────────
  const CONFIG = {
    // Contoh: 'https://api.untungin.id' atau 'http://localhost:3000'
    BASE_URL: 'http://localhost:3000',

    CREATE_PAYMENT_ENDPOINT: '/api/create-payment',

    CHECK_STATUS_ENDPOINT: '/api/payment-status',

    SUCCESS_URL: '/sukses.html',

    UMKM_DISCOUNT_RATE: 0.10,

    TAX_RATE: 0.11,
  };

  // ── HITUNG TOTAL HARGA ───────────────────────────────
  function calculateTotal(cartItems) {
    const subtotal  = cartItems.reduce((sum, item) => sum + item.price, 0);
    const discount  = Math.round(subtotal * CONFIG.UMKM_DISCOUNT_RATE);
    const afterDisc = subtotal - discount;
    const tax       = Math.round(afterDisc * CONFIG.TAX_RATE);
    const total     = afterDisc + tax;

    return { subtotal, discount, tax, total };
  }

  // ── BUAT ORDER ID UNIK ───────────────────────────────
  function generateOrderId() {
    const timestamp = Date.now();
    const random    = Math.random().toString(36).substr(2, 6).toUpperCase();
    return `UNTUNGIN-${timestamp}-${random}`;
  }

  // ── FORMAT RUPIAH ────────────────────────────────────
  function formatRupiah(amount) {
    return 'Rp ' + amount.toLocaleString('id-ID');
  }

  // ── REQUEST SNAP TOKEN DARI BACKEND ─────────────────
  async function fetchSnapToken(cartItems, userInfo) {
    const orderId      = generateOrderId();
    const { total }    = calculateTotal(cartItems);

    const payload = {
      order_id:     orderId,
      gross_amount: total,
      customer: {
        first_name: userInfo.name || 'Pelanggan',
        email:      userInfo.email || '',
        phone:      userInfo.phone || '',
      },
      items: cartItems.map(item => ({
        id:       String(item.id),
        name:     item.name,
        price:    item.price,
        quantity: 1,
        category: item.tag || 'Aplikasi',
      })),
    };

    const response = await fetch(CONFIG.BASE_URL + CONFIG.CREATE_PAYMENT_ENDPOINT, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`Backend error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    if (!data.snap_token) {
      throw new Error('snap_token tidak ditemukan di response backend');
    }

    return { snapToken: data.snap_token, orderId };
  }

  // ── BUKA POPUP MIDTRANS ──────────────────────────────
  function openSnapPopup(snapToken, orderId, callbacks = {}) {
    if (typeof window.snap === 'undefined') {
      console.error('[Untungin] Snap.js belum dimuat! Pastikan script tag ada di <head>.');
      callbacks.onError?.({ message: 'Snap.js belum dimuat' });
      return;
    }

    window.snap.pay(snapToken, {
      // ✅ Pembayaran berhasil
      onSuccess(result) {
        console.log('[Untungin] Pembayaran sukses:', result);
        callbacks.onSuccess?.(result);

        // Simpan ke localStorage sebagai konfirmasi sementara
        localStorage.setItem('lastOrder', JSON.stringify({
          orderId,
          transactionId: result.transaction_id,
          status:        'success',
          timestamp:     new Date().toISOString(),
        }));

        // Redirect ke halaman sukses
        window.location.href = CONFIG.SUCCESS_URL +
          `?order_id=${result.order_id}&status=success`;
      },

      // ⏳ Menunggu pembayaran (Virtual Account, Transfer)
      onPending(result) {
        console.log('[Untungin] Menunggu pembayaran:', result);
        callbacks.onPending?.(result);

        showNotification(
          '⏳ Menunggu pembayaran',
          `Selesaikan pembayaran sebelum batas waktu. Order ID: ${result.order_id}`
        );
      },

      // ❌ Pembayaran gagal
      onError(result) {
        console.error('[Untungin] Pembayaran gagal:', result);
        callbacks.onError?.(result);

        showNotification(
          '❌ Pembayaran gagal',
          'Silakan coba lagi atau pilih metode pembayaran lain.'
        );
      },

      // 🚪 Popup ditutup sebelum selesai
      onClose() {
        console.log('[Untungin] Popup ditutup');
        callbacks.onClose?.();

        showNotification(
          '💡 Pembayaran dibatalkan',
          'Kamu bisa melanjutkan pembayaran kapan saja.'
        );
      },
    });
  }

  // ── MAIN: PROSES CHECKOUT ────────────────────────────
  async function processCheckout(cartItems, userInfo = {}, callbacks = {}) {
    if (!cartItems || cartItems.length === 0) {
      showNotification('🛒 Keranjang kosong', 'Tambahkan produk terlebih dahulu.');
      return;
    }

    // Tampilkan loading state
    setCheckoutLoading(true);

    try {
      // 1. Request snap_token dari backend
      const { snapToken, orderId } = await fetchSnapToken(cartItems, userInfo);
      console.log('[Untungin] Snap token diterima, order:', orderId);

      // 2. Buka popup Midtrans
      openSnapPopup(snapToken, orderId, callbacks);

    } catch (error) {
      console.error('[Untungin] Checkout error:', error);
      showNotification(
        '⚠️ Terjadi kesalahan',
        error.message || 'Gagal memproses pembayaran. Coba lagi.'
      );
      callbacks.onError?.({ message: error.message });
    } finally {
      setCheckoutLoading(false);
    }
  }

  // ── CEK STATUS PEMBAYARAN ────────────────────────────
  async function checkPaymentStatus(orderId) {
    try {
      const response = await fetch(
        CONFIG.BASE_URL + CONFIG.CHECK_STATUS_ENDPOINT + `?order_id=${orderId}`
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('[Untungin] Gagal cek status:', error);
      return null;
    }
  }

  // ── UI HELPERS ───────────────────────────────────────

  // Tampilkan notifikasi toast
  function showNotification(title, message) {
    // Gunakan fungsi toast yang sudah ada di untungin.html
    if (typeof showToast === 'function') {
      showToast(title + ' — ' + message);
      return;
    }

    // Fallback: buat toast sendiri jika tidak ada
    const toast = document.createElement('div');
    toast.style.cssText = `
      position: fixed; bottom: 24px; right: 24px; z-index: 9999;
      background: #0f0f0f; color: #fff; padding: 14px 20px;
      border-radius: 10px; font-size: 13px; font-weight: 500;
      max-width: 320px; line-height: 1.4;
      box-shadow: 0 4px 20px rgba(0,0,0,0.2);
      animation: fadeUp 0.2s ease;
    `;
    toast.innerHTML = `<div style="font-size:14px;margin-bottom:3px">${title}</div>
                       <div style="opacity:0.7;font-size:12px">${message}</div>`;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 4000);
  }

  // Set loading state tombol checkout
  function setCheckoutLoading(isLoading) {
    const btn = document.querySelector('.checkout-btn, #checkoutBtn');
    if (!btn) return;

    if (isLoading) {
      btn.disabled   = true;
      btn.dataset.originalText = btn.textContent;
      btn.textContent = 'Memproses... ⏳';
    } else {
      btn.disabled   = false;
      btn.textContent = btn.dataset.originalText || 'Bayar sekarang →';
    }
  }

  // ── PUBLIC API ───────────────────────────────────────
  return {
    processCheckout,
    checkPaymentStatus,
    calculateTotal,
    formatRupiah,
    generateOrderId,
    config: CONFIG,
  };

})();


// ════════════════════════════════════════════════════════
//   CONTOH PENGGUNAAN — Ganti handleCheckout() di
//   untungin.html dengan kode di bawah ini:
// ════════════════════════════════════════════════════════

/**
 * Contoh implementasi di untungin.html:
 *
 * function handleCheckout() {
 *   // Ambil data user yang sedang login
 *   const userInfo = {
 *     name:  'Budi Santoso',
 *     email: 'budi@tokomaju.com',
 *     phone: '08123456789',
 *   };
 *
 *   // Proses checkout
 *   UntunginPayment.processCheckout(cart, userInfo, {
 *     onSuccess: (result) => {
 *       // Aktifkan langganan, kirim email, dsb.
 *       console.log('Order sukses:', result.order_id);
 *     },
 *     onError: (result) => {
 *       console.error('Error:', result);
 *     }
 *   });
 * }
 */


// ════════════════════════════════════════════════════════
//   BACKEND TEMPLATE (Node.js / Express)
//   Simpan sebagai: server.js
// ════════════════════════════════════════════════════════

/**
 * const express      = require('express');
 * const midtransClient = require('midtrans-client');
 * const crypto       = require('crypto');
 * require('dotenv').config();
 *
 * const app  = express();
 * const snap = new midtransClient.Snap({
 *   isProduction: process.env.NODE_ENV === 'production',
 *   serverKey:    process.env.MIDTRANS_SERVER_KEY,
 *   clientKey:    process.env.MIDTRANS_CLIENT_KEY,
 * });
 *
 * app.use(express.json());
 *
 * // POST /api/create-payment
 * app.post('/api/create-payment', async (req, res) => {
 *   try {
 *     const { order_id, gross_amount, customer, items } = req.body;
 *
 *     const transaction = await snap.createTransaction({
 *       transaction_details: { order_id, gross_amount },
 *       customer_details:    customer,
 *       item_details:        items,
 *       credit_card:         { secure: true },
 *     });
 *
 *     res.json({ snap_token: transaction.token });
 *   } catch (err) {
 *     res.status(500).json({ error: err.message });
 *   }
 * });
 *
 * // POST /api/midtrans-webhook  ← set di Midtrans Dashboard
 * app.post('/api/midtrans-webhook', (req, res) => {
 *   const notif = req.body;
 *
 *   // Verifikasi signature (WAJIB untuk keamanan)
 *   const signatureKey = crypto
 *     .createHash('sha512')
 *     .update(
 *       notif.order_id +
 *       notif.status_code +
 *       notif.gross_amount +
 *       process.env.MIDTRANS_SERVER_KEY
 *     )
 *     .digest('hex');
 *
 *   if (signatureKey !== notif.signature_key) {
 *     return res.status(403).json({ error: 'Invalid signature' });
 *   }
 *
 *   // Update status order di database
 *   if (notif.transaction_status === 'settlement' ||
 *       notif.transaction_status === 'capture') {
 *     // TODO: Aktifkan langganan, kirim email konfirmasi
 *     console.log('Pembayaran confirmed:', notif.order_id);
 *   }
 *
 *   res.json({ status: 'ok' });
 * });
 *
 * app.listen(3000, () => console.log('Server berjalan di port 3000'));
 */