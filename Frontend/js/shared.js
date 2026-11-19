(function(global) {
    'use strict';

    var AUTH_SESSION_STORAGE_KEY = 'sporthubAuthSession';

    var SPORT_TYPES = {
        FOOTBALL: {
            label: 'Bóng đá',
            shortLabel: 'Bóng đá',
            bgStart: '#0b0d09',
            bgEnd: '#192211',
            lineColor: 'rgba(198,246,38,0.32)',
            accentColor: '#c6f626',
            iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7.5 15.5 10l-1.3 4.2H9.8L8.5 10 12 7.5Z"/><path d="M12 3v4.5M20.5 9.5 15.5 10M17.5 19.3l-3.3-5.1M6.5 19.3l3.3-5.1M3.5 9.5 8.5 10"/></svg>'
        },
        VOLLEYBALL: {
            label: 'Bóng chuyền',
            shortLabel: 'Bóng chuyền',
            bgStart: '#0b0d09',
            bgEnd: '#1d2415',
            lineColor: 'rgba(198,246,38,0.32)',
            accentColor: '#c6f626',
            iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M11.1 3.1a14 14 0 0 1 6.7 11.4"/><path d="M3.4 9.5a14 14 0 0 1 13.4-2.8"/><path d="M5.2 18a14 14 0 0 1 8.4-11.2"/><path d="M12 12v9"/></svg>'
        },
        BADMINTON: {
            label: 'Cầu lông',
            shortLabel: 'Cầu lông',
            bgStart: '#0b0d09',
            bgEnd: '#182012',
            lineColor: 'rgba(198,246,38,0.32)',
            accentColor: '#c6f626',
            iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m14.5 14.5 5-8.5-3.5-2-5 8.5"/><path d="m10 12.5 5-8.5-3.5-1.5-5 8.5"/><path d="M7.5 14.5 5 18a2.2 2.2 0 0 0 3 3l3.5-2.5"/><path d="m8 11.5 4.5 4.5"/></svg>'
        },
        BASKETBALL: {
            label: 'Bóng rổ',
            shortLabel: 'Bóng rổ',
            bgStart: '#0b0d09',
            bgEnd: '#1e2515',
            lineColor: 'rgba(198,246,38,0.32)',
            accentColor: '#c6f626',
            iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3v18"/><path d="M5.6 5.6c2.5 2.4 2.5 10.4 0 12.8"/><path d="M18.4 5.6c-2.5 2.4-2.5 10.4 0 12.8"/></svg>'
        },
        TENNIS: {
            label: 'Tennis',
            shortLabel: 'Tennis',
            bgStart: '#0b0d09',
            bgEnd: '#1b2611',
            lineColor: 'rgba(198,246,38,0.35)',
            accentColor: '#c6f626',
            iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M5.2 6.8a9 9 0 0 1 0 10.4"/><path d="M18.8 6.8a9 9 0 0 0 0 10.4"/></svg>'
        },
        PING_PONG: {
            label: 'Bóng bàn',
            shortLabel: 'Bóng bàn',
            bgStart: '#0b0d09',
            bgEnd: '#182012',
            lineColor: 'rgba(198,246,38,0.32)',
            accentColor: '#c6f626',
            iconSvg: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="13" cy="10" r="6"/><path d="m8.8 14.2-4.8 4.8a1.5 1.5 0 0 0 2.1 2.1l4.8-4.8"/><circle cx="18" cy="17" r="2"/></svg>'
        }
    };

    var BOOKING_STATUS_META = {
        PENDING: { label: 'Chờ xác nhận', className: 'pending', icon: 'clock' },
        HOLD: { label: 'Đang giữ chỗ', className: 'hold', icon: 'timer' },
        CONFIRMED: { label: 'Đã xác nhận', className: 'success', icon: 'check-circle-2' },
        COMPLETED: { label: 'Hoàn thành', className: 'success', icon: 'badge-check' },
        CANCELLED: { label: 'Đã hủy', className: 'error', icon: 'x-circle' }
    };

    var MATCH_STATUS_META = {
        OPEN: { label: 'Đang tìm đối', className: 'hold', icon: 'users' },
        MATCHED: { label: 'Đã đủ kèo', className: 'pending', icon: 'swords' },
        COMPLETED: { label: 'Đã có kết quả', className: 'success', icon: 'trophy' },
        CANCELLED: { label: 'Đã hủy', className: 'error', icon: 'x-circle' }
    };

    var SKILL_LEVEL_LABELS = {
        BEGINNER: 'Mới chơi',
        INTERMEDIATE: 'Trung bình',
        ADVANCED: 'Nâng cao',
        PRO: 'Bán chuyên'
    };

    function escapeHtml(text) {
        if (text == null) {
            return '';
        }
        return String(text).replace(/[&<>"']/g, function(ch) {
            var map = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
            return map[ch];
        });
    }

    function normalizeRole(role) {
        var upper = String(role || 'CUSTOMER').trim().toUpperCase();
        if (upper === 'USER') return 'CUSTOMER';
        if (upper === 'STAFF') return 'ADMIN';
        if (upper === 'ADMIN' || upper === 'OWNER') return upper;
        return 'CUSTOMER';
    }

    function getRoleLabel(role) {
        var normalized = normalizeRole(role);
        if (normalized === 'ADMIN') return 'Quản trị viên';
        if (normalized === 'OWNER') return 'Chủ sân';
        return 'Thành viên';
    }

    function normalizeUser(user) {
        if (!user || typeof user !== 'object') {
            return null;
        }
        return {
            id: user.id != null ? user.id : Date.now(),
            backendUserId: user.backendUserId != null ? user.backendUserId : user.id,
            fullName: user.fullName || user.name || 'Người dùng',
            name: user.name || user.fullName || 'Người dùng',
            email: String(user.email || '').trim().toLowerCase(),
            phone: user.phone || '',
            address: user.address || '',
            bio: user.bio || '',
            avatarUrl: user.avatarUrl || '',
            role: normalizeRole(user.role),
            eloRating: Number(user.eloRating || 1000)
        };
    }

    function loadAuthSession() {
        try {
            var raw = localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
            if (!raw) {
                return { token: '', currentUser: null, currentRole: null };
            }
            var parsed = JSON.parse(raw);
            if (!parsed || !parsed.token || !parsed.currentUser) {
                return { token: '', currentUser: null, currentRole: null };
            }
            var user = normalizeUser(parsed.currentUser);
            return {
                token: String(parsed.token),
                currentUser: user,
                currentRole: user ? user.role : null
            };
        } catch (error) {
            return { token: '', currentUser: null, currentRole: null };
        }
    }

    function persistAuthSession(user, token) {
        var normalized = normalizeUser(user);
        localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify({
            token: token,
            currentUser: normalized
        }));
        return {
            token: token,
            currentUser: normalized,
            currentRole: normalized ? normalized.role : null
        };
    }

    function clearAuthSession() {
        localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    }

    function createAuthHeaders(token, extraHeaders) {
        var headers = { Accept: 'application/json' };
        if (token) {
            headers.Authorization = 'Bearer ' + token;
        }
        if (extraHeaders && typeof extraHeaders === 'object') {
            Object.keys(extraHeaders).forEach(function(key) {
                headers[key] = extraHeaders[key];
            });
        }
        return headers;
    }

    function apiRequest(pathOrUrl, options) {
        var opts = options || {};
        var baseUrl = getSportHubApiBaseUrl();
        var url = /^https?:\/\//i.test(pathOrUrl)
            ? pathOrUrl
            : baseUrl + (pathOrUrl.charAt(0) === '/' ? pathOrUrl : '/' + pathOrUrl);

        var session = loadAuthSession();
        var token = opts.token !== undefined ? opts.token : session.token;
        var headers = opts.isFormData
            ? (token ? { Accept: 'application/json', Authorization: 'Bearer ' + token } : { Accept: 'application/json' })
            : createAuthHeaders(token, opts.headers);

        if (opts.body && !opts.isFormData && !headers['Content-Type']) {
            headers['Content-Type'] = 'application/json';
        }

        return fetch(url, {
            method: opts.method || 'GET',
            headers: headers,
            body: opts.body
        }).then(function(response) {
            if (!response.ok) {
                return response.json().catch(function() { return {}; }).then(function(errorBody) {
                    var message = errorBody.message || errorBody.title || ('Lỗi máy chủ (HTTP ' + response.status + ')');
                    var err = new Error(message);
                    err.status = response.status;
                    err.isBackendError = true;
                    throw err;
                });
            }
            if (response.status === 204) {
                return null;
            }
            return response.text().then(function(text) {
                if (!text) return null;
                try {
                    return JSON.parse(text);
                } catch (e) {
                    return text;
                }
            });
        });
    }

    function resolveMediaUrl(url) {
        if (!url) return '';
        var trimmed = String(url).trim();
        if (!trimmed) return '';
        if (/^https?:\/\//i.test(trimmed) || /^data:image\//i.test(trimmed)) {
            return trimmed;
        }
        var origin = getSportHubApiOrigin();
        return origin + (trimmed.charAt(0) === '/' ? trimmed : '/' + trimmed);
    }

    function isPlaceholderUrl(url) {
        return !url || /via\.placeholder\.com/i.test(url);
    }

    function getSportMeta(sportType) {
        var key = String(sportType || 'FOOTBALL').toUpperCase();
        return SPORT_TYPES[key] || {
            label: sportType || 'Thể thao',
            shortLabel: sportType || 'Thể thao',
            bgStart: '#1e293b',
            bgEnd: '#334155',
            lineColor: 'rgba(255,255,255,0.24)',
            accentColor: '#94a3b8',
            iconSvg: SPORT_TYPES.FOOTBALL.iconSvg
        };
    }

    function buildCourtPattern(sportKey, lineColor) {
        if (sportKey === 'BADMINTON' || sportKey === 'TENNIS' || sportKey === 'VOLLEYBALL') {
            return '<rect x="36" y="24" width="328" height="202" rx="6" fill="none" stroke="' + lineColor + '" stroke-width="2"/>' +
                '<line x1="200" y1="24" x2="200" y2="226" stroke="' + lineColor + '" stroke-width="2.5" stroke-dasharray="6 4"/>' +
                '<line x1="80" y1="24" x2="80" y2="226" stroke="' + lineColor + '" stroke-width="1.5"/>' +
                '<line x1="320" y1="24" x2="320" y2="226" stroke="' + lineColor + '" stroke-width="1.5"/>' +
                '<line x1="36" y1="54" x2="364" y2="54" stroke="' + lineColor + '" stroke-width="1.4"/>' +
                '<line x1="36" y1="196" x2="364" y2="196" stroke="' + lineColor + '" stroke-width="1.4"/>';
        }
        if (sportKey === 'BASKETBALL') {
            return '<rect x="32" y="24" width="336" height="202" rx="6" fill="none" stroke="' + lineColor + '" stroke-width="2"/>' +
                '<line x1="200" y1="24" x2="200" y2="226" stroke="' + lineColor + '" stroke-width="2"/>' +
                '<circle cx="200" cy="125" r="32" fill="none" stroke="' + lineColor + '" stroke-width="2"/>' +
                '<path d="M32 62h54a54 54 0 0 1 0 126H32" fill="none" stroke="' + lineColor + '" stroke-width="2"/>' +
                '<path d="M368 62h-54a54 54 0 0 0 0 126h54" fill="none" stroke="' + lineColor + '" stroke-width="2"/>';
        }
        return '<rect x="28" y="22" width="344" height="206" rx="6" fill="none" stroke="' + lineColor + '" stroke-width="2"/>' +
            '<line x1="200" y1="22" x2="200" y2="228" stroke="' + lineColor + '" stroke-width="2"/>' +
            '<circle cx="200" cy="125" r="34" fill="none" stroke="' + lineColor + '" stroke-width="2"/>' +
            '<circle cx="200" cy="125" r="4" fill="' + lineColor + '"/>' +
            '<rect x="28" y="72" width="46" height="106" fill="none" stroke="' + lineColor + '" stroke-width="2"/>' +
            '<rect x="326" y="72" width="46" height="106" fill="none" stroke="' + lineColor + '" stroke-width="2"/>';
    }

    function getFieldFallbackSvgMarkup(sportType, altLabel) {
        var key = String(sportType || 'FOOTBALL').toUpperCase();
        var meta = getSportMeta(key);
        var gradId = 'g-' + key.toLowerCase();
        var glowId = 'glow-' + key.toLowerCase();
        return '<svg class="field-media-svg" viewBox="0 0 400 250" role="img" aria-label="' + escapeHtml(altLabel || meta.label) + '">' +
            '<defs>' +
            '<linearGradient id="' + gradId + '" x1="0%" y1="0%" x2="100%" y2="100%">' +
            '<stop offset="0%" stop-color="' + meta.bgStart + '"/>' +
            '<stop offset="100%" stop-color="' + meta.bgEnd + '"/>' +
            '</linearGradient>' +
            '<radialGradient id="' + glowId + '" cx="50%" cy="45%" r="55%">' +
            '<stop offset="0%" stop-color="' + meta.accentColor + '" stop-opacity="0.18"/>' +
            '<stop offset="100%" stop-color="' + meta.bgStart + '" stop-opacity="0"/>' +
            '</radialGradient>' +
            '</defs>' +
            '<rect width="400" height="250" fill="url(#' + gradId + ')"/>' +
            '<rect width="400" height="250" fill="url(#' + glowId + ')"/>' +
            buildCourtPattern(key, meta.lineColor) +
            '</svg>';
    }

    var CURATED_SPORT_PHOTOS = {
        FOOTBALL: [
            'https://images.unsplash.com/photo-1529900748604-07564a03e7a6?auto=format&fit=crop&w=960&q=82',
            'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?auto=format&fit=crop&w=960&q=82',
            'https://images.unsplash.com/photo-1518605368461-1ee7e543b29f?auto=format&fit=crop&w=960&q=82'
        ],
        TENNIS: [
            'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?auto=format&fit=crop&w=960&q=82',
            'https://images.unsplash.com/photo-1595435934249-5df7ed86e1c0?auto=format&fit=crop&w=960&q=82'
        ],
        BADMINTON: [
            'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?auto=format&fit=crop&w=960&q=82',
            'https://images.unsplash.com/photo-1613918431703-aa50889e3be9?auto=format&fit=crop&w=960&q=82'
        ],
        BASKETBALL: [
            'https://images.unsplash.com/photo-1505666287802-931dc83948e9?auto=format&fit=crop&w=960&q=82',
            'https://images.unsplash.com/photo-1546519638-68e109498ffc?auto=format&fit=crop&w=960&q=82'
        ],
        VOLLEYBALL: [
            'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?auto=format&fit=crop&w=960&q=82',
            'https://images.unsplash.com/photo-1592656094267-764a45160876?auto=format&fit=crop&w=960&q=82'
        ]
    };

    function getCuratedSportPhoto(field) {
        var key = String((field && field.sportType) || 'FOOTBALL').toUpperCase();
        var pool = CURATED_SPORT_PHOTOS[key] || CURATED_SPORT_PHOTOS.FOOTBALL;
        var seed = Number(field && field.id) || String((field && field.name) || '').length || 0;
        return pool[Math.abs(seed) % pool.length];
    }

    function renderFieldMediaMarkup(field, extraClass) {
        var resolved = resolveMediaUrl(field && field.imageUrl);
        var sport = field && field.sportType;
        var name = (field && field.name) || 'Sân thể thao';
        var finalSrc = (!resolved || isPlaceholderUrl(resolved)) ? getCuratedSportPhoto(field) : resolved;
        if (!finalSrc) {
            return getFieldFallbackSvgMarkup(sport, name);
        }
        return '<img src="' + escapeHtml(finalSrc) + '" alt="' + escapeHtml(name) + '" loading="lazy" class="' + escapeHtml(extraClass || 'field-image') + '" data-sport-fallback="' + escapeHtml(sport || 'FOOTBALL') + '" onerror="handleSportHubImageError(this)">';
    }

    global.handleSportHubImageError = function(img) {
        var container = img && img.parentElement;
        if (!container) return;
        var sport = img.getAttribute('data-sport-fallback') || 'FOOTBALL';
        var alt = img.getAttribute('alt') || 'Sân thể thao';
        container.innerHTML = getFieldFallbackSvgMarkup(sport, alt);
    };

    function formatCurrency(value) {
        var num = Number(value);
        if (!Number.isFinite(num)) num = 0;
        return new Intl.NumberFormat('vi-VN').format(num);
    }

    function formatDate(value) {
        if (!value) return '--';
        var str = String(value).slice(0, 10);
        var parts = str.split('-');
        if (parts.length === 3) {
            return parts[2] + '/' + parts[1] + '/' + parts[0];
        }
        var d = new Date(value);
        return isNaN(d.getTime()) ? String(value) : d.toLocaleDateString('vi-VN');
    }

    function formatDateForInput(date) {
        var d = date instanceof Date ? date : new Date();
        var y = d.getFullYear();
        var m = String(d.getMonth() + 1).padStart(2, '0');
        var day = String(d.getDate()).padStart(2, '0');
        return y + '-' + m + '-' + day;
    }

    function formatTime(value) {
        if (!value) return '--:--';
        return String(value).slice(0, 5);
    }

    function formatTimeRange(startTime, endTime) {
        return formatTime(startTime) + ' - ' + formatTime(endTime);
    }

    function getHoursBetweenTimes(startTime, endTime) {
        if (!startTime || !endTime) return 0;
        var s = String(startTime).split(':');
        var e = String(endTime).split(':');
        var sMin = (Number(s[0]) || 0) * 60 + (Number(s[1]) || 0);
        var eMin = (Number(e[0]) || 0) * 60 + (Number(e[1]) || 0);
        var diff = eMin - sMin;
        return diff > 0 ? diff / 60 : 0;
    }

    function calculateBookingTotal(pricePerHour, startTime, endTime) {
        var price = Number(pricePerHour) || 0;
        var hours = getHoursBetweenTimes(startTime, endTime);
        if (hours <= 0) return 0;
        var roundedHours = Math.round(hours * 100) / 100;
        return Math.round(price * roundedHours);
    }

    function parseAmenities(amenitiesText) {
        if (!amenitiesText) return [];
        return String(amenitiesText)
            .split(',')
            .map(function(item) { return item.trim(); })
            .filter(Boolean);
    }

    function normalizeBookingStatus(status) {
        var value = String(status || 'PENDING').trim().toUpperCase();
        if (value === 'DONE' || value === 'APPROVED') return 'CONFIRMED';
        return value;
    }

    function renderBookingStatusBadge(status) {
        var normalized = normalizeBookingStatus(status);
        var meta = BOOKING_STATUS_META[normalized] || { label: normalized, className: 'pending', icon: 'clock' };
        return '<span class="booking-status ' + meta.className + '"><i data-lucide="' + meta.icon + '" aria-hidden="true"></i><span>' + escapeHtml(meta.label) + '</span></span>';
    }

    function renderMatchStatusBadge(status) {
        var normalized = String(status || 'OPEN').trim().toUpperCase();
        var meta = MATCH_STATUS_META[normalized] || { label: normalized, className: 'pending', icon: 'circle' };
        return '<span class="status-badge ' + meta.className + '"><i data-lucide="' + meta.icon + '" aria-hidden="true"></i><span>' + escapeHtml(meta.label) + '</span></span>';
    }

    function refreshIcons(root) {
        if (!global.lucide || typeof global.lucide.createIcons !== 'function') {
            return;
        }
        var config = { attrs: { 'stroke-width': 1.8 } };
        if (root) {
            config.root = root;
        }
        global.lucide.createIcons(config);
    }

    function ensureToastRegion() {
        var region = document.getElementById('sporthub-toast-region');
        if (!region) {
            region = document.createElement('div');
            region.id = 'sporthub-toast-region';
            region.className = 'toast-region';
            region.setAttribute('aria-live', 'polite');
            region.setAttribute('aria-atomic', 'true');
            document.body.appendChild(region);
        }
        return region;
    }

    function showToast(message, type) {
        if (!message) return;
        var region = ensureToastRegion();
        var variant = type === 'error' ? 'error' : (type === 'info' ? 'info' : 'success');
        var iconName = variant === 'error' ? 'alert-circle' : (variant === 'info' ? 'info' : 'check-circle-2');

        var toast = document.createElement('div');
        toast.className = 'toast ' + variant;
        toast.setAttribute('role', 'status');
        toast.innerHTML =
            '<i data-lucide="' + iconName + '" class="toast-icon" aria-hidden="true"></i>' +
            '<div class="toast-body">' + escapeHtml(message) + '</div>' +
            '<button class="toast-close" type="button" aria-label="Đóng thông báo"><i data-lucide="x" aria-hidden="true"></i></button>';

        region.appendChild(toast);
        refreshIcons(toast);

        function removeToast() {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }

        toast.querySelector('.toast-close').addEventListener('click', removeToast);
        global.setTimeout(removeToast, 4500);
    }

    function openConfirmDialog(options) {
        var opts = options || {};
        return new Promise(function(resolve) {
            var existing = document.getElementById('sporthub-confirm-modal');
            if (existing && existing.parentNode) {
                existing.parentNode.removeChild(existing);
            }

            var modal = document.createElement('div');
            modal.id = 'sporthub-confirm-modal';
            modal.className = 'modal';
            modal.setAttribute('role', 'dialog');
            modal.setAttribute('aria-modal', 'true');
            modal.setAttribute('aria-labelledby', 'confirm-dialog-title');

            var confirmBtnClass = opts.danger ? 'btn btn-danger' : 'btn btn-primary';
            modal.innerHTML =
                '<div class="modal-content modal-sm" tabindex="-1">' +
                '  <div class="modal-header">' +
                '    <h2 id="confirm-dialog-title">' + escapeHtml(opts.title || 'Xác nhận thao tác') + '</h2>' +
                '    <button class="close-modal" type="button" data-confirm-cancel aria-label="Đóng"><i data-lucide="x" aria-hidden="true"></i></button>' +
                '  </div>' +
                '  <p class="secondary-text" style="margin-bottom:20px;">' + escapeHtml(opts.message || 'Bạn có chắc chắn muốn tiếp tục?') + '</p>' +
                '  <div class="modal-actions">' +
                '    <button class="' + confirmBtnClass + '" type="button" data-confirm-ok>' + escapeHtml(opts.confirmText || 'Xác nhận') + '</button>' +
                '    <button class="btn btn-secondary" type="button" data-confirm-cancel>' + escapeHtml(opts.cancelText || 'Hủy') + '</button>' +
                '  </div>' +
                '</div>';

            document.body.appendChild(modal);
            document.body.classList.add('modal-open');
            refreshIcons(modal);

            var prevFocus = document.activeElement;
            var okBtn = modal.querySelector('[data-confirm-ok]');
            if (okBtn) okBtn.focus();

            function cleanup(result) {
                document.removeEventListener('keydown', onKeydown);
                if (modal.parentNode) modal.parentNode.removeChild(modal);
                if (!document.querySelector('.modal:not(.hidden)')) {
                    document.body.classList.remove('modal-open');
                }
                if (prevFocus && typeof prevFocus.focus === 'function') {
                    prevFocus.focus();
                }
                resolve(result);
            }

            function onKeydown(e) {
                if (e.key === 'Escape') cleanup(false);
            }

            document.addEventListener('keydown', onKeydown);
            modal.addEventListener('click', function(e) {
                if (e.target === modal || (e.target.closest && e.target.closest('[data-confirm-cancel]'))) {
                    cleanup(false);
                } else if (e.target.closest && e.target.closest('[data-confirm-ok]')) {
                    cleanup(true);
                }
            });
        });
    }

    function trapModalFocus(event, container) {
        if (!container || event.key !== 'Tab') return;
        var focusable = container.querySelectorAll('button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])');
        if (!focusable.length) return;
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
            event.preventDefault();
            last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
            event.preventDefault();
            first.focus();
        }
    }

    // ===== Shared Navbar + Mobile Drawer + Auth Modal =====

    var authModalCallbacks = { onSuccess: null, onLogout: null };
    var authModalState = { tab: 'login', message: '', prevFocus: null };

    function ensureAuthModalDom() {
        if (document.getElementById('auth-modal')) {
            return;
        }

        var wrapper = document.createElement('div');
        wrapper.innerHTML =
            '<div id="auth-modal" class="modal hidden" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title" aria-describedby="auth-modal-description" aria-hidden="true">' +
            '  <div class="modal-content auth-modal-content" tabindex="-1">' +
            '    <div class="modal-header">' +
            '      <div>' +
            '        <span class="auth-brand-badge"><i data-lucide="shield-check" aria-hidden="true"></i><span>SportHub Account</span></span>' +
            '        <h2 id="auth-modal-title">Đăng nhập SportHub</h2>' +
            '        <p id="auth-modal-description" class="secondary-text">Đăng nhập để đặt sân, theo dõi lịch hoặc tham gia tìm đối thủ.</p>' +
            '      </div>' +
            '      <button class="close-modal" id="close-auth-modal-btn" type="button" aria-label="Đóng cửa sổ đăng nhập"><i data-lucide="x" aria-hidden="true"></i></button>' +
            '    </div>' +
            '    <div class="auth-tabs" role="tablist">' +
            '      <button id="auth-login-tab" class="auth-tab active" type="button" role="tab" aria-selected="true">Đăng nhập</button>' +
            '      <button id="auth-register-tab" class="auth-tab" type="button" role="tab" aria-selected="false">Đăng ký</button>' +
            '    </div>' +
            '    <form id="login-form" class="auth-form" novalidate>' +
            '      <label class="form-field"><span>Email</span><input id="login-email" type="email" autocomplete="email" placeholder="ten@example.com" required></label>' +
            '      <label class="form-field"><span>Mật khẩu</span><input id="login-password" type="password" autocomplete="current-password" placeholder="Nhập mật khẩu" required></label>' +
            '      <button class="btn btn-primary auth-submit" type="submit">Đăng nhập</button>' +
            '    </form>' +
            '    <form id="register-form" class="auth-form hidden" novalidate>' +
            '      <label class="form-field"><span>Họ và tên</span><input id="register-name" type="text" autocomplete="name" placeholder="Nguyễn Văn A" required></label>' +
            '      <label class="form-field"><span>Email</span><input id="register-email" type="email" autocomplete="email" placeholder="ten@example.com" required></label>' +
            '      <label class="form-field"><span>Số điện thoại</span><input id="register-phone" type="tel" autocomplete="tel" placeholder="0901 234 567" required></label>' +
            '      <label class="form-field"><span>Mật khẩu</span><input id="register-password" type="password" autocomplete="new-password" placeholder="Ít nhất 6 ký tự" required></label>' +
            '      <label class="form-field"><span>Xác nhận mật khẩu</span><input id="register-confirm-password" type="password" autocomplete="new-password" placeholder="Nhập lại mật khẩu" required></label>' +
            '      <button class="btn btn-primary auth-submit" type="submit">Tạo tài khoản</button>' +
            '    </form>' +
            '    <p id="auth-feedback" class="booking-feedback hidden" role="status"></p>' +
            '  </div>' +
            '</div>';

        document.body.appendChild(wrapper.firstElementChild);
        refreshIcons(document.getElementById('auth-modal'));
    }

    function showAuthFeedback(message, isError) {
        var el = document.getElementById('auth-feedback');
        if (!el) return;
        if (!message) {
            el.textContent = '';
            el.className = 'booking-feedback hidden';
            return;
        }
        el.textContent = message;
        el.className = 'booking-feedback ' + (isError ? 'error' : 'info');
    }

    function setAuthTab(tab) {
        authModalState.tab = tab === 'register' ? 'register' : 'login';
        var loginTab = document.getElementById('auth-login-tab');
        var regTab = document.getElementById('auth-register-tab');
        var loginForm = document.getElementById('login-form');
        var regForm = document.getElementById('register-form');
        var title = document.getElementById('auth-modal-title');
        var desc = document.getElementById('auth-modal-description');

        if (loginTab) {
            loginTab.classList.toggle('active', authModalState.tab === 'login');
            loginTab.setAttribute('aria-selected', String(authModalState.tab === 'login'));
        }
        if (regTab) {
            regTab.classList.toggle('active', authModalState.tab === 'register');
            regTab.setAttribute('aria-selected', String(authModalState.tab === 'register'));
        }
        if (loginForm) loginForm.classList.toggle('hidden', authModalState.tab !== 'login');
        if (regForm) regForm.classList.toggle('hidden', authModalState.tab !== 'register');
        if (title) title.textContent = authModalState.tab === 'register' ? 'Tạo tài khoản mới' : 'Đăng nhập SportHub';
        if (desc) {
            desc.textContent = authModalState.tab === 'register'
                ? 'Tạo tài khoản để quản lý lịch đặt sân và tham gia bảng xếp hạng Elo.'
                : 'Đăng nhập để đặt sân, theo dõi lịch hoặc tham gia tìm đối thủ.';
        }
        showAuthFeedback('', false);
    }

    function openAuthModal(tab, options) {
        ensureAuthModalDom();
        bindAuthModalEventsOnce();

        var modal = document.getElementById('auth-modal');
        var loginForm = document.getElementById('login-form');
        var regForm = document.getElementById('register-form');
        if (loginForm) loginForm.reset();
        if (regForm) regForm.reset();

        authModalState.prevFocus = document.activeElement;
        setAuthTab(tab || 'login');

        if (options && options.message) {
            showAuthFeedback(options.message, false);
        }

        if (modal) {
            modal.classList.remove('hidden');
            modal.setAttribute('aria-hidden', 'false');
        }
        document.body.classList.add('modal-open');

        global.setTimeout(function() {
            var target = authModalState.tab === 'register'
                ? document.getElementById('register-name')
                : document.getElementById('login-email');
            if (target) target.focus();
        }, 20);
    }

    function closeAuthModal() {
        var modal = document.getElementById('auth-modal');
        if (!modal || modal.classList.contains('hidden')) return;
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
        if (!document.querySelector('.modal:not(.hidden)')) {
            document.body.classList.remove('modal-open');
        }
        if (authModalState.prevFocus && typeof authModalState.prevFocus.focus === 'function') {
            authModalState.prevFocus.focus();
        }
    }

    var authEventsBound = false;
    function bindAuthModalEventsOnce() {
        if (authEventsBound) return;
        var modal = document.getElementById('auth-modal');
        if (!modal) return;
        authEventsBound = true;

        var closeBtn = document.getElementById('close-auth-modal-btn');
        var loginTab = document.getElementById('auth-login-tab');
        var regTab = document.getElementById('auth-register-tab');
        var loginForm = document.getElementById('login-form');
        var regForm = document.getElementById('register-form');

        if (closeBtn) closeBtn.addEventListener('click', closeAuthModal);
        if (loginTab) loginTab.addEventListener('click', function() { setAuthTab('login'); });
        if (regTab) regTab.addEventListener('click', function() { setAuthTab('register'); });

        modal.addEventListener('click', function(e) {
            if (e.target === modal) closeAuthModal();
        });

        document.addEventListener('keydown', function(e) {
            if (!modal.classList.contains('hidden')) {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    closeAuthModal();
                } else if (e.key === 'Tab') {
                    trapModalFocus(e, modal.querySelector('.modal-content'));
                }
            }
        });

        if (loginForm) {
            loginForm.addEventListener('submit', function(e) {
                e.preventDefault();
                var email = (document.getElementById('login-email').value || '').trim().toLowerCase();
                var password = document.getElementById('login-password').value || '';
                if (!email || !password) {
                    showAuthFeedback('Vui lòng nhập đầy đủ email và mật khẩu.', true);
                    return;
                }
                showAuthFeedback('Đang đăng nhập...', false);
                var submitBtn = loginForm.querySelector('button[type="submit"]');
                if (submitBtn) submitBtn.disabled = true;

                apiRequest('/auth/login', {
                    method: 'POST',
                    token: '',
                    body: JSON.stringify({ email: email, password: password })
                }).then(function(data) {
                    if (!data || !data.token || !data.user) {
                        throw new Error('Phản hồi đăng nhập không hợp lệ.');
                    }
                    var session = persistAuthSession(data.user, data.token);
                    closeAuthModal();
                    showToast('Đăng nhập thành công. Xin chào ' + session.currentUser.fullName + '!', 'success');
                    updateNavbarAuthUI();
                    if (typeof authModalCallbacks.onSuccess === 'function') {
                        authModalCallbacks.onSuccess(session);
                    }
                }).catch(function(err) {
                    showAuthFeedback(err.message || 'Email hoặc mật khẩu không chính xác.', true);
                }).then(function() {
                    if (submitBtn) submitBtn.disabled = false;
                });
            });
        }

        if (regForm) {
            regForm.addEventListener('submit', function(e) {
                e.preventDefault();
                var fullName = (document.getElementById('register-name').value || '').trim();
                var email = (document.getElementById('register-email').value || '').trim().toLowerCase();
                var phone = (document.getElementById('register-phone').value || '').trim();
                var password = document.getElementById('register-password').value || '';
                var confirmPassword = document.getElementById('register-confirm-password').value || '';

                if (!fullName || !email || !phone || !password || !confirmPassword) {
                    showAuthFeedback('Vui lòng điền đầy đủ thông tin đăng ký.', true);
                    return;
                }
                if (password.length < 6) {
                    showAuthFeedback('Mật khẩu phải có ít nhất 6 ký tự.', true);
                    return;
                }
                if (password !== confirmPassword) {
                    showAuthFeedback('Mật khẩu xác nhận không khớp.', true);
                    return;
                }

                showAuthFeedback('Đang tạo tài khoản...', false);
                var submitBtn = regForm.querySelector('button[type="submit"]');
                if (submitBtn) submitBtn.disabled = true;

                apiRequest('/auth/register', {
                    method: 'POST',
                    token: '',
                    body: JSON.stringify({
                        fullName: fullName,
                        email: email,
                        phone: phone,
                        password: password
                    })
                }).then(function(data) {
                    if (!data || !data.token || !data.user) {
                        throw new Error('Không thể tạo tài khoản.');
                    }
                    var session = persistAuthSession(data.user, data.token);
                    closeAuthModal();
                    showToast('Tạo tài khoản thành công!', 'success');
                    updateNavbarAuthUI();
                    if (typeof authModalCallbacks.onSuccess === 'function') {
                        authModalCallbacks.onSuccess(session);
                    }
                }).catch(function(err) {
                    showAuthFeedback(err.message || 'Không thể tạo tài khoản.', true);
                }).then(function() {
                    if (submitBtn) submitBtn.disabled = false;
                });
            });
        }
    }

    function updateNavbarAuthUI() {
        var session = loadAuthSession();
        var isAuth = !!(session.token && session.currentUser);
        var role = session.currentRole;
        var isAdminOrOwner = role === 'ADMIN' || role === 'OWNER';

        var loginBtns = document.querySelectorAll('[data-auth-action="login"]');
        var registerBtns = document.querySelectorAll('[data-auth-action="register"]');
        var logoutBtns = document.querySelectorAll('[data-auth-action="logout"]');
        var dashboardBtns = document.querySelectorAll('[data-auth-action="dashboard"]');
        var userPills = document.querySelectorAll('[data-user-pill]');

        Array.prototype.forEach.call(loginBtns, function(el) { el.classList.toggle('hidden', isAuth); });
        Array.prototype.forEach.call(registerBtns, function(el) { el.classList.toggle('hidden', isAuth); });
        Array.prototype.forEach.call(logoutBtns, function(el) { el.classList.toggle('hidden', !isAuth); });

        Array.prototype.forEach.call(dashboardBtns, function(el) {
            el.classList.toggle('hidden', !isAuth);
            var span = el.querySelector('span');
            if (span) {
                span.textContent = isAdminOrOwner ? 'Trang quản trị' : 'Lịch của tôi';
            }
            if (el.tagName === 'A') {
                el.setAttribute('href', isAdminOrOwner ? 'admin.html' : 'my-bookings.html');
            }
        });

        Array.prototype.forEach.call(userPills, function(pill) {
            pill.classList.toggle('hidden', !isAuth);
            var editButton = pill.nextElementSibling;
            if (editButton && editButton.hasAttribute('data-profile-edit')) {
                editButton.classList.toggle('hidden', !isAuth);
            }
            if (isAuth && session.currentUser) {
                var fullName = session.currentUser.fullName || 'Người dùng';
                var initials = fullName.trim().split(/\s+/).slice(-2).map(function(w) { return w.charAt(0).toUpperCase(); }).join('') || 'U';
                var avatarEl = pill.querySelector('.user-avatar');
                var nameEl = pill.querySelector('.user-name');
                var roleEl = pill.querySelector('.user-role');
                if (avatarEl) {
                    avatarEl.textContent = initials;
                    avatarEl.style.backgroundImage = '';
                    avatarEl.classList.remove('has-image');
                    if (session.currentUser.avatarUrl) {
                        var avatarImage = document.createElement('img');
                        avatarImage.src = resolveMediaUrl(session.currentUser.avatarUrl);
                        avatarImage.alt = '';
                        avatarImage.onload = function() {
                            avatarEl.textContent = '';
                            avatarEl.appendChild(avatarImage);
                            avatarEl.classList.add('has-image');
                        };
                    }
                }
                if (nameEl) nameEl.textContent = fullName;
                if (roleEl) roleEl.textContent = getRoleLabel(role);
            }
        });
    }

    function ensureProfileModalDom() {
        if (document.getElementById('profile-edit-modal')) return;
        var modal = document.createElement('div');
        modal.id = 'profile-edit-modal';
        modal.className = 'modal hidden';
        modal.setAttribute('role', 'dialog');
        modal.setAttribute('aria-modal', 'true');
        modal.setAttribute('aria-labelledby', 'profile-edit-title');
        modal.innerHTML =
            '<div class="modal-content profile-modal-content" tabindex="-1">' +
            '  <div class="modal-header"><div><span class="auth-brand-badge"><i data-lucide="user-round" aria-hidden="true"></i><span>SportHub Account</span></span><h2 id="profile-edit-title">Chỉnh sửa hồ sơ</h2><p class="secondary-text">Cập nhật thông tin cá nhân hiển thị trên SportHub.</p></div><button class="close-modal" type="button" data-profile-close aria-label="Đóng"><i data-lucide="x" aria-hidden="true"></i></button></div>' +
            '  <form id="profile-edit-form" class="profile-edit-form">' +
            '    <label class="profile-avatar-picker"><span id="profile-avatar-preview" class="profile-avatar-preview">U</span><span><strong>Ảnh đại diện</strong><small>JPG, PNG hoặc WebP · tối đa 2 MB</small><input id="profile-avatar-file" type="file" accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"></span></label>' +
            '    <div class="profile-form-grid">' +
            '      <label class="form-field"><span>Họ và tên</span><input id="profile-full-name" type="text" maxlength="100" required></label>' +
            '      <label class="form-field"><span>Email</span><input id="profile-email" type="email" disabled></label>' +
            '      <label class="form-field"><span>Số điện thoại</span><input id="profile-phone" type="tel" maxlength="20"></label>' +
            '      <label class="form-field"><span>Địa chỉ</span><input id="profile-address" type="text" maxlength="255"></label>' +
            '      <label class="form-field profile-bio-field"><span>Giới thiệu</span><textarea id="profile-bio" maxlength="500" rows="3" placeholder="Viết vài dòng giới thiệu về bạn"></textarea><small class="secondary-text">Tối đa 500 ký tự</small></label>' +
            '    </div>' +
            '    <p id="profile-edit-feedback" class="booking-feedback hidden" role="status"></p>' +
            '    <div class="modal-actions"><button id="profile-save-btn" class="btn btn-primary" type="submit">Lưu thay đổi</button><button class="btn btn-secondary" type="button" data-profile-close>Đóng</button></div>' +
            '  </form>' +
            '</div>';
        document.body.appendChild(modal);
        refreshIcons(modal);
    }

    function showProfileFeedback(message, isError) {
        var feedback = document.getElementById('profile-edit-feedback');
        if (!feedback) return;
        feedback.textContent = message || '';
        feedback.className = message ? 'booking-feedback ' + (isError ? 'error' : 'info') : 'booking-feedback hidden';
    }

    function showProfileAvatarPreview(url, fallbackName) {
        var preview = document.getElementById('profile-avatar-preview');
        if (!preview) return;
        preview.textContent = String(fallbackName || 'U').trim().split(/\s+/).slice(-2).map(function(part) { return part.charAt(0).toUpperCase(); }).join('') || 'U';
        preview.style.backgroundImage = '';
        if (url) {
            preview.style.backgroundImage = 'url("' + String(url).replace(/["\\]/g, '') + '")';
            preview.classList.add('has-image');
        } else {
            preview.classList.remove('has-image');
        }
    }

    function openProfileModal() {
        var session = loadAuthSession();
        if (!session.token || !session.currentUser) return;
        ensureProfileModalDom();
        var user = session.currentUser;
        document.getElementById('profile-full-name').value = user.fullName || '';
        document.getElementById('profile-email').value = user.email || '';
        document.getElementById('profile-phone').value = user.phone || '';
        document.getElementById('profile-address').value = user.address || '';
        document.getElementById('profile-bio').value = user.bio || '';
        document.getElementById('profile-avatar-file').value = '';
        showProfileAvatarPreview(user.avatarUrl ? resolveMediaUrl(user.avatarUrl) : '', user.fullName);
        showProfileFeedback('');
        var modal = document.getElementById('profile-edit-modal');
        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
        document.getElementById('profile-full-name').focus();
    }

    function closeProfileModal() {
        var modal = document.getElementById('profile-edit-modal');
        if (!modal) return;
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
        if (!document.querySelector('.modal:not(.hidden)')) document.body.classList.remove('modal-open');
    }

    function bindProfileModalEventsOnce() {
        var form = document.getElementById('profile-edit-form');
        if (!form || form.dataset.bound === 'true') return;
        form.dataset.bound = 'true';
        var fileInput = document.getElementById('profile-avatar-file');
        fileInput.addEventListener('change', function() {
            var file = fileInput.files && fileInput.files[0];
            if (!file) return;
            if (file.size > 2 * 1024 * 1024) {
                fileInput.value = '';
                showProfileFeedback('Ảnh đại diện không được vượt quá 2 MB.', true);
                return;
            }
            showProfileAvatarPreview(URL.createObjectURL(file), document.getElementById('profile-full-name').value);
        });

        form.addEventListener('submit', function(event) {
            event.preventDefault();
            var session = loadAuthSession();
            if (!session.token) return;
            var saveButton = document.getElementById('profile-save-btn');
            saveButton.disabled = true;
            showProfileFeedback('Đang lưu hồ sơ…');
            apiRequest('/auth/me/profile', {
                method: 'PUT',
                body: JSON.stringify({
                    fullName: document.getElementById('profile-full-name').value.trim(),
                    phone: document.getElementById('profile-phone').value.trim(),
                    address: document.getElementById('profile-address').value.trim(),
                    bio: document.getElementById('profile-bio').value.trim()
                })
            }).then(function(user) {
                persistAuthSession(user, session.token);
                updateNavbarAuthUI();
                var file = fileInput.files && fileInput.files[0];
                if (!file) return user;
                var body = new FormData();
                body.append('file', file);
                return apiRequest('/auth/me/avatar', { method: 'POST', body: body, isFormData: true });
            }).then(function(user) {
                persistAuthSession(user, session.token);
                updateNavbarAuthUI();
                closeProfileModal();
                showToast('Hồ sơ đã được cập nhật.', 'success');
            }).catch(function(error) {
                showProfileFeedback(error.message || 'Không thể cập nhật hồ sơ.', true);
            }).then(function() {
                saveButton.disabled = false;
            });
        });
    }

    function initSharedNavbar(options) {
        var opts = options || {};
        authModalCallbacks.onSuccess = opts.onAuthSuccess || null;
        authModalCallbacks.onLogout = opts.onLogout || null;

        ensureAuthModalDom();
        ensureProfileModalDom();
        bindAuthModalEventsOnce();
        bindProfileModalEventsOnce();
        Array.prototype.forEach.call(document.querySelectorAll('[data-user-pill]'), function(pill) {
            if (pill.nextElementSibling && pill.nextElementSibling.hasAttribute('data-profile-edit')) return;
            var button = document.createElement('button');
            button.type = 'button';
            button.className = 'profile-edit-trigger hidden';
            button.setAttribute('data-profile-edit', '');
            button.setAttribute('aria-label', 'Chỉnh sửa hồ sơ');
            button.title = 'Chỉnh sửa hồ sơ';
            button.innerHTML = '<i data-lucide="user-round-pen" aria-hidden="true"></i>';
            pill.insertAdjacentElement('afterend', button);
            refreshIcons(button);
        });
        updateNavbarAuthUI();

        var navbar = document.querySelector('.navbar');
        if (navbar) {
            var syncScrollState = function() {
                navbar.classList.toggle('is-scrolled', global.scrollY > 8);
            };
            syncScrollState();
            global.addEventListener('scroll', syncScrollState, { passive: true });
        }

        var drawer = document.getElementById('mobile-nav-drawer');
        var openDrawerBtn = document.getElementById('mobile-menu-open');
        var closeDrawerBtn = document.getElementById('mobile-menu-close');

        function closeDrawer() {
            if (!drawer) return;
            drawer.classList.add('hidden');
            drawer.setAttribute('aria-hidden', 'true');
            document.body.classList.remove('drawer-open');
        }

        if (openDrawerBtn && drawer) {
            openDrawerBtn.addEventListener('click', function() {
                drawer.classList.remove('hidden');
                drawer.setAttribute('aria-hidden', 'false');
                document.body.classList.add('drawer-open');
                if (closeDrawerBtn) closeDrawerBtn.focus();
            });
        }

        if (closeDrawerBtn) {
            closeDrawerBtn.addEventListener('click', closeDrawer);
        }

        if (drawer) {
            drawer.addEventListener('click', function(e) {
                if (e.target === drawer || (e.target.closest && e.target.closest('a'))) {
                    closeDrawer();
                }
            });
        }

        document.addEventListener('click', function(e) {
            var profileTrigger = e.target.closest ? e.target.closest('[data-profile-edit]') : null;
            if (profileTrigger) {
                openProfileModal();
                return;
            }
            if (e.target.closest && e.target.closest('[data-profile-close]')) {
                closeProfileModal();
                return;
            }
            var profileModal = document.getElementById('profile-edit-modal');
            if (profileModal && e.target === profileModal) {
                closeProfileModal();
                return;
            }
            var authTrigger = e.target.closest ? e.target.closest('[data-auth-action]') : null;
            if (!authTrigger) return;
            var action = authTrigger.getAttribute('data-auth-action');
            if (action === 'login') {
                closeDrawer();
                openAuthModal('login');
            } else if (action === 'register') {
                closeDrawer();
                openAuthModal('register');
            } else if (action === 'logout') {
                closeDrawer();
                clearAuthSession();
                updateNavbarAuthUI();
                showToast('Bạn đã đăng xuất.', 'info');
                if (typeof authModalCallbacks.onLogout === 'function') {
                    authModalCallbacks.onLogout();
                }
            } else if (action === 'dashboard' && authTrigger.tagName === 'BUTTON') {
                var session = loadAuthSession();
                var role = session.currentRole;
                window.location.href = (role === 'ADMIN' || role === 'OWNER') ? 'admin.html' : 'my-bookings.html';
            }
        });

        refreshIcons();
    }

    function syncCurrentUser() {
        var session = loadAuthSession();
        if (!session.token) {
            return Promise.resolve(null);
        }
        return apiRequest('/auth/me', { method: 'GET', token: session.token })
            .then(function(user) {
                if (!user) {
                    throw new Error('Invalid profile');
                }
                var updated = persistAuthSession(user, session.token);
                updateNavbarAuthUI();
                return updated;
            })
            .catch(function() {
                clearAuthSession();
                updateNavbarAuthUI();
                return null;
            });
    }

    global.SportHubShared = {
        AUTH_SESSION_STORAGE_KEY: AUTH_SESSION_STORAGE_KEY,
        SPORT_TYPES: SPORT_TYPES,
        BOOKING_STATUS_META: BOOKING_STATUS_META,
        MATCH_STATUS_META: MATCH_STATUS_META,
        SKILL_LEVEL_LABELS: SKILL_LEVEL_LABELS,
        escapeHtml: escapeHtml,
        normalizeRole: normalizeRole,
        getRoleLabel: getRoleLabel,
        normalizeUser: normalizeUser,
        loadAuthSession: loadAuthSession,
        persistAuthSession: persistAuthSession,
        clearAuthSession: clearAuthSession,
        createAuthHeaders: createAuthHeaders,
        apiRequest: apiRequest,
        resolveMediaUrl: resolveMediaUrl,
        getSportMeta: getSportMeta,
        getFieldFallbackSvgMarkup: getFieldFallbackSvgMarkup,
        renderFieldMediaMarkup: renderFieldMediaMarkup,
        formatCurrency: formatCurrency,
        formatDate: formatDate,
        formatDateForInput: formatDateForInput,
        formatTime: formatTime,
        formatTimeRange: formatTimeRange,
        getHoursBetweenTimes: getHoursBetweenTimes,
        calculateBookingTotal: calculateBookingTotal,
        parseAmenities: parseAmenities,
        normalizeBookingStatus: normalizeBookingStatus,
        renderBookingStatusBadge: renderBookingStatusBadge,
        renderMatchStatusBadge: renderMatchStatusBadge,
        refreshIcons: refreshIcons,
        showToast: showToast,
        openConfirmDialog: openConfirmDialog,
        trapModalFocus: trapModalFocus,
        openAuthModal: openAuthModal,
        closeAuthModal: closeAuthModal,
        updateNavbarAuthUI: updateNavbarAuthUI,
        initSharedNavbar: initSharedNavbar,
        syncCurrentUser: syncCurrentUser
    };
})(window);
