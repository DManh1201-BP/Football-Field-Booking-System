(function() {
    'use strict';

    var S = window.SportHubShared;

    var PREVIEW_MATCHES = [
        { id: 101, title: 'Giao hữu 7v7 giữa tuần — Chia sân 50/50', sportType: 'FOOTBALL', skillLevel: 'INTERMEDIATE', status: 'OPEN', matchDate: '2026-11-18', startTime: '19:00', endTime: '20:30', missingPlayers: 7, location: 'Sân Bóng Đá 7v7 Premium Mỹ Phước', city: 'Thủ Dầu Một', notes: 'Đá fair-play, ưu tiên đội văn phòng khu vực Thủ Dầu Một.', hostUser: { id: 901, fullName: 'Trần Minh Quân', eloRating: 1285 }, challengerUser: null },
        { id: 102, title: 'Đánh đơn Tennis Hard Court cọ xát chiến thuật', sportType: 'TENNIS', skillLevel: 'ADVANCED', status: 'OPEN', matchDate: '2026-11-19', startTime: '17:30', endTime: '19:00', missingPlayers: 1, location: 'Sân Tennis Hard Court Thủ Dầu Một', city: 'Thủ Dầu Một', notes: 'Đã đặt sẵn sân số 2, bóng Wilson US Open mới.', hostUser: { id: 902, fullName: 'Lê Hoàng Nam', eloRating: 1440 }, challengerUser: null },
        { id: 103, title: 'Kèo đôi Cầu lông giao lưu trình TB-Khá', sportType: 'BADMINTON', skillLevel: 'INTERMEDIATE', status: 'MATCHED', matchDate: '2026-11-17', startTime: '18:30', endTime: '20:30', missingPlayers: 2, location: 'Sân Cầu Lông Thảm PVC Huỳnh Văn Lũy', city: 'Thủ Dầu Một', notes: 'Cầu Hải Yến S90, đánh chạm 21.', hostUser: { id: 903, fullName: 'Nguyễn Quốc Bảo', eloRating: 1190 }, challengerUser: { id: 904, fullName: 'Phạm Gia Huy', eloRating: 1215 } },
        { id: 104, title: 'Bóng rổ 5x5 Full Court cuối tuần', sportType: 'BASKETBALL', skillLevel: 'PRO', status: 'COMPLETED', matchDate: '2026-11-15', startTime: '16:00', endTime: '17:30', missingPlayers: 5, hostScore: 68, challengerScore: 64, location: 'Sân Bóng Rổ Arena Lê Lợi', city: 'Thủ Dầu Một', notes: 'Có trọng tài bấm giờ 4 hiệp.', hostUser: { id: 905, fullName: 'Võ Đăng Khoa', eloRating: 1365 }, challengerUser: { id: 906, fullName: 'Đặng Tuấn Kiệt', eloRating: 1330 } }
    ];

    var PREVIEW_LEADERBOARD = [
        { rank: 1, fullName: 'Lê Hoàng Nam', address: 'Thủ Dầu Một', eloRating: 1440 },
        { rank: 2, fullName: 'Võ Đăng Khoa', address: 'Thuận An', eloRating: 1365 },
        { rank: 3, fullName: 'Đặng Tuấn Kiệt', address: 'Thủ Dầu Một', eloRating: 1330 },
        { rank: 4, fullName: 'Trần Minh Quân', address: 'Dĩ An', eloRating: 1285 },
        { rank: 5, fullName: 'Phạm Gia Huy', address: 'Thủ Dầu Một', eloRating: 1215 },
        { rank: 6, fullName: 'Nguyễn Quốc Bảo', address: 'Tân Uyên', eloRating: 1190 }
    ];

    var state = {
        matches: [],
        leaderboard: [],
        fields: [],
        isPreview: false,
        activeResultMatch: null
    };

    var el = {};

    document.addEventListener('DOMContentLoaded', initMatchesPage);

    function initMatchesPage() {
        cacheElements();
        S.initSharedNavbar({
            onAuthSuccess: renderMatches,
            onLogout: renderMatches
        });
        bindEvents();
        if (el.matchDate) el.matchDate.min = S.formatDateForInput(new Date());
        loadFieldsOptions();
        loadMatchesAndLeaderboard();
        S.syncCurrentUser();
    }

    function cacheElements() {
        el.sportFilter = document.getElementById('match-sport-filter');
        el.skillFilter = document.getElementById('match-skill-filter');
        el.statusFilter = document.getElementById('match-status-filter');
        el.cityFilter = document.getElementById('match-city-filter');
        el.matchesGrid = document.getElementById('matches-grid');
        el.leaderboardList = document.getElementById('leaderboard-list');
        el.refreshBtn = document.getElementById('refresh-matches-btn');
        el.openCreateBtn = document.getElementById('open-create-match-btn');
        el.previewBanner = document.getElementById('matches-preview-banner');
        el.reconnectBtn = document.getElementById('matches-reconnect-btn');

        el.createModal = document.getElementById('create-match-modal');
        el.createForm = document.getElementById('create-match-form');
        el.matchTitle = document.getElementById('match-title');
        el.matchSport = document.getElementById('match-sport');
        el.matchSkill = document.getElementById('match-skill');
        el.matchDate = document.getElementById('match-date');
        el.matchMissing = document.getElementById('match-missing');
        el.matchStart = document.getElementById('match-start');
        el.matchEnd = document.getElementById('match-end');
        el.matchFieldId = document.getElementById('match-field-id');
        el.matchCity = document.getElementById('match-city');
        el.matchLocation = document.getElementById('match-location');
        el.matchNotes = document.getElementById('match-notes');
        el.createSubmit = document.getElementById('create-match-submit');
        el.createFeedback = document.getElementById('create-match-feedback');

        el.resultModal = document.getElementById('result-match-modal');
        el.resultForm = document.getElementById('result-match-form');
        el.resultSummary = document.getElementById('result-match-summary');
        el.resultHostLabel = document.getElementById('result-host-label');
        el.resultChallengerLabel = document.getElementById('result-challenger-label');
        el.resultHostScore = document.getElementById('result-host-score');
        el.resultChallengerScore = document.getElementById('result-challenger-score');
        el.resultSubmit = document.getElementById('result-match-submit');
        el.resultFeedback = document.getElementById('result-match-feedback');
    }

    function bindEvents() {
        [el.sportFilter, el.skillFilter, el.statusFilter].forEach(function(ctrl) {
            if (ctrl) ctrl.addEventListener('change', loadMatchesOnly);
        });
        if (el.cityFilter) {
            el.cityFilter.addEventListener('input', loadMatchesOnly);
        }
        if (el.refreshBtn) {
            el.refreshBtn.addEventListener('click', loadMatchesAndLeaderboard);
        }
        if (el.reconnectBtn) {
            el.reconnectBtn.addEventListener('click', loadMatchesAndLeaderboard);
        }
        if (el.openCreateBtn) {
            el.openCreateBtn.addEventListener('click', openCreateModal);
        }
        if (el.matchFieldId) {
            el.matchFieldId.addEventListener('change', function() {
                var selected = state.fields.find(function(f) { return String(f.id) === String(el.matchFieldId.value); });
                if (selected) {
                    if (el.matchSport) el.matchSport.value = selected.sportType || 'FOOTBALL';
                    if (el.matchCity && !el.matchCity.value) el.matchCity.value = selected.city || '';
                    if (el.matchLocation && !el.matchLocation.value) el.matchLocation.value = selected.location || '';
                }
            });
        }
        if (el.createForm) el.createForm.addEventListener('submit', handleCreateSubmit);
        if (el.resultForm) el.resultForm.addEventListener('submit', handleResultSubmit);

        if (el.createModal) {
            el.createModal.addEventListener('click', function(e) {
                if (e.target === el.createModal || (e.target.closest && e.target.closest('[data-close-match-modal]'))) {
                    closeModal(el.createModal);
                }
            });
        }
        if (el.resultModal) {
            el.resultModal.addEventListener('click', function(e) {
                if (e.target === el.resultModal || (e.target.closest && e.target.closest('[data-close-result-modal]'))) {
                    closeModal(el.resultModal);
                }
            });
        }

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeModal(el.createModal);
                closeModal(el.resultModal);
            }
        });
    }

    function loadFieldsOptions() {
        S.apiRequest('/fields', { method: 'GET', token: '' })
            .then(function(list) {
                state.fields = Array.isArray(list) ? list : [];
                if (!el.matchFieldId) return;
                el.matchFieldId.innerHTML = '<option value="">-- Tự nhập địa điểm bên dưới --</option>' +
                    state.fields.map(function(f) {
                        return '<option value="' + S.escapeHtml(f.id) + '">' + S.escapeHtml(f.name) + ' (' + S.escapeHtml(S.getSportMeta(f.sportType).label) + ')</option>';
                    }).join('');
            })
            .catch(function() {});
    }

    function buildMatchQueryString() {
        var params = new URLSearchParams();
        if (el.sportFilter && el.sportFilter.value) params.set('sportType', el.sportFilter.value);
        if (el.skillFilter && el.skillFilter.value) params.set('skillLevel', el.skillFilter.value);
        if (el.statusFilter && el.statusFilter.value) params.set('status', el.statusFilter.value);
        if (el.cityFilter && el.cityFilter.value.trim()) params.set('city', el.cityFilter.value.trim());
        var q = params.toString();
        return q ? ('?' + q) : '';
    }

    function filterPreviewMatches() {
        var sport = el.sportFilter ? el.sportFilter.value : '';
        var skill = el.skillFilter ? el.skillFilter.value : '';
        var status = el.statusFilter ? el.statusFilter.value : '';
        var city = (el.cityFilter ? el.cityFilter.value : '').trim().toLowerCase();
        return PREVIEW_MATCHES.filter(function(m) {
            if (sport && m.sportType !== sport) return false;
            if (skill && m.skillLevel !== skill) return false;
            if (status && m.status !== status) return false;
            if (city && String(m.city || '').toLowerCase().indexOf(city) === -1) return false;
            return true;
        });
    }

    function loadMatchesOnly() {
        if (state.isPreview) {
            state.matches = filterPreviewMatches();
            renderMatches();
            return;
        }
        S.apiRequest('/matches' + buildMatchQueryString(), { method: 'GET', token: '' })
            .then(function(list) {
                state.matches = Array.isArray(list) ? list : [];
                renderMatches();
            })
            .catch(function(err) {
                if (!err || !err.isBackendError) {
                    state.isPreview = true;
                    if (el.previewBanner) el.previewBanner.classList.remove('hidden');
                    state.matches = filterPreviewMatches();
                    renderMatches();
                    return;
                }
                if (el.matchesGrid) {
                    el.matchesGrid.innerHTML = '<div class="error-alert" style="grid-column:1/-1;">' + S.escapeHtml(err.message || 'Không thể tải danh sách kèo.') + '</div>';
                }
            });
    }

    function loadMatchesAndLeaderboard() {
        if (el.previewBanner) el.previewBanner.classList.add('hidden');
        if (el.matchesGrid) {
            el.matchesGrid.innerHTML = '<div class="table-empty" style="grid-column:1/-1;">Đang tải danh sách kèo đấu...</div>';
        }
        Promise.all([
            S.apiRequest('/matches' + buildMatchQueryString(), { method: 'GET', token: '' }),
            S.apiRequest('/matches/leaderboard?limit=15', { method: 'GET', token: '' })
        ])
            .then(function(results) {
                state.isPreview = false;
                state.matches = Array.isArray(results[0]) ? results[0] : [];
                state.leaderboard = Array.isArray(results[1]) ? results[1] : [];
                renderMatches();
                renderLeaderboard();
            })
            .catch(function(err) {
                if (!err || !err.isBackendError) {
                    state.isPreview = true;
                    if (el.previewBanner) el.previewBanner.classList.remove('hidden');
                    state.matches = filterPreviewMatches();
                    state.leaderboard = PREVIEW_LEADERBOARD.slice();
                    renderMatches();
                    renderLeaderboard();
                    return;
                }
                if (el.matchesGrid) {
                    el.matchesGrid.innerHTML = '<div class="error-alert" style="grid-column:1/-1;">' + S.escapeHtml(err.message || 'Không thể tải dữ liệu matchmaking.') + '</div>';
                }
                if (el.leaderboardList) {
                    el.leaderboardList.innerHTML = '<p class="table-empty">Không thể tải bảng xếp hạng.</p>';
                }
            });
    }

    function getInitials(name) {
        var parts = String(name || 'U').trim().split(/\s+/).filter(Boolean);
        if (!parts.length) return 'U';
        return parts.slice(-2).map(function(w) { return w.charAt(0).toUpperCase(); }).join('');
    }

    function getEloTierLabel(elo) {
        var score = Number(elo || 1000);
        if (score >= 1400) return 'Cao thủ';
        if (score >= 1200) return 'Bán chuyên';
        if (score >= 1050) return 'Phong trào+';
        return 'Thành viên';
    }

    function renderMatches() {
        if (!el.matchesGrid) return;
        if (!state.matches.length) {
            el.matchesGrid.innerHTML =
                '<div class="empty-state" style="grid-column:1/-1;">' +
                '  <span class="empty-state-icon"><i data-lucide="swords" aria-hidden="true"></i></span>' +
                '  <h3>Chưa có kèo đấu nào phù hợp</h3>' +
                '  <p>Hãy là người đầu tiên tạo kèo tìm đối thủ trong khu vực của bạn.</p>' +
                '</div>';
            S.refreshIcons(el.matchesGrid);
            return;
        }

        var session = S.loadAuthSession();
        var userId = session.currentUser ? session.currentUser.id : null;
        var isAdmin = session.currentRole === 'ADMIN';

        el.matchesGrid.innerHTML = state.matches.map(function(m) {
            var sportMeta = S.getSportMeta(m.sportType);
            var skillLabel = S.SKILL_LEVEL_LABELS[String(m.skillLevel || '').toUpperCase()] || m.skillLevel || 'Trung bình';
            var status = String(m.status || 'OPEN').toUpperCase();
            var host = m.hostUser || {};
            var challenger = m.challengerUser || null;
            var locationText = (m.field && m.field.name) || m.location || m.city || 'Chưa cập nhật sân';

            var canJoin = status === 'OPEN' && (!userId || String(host.id) !== String(userId));
            var canRecordResult = status !== 'COMPLETED' && challenger && userId && (isAdmin || String(host.id) === String(userId));

            var isCompleted = status === 'COMPLETED' && m.hostScore != null && m.challengerScore != null;
            var centerBadgeHtml = isCompleted
                ? ('<div class="match-center-status">' +
                   '  <div class="match-score-pill tabular-nums">' + S.escapeHtml(String(m.hostScore)) + ' : ' + S.escapeHtml(String(m.challengerScore)) + '</div>' +
                   '  <span class="match-score-caption">Kết quả</span>' +
                   '</div>')
                : '<div class="match-center-status"><span class="match-vs-badge">VS</span></div>';

            var hostName = host.fullName || 'Chủ kèo';
            var hostNameMarkup = host.id
                ? '<a class="match-player-name social-profile-link" href="profile.html?id=' + encodeURIComponent(host.id) + '">' + S.escapeHtml(hostName) + '</a>'
                : S.escapeHtml(hostName);
            var challengerSlotHtml = challenger
                ? ('<div class="match-player-slot is-challenger">' +
                   '  <div class="match-player-head">' +
                   '    <span class="match-player-avatar challenger">' + S.escapeHtml(getInitials(challenger.fullName)) + '</span>' +
                   '    ' + (challenger.id ? '<a class="match-player-name social-profile-link" href="profile.html?id=' + encodeURIComponent(challenger.id) + '">' + S.escapeHtml(challenger.fullName || 'Đối thủ') + '</a>' : '<span class="match-player-name">' + S.escapeHtml(challenger.fullName || 'Đối thủ') + '</span>') +
                   '  </div>' +
                   '  <span class="match-player-sub tabular-nums">Đối thủ · Elo ' + S.escapeHtml(String(challenger.eloRating || 1000)) + '</span>' +
                   '</div>')
                : ('<div class="match-player-slot is-challenger">' +
                   '  <div class="match-player-head">' +
                   '    <span class="match-player-avatar open">?</span>' +
                   '    <span class="match-player-name muted">Chờ đối thủ</span>' +
                   '  </div>' +
                   '  <span class="match-player-sub">Thiếu ' + S.escapeHtml(String(m.missingPlayers || 1)) + ' người</span>' +
                   '</div>');

            var actionHtml = '';
            if (canJoin) {
                actionHtml += '<button class="btn btn-primary btn-sm" type="button" data-match-join="' + S.escapeHtml(m.id) + '"><span>Nhận kèo</span></button>';
            }
            if (canRecordResult) {
                actionHtml += '<button class="btn btn-secondary btn-sm" type="button" data-match-result="' + S.escapeHtml(m.id) + '"><span>Nhập tỷ số</span></button>';
            }

            return '<article class="match-card">' +
                '  <div class="match-card-meta-top">' +
                '    <span class="match-inline-tags">' + sportMeta.iconSvg + '<strong>' + S.escapeHtml(sportMeta.label) + '</strong> · ' + S.escapeHtml(skillLabel) + '</span>' +
                '    ' + S.renderMatchStatusBadge(status) +
                '  </div>' +
                '  <h3 class="match-card-title">' + S.escapeHtml(m.title) + '</h3>' +
                '  <div class="match-players-box">' +
                '    <div class="match-player-slot">' +
                '      <div class="match-player-head">' +
                '        <span class="match-player-avatar">' + S.escapeHtml(getInitials(hostName)) + '</span>' +
                   '        ' + hostNameMarkup +
                '      </div>' +
                '      <span class="match-player-sub tabular-nums">Chủ kèo · Elo ' + S.escapeHtml(String(host.eloRating || 1000)) + '</span>' +
                '    </div>' +
                '    ' + centerBadgeHtml +
                '    ' + challengerSlotHtml +
                '  </div>' +
                (m.notes ? '<p class="match-notes">' + S.escapeHtml(m.notes) + '</p>' : '') +
                '  <div class="match-card-footer">' +
                '    <div class="match-venue-schedule">' +
                '      <span class="match-schedule-time tabular-nums">' + S.escapeHtml(S.formatDate(m.matchDate)) + ' · ' + S.escapeHtml(S.formatTimeRange(m.startTime, m.endTime)) + '</span>' +
                '      <span class="match-schedule-place">' + S.escapeHtml(locationText) + '</span>' +
                '    </div>' +
                '    ' + (actionHtml || '') +
                '  </div>' +
                '</article>';
        }).join('');

        Array.prototype.forEach.call(el.matchesGrid.querySelectorAll('[data-match-join]'), function(btn) {
            btn.addEventListener('click', function() {
                joinMatch(btn.getAttribute('data-match-join'), btn);
            });
        });

        Array.prototype.forEach.call(el.matchesGrid.querySelectorAll('[data-match-result]'), function(btn) {
            btn.addEventListener('click', function() {
                openResultModal(btn.getAttribute('data-match-result'));
            });
        });

        S.refreshIcons(el.matchesGrid);
    }

    function renderLeaderboard() {
        if (!el.leaderboardList) return;
        if (!state.leaderboard.length) {
            el.leaderboardList.innerHTML = '<p class="table-empty">Chưa có dữ liệu xếp hạng.</p>';
            return;
        }

        el.leaderboardList.innerHTML = state.leaderboard.map(function(entry) {
            var rankClass = entry.rank <= 3 ? (' rank-' + entry.rank) : '';
            var tierText = getEloTierLabel(entry.eloRating);
            var subText = entry.address ? (tierText + ' · ' + entry.address) : tierText;
            return '<div class="leaderboard-row' + rankClass + '">' +
                '  <span class="leaderboard-rank">' + S.escapeHtml(String(entry.rank)) + '</span>' +
                '  <span class="leaderboard-avatar">' + S.escapeHtml(getInitials(entry.fullName)) + '</span>' +
                '  <div class="leaderboard-info">' +
                '    <strong>' + S.escapeHtml(entry.fullName) + '</strong>' +
                '    <span>' + S.escapeHtml(subText) + '</span>' +
                '  </div>' +
                '  <span class="leaderboard-elo">' + S.escapeHtml(String(entry.eloRating)) + '</span>' +
                '</div>';
        }).join('');
    }

    function openCreateModal() {
        var session = S.loadAuthSession();
        if (!session.token) {
            S.openAuthModal('login', { message: 'Đăng nhập để tạo kèo tìm đối thủ mới.' });
            return;
        }
        if (el.createForm) el.createForm.reset();
        if (el.matchDate) {
            var tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000);
            el.matchDate.value = S.formatDateForInput(tomorrow);
        }
        if (el.createFeedback) el.createFeedback.className = 'booking-feedback hidden';
        openModal(el.createModal, el.matchTitle);
    }

    function handleCreateSubmit(e) {
        e.preventDefault();
        var title = el.matchTitle ? el.matchTitle.value.trim() : '';
        var matchDate = el.matchDate ? el.matchDate.value : '';
        var startTime = el.matchStart ? el.matchStart.value : '';
        var endTime = el.matchEnd ? el.matchEnd.value : '';

        if (!title || !matchDate || !startTime || !endTime) {
            showFeedback(el.createFeedback, 'Vui lòng nhập đầy đủ tiêu đề, ngày và khung giờ.', true);
            return;
        }
        if (endTime <= startTime) {
            showFeedback(el.createFeedback, 'Giờ kết thúc phải sau giờ bắt đầu.', true);
            return;
        }

        var fieldIdRaw = el.matchFieldId ? el.matchFieldId.value : '';
        var payload = {
            title: title,
            sportType: el.matchSport ? el.matchSport.value : 'FOOTBALL',
            skillLevel: el.matchSkill ? el.matchSkill.value : 'INTERMEDIATE',
            fieldId: fieldIdRaw ? Number(fieldIdRaw) : null,
            city: el.matchCity ? el.matchCity.value.trim() || null : null,
            location: el.matchLocation ? el.matchLocation.value.trim() || null : null,
            matchDate: matchDate,
            startTime: startTime,
            endTime: endTime,
            missingPlayers: Number(el.matchMissing ? el.matchMissing.value : 1) || 1,
            notes: el.matchNotes ? el.matchNotes.value.trim() || null : null
        };

        if (el.createSubmit) el.createSubmit.disabled = true;
        S.apiRequest('/matches', { method: 'POST', body: JSON.stringify(payload) })
            .then(function() {
                closeModal(el.createModal);
                S.showToast('Đã tạo kèo đấu thành công!', 'success');
                loadMatchesAndLeaderboard();
            })
            .catch(function(err) {
                showFeedback(el.createFeedback, err.message || 'Không thể tạo kèo đấu.', true);
            })
            .then(function() {
                if (el.createSubmit) el.createSubmit.disabled = false;
            });
    }

    function joinMatch(matchId, btn) {
        var session = S.loadAuthSession();
        if (!session.token) {
            S.openAuthModal('login', { message: 'Đăng nhập để nhận kèo giao hữu.' });
            return;
        }
        if (btn) btn.disabled = true;
        S.apiRequest('/matches/' + encodeURIComponent(matchId) + '/join', { method: 'POST' })
            .then(function() {
                S.showToast('Nhận kèo thành công! Hãy chuẩn bị ra sân đúng giờ.', 'success');
                loadMatchesAndLeaderboard();
            })
            .catch(function(err) {
                S.showToast(err.message || 'Không thể tham gia kèo.', 'error');
                if (btn) btn.disabled = false;
            });
    }

    function openResultModal(matchId) {
        var match = state.matches.find(function(m) { return String(m.id) === String(matchId); });
        if (!match) return;
        state.activeResultMatch = match;
        if (el.resultSummary) el.resultSummary.textContent = match.title;
        if (el.resultHostLabel) {
            el.resultHostLabel.textContent = 'Điểm ' + ((match.hostUser && match.hostUser.fullName) || 'Chủ kèo');
        }
        if (el.resultChallengerLabel) {
            el.resultChallengerLabel.textContent = 'Điểm ' + ((match.challengerUser && match.challengerUser.fullName) || 'Đối thủ');
        }
        if (el.resultForm) el.resultForm.reset();
        if (el.resultFeedback) el.resultFeedback.className = 'booking-feedback hidden';
        openModal(el.resultModal, el.resultHostScore);
    }

    function handleResultSubmit(e) {
        e.preventDefault();
        var match = state.activeResultMatch;
        if (!match) return;

        var hostScore = Number(el.resultHostScore ? el.resultHostScore.value : '');
        var challengerScore = Number(el.resultChallengerScore ? el.resultChallengerScore.value : '');
        if (!Number.isFinite(hostScore) || !Number.isFinite(challengerScore) || hostScore < 0 || challengerScore < 0) {
            showFeedback(el.resultFeedback, 'Vui lòng nhập tỷ số hợp lệ (>= 0).', true);
            return;
        }

        if (el.resultSubmit) el.resultSubmit.disabled = true;
        S.apiRequest('/matches/' + encodeURIComponent(match.id) + '/result', {
            method: 'PATCH',
            body: JSON.stringify({ hostScore: hostScore, challengerScore: challengerScore })
        })
            .then(function() {
                closeModal(el.resultModal);
                S.showToast('Đã lưu tỷ số và cập nhật điểm Elo!', 'success');
                loadMatchesAndLeaderboard();
            })
            .catch(function(err) {
                showFeedback(el.resultFeedback, err.message || 'Không thể lưu tỷ số.', true);
            })
            .then(function() {
                if (el.resultSubmit) el.resultSubmit.disabled = false;
            });
    }

    function openModal(modal, focusTarget) {
        if (!modal) return;
        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
        window.setTimeout(function() {
            if (focusTarget) focusTarget.focus();
        }, 20);
    }

    function closeModal(modal) {
        if (!modal || modal.classList.contains('hidden')) return;
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
        if (!document.querySelector('.modal:not(.hidden)')) {
            document.body.classList.remove('modal-open');
        }
    }

    function showFeedback(target, msg, isError) {
        if (!target) return;
        target.textContent = msg;
        target.className = 'booking-feedback ' + (isError ? 'error' : 'info');
    }
})();
