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
