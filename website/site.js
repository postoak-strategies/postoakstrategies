// Shared behavior for every page: mobile menu, nav background on scroll, smooth anchor scrolling.
(function () {
    var menuBtn = document.querySelector('.mobile-menu-btn');
    var mobileMenu = document.querySelector('.mobile-menu');
    var nav = document.querySelector('.nav');

    function setMenu(open) {
        menuBtn.classList.toggle('active', open);
        mobileMenu.classList.toggle('active', open);
        menuBtn.setAttribute('aria-expanded', String(open));
    }

    if (menuBtn && mobileMenu) {
        menuBtn.addEventListener('click', function () {
            setMenu(!mobileMenu.classList.contains('active'));
        });
        mobileMenu.querySelectorAll('a').forEach(function (link) {
            link.addEventListener('click', function () { setMenu(false); });
        });
    }

    if (nav && !nav.classList.contains('solid')) {
        var onScroll = function () { nav.classList.toggle('scrolled', window.scrollY > 50); };
        window.addEventListener('scroll', onScroll, { passive: true });
        onScroll();
    }

    document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
        anchor.addEventListener('click', function (e) {
            var id = this.getAttribute('href');
            var target = id.length > 1 ? document.querySelector(id) : null;
            if (target) {
                e.preventDefault();
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
})();

// Fade-in on scroll, and no autoplaying video for visitors who ask for reduced motion.
(function () {
    var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    if (reduce) {
        document.querySelectorAll('video').forEach(function (v) {
            v.removeAttribute('autoplay');
            v.pause();
        });
    }

    if (reduce || !('IntersectionObserver' in window)) return;
    document.documentElement.classList.add('js');
    var targets = document.querySelectorAll('.work-card, .toolkit, .ladder-step, .mode-card, .seeit-copy, .mock, .service-card, .build-item, .icp-item, .founding-item, .faq-list details');
    var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
            if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
        });
    }, { threshold: 0.12 });
    targets.forEach(function (el) {
        var i = 0, sib = el.previousElementSibling;
        while (sib && i < 5) { if (sib.classList.contains('reveal')) i++; sib = sib.previousElementSibling; }
        el.style.setProperty('--i', i);
        el.classList.add('reveal'); io.observe(el);
    });
})();


// Scroll progress bar and the section dots on the home page.
(function () {
    var bar = document.querySelector('.progress');
    if (bar) {
        var tick = false;
        var update = function () {
            var max = document.documentElement.scrollHeight - window.innerHeight;
            bar.style.transform = 'scaleX(' + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ')';
            tick = false;
        };
        window.addEventListener('scroll', function () { if (!tick) { tick = true; requestAnimationFrame(update); } }, { passive: true });
        window.addEventListener('resize', update);
        update();
    }

    var dots = Array.prototype.slice.call(document.querySelectorAll('.dots a'));
    if (!dots.length || !('IntersectionObserver' in window)) return;
    var byId = {};
    dots.forEach(function (a) {
        var el = document.getElementById(a.getAttribute('href').slice(1));
        if (el) byId[el.id] = a;
    });
    var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (e) {
            if (!e.isIntersecting) return;
            dots.forEach(function (a) { a.classList.remove('active'); a.removeAttribute('aria-current'); });
            var a = byId[e.target.id];
            if (a) { a.classList.add('active'); a.setAttribute('aria-current', 'true'); }
        });
    }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });
    Object.keys(byId).forEach(function (id) { io.observe(document.getElementById(id)); });
})();
