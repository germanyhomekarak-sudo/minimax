/* al BOURJI ELECTRICS — التفاعلات */
(() => {
  const $  = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));

  /* ========== تحميل البيانات ========== */
  const fetchJSON = async (p) => {
    try { const r = await fetch(p); return await r.json(); }
    catch (e) { console.error('load fail', p, e); return null; }
  };

  const fillFromData = (data) => {
    if (!data) return;
    const map = {
      'tagline':        data.brand?.tagline,
      'slogan':         data.brand?.slogan,
      'phone_display':  data.contact?.phone_display,
      'phone2_display': data.contact?.phone2_display,
      'email':          data.contact?.email,
      'instagram_handle': data.contact?.instagram_handle,
      'address':        data.contact?.address,
      'city':           data.contact?.city,
      'shipping_area':  data.contact?.shipping_area,
      'working_hours':  data.contact?.working_hours,
      'established':    data.brand?.established,
    };
    $$('[data-c]').forEach(el => {
      const k = el.dataset.c;
      if (map[k]) el.textContent = map[k];
    });
    $$('[data-social]').forEach(el => {
      const k = el.dataset.social;
      let v = data.contact?.[k] || data.social?.[k];
      if (k === 'whatsapp' && data.contact?.whatsapp) {
        v = `https://wa.me/${data.contact.whatsapp}?text=${encodeURIComponent('مرحبا، أرغب بالاستفسار عن منتج')}`;
      }
      if (k === 'whatsapp2' && data.contact?.whatsapp2) {
        v = `https://wa.me/${data.contact.whatsapp2}?text=${encodeURIComponent('مرحبا، أحتاج خدمة إصلاح')}`;
      }
      if (v) { el.setAttribute('href', v); el.style.opacity = '1'; }
      else { el.style.opacity = '.4'; el.setAttribute('aria-disabled', 'true'); }
    });

    // اسم الفني
    if (data.mechanic?.name) {
      const el = $('#mechanicName');
      if (el) el.textContent = data.mechanic.name;
    }
  };

  /* ========== المنتجات ========== */
  let allProducts = [];
  let activeFilter = 'all';
  let searchTerm = '';

  const renderProducts = (data) => {
    allProducts = data.products || [];
    renderChips(allProducts);
    renderGrid();
    fillSelect(allProducts);
  };

  const renderChips = (products) => {
    const wrap = $('#filterChips');
    if (!wrap) return;
    const cats = ['all', ...new Set(products.map(p => p.category))];
    wrap.innerHTML = cats.map(c =>
      c === 'all' ? `<button class="chip active" data-filter="all">الكل</button>`
      : `<button class="chip" data-filter="${c}">${c}</button>`
    ).join('');
    wrap.querySelectorAll('.chip').forEach(chip => {
      chip.addEventListener('click', () => {
        activeFilter = chip.dataset.filter;
        wrap.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        renderGrid();
      });
    });
  };

  const renderGrid = () => {
    const grid = $('#productGrid');
    const noRes = $('#noResults');
    if (!grid) return;
    const filtered = allProducts.filter(p => {
      const catMatch = activeFilter === 'all' || p.category === activeFilter;
      const s = searchTerm.trim().toLowerCase();
      const searchMatch = !s ||
        p.name.toLowerCase().includes(s) ||
        p.category.toLowerCase().includes(s) ||
        (p.short_desc || '').toLowerCase().includes(s);
      return catMatch && searchMatch;
    });
    if (!filtered.length) {
      grid.innerHTML = '';
      if (noRes) noRes.hidden = false;
      return;
    }
    if (noRes) noRes.hidden = true;
    grid.innerHTML = filtered.map(p => `
      <article class="product" data-pid="${p.id}">
        <div class="product__img">
          ${p.badge ? `<span class="product__badge">${p.badge}</span>` : ''}
          <img src="${p.image}" alt="${p.name}" loading="lazy" />
        </div>
        <div class="product__body">
          <span class="product__cat">${p.category}</span>
          <h3 class="product__name">${p.name}</h3>
          <p class="product__desc">${p.short_desc}</p>
          <div class="product__foot">
            <div class="product__price">
              ${p.old_price ? `<del>$${p.old_price}</del>` : ''}
              <strong>$${p.price}</strong>
            </div>
            <span class="product__btn">عرض التفاصيل →</span>
          </div>
        </div>
      </article>
    `).join('');

    grid.querySelectorAll('.product').forEach(card => {
      card.addEventListener('click', () => {
        const pid = card.dataset.pid;
        const p = allProducts.find(x => x.id === pid);
        if (p) openProductModal(p);
      });
    });
  };

  const fillSelect = (products) => {
    const sel = $('#productSelect');
    if (!sel) return;
    sel.innerHTML = '<option value="">اختر منتجًا</option>';
    products.forEach(p => {
      const opt = document.createElement('option');
      opt.value = p.name;
      opt.textContent = `${p.name} — $${p.price}`;
      sel.appendChild(opt);
    });
    const any = document.createElement('option');
    any.value = 'استفسار عام';
    any.textContent = 'استفسار عام';
    sel.appendChild(any);
  };

  /* ========== نافذة تفاصيل المنتج ========== */
  const openProductModal = (p) => {
    const panel = $('#productModalPanel');
    const save = p.old_price ? Math.round((1 - p.price / p.old_price) * 100) : 0;
    panel.innerHTML = `
      <button class="pd__close" data-pm-close aria-label="إغلاق">×</button>
      <div class="pd">
        <div class="pd__img">
          ${p.badge ? `<span class="pd__img-badge">${p.badge}</span>` : ''}
          <img src="${p.image}" alt="${p.name}" />
        </div>
        <div class="pd__body">
          <span class="pd__cat">${p.category}</span>
          <h2 class="pd__name">${p.name}</h2>
          <div class="pd__price">
            <strong>$${p.price}</strong>
            ${p.old_price ? `<del>$${p.old_price}</del>` : ''}
            ${save > 0 ? `<span class="save">وفّر ${save}%</span>` : ''}
          </div>
          <p class="pd__desc">${p.short_desc}</p>
          ${p.specs ? `
            <div class="pd__specs">
              <h4>⚙️ المواصفات</h4>
              <div class="pd__specs-grid">
                ${Object.entries(p.specs).map(([k, v]) => `<div><span>${k}</span><span>${v}</span></div>`).join('')}
              </div>
            </div>` : ''}
          ${p.features?.length ? `
            <div class="pd__features">
              <h4>✨ المميزات</h4>
              <ul>
                ${p.features.map(f => `<li><svg class="ic"><use href="assets/icons.svg#i-check"/></svg> ${f}</li>`).join('')}
              </ul>
            </div>` : ''}
          <div class="pd__actions">
            <a class="btn btn--wa btn--lg" href="https://wa.me/96171122050?text=${encodeURIComponent('مرحبا، أرغب بطلب: ' + p.name + ' - السعر: $' + p.price)}" target="_blank" rel="noopener">
              <svg class="ic"><use href="assets/icons.svg#i-wa"/></svg> اطلب عبر واتساب
            </a>
            <a class="btn btn--ghost btn--lg" href="tel:+96171122050">
              <svg class="ic"><use href="assets/icons.svg#i-phone"/></svg> اتصل بنا
            </a>
          </div>
        </div>
      </div>
    `;
    $('#productModal').hidden = false;
    document.body.style.overflow = 'hidden';
    panel.querySelectorAll('[data-pm-close]').forEach(el => {
      el.addEventListener('click', closeProductModal);
    });
  };

  const closeProductModal = () => {
    $('#productModal').hidden = true;
    document.body.style.overflow = '';
  };

  /* ========== التصنيفات ========== */
  const renderCategories = (data) => {
    const grid = $('#catGrid');
    if (!grid || !data?.categories) return;
    grid.innerHTML = data.categories.map(c => `
      <a class="cat" href="#products" data-cat="${c.name}">
        <div class="cat__icon"><svg class="ic"><use href="assets/icons.svg#i-bolt"/></svg></div>
        <span class="cat__name">${c.name}</span>
      </a>
    `).join('');
    grid.querySelectorAll('.cat').forEach(cat => {
      cat.addEventListener('click', (e) => {
        const catName = cat.dataset.cat;
        // انتظر السكرول ثم طبّق الفلتر
        setTimeout(() => {
          activeFilter = catName;
          const chip = [...$$('.chip')].find(c => c.dataset.filter === catName);
          if (chip) {
            $$('.chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            renderGrid();
          }
        }, 400);
      });
    });
  };

  /* ========== البحث ========== */
  const setupSearch = () => {
    const input = $('#searchInput');
    if (!input) return;
    input.addEventListener('input', () => {
      searchTerm = input.value;
      renderGrid();
    });
  };

  /* ========== قائمة الجوال ========== */
  const setupMenu = () => {
    const btn = $('#menuBtn');
    const nav = $('#nav');
    if (!btn || !nav) return;
    btn.addEventListener('click', () => {
      const open = nav.classList.toggle('open');
      btn.setAttribute('aria-expanded', open);
      const use = btn.querySelector('use');
      if (use) use.setAttribute('href', open ? 'assets/icons.svg#i-close' : 'assets/icons.svg#i-menu');
    });
    $$('.nav a').forEach(a => a.addEventListener('click', () => {
      nav.classList.remove('open');
      const use = btn.querySelector('use');
      if (use) use.setAttribute('href', 'assets/icons.svg#i-menu');
    }));
  };

  /* ========== تأثير الهيدر عند التمرير ========== */
  const setupHeaderScroll = () => {
    const h = $('#header');
    if (!h) return;
    const onScroll = () => h.classList.toggle('scrolled', window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  };

  /* ========== الإعلان العلوي ========== */
  const setupAnnouncement = () => {
    const bar = $('#announcementBar');
    if (!bar) return;
    const ann = localStorage.getItem('alburji.ann.close');
    if (!ann) bar.hidden = false;
    $('#announcementClose')?.addEventListener('click', () => {
      bar.hidden = true;
      localStorage.setItem('alburji.ann.close', '1');
    });
  };

  /* ========== النموذج ========== */
  const setupForm = () => {
    const form = $('#orderForm');
    if (!form) return;
    const status = $('#formStatus');

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      status.textContent = '';
      status.className = 'form__status';

      const data = Object.fromEntries(new FormData(form).entries());

      if (!data.name || data.name.trim().length < 2) {
        status.textContent = 'الرجاء إدخال اسم صحيح';
        status.classList.add('error'); return;
      }
      if (!/^(03|70|71|76|78|79|81)[0-9]{6}$/.test(data.phone)) {
        status.textContent = 'الرجاء إدخال رقم جوال لبناني صحيح';
        status.classList.add('error'); return;
      }
      if (!data.area) {
        status.textContent = 'الرجاء اختيار منطقتك';
        status.classList.add('error'); return;
      }
      if (!data.product) {
        status.textContent = 'الرجاء اختيار منتج';
        status.classList.add('error'); return;
      }

      const msg = `طلب جديد من موقع al BOURJI ELECTRICS:%0A
الاسم: ${data.name}%0A
الجوال: ${data.phone}%0A
المنطقة: ${data.area}%0A
المنتج: ${data.product}%0A
ملاحظات: ${data.notes || '—'}`;

      status.textContent = '✓ تم استلام طلبك، جاري تحويلك إلى واتساب...';
      status.classList.add('success');

      const wa = form.dataset.wa || 'https://wa.me/96171122050';
      setTimeout(() => {
        window.open(wa + (wa.includes('?') ? '&' : '?') + 'text=' + msg, '_blank', 'noopener');
        form.reset();
      }, 800);
    });
  };

  /* ========== تهيئة عامة ========== */
  const init = async () => {
    $('#year').textContent = new Date().getFullYear();

    const [contact, products] = await Promise.all([
      fetchJSON('assets/contact.json'),
      fetchJSON('assets/products.json'),
    ]);

    fillFromData(contact);
    renderCategories(products);
    renderProducts(products);

    if (contact?.social?.whatsapp_url) {
      const form = $('#orderForm');
      if (form) form.dataset.wa = contact.social.whatsapp_url;
    }

    setupMenu();
    setupHeaderScroll();
    setupForm();
    setupSearch();
    setupAnnouncement();
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else { init(); }
})();
