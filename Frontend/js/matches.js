(function() {
    'use strict';

    var S = window.SportHubShared;

    var PREVIEW_MATCHES = [
        { id: 101, title: 'Giao hữu 7v7 giữa tuần — Chia sân 50/50', sportType: 'FOOTBALL', skillLevel: 'INTERMEDIATE', status: 'OPEN', matchMode: 'TEAM_CHALLENGE', maxSlots: 2, occupiedSlots: 1, missingPlayers: 1, isRanked: true, scoreStatus: 'NONE', matchDate: '2026-11-28', startTime: '19:00', endTime: '20:30', location: 'Sân Bóng Đá 7v7 Premium Mỹ Phước', city: 'Thủ Dầu Một', notes: 'Đá fair-play, ưu tiên đội văn phòng khu vực Thủ Dầu Một.', hostUser: { id: 901, fullName: 'Trần Minh Quân', eloRating: 1285, reliabilityScore: 100 }, challengerUser: null, participants: [] },
        { id: 102, title: 'Ghép lẻ 5v5 sân Trường Chinh (Còn 4 slot)', sportType: 'FOOTBALL', skillLevel: 'INTERMEDIATE', status: 'OPEN', matchMode: 'SOLO_LOBBY', maxSlots: 10, preReservedSlots: 6, occupiedSlots: 6, missingPlayers: 4, waitlistCount: 0, isRanked: true, scoreStatus: 'NONE', matchDate: '2026-11-29', startTime: '18:00', endTime: '19:30', location: 'Sân Bóng Đá 5v5 Thủ Dầu Một', city: 'Thủ Dầu Một', notes: 'Đội có sẵn 6 người, tuyển 4 bạn solo đá vui vẻ.', hostUser: { id: 902, fullName: 'Lê Hoàng Nam', eloRating: 1440, reliabilityScore: 98 }, challengerUser: null, participants: [] },
        { id: 103, title: 'Kèo đôi Cầu lông giao lưu trình TB-Khá', sportType: 'BADMINTON', skillLevel: 'INTERMEDIATE', status: 'MATCHED', matchMode: 'TEAM_CHALLENGE', maxSlots: 2, occupiedSlots: 2, missingPlayers: 0, isRanked: true, scoreStatus: 'PENDING_CONFIRMATION', proposedHostScore: 2, proposedChallengerScore: 1, matchDate: '2026-11-27', startTime: '18:30', endTime: '20:30', location: 'Sân Cầu Lông Thảm PVC Huỳnh Văn Lũy', city: 'Thủ Dầu Một', notes: 'Cầu Hải Yến S90, đánh chạm 21.', hostUser: { id: 903, fullName: 'Nguyễn Quốc Bảo', eloRating: 1190, reliabilityScore: 100 }, challengerUser: { id: 904, fullName: 'Phạm Gia Huy', eloRating: 1215, reliabilityScore: 95 }, participants: [] },
        { id: 104, title: 'Bóng rổ 5x5 Full Court cuối tuần', sportType: 'BASKETBALL', skillLevel: 'PRO', status: 'COMPLETED', matchMode: 'TEAM_CHALLENGE', maxSlots: 2, occupiedSlots: 2, missingPlayers: 0, isRanked: true, scoreStatus: 'CONFIRMED', hostScore: 68, challengerScore: 64, matchDate: '2026-11-15', startTime: '16:00', endTime: '17:30', location: 'Sân Bóng Rổ Arena Lê Lợi', city: 'Thủ Dầu Một', notes: 'Có trọng tài bấm giờ 4 hiệp.', hostUser: { id: 905, fullName: 'Võ Đăng Khoa', eloRating: 1365, reliabilityScore: 100 }, challengerUser: { id: 906, fullName: 'Đặng Tuấn Kiệt', eloRating: 1330, reliabilityScore: 100 }, participants: [] }
    ];

    var PREVIEW_LEADERBOARD = [
        { rank: 1, fullName: 'Lê Hoàng Nam', address: 'Thủ Dầu Một', eloRating: 1440, reliabilityScore: 98 },
        { rank: 2, fullName: 'Võ Đăng Khoa', address: 'Thuận An', eloRating: 1365, reliabilityScore: 100 },
        { rank: 3, fullName: 'Đặng Tuấn Kiệt', address: 'Thủ Dầu Một', eloRating: 1330, reliabilityScore: 100 },
        { rank: 4, fullName: 'Trần Minh Quân', address: 'Dĩ An', eloRating: 1285, reliabilityScore: 100 },
        { rank: 5, fullName: 'Phạm Gia Huy', address: 'Thủ Dầu Một', eloRating: 1215, reliabilityScore: 95 },
        { rank: 6, fullName: 'Nguyễn Quốc Bảo', address: 'Tân Uyên', eloRating: 1190, reliabilityScore: 100 }
    ];

    var state = {
        matches: [],
        leaderboard: [],
        fields: [],
        myBookings: [],
        isPreview: false,
        activeResultMatch: null,
        activeSoloMatch: null,
        activeDisputeMatch: null,
        activeResolveMatch: null
    };

    var el = {};

    document.addEventListener('DOMContentLoaded', initMatchesPage);

    function initMatchesPage() {
        cacheElements();
        S.initSharedNavbar({
            onAuthSuccess: function() {
                loadMyBookingsOptions();
                renderMatches();
            },
            onLogout: function() {
                state.myBookings = [];
                renderMatches();
            }
        });
        bindEvents();
        if (el.matchDate) el.matchDate.min = S.formatDateForInput(new Date());
        syncMatchModeControls();
        Promise.all([loadFieldsOptions(), loadMyBookingsOptions()]).then(handleUrlPrefill);
        loadMatchesAndLeaderboard();
        S.syncCurrentUser();
    }

    function cacheElements() {
        el.sportFilter = document.getElementById('match-sport-filter');
        el.skillFilter = document.getElementById('match-skill-filter');
        el.statusFilter = document.getElementById('match-status-filter');
        el.cityFilter = document.getElementById('match-city-filter');
        el.leaderboardSportFilter = document.getElementById('leaderboard-sport-filter');
        el.matchesGrid = document.getElementById('matches-grid');
        el.leaderboardList = document.getElementById('leaderboard-list');
        el.refreshBtn = document.getElementById('refresh-matches-btn');
        el.openCreateBtn = document.getElementById('open-create-match-btn');
        el.previewBanner = document.getElementById('matches-preview-banner');
        el.reconnectBtn = document.getElementById('matches-reconnect-btn');

        el.createModal = document.getElementById('create-match-modal');
        el.createForm = document.getElementById('create-match-form');
        el.matchTitle = document.getElementById('match-title');
        el.matchMode = document.getElementById('match-mode');
        el.matchBookingId = document.getElementById('match-booking-id');
        el.matchSport = document.getElementById('match-sport');
        el.matchSkill = document.getElementById('match-skill');
        el.matchDate = document.getElementById('match-date');
        el.matchMissing = document.getElementById('match-missing');
        el.matchMissingWrap = document.getElementById('match-missing-wrap');
        el.matchMaxSlotsWrap = document.getElementById('match-max-slots-wrap');
        el.matchMaxSlots = document.getElementById('match-max-slots');
        el.matchPreReservedWrap = document.getElementById('match-prereserved-wrap');
        el.matchPreReserved = document.getElementById('match-prereserved');
        el.matchStart = document.getElementById('match-start');
        el.matchEnd = document.getElementById('match-end');
        el.matchFieldId = document.getElementById('match-field-id');
        el.matchCity = document.getElementById('match-city');
        el.matchLocation = document.getElementById('match-location');
        el.matchIsRanked = document.getElementById('match-is-ranked');
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

        el.soloJoinModal = document.getElementById('solo-join-modal');
        el.soloJoinForm = document.getElementById('solo-join-form');
        el.soloJoinSummary = document.getElementById('solo-join-summary');
        el.soloJoinSide = document.getElementById('solo-join-side');
        el.soloJoinGuest = document.getElementById('solo-join-guest');
        el.soloJoinSubmit = document.getElementById('solo-join-submit');
        el.soloJoinFeedback = document.getElementById('solo-join-feedback');

        el.disputeModal = document.getElementById('dispute-match-modal');
        el.disputeForm = document.getElementById('dispute-match-form');
        el.disputeSummary = document.getElementById('dispute-match-summary');
        el.disputeHostScore = document.getElementById('dispute-host-score');
        el.disputeChallengerScore = document.getElementById('dispute-challenger-score');
        el.disputeReason = document.getElementById('dispute-reason');
        el.disputeEvidenceFile = document.getElementById('dispute-evidence-file');
        el.disputeSubmit = document.getElementById('dispute-match-submit');
        el.disputeFeedback = document.getElementById('dispute-match-feedback');

        el.resolveModal = document.getElementById('resolve-match-modal');
        el.resolveForm = document.getElementById('resolve-match-form');
        el.resolveSummary = document.getElementById('resolve-match-summary');
        el.resolveContext = document.getElementById('resolve-dispute-context');
        el.resolveDecision = document.getElementById('resolve-decision');
        el.resolveScoreInputs = document.getElementById('resolve-score-inputs');
        el.resolveHostScore = document.getElementById('resolve-host-score');
        el.resolveChallengerScore = document.getElementById('resolve-challenger-score');
        el.resolveSubmit = document.getElementById('resolve-match-submit');
        el.resolveFeedback = document.getElementById('resolve-match-feedback');
    }

    function bindEvents() {
        [el.sportFilter, el.skillFilter, el.statusFilter].forEach(function(ctrl) {
            if (ctrl) ctrl.addEventListener('change', loadMatchesOnly);
        });
        if (el.cityFilter) el.cityFilter.addEventListener('input', loadMatchesOnly);
        if (el.leaderboardSportFilter) el.leaderboardSportFilter.addEventListener('change', loadLeaderboardOnly);
        if (el.refreshBtn) el.refreshBtn.addEventListener('click', loadMatchesAndLeaderboard);
        if (el.reconnectBtn) el.reconnectBtn.addEventListener('click', loadMatchesAndLeaderboard);
        if (el.openCreateBtn) el.openCreateBtn.addEventListener('click', openCreateModal);

        if (el.matchMode) el.matchMode.addEventListener('change', syncMatchModeControls);
        if (el.matchBookingId) el.matchBookingId.addEventListener('change', applySelectedBookingToForm);

        if (el.matchFieldId) {
            el.matchFieldId.addEventListener('change', function() {
                var selected = state.fields.find(function(f) { return String(f.id) === String(el.matchFieldId.value); });
                if (selected) {
                    if (el.matchSport) el.matchSport.value = selected.sportType || 'FOOTBALL';
                    if (el.matchCity) el.matchCity.value = selected.city || '';
                    if (el.matchLocation) el.matchLocation.value = selected.location || '';
                    if (el.matchIsRanked) {
                        var verifiedPartner = selected.venueSource === 'PARTNER' && selected.verificationStatus === 'APPROVED';
                        el.matchIsRanked.checked = verifiedPartner;
                        el.matchIsRanked.disabled = !verifiedPartner;
                    }
                } else if (el.matchIsRanked) {
                    el.matchIsRanked.checked = false;
                    el.matchIsRanked.disabled = true;
                }
            });
        }

        if (el.createForm) el.createForm.addEventListener('submit', handleCreateSubmit);
        if (el.resultForm) el.resultForm.addEventListener('submit', handleResultSubmit);
        if (el.soloJoinForm) el.soloJoinForm.addEventListener('submit', handleSoloJoinSubmit);
        if (el.disputeForm) el.disputeForm.addEventListener('submit', handleDisputeSubmit);
        if (el.resolveForm) el.resolveForm.addEventListener('submit', handleResolveSubmit);
        if (el.resolveDecision) {
            el.resolveDecision.addEventListener('change', function() {
                if (el.resolveScoreInputs) el.resolveScoreInputs.classList.toggle('hidden', el.resolveDecision.value === 'VOID');
            });
        }

        bindModalClose(el.createModal, '[data-close-match-modal]');
        bindModalClose(el.resultModal, '[data-close-result-modal]');
        bindModalClose(el.soloJoinModal, '[data-close-solo-join]');
        bindModalClose(el.disputeModal, '[data-close-dispute-modal]');
        bindModalClose(el.resolveModal, '[data-close-resolve-modal]');

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                [el.createModal, el.resultModal, el.soloJoinModal, el.disputeModal, el.resolveModal].forEach(closeModal);
            }
        });
    }

    function bindModalClose(modal, selector) {
        if (!modal) return;
        modal.addEventListener('click', function(e) {
            if (e.target === modal || (e.target.closest && e.target.closest(selector))) {
                closeModal(modal);
            }
        });
    }

    function syncMatchModeControls() {
        var mode = el.matchMode ? el.matchMode.value : 'TEAM_CHALLENGE';
        var isSolo = mode === 'SOLO_LOBBY';
        var isCustom = mode === 'CUSTOM_PRIVATE';
        if (el.matchMissingWrap) el.matchMissingWrap.classList.toggle('hidden', isSolo || isCustom);
        if (el.matchMaxSlotsWrap) el.matchMaxSlotsWrap.classList.toggle('hidden', !isSolo && !isCustom);
        if (el.matchPreReservedWrap) el.matchPreReservedWrap.classList.toggle('hidden', !isSolo);
    }

    function loadFieldsOptions() {
        return S.apiRequest('/fields', { method: 'GET', token: '' })
            .then(function(list) {
                state.fields = Array.isArray(list) ? list : [];
                if (!el.matchFieldId) return;
                el.matchFieldId.innerHTML = '<option value="">-- Tự nhập địa điểm bên dưới (Giao hữu Unranked) --</option>' +
                    state.fields.map(function(f) {
                        var tag = f.venueSource === 'COMMUNITY_UNCLAIMED' ? ' · Cộng đồng' : ' · Đã xác thực';
                        return '<option value="' + S.escapeHtml(f.id) + '">' + S.escapeHtml(f.name) + ' (' + S.escapeHtml(S.getSportMeta(f.sportType).label) + tag + ')</option>';
                    }).join('');
            })
            .catch(function() {});
    }

    function loadMyBookingsOptions() {
        var session = S.loadAuthSession();
        if (!session.token) {
            state.myBookings = [];
            renderBookingSelectOptions();
            return Promise.resolve();
        }
        return S.apiRequest('/bookings/me', { method: 'GET', token: session.token })
            .then(function(list) {
                state.myBookings = (Array.isArray(list) ? list : []).filter(function(b) {
                    var st = S.normalizeBookingStatus(b.status);
                    return st === 'PENDING' || st === 'HOLD' || st === 'CONFIRMED';
                });
                renderBookingSelectOptions();
            })
            .catch(function() {});
    }

    function renderBookingSelectOptions() {
        if (!el.matchBookingId) return;
        el.matchBookingId.innerHTML = '<option value="">-- Không gắn booking --</option>' +
            state.myBookings.map(function(b) {
                var fname = (b.field && b.field.name) || 'Sân';
                return '<option value="' + S.escapeHtml(b.id) + '">#' + S.escapeHtml(b.id) + ' · ' + S.escapeHtml(fname) + ' (' + S.escapeHtml(S.formatDate(b.bookingDate)) + ' ' + S.escapeHtml(S.formatTimeRange(b.startTime, b.endTime)) + ')</option>';
            }).join('');
    }

    function applySelectedBookingToForm() {
        if (!el.matchBookingId) return;
        var b = state.myBookings.find(function(item) { return String(item.id) === String(el.matchBookingId.value); });
        if (!b) return;
        var field = b.field || {};
        if (el.matchFieldId && field.id) {
            el.matchFieldId.value = String(field.id);
            el.matchFieldId.dispatchEvent(new Event('change'));
        }
        if (el.matchDate) el.matchDate.value = String(b.bookingDate || '').slice(0, 10);
        if (el.matchStart) el.matchStart.value = S.formatTime(b.startTime);
        if (el.matchEnd) el.matchEnd.value = S.formatTime(b.endTime);
        if (el.matchSport && field.sportType) el.matchSport.value = field.sportType;
        if (el.matchCity && field.city) el.matchCity.value = field.city;
        if (el.matchLocation && field.location) el.matchLocation.value = field.location;
        if (b.expectedPlayers && el.matchMaxSlots) el.matchMaxSlots.value = b.expectedPlayers;
    }

    function handleUrlPrefill() {
        var params = new URLSearchParams(window.location.search);
        var bookingId = params.get('bookingId');
        var fieldId = params.get('fieldId');
        if (bookingId || fieldId) {
            openCreateModal();
            if (bookingId && el.matchBookingId) {
                el.matchBookingId.value = bookingId;
                applySelectedBookingToForm();
            } else if (fieldId && el.matchFieldId) {
                el.matchFieldId.value = fieldId;
                el.matchFieldId.dispatchEvent(new Event('change'));
            }
        }
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

    function loadLeaderboardOnly() {
        var sport = el.leaderboardSportFilter ? el.leaderboardSportFilter.value : '';
        var qs = '?limit=15' + (sport ? ('&sportType=' + encodeURIComponent(sport)) : '');
        S.apiRequest('/matches/leaderboard' + qs, { method: 'GET', token: '' })
            .then(function(list) {
                state.leaderboard = Array.isArray(list) ? list : [];
                renderLeaderboard();
            })
            .catch(function() {});
    }

    function loadMatchesAndLeaderboard() {
        if (el.previewBanner) el.previewBanner.classList.add('hidden');
        if (el.matchesGrid) {
            el.matchesGrid.innerHTML = '<div class="table-empty" style="grid-column:1/-1;">Đang tải danh sách kèo đấu...</div>';
        }
        var sport = el.leaderboardSportFilter ? el.leaderboardSportFilter.value : '';
        var lbQs = '?limit=15' + (sport ? ('&sportType=' + encodeURIComponent(sport)) : '');
        Promise.all([
            S.apiRequest('/matches' + buildMatchQueryString(), { method: 'GET', token: '' }),
            S.apiRequest('/matches/leaderboard' + lbQs, { method: 'GET', token: '' })
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
        var isOwner = session.currentRole === 'OWNER';

        el.matchesGrid.innerHTML = state.matches.map(function(m) {
            var sportMeta = S.getSportMeta(m.sportType);
            var skillLabel = S.SKILL_LEVEL_LABELS[String(m.skillLevel || '').toUpperCase()] || m.skillLevel || 'Trung bình';
            var status = String(m.status || 'OPEN').toUpperCase();
            var mode = String(m.matchMode || 'TEAM_CHALLENGE').toUpperCase();
            var scoreStatus = String(m.scoreStatus || 'NONE').toUpperCase();
            var host = m.hostUser || {};
            var challenger = m.challengerUser || null;
            var participants = Array.isArray(m.participants) ? m.participants : [];
            var activeParticipants = participants.filter(function(p) { return p.status === 'JOINED' || p.status === 'CHECKED_IN'; });
            var waitlistParticipants = participants.filter(function(p) { return p.status === 'WAITLISTED'; });
            var myPart = userId ? participants.find(function(p) { return String(p.userId) === String(userId) && p.status !== 'CANCELLED'; }) : null;
            var isHost = userId && String(host.id) === String(userId);
            var isParticipant = isHost || (userId && challenger && String(challenger.id) === String(userId)) || !!(myPart && (myPart.status === 'JOINED' || myPart.status === 'CHECKED_IN'));
            var isVerifiedFieldOwner = isOwner && m.field && String(m.field.ownerId) === String(userId) && m.field.verificationStatus === 'APPROVED';

            var locationText = (m.field && m.field.name) || m.location || m.city || 'Chưa cập nhật sân';

            var isCompleted = status === 'COMPLETED' && m.hostScore != null && m.challengerScore != null;
            var centerBadgeHtml = isCompleted
                ? ('<div class="match-center-status"><div class="match-score-pill tabular-nums">' + S.escapeHtml(String(m.hostScore)) + ' : ' + S.escapeHtml(String(m.challengerScore)) + '</div><span class="match-score-caption">Đã chốt</span></div>')
                : scoreStatus === 'PENDING_CONFIRMATION'
                    ? ('<div class="match-center-status"><div class="match-score-pill tabular-nums">' + S.escapeHtml(String(m.proposedHostScore)) + ' : ' + S.escapeHtml(String(m.proposedChallengerScore)) + '</div><span class="match-score-caption">Chờ xác nhận</span></div>')
                    : scoreStatus === 'DISPUTED'
                        ? '<div class="match-center-status"><span class="status-badge error">Tranh chấp</span></div>'
                        : '<div class="match-center-status"><span class="match-vs-badge">VS</span></div>';

            var hostName = host.fullName || 'Chủ kèo';
            var hostNameMarkup = host.id
                ? '<a class="match-player-name social-profile-link" href="profile.html?id=' + encodeURIComponent(host.id) + '">' + S.escapeHtml(hostName) + '</a>'
                : S.escapeHtml(hostName);

            var rightSlotHtml = '';
            if (mode === 'SOLO_LOBBY') {
                rightSlotHtml =
                    '<div class="match-player-slot is-challenger">' +
                    '  <div class="match-player-head">' +
                    '    <span class="match-player-avatar challenger">' + S.escapeHtml(String(m.occupiedSlots || 1)) + '/' + S.escapeHtml(String(m.maxSlots || 10)) + '</span>' +
                    '    <span class="match-player-name">Ghép lẻ (' + S.escapeHtml(String(m.occupiedSlots || 1)) + '/' + S.escapeHtml(String(m.maxSlots || 10)) + ' slot)</span>' +
                    '  </div>' +
                    '  <span class="match-player-sub">Còn thiếu ' + S.escapeHtml(String(m.missingPlayers || 0)) + ' slot' + (waitlistParticipants.length ? (' · ' + waitlistParticipants.length + ' chờ') : '') + '</span>' +
                    '</div>';
            } else if (mode === 'CUSTOM_PRIVATE') {
                rightSlotHtml =
                    '<div class="match-player-slot is-challenger">' +
                    '  <div class="match-player-head"><span class="match-player-avatar">' + S.escapeHtml(String(m.maxSlots || 10)) + '</span><span class="match-player-name">Đội riêng (' + S.escapeHtml(String(m.maxSlots || 10)) + ' người)</span></div>' +
                    '  <span class="match-player-sub">Quản lý bởi 1 Host</span>' +
                    '</div>';
            } else if (challenger) {
                rightSlotHtml =
                    '<div class="match-player-slot is-challenger">' +
                    '  <div class="match-player-head">' +
                    '    <span class="match-player-avatar challenger">' + S.escapeHtml(getInitials(challenger.fullName)) + '</span>' +
                    '    ' + (challenger.id ? '<a class="match-player-name social-profile-link" href="profile.html?id=' + encodeURIComponent(challenger.id) + '">' + S.escapeHtml(challenger.fullName || 'Đối thủ') + '</a>' : '<span class="match-player-name">' + S.escapeHtml(challenger.fullName || 'Đối thủ') + '</span>') +
                    '  </div>' +
                    '  <span class="match-player-sub tabular-nums">Đối thủ · Elo ' + S.escapeHtml(String(challenger.eloRating || 1000)) + '</span>' +
                    '</div>';
            } else {
                rightSlotHtml =
                    '<div class="match-player-slot is-challenger">' +
                    '  <div class="match-player-head"><span class="match-player-avatar open">?</span><span class="match-player-name muted">Chờ đối thủ</span></div>' +
                    '  <span class="match-player-sub">Thiếu 1 đội đối thủ</span>' +
                    '</div>';
            }

            var participantsHtml = '';
            if (mode === 'SOLO_LOBBY' && activeParticipants.length) {
                participantsHtml = '<div class="field-amenities" style="margin-top:8px;">' +
                    activeParticipants.map(function(p) {
                        var checkMark = p.status === 'CHECKED_IN' ? ' ✓' : '';
                        var guestTag = p.guestCount > 0 ? (' +' + p.guestCount) : '';
                        var noShowBtn = (isHost || isAdmin) && p.status === 'JOINED' && String(p.userId) !== String(host.id)
                            ? ' <button type="button" class="amenity-tag" style="cursor:pointer;border:1px solid rgba(255,90,90,.4);" data-mark-noshow="' + S.escapeHtml(m.id) + ':' + S.escapeHtml(p.userId) + '" title="Đánh dấu vắng mặt">Vắng?</button>'
                            : '';
                        return '<span class="amenity-tag">Đội ' + S.escapeHtml(p.teamSide) + ' · ' + S.escapeHtml(p.fullName) + guestTag + checkMark + '</span>' + noShowBtn;
                    }).join('') + '</div>';
            }

            var disputeInfoHtml = '';
            if (scoreStatus === 'DISPUTED') {
                disputeInfoHtml = '<p class="booking-feedback error" style="margin-top:8px;">Tranh chấp tỉ số (' + S.escapeHtml(String(m.proposedHostScore)) + ':' + S.escapeHtml(String(m.proposedChallengerScore)) + ' vs ' + S.escapeHtml(String(m.disputedHostScore)) + ':' + S.escapeHtml(String(m.disputedChallengerScore)) + '): ' + S.escapeHtml(m.disputeReason || '') +
                    (m.disputeEvidenceUrl ? (' · <a href="' + S.escapeHtml(S.resolveMediaUrl(m.disputeEvidenceUrl)) + '" target="_blank" rel="noopener">Xem ảnh</a>') : '') + '</p>';
            }

            var actionHtml = '';
            var canJoinTeam = mode === 'TEAM_CHALLENGE' && status === 'OPEN' && !isHost;
            var canJoinSolo = mode === 'SOLO_LOBBY' && status !== 'COMPLETED' && status !== 'CANCELLED' && !isHost && !myPart;
            var canLeave = !isHost && myPart && status !== 'COMPLETED' && status !== 'CANCELLED';
            var canCheckIn = myPart && myPart.status === 'JOINED' && status !== 'COMPLETED' && status !== 'CANCELLED';
            var canPropose = status !== 'COMPLETED' && status !== 'CANCELLED' && scoreStatus === 'NONE' && (isParticipant || isAdmin) && (mode === 'TEAM_CHALLENGE' ? !!challenger : activeParticipants.length >= 2);
            var canConfirmOrDispute = scoreStatus === 'PENDING_CONFIRMATION' && userId && ((isParticipant && String(m.scoreSubmittedByUserId) !== String(userId)) || isAdmin);
            var canResolve = scoreStatus === 'DISPUTED' && (isAdmin || isVerifiedFieldOwner);

            if (canJoinTeam) {
                actionHtml += '<button class="btn btn-primary btn-sm" type="button" data-match-join="' + S.escapeHtml(m.id) + '">Nhận kèo</button>';
            }
            if (canJoinSolo) {
                actionHtml += '<button class="btn btn-primary btn-sm" type="button" data-solo-join="' + S.escapeHtml(m.id) + '">' + (m.missingPlayers > 0 ? 'Đăng ký slot' : 'Vào chờ (Waitlist)') + '</button>';
            }
            if (canCheckIn) {
                actionHtml += '<button class="btn btn-secondary btn-sm" type="button" data-match-checkin="' + S.escapeHtml(m.id) + '">Check-in</button>';
            }
            if (canLeave) {
                actionHtml += '<button class="btn btn-ghost btn-sm" type="button" data-match-leave="' + S.escapeHtml(m.id) + '">Rời kèo</button>';
            }
            if (canPropose) {
                actionHtml += '<button class="btn btn-secondary btn-sm" type="button" data-match-result="' + S.escapeHtml(m.id) + '">Đề xuất tỉ số</button>';
            }
            if (canConfirmOrDispute) {
                actionHtml += '<button class="btn btn-primary btn-sm" type="button" data-score-confirm="' + S.escapeHtml(m.id) + '">Xác nhận tỉ số</button>';
                actionHtml += '<button class="btn btn-danger-soft btn-sm" type="button" data-score-dispute="' + S.escapeHtml(m.id) + '">Khiếu nại</button>';
            }
            if (canResolve) {
                actionHtml += '<button class="btn btn-primary btn-sm" type="button" data-score-resolve="' + S.escapeHtml(m.id) + '">Phân xử</button>';
            }

            var modeTag = S.getMatchModeLabel(mode) + ' · ' + (m.isRanked ? 'Tính Elo' : 'Giao hữu');

            return '<article class="match-card">' +
                '  <div class="match-card-meta-top">' +
                '    <span class="match-inline-tags">' + sportMeta.iconSvg + '<strong>' + S.escapeHtml(sportMeta.label) + '</strong> · ' + S.escapeHtml(skillLabel) + ' · ' + S.escapeHtml(modeTag) + '</span>' +
                '    ' + S.renderMatchStatusBadge(status) +
                '  </div>' +
                '  <h3 class="match-card-title">' + S.escapeHtml(m.title) + '</h3>' +
                '  <div class="match-players-box">' +
                '    <div class="match-player-slot">' +
                '      <div class="match-player-head"><span class="match-player-avatar">' + S.escapeHtml(getInitials(hostName)) + '</span>' + hostNameMarkup + '</div>' +
                '      <span class="match-player-sub tabular-nums">Chủ kèo · Elo ' + S.escapeHtml(String(host.eloRating || 1000)) + ' · Uy tín ' + S.escapeHtml(String(host.reliabilityScore != null ? host.reliabilityScore : 100)) + '</span>' +
                '    </div>' +
                '    ' + centerBadgeHtml +
                '    ' + rightSlotHtml +
                '  </div>' +
                participantsHtml +
                disputeInfoHtml +
                (m.notes ? '<p class="match-notes">' + S.escapeHtml(m.notes) + '</p>' : '') +
                '  <div class="match-card-footer">' +
                '    <div class="match-venue-schedule">' +
                '      <span class="match-schedule-time tabular-nums">' + S.escapeHtml(S.formatDate(m.matchDate)) + ' · ' + S.escapeHtml(S.formatTimeRange(m.startTime, m.endTime)) + '</span>' +
                '      <span class="match-schedule-place">' + S.escapeHtml(locationText) + (m.bookingId ? (' · Booking #' + S.escapeHtml(String(m.bookingId))) : '') + '</span>' +
                '    </div>' +
                '    <div style="display:flex;gap:8px;flex-wrap:wrap;">' + actionHtml + '</div>' +
                '  </div>' +
                '</article>';
        }).join('');

        bindMatchCardButtons();
        S.refreshIcons(el.matchesGrid);
    }

    function bindMatchCardButtons() {
        Array.prototype.forEach.call(el.matchesGrid.querySelectorAll('[data-match-join]'), function(btn) {
            btn.addEventListener('click', function() { joinTeamMatch(btn.getAttribute('data-match-join'), btn); });
        });
        Array.prototype.forEach.call(el.matchesGrid.querySelectorAll('[data-solo-join]'), function(btn) {
            btn.addEventListener('click', function() { openSoloJoinModal(btn.getAttribute('data-solo-join')); });
        });
        Array.prototype.forEach.call(el.matchesGrid.querySelectorAll('[data-match-leave]'), function(btn) {
            btn.addEventListener('click', function() { leaveMatch(btn.getAttribute('data-match-leave'), btn); });
        });
        Array.prototype.forEach.call(el.matchesGrid.querySelectorAll('[data-match-checkin]'), function(btn) {
            btn.addEventListener('click', function() { checkInMatch(btn.getAttribute('data-match-checkin'), btn); });
        });
        Array.prototype.forEach.call(el.matchesGrid.querySelectorAll('[data-mark-noshow]'), function(btn) {
            btn.addEventListener('click', function() {
                var parts = btn.getAttribute('data-mark-noshow').split(':');
                markNoShow(parts[0], parts[1], btn);
            });
        });
        Array.prototype.forEach.call(el.matchesGrid.querySelectorAll('[data-match-result]'), function(btn) {
            btn.addEventListener('click', function() { openResultModal(btn.getAttribute('data-match-result')); });
        });
        Array.prototype.forEach.call(el.matchesGrid.querySelectorAll('[data-score-confirm]'), function(btn) {
            btn.addEventListener('click', function() { confirmMatchScore(btn.getAttribute('data-score-confirm'), btn); });
        });
        Array.prototype.forEach.call(el.matchesGrid.querySelectorAll('[data-score-dispute]'), function(btn) {
            btn.addEventListener('click', function() { openDisputeModal(btn.getAttribute('data-score-dispute')); });
        });
        Array.prototype.forEach.call(el.matchesGrid.querySelectorAll('[data-score-resolve]'), function(btn) {
            btn.addEventListener('click', function() { openResolveModal(btn.getAttribute('data-score-resolve')); });
        });
    }

    function renderLeaderboard() {
        if (!el.leaderboardList) return;
        if (!state.leaderboard.length) {
            el.leaderboardList.innerHTML = '<p class="table-empty">Chưa có dữ liệu xếp hạng cho môn này.</p>';
            return;
        }

        el.leaderboardList.innerHTML = state.leaderboard.map(function(entry) {
            var rankClass = entry.rank <= 3 ? (' rank-' + entry.rank) : '';
            var tierText = getEloTierLabel(entry.eloRating);
            var relText = entry.reliabilityScore != null ? (' · Uy tín ' + entry.reliabilityScore) : '';
            var subText = (entry.address ? (tierText + ' · ' + entry.address) : tierText) + relText;
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
            S.openAuthModal('login', { message: 'Đăng nhập để tạo kèo thi đấu mới.' });
            return;
        }
        if (el.createForm) el.createForm.reset();
        if (el.matchDate) el.matchDate.value = S.formatDateForInput(new Date(Date.now() + 24 * 60 * 60 * 1000));
        if (el.matchIsRanked) {
            el.matchIsRanked.checked = false;
            el.matchIsRanked.disabled = true;
        }
        syncMatchModeControls();
        if (el.createFeedback) el.createFeedback.className = 'booking-feedback hidden';
        openModal(el.createModal, el.matchTitle);
    }

    function handleCreateSubmit(e) {
        e.preventDefault();
        var title = el.matchTitle ? el.matchTitle.value.trim() : '';
        var matchDate = el.matchDate ? el.matchDate.value : '';
        var startTime = el.matchStart ? el.matchStart.value : '';
        var endTime = el.matchEnd ? el.matchEnd.value : '';
        var mode = el.matchMode ? el.matchMode.value : 'TEAM_CHALLENGE';

        if (!title || !matchDate || !startTime || !endTime) {
            showFeedback(el.createFeedback, 'Vui lòng nhập đầy đủ tiêu đề, ngày và khung giờ.', true);
            return;
        }
        if (endTime <= startTime) {
            showFeedback(el.createFeedback, 'Giờ kết thúc phải sau giờ bắt đầu.', true);
            return;
        }

        var fieldIdRaw = el.matchFieldId ? el.matchFieldId.value : '';
        var bookingIdRaw = el.matchBookingId ? el.matchBookingId.value : '';
        var maxSlots = el.matchMaxSlots ? Number(el.matchMaxSlots.value) : 10;
        var preReserved = el.matchPreReserved ? Number(el.matchPreReserved.value) : 1;

        var payload = {
            title: title,
            matchMode: mode,
            bookingId: bookingIdRaw ? Number(bookingIdRaw) : null,
            sportType: el.matchSport ? el.matchSport.value : 'FOOTBALL',
            skillLevel: el.matchSkill ? el.matchSkill.value : 'INTERMEDIATE',
            fieldId: fieldIdRaw ? Number(fieldIdRaw) : null,
            city: el.matchCity ? el.matchCity.value.trim() || null : null,
            location: el.matchLocation ? el.matchLocation.value.trim() || null : null,
            matchDate: matchDate,
            startTime: startTime,
            endTime: endTime,
            missingPlayers: mode === 'SOLO_LOBBY' ? Math.max(1, maxSlots - preReserved) : (mode === 'CUSTOM_PRIVATE' ? 0 : 1),
            maxSlots: mode === 'TEAM_CHALLENGE' ? 2 : maxSlots,
            preReservedSlots: mode === 'SOLO_LOBBY' ? preReserved : 1,
            isRanked: !!(el.matchIsRanked && el.matchIsRanked.checked),
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

    function joinTeamMatch(matchId, btn) {
        var session = S.loadAuthSession();
        if (!session.token) {
            S.openAuthModal('login', { message: 'Đăng nhập để nhận kèo giao hữu.' });
            return;
        }
        if (btn) btn.disabled = true;
        S.apiRequest('/matches/' + encodeURIComponent(matchId) + '/join', { method: 'POST', body: JSON.stringify({ teamSide: 'B', guestCount: 0 }) })
            .then(function() {
                S.showToast('Nhận kèo thành công!', 'success');
                loadMatchesAndLeaderboard();
            })
            .catch(function(err) {
                S.showToast(err.message || 'Không thể tham gia kèo.', 'error');
                if (btn) btn.disabled = false;
            });
    }

    function openSoloJoinModal(matchId) {
        var session = S.loadAuthSession();
        if (!session.token) {
            S.openAuthModal('login', { message: 'Đăng nhập để đăng ký slot vào phòng Solo Lobby.' });
            return;
        }
        var match = state.matches.find(function(m) { return String(m.id) === String(matchId); });
        if (!match) return;
        state.activeSoloMatch = match;
        if (el.soloJoinSummary) el.soloJoinSummary.textContent = match.title + ' (Còn ' + (match.missingPlayers || 0) + ' slot)';
        if (el.soloJoinForm) el.soloJoinForm.reset();
        if (el.soloJoinFeedback) el.soloJoinFeedback.className = 'booking-feedback hidden';
        openModal(el.soloJoinModal, el.soloJoinSide);
    }

    function handleSoloJoinSubmit(e) {
        e.preventDefault();
        if (!state.activeSoloMatch) return;
        if (el.soloJoinSubmit) el.soloJoinSubmit.disabled = true;
        S.apiRequest('/matches/' + encodeURIComponent(state.activeSoloMatch.id) + '/join', {
            method: 'POST',
            body: JSON.stringify({
                teamSide: el.soloJoinSide ? el.soloJoinSide.value : 'ANY',
                guestCount: Number(el.soloJoinGuest ? el.soloJoinGuest.value : 0)
            })
        })
            .then(function() {
                closeModal(el.soloJoinModal);
                S.showToast('Đăng ký slot thành công!', 'success');
                loadMatchesAndLeaderboard();
            })
            .catch(function(err) {
                showFeedback(el.soloJoinFeedback, err.message || 'Không thể đăng ký slot.', true);
            })
            .then(function() {
                if (el.soloJoinSubmit) el.soloJoinSubmit.disabled = false;
            });
    }

    function leaveMatch(matchId, btn) {
        if (btn) btn.disabled = true;
        S.apiRequest('/matches/' + encodeURIComponent(matchId) + '/leave', { method: 'POST' })
            .then(function() {
                S.showToast('Đã rời khỏi trận đấu.', 'info');
                loadMatchesAndLeaderboard();
            })
            .catch(function(err) {
                S.showToast(err.message || 'Không thể rời trận.', 'error');
                if (btn) btn.disabled = false;
            });
    }

    function checkInMatch(matchId, btn) {
        if (btn) btn.disabled = true;
        S.apiRequest('/matches/' + encodeURIComponent(matchId) + '/check-in', { method: 'POST' })
            .then(function() {
                S.showToast('Check-in trận đấu thành công (+1 uy tín)!', 'success');
                loadMatchesAndLeaderboard();
            })
            .catch(function(err) {
                S.showToast(err.message || 'Không thể check-in.', 'error');
                if (btn) btn.disabled = false;
            });
    }

    function markNoShow(matchId, targetUserId, btn) {
        if (btn) btn.disabled = true;
        S.apiRequest('/matches/' + encodeURIComponent(matchId) + '/no-show/' + encodeURIComponent(targetUserId), { method: 'POST' })
            .then(function() {
                S.showToast('Đã ghi nhận vắng mặt (NO_SHOW).', 'info');
                loadMatchesAndLeaderboard();
            })
            .catch(function(err) {
                S.showToast(err.message || 'Không thể ghi nhận NO_SHOW.', 'error');
                if (btn) btn.disabled = false;
            });
    }

    function openResultModal(matchId) {
        var match = state.matches.find(function(m) { return String(m.id) === String(matchId); });
        if (!match) return;
        state.activeResultMatch = match;
        if (el.resultSummary) el.resultSummary.textContent = match.title;
        if (el.resultHostLabel) el.resultHostLabel.textContent = 'Điểm Đội A (' + ((match.hostUser && match.hostUser.fullName) || 'Chủ kèo') + ')';
        if (el.resultChallengerLabel) el.resultChallengerLabel.textContent = 'Điểm Đội B (' + ((match.challengerUser && match.challengerUser.fullName) || 'Đối thủ') + ')';
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
        S.apiRequest('/matches/' + encodeURIComponent(match.id) + '/score/propose', {
            method: 'POST',
            body: JSON.stringify({ hostScore: hostScore, challengerScore: challengerScore })
        })
            .then(function() {
                closeModal(el.resultModal);
                S.showToast('Đã gửi đề xuất tỉ số! Chờ đối thủ xác nhận trong 24h.', 'success');
                loadMatchesAndLeaderboard();
            })
            .catch(function(err) {
                showFeedback(el.resultFeedback, err.message || 'Không thể gửi tỉ số.', true);
            })
            .then(function() {
                if (el.resultSubmit) el.resultSubmit.disabled = false;
            });
    }

    function confirmMatchScore(matchId, btn) {
        if (btn) btn.disabled = true;
        S.apiRequest('/matches/' + encodeURIComponent(matchId) + '/score/confirm', { method: 'POST' })
            .then(function() {
                S.showToast('Đã xác nhận tỉ số và cập nhật bảng xếp hạng Elo!', 'success');
                loadMatchesAndLeaderboard();
            })
            .catch(function(err) {
                S.showToast(err.message || 'Không thể xác nhận tỉ số.', 'error');
                if (btn) btn.disabled = false;
            });
    }

    function openDisputeModal(matchId) {
        var match = state.matches.find(function(m) { return String(m.id) === String(matchId); });
        if (!match) return;
        state.activeDisputeMatch = match;
        if (el.disputeSummary) el.disputeSummary.textContent = match.title + ' (Đề xuất hiện tại: ' + match.proposedHostScore + ':' + match.proposedChallengerScore + ')';
        if (el.disputeForm) el.disputeForm.reset();
        if (el.disputeFeedback) el.disputeFeedback.className = 'booking-feedback hidden';
        openModal(el.disputeModal, el.disputeHostScore);
    }

    function handleDisputeSubmit(e) {
        e.preventDefault();
        var match = state.activeDisputeMatch;
        if (!match) return;
        var hostScore = Number(el.disputeHostScore.value);
        var challengerScore = Number(el.disputeChallengerScore.value);
        var reason = el.disputeReason.value.trim();
        if (!reason) {
            showFeedback(el.disputeFeedback, 'Vui lòng nhập lý do khiếu nại.', true);
            return;
        }
        var file = el.disputeEvidenceFile && el.disputeEvidenceFile.files ? el.disputeEvidenceFile.files[0] : null;
        if (el.disputeSubmit) el.disputeSubmit.disabled = true;

        var uploadPromise = Promise.resolve(null);
        if (file) {
            var fd = new FormData();
            fd.append('file', file);
            uploadPromise = S.apiRequest('/matches/' + encodeURIComponent(match.id) + '/dispute-evidence', {
                method: 'POST', isFormData: true, body: fd
            }).then(function(res) { return res && res.url ? res.url : null; });
        }
        uploadPromise
            .then(function(evidenceUrl) {
                return S.apiRequest('/matches/' + encodeURIComponent(match.id) + '/score/dispute', {
                    method: 'POST',
                    body: JSON.stringify({
                        hostScore: hostScore,
                        challengerScore: challengerScore,
                        reason: reason,
                        evidenceUrl: evidenceUrl
                    })
                });
            })
            .then(function() {
                closeModal(el.disputeModal);
                S.showToast('Đã gửi khiếu nại tỉ số tới Admin/Chủ sân.', 'info');
                loadMatchesAndLeaderboard();
            })
            .catch(function(err) {
                showFeedback(el.disputeFeedback, err.message || 'Không thể gửi khiếu nại.', true);
            })
            .then(function() {
                if (el.disputeSubmit) el.disputeSubmit.disabled = false;
            });
    }

    function openResolveModal(matchId) {
        var match = state.matches.find(function(m) { return String(m.id) === String(matchId); });
        if (!match) return;
        state.activeResolveMatch = match;
        if (el.resolveSummary) el.resolveSummary.textContent = match.title;
        if (el.resolveContext) {
            el.resolveContext.textContent = 'Đề xuất: ' + match.proposedHostScore + ':' + match.proposedChallengerScore +
                ' · Khiếu nại: ' + match.disputedHostScore + ':' + match.disputedChallengerScore +
                (match.disputeReason ? (' · Lý do: ' + match.disputeReason) : '');
        }
        if (el.resolveHostScore) el.resolveHostScore.value = match.proposedHostScore != null ? match.proposedHostScore : 0;
        if (el.resolveChallengerScore) el.resolveChallengerScore.value = match.proposedChallengerScore != null ? match.proposedChallengerScore : 0;
        if (el.resolveScoreInputs) el.resolveScoreInputs.classList.remove('hidden');
        if (el.resolveFeedback) el.resolveFeedback.className = 'booking-feedback hidden';
        openModal(el.resolveModal, el.resolveDecision);
    }

    function handleResolveSubmit(e) {
        e.preventDefault();
        var match = state.activeResolveMatch;
        if (!match) return;
        var decision = el.resolveDecision.value;
        var payload = {
            decision: decision,
            hostScore: decision === 'CONFIRM' ? Number(el.resolveHostScore.value) : null,
            challengerScore: decision === 'CONFIRM' ? Number(el.resolveChallengerScore.value) : null
        };
        if (el.resolveSubmit) el.resolveSubmit.disabled = true;
        S.apiRequest('/matches/' + encodeURIComponent(match.id) + '/score/resolve', {
            method: 'PATCH',
            body: JSON.stringify(payload)
        })
            .then(function() {
                closeModal(el.resolveModal);
                S.showToast('Đã phân xử tranh chấp trận đấu!', 'success');
                loadMatchesAndLeaderboard();
            })
            .catch(function(err) {
                showFeedback(el.resolveFeedback, err.message || 'Không thể lưu phán quyết.', true);
            })
            .then(function() {
                if (el.resolveSubmit) el.resolveSubmit.disabled = false;
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
