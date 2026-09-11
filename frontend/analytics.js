(function () {
    const API_URL_ANALYTICS = window.location.hostname === 'localhost'
        ? 'http://localhost:3000/api'
        : 'https://SUBSTITUIR-PELO-TEU-BACKEND-EM-PRODUCAO.com/api';

    function getSessionId() {
        let sid = sessionStorage.getItem('ella_session_id');
        if (!sid) {
            sid = 'sid_' + Math.random().toString(36).substring(2) + Date.now().toString(36);
            sessionStorage.setItem('ella_session_id', sid);
        }
        return sid;
    }

    function temConsentimentoAnalise() {
        try {
            const consent = JSON.parse(localStorage.getItem('ella_cookie_consent'));
            return consent && consent.analytics === true;
        } catch {
            return false;
        }
    }

    function registarVisita() {
        if (!temConsentimentoAnalise()) return;

        const params = new URLSearchParams(window.location.search);

        fetch(`${API_URL_ANALYTICS}/analytics/pageview`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                page_path: window.location.pathname,
                utm_source: params.get('utm_source'),
                utm_medium: params.get('utm_medium'),
                utm_campaign: params.get('utm_campaign'),
                session_id: getSessionId()
            })
        }).catch(() => {
            // Falha silenciosa - analytics nunca deve quebrar a experiencia do utilizador
        });
    }

    // So regista quando ha consentimento. Se o consentimento for dado
    // depois de a pagina ja ter carregado, o cookies.js chama esta funcao.
    window.ellaAnalytics = { registarVisita };

    document.addEventListener('DOMContentLoaded', registarVisita);
})();
