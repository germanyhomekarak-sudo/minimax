/* البرجي الكتريكس — لوحة المطور (مقفلة بالكامل) */
(() => {
  // ========== إعدادات الأمان ==========
  const DEV_CODE       = '9p3cas99';                    // كود دخول اللوحة
  const STORAGE_KEY    = 'alburji.dev.state';           // مفتاح التخزين
  const KONAMI_CODE    = ['ArrowUp','ArrowUp','ArrowDown','ArrowDown','ArrowLeft','ArrowRight','ArrowLeft','ArrowRight','b','a'];
  let   konamiBuffer   = [];
  let   konamiUnlocked = false;

  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  // الحالة في الذاكرة
  let state = {
    products: null,
    contact: null,
    content: {
      'hero.title': '',
      'hero.subtitle': 'غسالات، برادات، تكييف، أفران وكل ما يلزم بيتك العصري — بضمان أصلي، توصيل سريع، وتركيب احترافي من فنيين معتمدين.',
      'about.p1': 'منذ تأسيسنا ونحن نوفر لعملائنا أفضل الماركات العالمية من الأجهزة الكهربائية، بخبرة موثوقة وخدمة ما بعد البيع تستمر. رؤيتنا أن يكون كل بيت عربي مجهزًا بأجهزة تجمع بين الفخامة والكفاءة.',
      'about.p2': 'رسالتنا: أن نقدم تجربة شراء متكاملة — تبدأ من الاختيار الصحيح، وتمر بالتوصيل الآمن، وتنتهي بالتركيب الاحترافي والضمان الموثوق.',
      'topbar.announcement': ''
    },
    theme: {
      '--gold':   '#D4AF37',
      '--gold-2': '#F1D27A',
      '--bg':     '#0E0E0E',
      '--text':   '#1a1a1a',
      '--wa':     '#25D366',
    },
    authed: false
  };

  /* ========== الحفظ التلقائي الفوري ========== */
  let saveTimer = null;
  const autoSave = (immediate = false) => {
    // حفظ فوري بدون تأخير
    if (immediate) {
      if (saveTimer) { clearTimeout(saveTimer); saveTimer = null; }
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        products: state.products, contact: state.contact,
        content: state.content, theme: state.theme
      }));
      // إشعار بصري خفيف
      showSaveIndicator();
      return;
    }
    // حفظ بعد 300ms (debounce) لتفادي الحفظ مع كل ضغطة مفتاح
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify({
        products: state.products, contact: state.contact,
        content: state.content, theme: state.theme
      }));
      showSaveIndicator();
    }, 300);
  };

  let indicatorEl = null;
  const showSaveIndicator = () => {
    if (!indicatorEl) {
      indicatorEl = document.createElement('div');
      indicatorEl.id = 'autosave-indicator';
      indicatorEl.style.cssText = 'position:fixed;bottom:20px;left:20px;background:#25D366;color:#fff;padding:8px 14px;border-radius:8px;font-family:Tajawal,sans-serif;font-size:13px;z-index:999999;opacity:0;transition:opacity .25s;pointer-events:none;box-shadow:0 4px 12px rgba(0,0,0,.3)';
      document.body.appendChild(indicatorEl);
    }
    indicatorEl.textContent = '✓ تم الحفظ تلقائياً';
    indicatorEl.style.opacity = '1';
    clearTimeout(indicatorEl._t);
    indicatorEl._t = setTimeout(() => { indicatorEl.style.opacity = '0'; }, 1200);
  };

  const load = () => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const s = JSON.parse(raw);
      Object.assign(state, s);
    } catch (e) {}
  };

  /* ========== فتح وإغلاق ========== */
  const openModal = () => {
    $('#devModal').hidden = false;
    document.body.style.overflow = 'hidden';
    // إعادة ضبط نموذج الدخول دائماً
    $('#devLogin').hidden = false;
    $('#devPanel').hidden = true;
    $('#devCode').value = '';
    $('#devErr').textContent = '';
    setTimeout(() => $('#devCode')?.focus(), 50);
  };
  const closeModal = () => {
    $('#devModal').hidden = true;
    document.body.style.overflow = '';
    state.authed = false;
  };

  /* ========== الدخول ========== */
  const setupLogin = () => {
    const input  = $('#devCode');
    const submit = $('#devSubmit');
    const err    = $('#devErr');

    const tryLogin = () => {
      if (input.value === DEV_CODE) {
        state.authed = true;
        err.textContent = '';
        $('#devLogin').hidden = true;
        $('#devPanel').hidden = false;
        hydratePanel();
      } else {
        err.textContent = 'الكود غير صحيح';
        input.value = ''; input.focus();
      }
    };

    submit.addEventListener('click', tryLogin);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') tryLogin(); });
  };

  /* ========== التبويبات ========== */
  const setupTabs = () => {
    $$('.dev-tab').forEach(tab => {
      tab.addEventListener('click', () => {
        $$('.dev-tab').forEach(t => t.classList.remove('active'));
        tab.classList.add('active');
        const target = tab.dataset.tab;
        $$('.dev-section').forEach(s => s.hidden = s.dataset.pane !== target);
      });
    });
  };

  /* ========== ملء الحقول ========== */
  const setByPath = (obj, path, val) => {
    const keys = path.split('.');
    const last = keys.pop();
    let cur = obj;
    keys.forEach(k => { if (!cur[k]) cur[k] = {}; cur = cur[k]; });
    cur[last] = val;
  };
  const getByPath = (obj, path) => {
    return path.split('.').reduce((o, k) => (o ? o[k] : undefined), obj);
  };

  const hydratePanel = () => {
    $$('[data-branding]').forEach(input => {
      const path = input.dataset.branding;
      const v = getByPath(state.contact, path) ?? getByPath(state, path);
      if (v != null) input.value = v;
    });
    $$('[data-content]').forEach(input => {
      const path = input.dataset.content;
      if (state.content[path] != null) input.value = state.content[path];
    });
    $$('[data-theme]').forEach(input => {
      const v = state.theme[input.dataset.theme];
      if (v) input.value = v;
    });
    renderProductList();
  };

  /* ========== إدارة المنتجات مع حفظ تلقائي ========== */
  const renderProductList = () => {
    const list = $('#devProductList');
    if (!list || !state.products?.products) return;
    list.innerHTML = state.products.products.map((p, idx) => `
      <div class="dev-product" data-idx="${idx}">
        <label class="dev-product__img" title="اضغط لتغيير الصورة">
          <img src="${p.image}" alt="" />
          <input type="file" accept="image/*" data-field="image" />
        </label>
        <div class="dev-product__info">
          <input class="dev-product__name" data-field="name" value="${escapeHtml(p.name)}" placeholder="اسم المنتج" />
          <div class="dev-product__row">
            <input data-field="category" value="${escapeHtml(p.category)}" placeholder="الفئة" style="max-width:110px" />
            <input data-field="price" type="number" value="${p.price}" placeholder="السعر" style="max-width:90px" />
            <input data-field="old_price" type="number" value="${p.old_price || ''}" placeholder="سعر قديم" style="max-width:90px" />
            <input data-field="badge" value="${escapeHtml(p.badge || '')}" placeholder="شارة" style="max-width:100px" />
          </div>
        </div>
        <div class="dev-product__actions">
          <button class="up" data-action="up" title="أعلى">↑</button>
          <button class="del" data-action="del" title="حذف">✕</button>
        </div>
      </div>
    `).join('');

    // أحداث التعديل مع حفظ تلقائي فوري
    list.querySelectorAll('.dev-product').forEach(row => {
      const idx = +row.dataset.idx;
      row.querySelectorAll('[data-field]').forEach(input => {
        const field = input.dataset.field;
        if (field === 'image') {
          input.addEventListener('change', (e) => {
            const file = e.target.files[0];
            if (!file) return;
            const reader = new FileReader();
            reader.onload = () => {
              state.products.products[idx].image = reader.result;
              autoSave(true);
              renderProductList();
              // تحديث الموقع فوراً
              if (window.__alBurjiRefresh) window.__alBurjiRefresh();
            };
            reader.readAsDataURL(file);
          });
          return;
        }
        // حفظ فوري عند كل تعديل
        input.addEventListener('input', () => {
          const val = field === 'price' || field === 'old_price' ? +input.value || null : input.value;
          state.products.products[idx][field] = val;
          autoSave();
          // تحديث الموقع فوراً
          if (window.__alBurjiRefresh) window.__alBurjiRefresh();
        });
      });
      row.querySelector('[data-action="del"]').addEventListener('click', () => {
        if (confirm('حذف هذا المنتج؟')) {
          state.products.products.splice(idx, 1);
          autoSave(true);
          renderProductList();
          if (window.__alBurjiRefresh) window.__alBurjiRefresh();
        }
      });
      row.querySelector('[data-action="up"]').addEventListener('click', () => {
        if (idx === 0) return;
        [state.products.products[idx-1], state.products.products[idx]] =
        [state.products.products[idx], state.products.products[idx-1]];
        autoSave(true);
        renderProductList();
        if (window.__alBurjiRefresh) window.__alBurjiRefresh();
      });
    });
  };

  const escapeHtml = (s) => String(s ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  }[c]));

  const setupAddProduct = () => {
    $('#addProduct').addEventListener('click', () => {
      const newP = {
        id: 'p' + Date.now(),
        name: 'منتج جديد',
        category: 'عام',
        price: 0,
        old_price: null,
        badge: null,
        short_desc: 'وصف قصير للمنتج',
        image: 'assets/images/product-washer.svg'
      };
      state.products.products.unshift(newP);
      autoSave(true);
      renderProductList();
      if (window.__alBurjiRefresh) window.__alBurjiRefresh();
      setTimeout(() => {
        document.querySelector('.dev-product input[data-field="name"]')?.focus();
        document.querySelector('.dev-product input[data-field="name"]')?.select();
      }, 50);
    });
  };

  /* ========== حقول النماذج مع حفظ تلقائي ========== */
  const setupFormInputs = () => {
    $$('[data-branding]').forEach(input => {
      input.addEventListener('input', () => {
        setByPath(state.contact, input.dataset.branding, input.value);
        if (input.dataset.branding === 'contact.whatsapp') {
          state.contact.social = state.contact.social || {};
          state.contact.social.whatsapp_url = `https://wa.me/${input.value}?text=${encodeURIComponent('مرحبا، أرغب بالاستفسار')}`;
        }
        if (input.dataset.branding === 'contact.whatsapp2') {
          state.contact.social = state.contact.social || {};
          state.contact.social.whatsapp2_url = `https://wa.me/${input.value}?text=${encodeURIComponent('مرحبا، أحتاج خدمة إصلاح')}`;
        }
        autoSave();
        // تحديث الموقع فوراً
        if (window.__alBurjiApplyContent) window.__alBurjiApplyContent();
      });
    });
    $$('[data-content]').forEach(input => {
      input.addEventListener('input', () => {
        state.content[input.dataset.content] = input.value;
        autoSave();
        if (window.__alBurjiApplyContent) window.__alBurjiApplyContent();
      });
    });
    $$('[data-theme]').forEach(input => {
      input.addEventListener('input', () => {
        state.theme[input.dataset.theme] = input.value;
        document.documentElement.style.setProperty(input.dataset.theme, input.value);
        autoSave();
      });
    });
  };

  /* ========== تصدير ========== */
  const downloadJson = (filename, obj) => {
    const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const setupExport = () => {
    const preview = $('#exportPreview');
    const refreshPreview = () => {
      preview.textContent = JSON.stringify({ contact: state.contact, products: state.products }, null, 2);
    };

    $('#exportJson').addEventListener('click', () => {
      const cleanContact = JSON.parse(JSON.stringify(state.contact));
      if (cleanContact.contact?.whatsapp) {
        cleanContact.social = cleanContact.social || {};
        cleanContact.social.whatsapp_url = `https://wa.me/${cleanContact.contact.whatsapp}?text=${encodeURIComponent('مرحبا، أرغب بالاستفسار')}`;
        if (cleanContact.contact?.whatsapp2) {
          cleanContact.social.whatsapp2_url = `https://wa.me/${cleanContact.contact.whatsapp2}?text=${encodeURIComponent('مرحبا، أحتاج خدمة إصلاح')}`;
        }
      }
      downloadJson('contact.json', cleanContact);
      downloadJson('products.json', state.products);
      refreshPreview();
      alert('✅ تم تنزيل الملفين. ارفعهما على الاستضافة داخل مجلد assets/ لاستبدال النسخة الحالية.');
    });

    $('#exportAndShare').addEventListener('click', () => {
      const msg = `✅ تم تحديث بيانات البرجي الكتريكس\n\nعدد المنتجات: ${state.products.products.length}\nالجوال: ${state.contact.contact.phone_display}\n\nأرفق ملفات contact.json و products.json في الاستضافة.`;
      const wa = state.contact.social?.whatsapp_url || 'https://wa.me/';
      window.open(wa + (wa.includes('?') ? '&' : '?') + 'text=' + encodeURIComponent(msg), '_blank');
    });

    refreshPreview();
  };

  /* ========== ثيم: إعادة الافتراضي ========== */
  const setupResetTheme = () => {
    $('#resetTheme').addEventListener('click', () => {
      state.theme = { '--gold': '#D4AF37', '--gold-2': '#F1D27A', '--bg': '#0E0E0E', '--text': '#1a1a1a', '--wa': '#25D366' };
      Object.entries(state.theme).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
      hydratePanel();
      autoSave(true);
    });
  };

  /* ========== فتح اللوحة — 3 طرق سرية ========== */
  // الطريقة 1: اختصار Konami Code (الكلاسيكي)
  const setupKonami = () => {
    document.addEventListener('keydown', (e) => {
      konamiBuffer.push(e.key);
      if (konamiBuffer.length > KONAMI_CODE.length) konamiBuffer.shift();
      if (konamiBuffer.join(',') === KONAMI_CODE.join(',')) {
        konamiUnlocked = true;
        openModal();
        konamiBuffer = [];
      }
    });
  };

  // الطريقة 2: نقر 7 مرات على الشعار
  const setupLogoClicks = () => {
    let logoClicks = [];
    document.addEventListener('click', (e) => {
      // أي عنصر فيه اللوغو أو اسم البراند
      const target = e.target.closest('[data-c="tagline"], .brand, .brand__name, header img');
      if (target) {
        logoClicks.push(Date.now());
        logoClicks = logoClicks.filter(t => Date.now() - t < 2000);
        if (logoClicks.length >= 7) {
          openModal();
          logoClicks = [];
        }
      }
    });
  };

  // الطريقة 3: من الـ Console فقط (للمطور)
  window.__alBurjiOpenDev = () => {
    console.log('%c🔓 al BOURJI — Developer Mode', 'color:#D4AF37;font-size:16px;font-weight:bold');
    console.log('%cأدخل الكود في النافذة المفتوحة', 'color:#888');
    openModal();
  };

  // الطريقة 4: اختصار لوحة المفاتيح Ctrl+Shift+D
  const setupShortcut = () => {
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey && e.shiftKey && (e.key === 'D' || e.key === 'd')) {
        e.preventDefault();
        openModal();
      }
    });
  };

  /* ========== تهيئة ========== */
  const init = async () => {
    load();

    // تحميل البيانات الأصلية إن لم تكن محفوظة
    if (!state.products || !state.contact) {
      const [contact, products] = await Promise.all([
        fetch('assets/contact.json').then(r => r.json()),
        fetch('assets/products.json').then(r => r.json()),
      ]);
      state.contact = state.products ? contact : contact;
      state.products = state.products || products;
      if (!state.contact) state.contact = contact;
      if (!state.products) state.products = products;
      autoSave(true);
    }

    // زر المطور مخفي — لا نحتاج ربط click عليه (لأنه display:none)
    $$('[data-dev-close]').forEach(el => el.addEventListener('click', closeModal));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

    setupLogin();
    setupTabs();
    setupFormInputs();
    setupAddProduct();
    setupExport();
    setupResetTheme();
    setupKonami();
    setupLogoClicks();
    setupShortcut();

    // إشعار صامت بأن الكود يعمل
    console.log('%cal BOURJI ELECTRICS — protected build', 'color:#D4AF37');
    console.log('%c• لفتح لوحة المطور: Ctrl+Shift+D أو كونسول: __alBurjiOpenDev()', 'color:#888');
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
