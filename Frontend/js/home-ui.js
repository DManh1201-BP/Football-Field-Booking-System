(function() {
    function initHomeUi() {
        var select = document.getElementById('sport-filter');
        var resetButton = document.getElementById('reset-btn');
        var chips = document.querySelectorAll('.sport-chip');
        var tiles = document.querySelectorAll('.sport-tile');

        if (!select) {
            return;
        }

        function syncChips() {
            Array.prototype.forEach.call(chips, function(chip) {
                var isActive = chip.getAttribute('data-sport') === select.value;
                chip.classList.toggle('active', isActive);
                chip.setAttribute('aria-pressed', String(isActive));
            });
        }

        function setSport(value) {
            select.value = value;
            select.dispatchEvent(new Event('change', { bubbles: true }));
            syncChips();
        }

        Array.prototype.forEach.call(chips, function(chip) {
            chip.addEventListener('click', function() {
                setSport(chip.getAttribute('data-sport') || '');
            });
        });

        Array.prototype.forEach.call(tiles, function(tile) {
            tile.addEventListener('click', function() {
                setSport(tile.getAttribute('data-sport') || '');
                var results = document.getElementById('fields');
                if (results) {
                    results.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        });

        select.addEventListener('change', syncChips);

        if (resetButton) {
            resetButton.addEventListener('click', function() {
                setTimeout(syncChips, 0);
            });
        }

        syncChips();
    }

    document.addEventListener('DOMContentLoaded', initHomeUi);
})();
