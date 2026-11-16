function getSportHubConfig() {
    var configElement = document.getElementById('sporthub-config');
    if (!configElement) {
        return {};
    }

    try {
        return JSON.parse(configElement.textContent || '{}');
    } catch (error) {
        return {};
    }
}

function getSportHubApiBaseUrl() {
    var config = getSportHubConfig();
    var raw = config.apiBaseUrl || localStorage.getItem('sporthubApiBaseUrl') || 'http://localhost:8081/api';
    return String(raw).replace(/\/+$/, '');
}

function getSportHubApiOrigin() {
    return getSportHubApiBaseUrl().replace(/\/api$/i, '');
}
