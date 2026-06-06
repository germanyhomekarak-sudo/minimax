/* البرجي الكتريكس — لوحة المطور */
(() => {
  const DEV_CODE = '9p3cas99';
  const STORAGE_KEY = 'alburji.dev.state';
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
      '--gold': '#D4AF37',
      '--gold-2': '#F1D27A',
      '--bg': '#0E0E0E',
      '--text': '#1a1a1a',
      '--wa': '#25D366',
    },
    authed: false
  };

  const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify({
    products: state.products, contact: state.contact,
    content: state.content, theme: state.theme
  }));
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
  };
  const closeModal = () => {
    $('#devModal').hidden = true;
    document.body.style.overflow = '';
  };

  /* ========== الدخول ========== */
  const setupLogin = () => {
    const input = $('#devCode');
    const submit = $('#devSubmit');
    const err = $('#devErr');

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
    // العلامة
    $$('[data-branding]').forEach(input => {
      const path = input.dataset.branding;
      const v = getByPath(state.contact, path) ?? getByPath(state, path);
      if (v != null) input.value = v;
    });
    // المحتوى
    $$('[data-content]').forEach(input => {
      const path = input.dataset.content;
      if (state.content[path] != null) input.value = state.content[path];
    });
    // الثيم
    $$('[data-theme]').forEach(input => {
      const v = state.theme[input.dataset.theme];
      if (v) input.value = v;
    });
    // المنتجات
    renderProductList();
  };

  /* ========== إدارة المنتجات ========== */
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

    // أحداث التعديل
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
              save(); renderProductList();
            };
            reader.readAsDataURL(file);
          });
          return;
        }
        input.addEventListener('input', () => {
          const val = field === 'price' || field === 'old_price' ? +input.value || null : input.value;
          state.products.products[idx][field] = val;
          save();
        });
      });
      row.querySelector('[data-action="del"]').addEventListener('click', () => {
        if (confirm('حذف هذا المنتج؟')) {
          state.products.products.splice(idx, 1);
          save(); renderProductList();
        }
      });
      row.querySelector('[data-action="up"]').addEventListener('click', () => {
        if (idx === 0) return;
        [state.products.products[idx-1], state.products.products[idx]] =
        [state.products.products[idx], state.products.products[idx-1]];
        save(); renderProductList();
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
      save(); renderProductList();
      setTimeout(() => {
        document.querySelector('.dev-product input[data-field="name"]')?.focus();
        document.querySelector('.dev-product input[data-field="name"]')?.select();
      }, 50);
    });
  };

  /* ========== حقول النماذج ========== */
  const setupFormInputs = () => {
    $$('[data-branding]').forEach(input => {
      input.addEventListener('input', () => {
        setByPath(state.contact, input.dataset.branding, input.value);
        save();
        // تحديث رابط واتساب
        if (input.dataset.branding === 'contact.whatsapp') {
          state.contact.social = state.contact.social || {};
          state.contact.social.whatsapp_url = `https://wa.me/${input.value}?text=${encodeURIComponent('مرحبا، أرغب بالاستفسار')}`;
        }
        if (input.dataset.branding === 'contact.whatsapp2') {
          state.contact.social = state.contact.social || {};
          state.contact.social.whatsapp2_url = `https://wa.me/${input.value}?text=${encodeURIComponent('مرحبا، أحتاج خدمة إصلاح')}`;
        }
      });
    });
    $$('[data-content]').forEach(input => {
      input.addEventListener('input', () => {
        state.content[input.dataset.content] = input.value;
        save();
      });
    });
    $$('[data-theme]').forEach(input => {
      input.addEventListener('input', () => {
        state.theme[input.dataset.theme] = input.value;
        document.documentElement.style.setProperty(input.dataset.theme, input.value);
        save();
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
      // تنظيف البيانات قبل التصدير
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
      alert('✅ تم تنزيل الملفين. ارفعهما على الاستاضة داخل مجلد assets/ لاستبدال النسخة الحالية.');
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
      save();
    });
  };

  /* ========== تطبيق الثيم المخزّن فورًا ========== */
  const applyStoredTheme = () => {
    if (state.theme) {
      Object.entries(state.theme).forEach(([k, v]) => document.documentElement.style.setProperty(k, v));
    }
  };

  /* ========== ربط المتغيرات في الصفحة بالمحتوى المخزّن ========== */
  const applyStoredContent = () => {
    // Hero
    if (state.content['hero.title']) {
      const el = document.querySelector('[data-c="tagline"]');
      if (el) el.textContent = state.content['hero.title'];
    }
    if (state.content['hero.subtitle']) {
      const el = document.querySelector('.hero__sub');
      if (el) el.textContent = state.content['hero.subtitle'];
    }
    // About
    if (state.content['about.p1'] || state.content['about.p2']) {
      const ps = document.querySelectorAll('.about__text p');
      if (ps[0] && state.content['about.p1']) ps[0].textContent = state.content['about.p1'];
      if (ps[1] && state.content['about.p2']) ps[1].textContent = state.content['about.p2'];
    }
  };

  /* ========== تهيئة ========== */
  const init = async () => {
    load();
    applyStoredTheme();
    applyStoredContent();

    // تحميل البيانات الأصلية إن لم تكن محفوظة
    if (!state.products || !state.contact) {
      const [contact, products] = await Promise.all([
        fetch('assets/contact.json').then(r => r.json()),
        fetch('assets/products.json').then(r => r.json()),
      ]);
      state.contact = state.products ? contact : contact;
      state.products = state.products || products;
      // دمج
      if (!state.contact) state.contact = contact;
      if (!state.products) state.products = products;
      save();
    }

    $('#devFab').addEventListener('click', openModal);
    $$('[data-dev-close]').forEach(el => el.addEventListener('click', closeModal));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeModal(); });

    setupLogin();
    setupTabs();
    setupFormInputs();
    setupAddProduct();
    setupExport();
    setupResetTheme();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
