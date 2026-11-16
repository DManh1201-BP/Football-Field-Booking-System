(function() {
    'use strict';

    function initHomeUi() {
        var select = document.getElementById('sport-filter');
        var resetButton = document.getElementById('reset-btn');
        var emptyResetButton = document.getElementById('empty-reset-btn');
        var chips = document.querySelectorAll('.sport-chip');
        var toggleAdvBtn = document.getElementById('toggle-advanced-filters');
        var advPanel = document.getElementById('advanced-filters-panel');

        // Inject crisp SVG sport icons into category chips
        if (window.SportHubShared) {
            Array.prototype.forEach.call(document.querySelectorAll('[data-sport-svg]'), function(slot) {
                var sportKey = slot.getAttribute('data-sport-svg');
                var meta = window.SportHubShared.getSportMeta(sportKey);
                if (meta && meta.iconSvg) {
                    slot.innerHTML = meta.iconSvg;
                }
            });
        }

        if (!select) {
            return;
        }

        function syncChips() {
            Array.prototype.forEach.call(chips, function(chip) {
                var isActive = (chip.getAttribute('data-sport') || '') === select.value;
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

        select.addEventListener('change', syncChips);

        if (resetButton) {
            resetButton.addEventListener('click', function() {
                window.setTimeout(syncChips, 0);
            });
        }

        if (emptyResetButton) {
            emptyResetButton.addEventListener('click', function() {
                window.setTimeout(syncChips, 0);
            });
        }

        if (toggleAdvBtn && advPanel) {
            toggleAdvBtn.addEventListener('click', function() {
                var isHidden = advPanel.classList.toggle('hidden');
                toggleAdvBtn.setAttribute('aria-expanded', String(!isHidden));
            });
        }

        syncChips();
    }

    document.addEventListener('DOMContentLoaded', initHomeUi);
})();
