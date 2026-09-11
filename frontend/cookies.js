(function () {
    const CONSENT_KEY = 'ella_cookie_consent';

    function getConsent() {
        try {
            return JSON.parse(localStorage.getItem(CONSENT_KEY));
        } catch {
            return null;
        }
    }

    function setConsent(consent) {
        localStorage.setItem(CONSENT_KEY, JSON.stringify(consent));
        const banner = document.getElementById('cookie-banner');
        if (banner) banner.remove();
        const settings = document.getElementById('cookie-settings');
        if (settings) settings.remove();
    }

    function renderBanner() {
        if (getConsent()) return;
        if (document.getElementById('cookie-banner')) return;

        const banner = document.createElement('div');
        banner.id = 'cookie-banner';
        banner.setAttribute('role', 'dialog');
        banner.setAttribute('aria-label', 'Preferências de cookies');
        banner.innerHTML = `
            <p>Usamos cookies necessários ao funcionamento da loja. Com o teu consentimento, também usamos cookies de análise e marketing. <a href="cookies.html">Saber mais</a>.</p>
            <div class="cookie-actions">
                <button id="cookie-reject" type="button">Rejeitar não essenciais</button>
                <button id="cookie-customize" type="button">Personalizar</button>
                <button id="cookie-accept" type="button">Aceitar todos</button>
            </div>
        `;
        document.body.appendChild(banner);

        document.getElementById('cookie-accept').addEventListener('click', () => {
            setConsent({ necessary: true, analytics: true, marketing: true });
        });
        document.getElementById('cookie-reject').addEventListener('click', () => {
            setConsent({ necessary: true, analytics: false, marketing: false });
        });
        document.getElementById('cookie-customize').addEventListener('click', renderCustomizePanel);
    }

    function renderCustomizePanel() {
        const banner = document.getElementById('cookie-banner');
        if (banner) banner.remove();

        const consentAtual = getConsent() || { analytics: false, marketing: false };

        const panel = document.createElement('div');
        panel.id = 'cookie-settings';
        panel.setAttribute('role', 'dialog');
        panel.setAttribute('aria-label', 'Personalizar cookies');
        panel.innerHTML = `
            <h2>Preferências de cookies</h2>
            <label class="cookie-opcao">
                <input type="checkbox" checked disabled> Necessários (sempre ativos)
            </label>
            <label class="cookie-opcao">
                <input type="checkbox" id="chk-analytics" ${consentAtual.analytics ? 'checked' : ''}> Análise
            </label>
            <label class="cookie-opcao">
                <input type="checkbox" id="chk-marketing" ${consentAtual.marketing ? 'checked' : ''}> Marketing
            </label>
            <div class="cookie-actions">
                <button id="cookie-save" type="button">Guardar preferências</button>
            </div>
        `;
        document.body.appendChild(panel);

        document.getElementById('cookie-save').addEventListener('click', () => {
            setConsent({
                necessary: true,
                analytics: document.getElementById('chk-analytics').checked,
                marketing: document.getElementById('chk-marketing').checked
            });
        });
    }

    window.ellaCookieConsent = {
        get: getConsent,
        reset: function () {
            localStorage.removeItem(CONSENT_KEY);
            renderBanner();
        }
    };

    document.addEventListener('DOMContentLoaded', renderBanner);
})();
