/*
 * Contact form.
 *
 * Where submissions go is set by the data-endpoint attribute on <form id="lead-form"> in index.html.
 *   - Endpoint set (currently FormSubmit, which emails each submission to ben@postoakstrategies.com;
 *     a Formspree URL such as https://formspree.io/f/xxxxxxxx works the same way):
 *     the form POSTs JSON there, and shows a success or failure message based on the real response.
 *   - Endpoint empty: the form is NOT connected. It validates, then opens the visitor's email app with the
 *     message pre-filled, and says plainly that nothing has been sent until they press send.
 * No secret keys belong in this file. Spam filtering, rate limiting and storage are handled by the form service.
 */
(function () {
    var form = document.getElementById('lead-form');
    if (!form) return;

    var EMAIL = 'ben@postoakstrategies.com';
    var endpoint = (form.getAttribute('data-endpoint') || '').trim();
    var status = document.getElementById('form-status');
    var button = form.querySelector('button[type="submit"]');

    var rules = {
        name: function (v) { return v ? '' : 'Please tell us your name.'; },
        email: function (v) {
            if (!v) return 'Please enter your email so we can reply.';
            return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? '' : 'That email doesn’t look quite right.';
        },
        company: function (v) { return v ? '' : 'Please tell us your business name.'; }
    };

    function show(kind, html) {
        status.className = 'form-status show ' + kind;
        status.innerHTML = html;
        status.setAttribute('role', kind === 'err' ? 'alert' : 'status');
    }

    function setError(field, message) {
        var err = document.getElementById('err-' + field.name);
        field.setAttribute('aria-invalid', message ? 'true' : 'false');
        if (message) field.setAttribute('aria-describedby', 'err-' + field.name);
        else field.removeAttribute('aria-describedby');
        if (err) err.textContent = message;
    }

    function validate() {
        var first = null;
        Object.keys(rules).forEach(function (name) {
            var field = form.elements[name];
            var msg = rules[name](field.value.trim());
            setError(field, msg);
            if (msg && !first) first = field;
        });
        if (first) first.focus();
        return !first;
    }

    Object.keys(rules).forEach(function (name) {
        form.elements[name].addEventListener('blur', function () {
            setError(this, rules[name](this.value.trim()));
        });
    });

    function payload() {
        var out = {};
        ['name', 'email', 'company', 'phone', 'contact_method', 'tools', 'message'].forEach(function (k) {
            out[k] = form.elements[k] ? form.elements[k].value.trim() : '';
        });
        out._subject = 'Free consultation request from ' + out.company;
        out._template = 'table';   // FormSubmit: readable email layout
        out._captcha = 'false';    // FormSubmit: no captcha page for AJAX posts
        return out;
    }

    function mailtoHref(data) {
        var body = 'Name: ' + data.name + '\nBusiness: ' + data.company + '\nEmail: ' + data.email +
            '\nPhone: ' + data.phone + '\nBest way to reach me: ' + data.contact_method +
            '\nTools we use today: ' + data.tools + '\n\nWhat I’d like help with:\n' + data.message;
        return 'mailto:' + EMAIL + '?subject=' + encodeURIComponent(data._subject) + '&body=' + encodeURIComponent(body);
    }

    form.addEventListener('submit', function (e) {
        e.preventDefault();
        status.className = 'form-status';
        if (!validate()) return;

        // Honeypot: real visitors never see or fill this field.
        if (form.elements._honey && form.elements._honey.value) {
            show('ok', 'Thanks! We’ll be in touch soon.');
            return;
        }

        var data = payload();

        if (!endpoint) {
            window.location.href = mailtoHref(data);
            show('info', 'Your email app should open with your message ready to go. <strong>Nothing has been sent until you press send there.</strong> ' +
                'If it didn’t open, email us at <a href="mailto:' + EMAIL + '">' + EMAIL + '</a>.');
            return;
        }

        button.disabled = true;
        button.textContent = 'Sending…';
        fetch(endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
            body: JSON.stringify(data)
        }).then(function (res) {
            if (!res.ok) throw new Error('HTTP ' + res.status);
            return res.json().catch(function () { return {}; });
        }).then(function (body) {
            // FormSubmit answers 200 with success:"false" when a form is not activated yet.
            if (body && (body.success === false || body.success === 'false')) throw new Error(body.message || 'not accepted');
            form.reset();
            show('ok', 'Thanks, ' + data.name.split(' ')[0] + '! We got your note and we’ll be in touch soon.');
        }).catch(function () {
            show('err', 'Sorry, that didn’t go through. <a href="' + mailtoHref(data).replace(/"/g, '&quot;') + '"><strong>Send it by email instead</strong></a> ' +
                '(your message is filled in), or write to <a href="mailto:' + EMAIL + '">' + EMAIL + '</a>.');
        }).then(function () {
            button.disabled = false;
            button.textContent = 'Request my free discovery call';
        });
    });
})();
