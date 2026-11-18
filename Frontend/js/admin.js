(function() {
    'use strict';

    var S = window.SportHubShared;

    var state = {
        currentUser: null,
        role: null,
        fields: [],
        bookings: [],
        revenueSummary: null,
        activeTab: 'overview',
        bookingStatusFilter: 'ALL',
        bookingSearch: '',
        bookingPage: 1,
        bookingPageSize: 10,
        fieldSearch: '',
        fieldSportFilter: '',
        editingFieldId: null,
        cancelingBooking: null
    };

    var el = {};

    document.addEventListener('DOMContentLoaded', initAdminPage);

    function initAdminPage() {
        cacheElements();
        S.initSharedNavbar({
            onAuthSuccess: verifyAndHydrate,
            onLogout: function() {
                denyAccess('Bạn đã đăng xuất. Vui lòng đăng nhập lại bằng tài khoản ADMIN hoặc OWNER.');
            }
        });
        bindEvents();
        verifyAndHydrate();
    }

    function cacheElements() {
        el.accessAlert = document.getElementById('admin-access-alert');
        el.accessText = document.getElementById('admin-access-text');
        el.workspace = document.getElementById('admin-workspace');
        el.profileName = document.getElementById('admin-profile-name');
        el.profileRole = document.getElementById('admin-profile-role');
        el.sessionText = document.getElementById('admin-session-text');
        el.pendingBadge = document.getElementById('admin-pending-badge');
        el.tabBookingsBtn = document.getElementById('admin-tab-bookings-btn');
        el.refreshBtn = document.getElementById('admin-refresh-btn');

        el.kpiGrid = document.getElementById('admin-kpi-grid');
        el.analyticsGrid = document.getElementById('admin-analytics-grid');
        el.overviewPendingPanel = document.getElementById('overview-pending-panel');
        el.revenue = document.getElementById('dashboard-revenue');
        el.bookings = document.getElementById('dashboard-bookings');
        el.pending = document.getElementById('dashboard-pending');
        el.confirmed = document.getElementById('dashboard-confirmed');
        el.chartStatusBars = document.getElementById('chart-status-bars');
        el.chartSportBars = document.getElementById('chart-sport-bars');
        el.overviewPendingBody = document.getElementById('overview-pending-body');

        el.bookingSearch = document.getElementById('admin-booking-search');
        el.bookingsBody = document.getElementById('bookings-table-body');
        el.bookingsPageInfo = document.getElementById('bookings-page-info');
        el.bookingsPrevPage = document.getElementById('bookings-prev-page');
        el.bookingsNextPage = document.getElementById('bookings-next-page');

        el.fieldSearch = document.getElementById('admin-field-search');
        el.fieldSportFilter = document.getElementById('admin-field-sport-filter');
        el.fieldsBody = document.getElementById('fields-table-body');

        el.openCreateFieldBtn = document.getElementById('open-create-field-btn');
        el.fieldsTabAddBtn = document.getElementById('fields-tab-add-btn');
        el.drawer = document.getElementById('field-drawer');
        el.closeDrawerBtn = document.getElementById('close-field-drawer');
        el.drawerTitle = document.getElementById('field-drawer-title');

        el.fieldForm = document.getElementById('field-form');
        el.fieldId = document.getElementById('field-id');
        el.fieldName = document.getElementById('field-name');
        el.fieldSport = document.getElementById('field-sport');
        el.fieldPrice = document.getElementById('field-price');
        el.fieldLocation = document.getElementById('field-location');
        el.fieldCity = document.getElementById('field-city');
        el.fieldProvince = document.getElementById('field-province');
        el.fieldCapacity = document.getElementById('field-capacity');
        el.fieldAvailable = document.getElementById('field-available');
        el.fieldAmenities = document.getElementById('field-amenities');
        el.fieldImageUrl = document.getElementById('field-image-url');
        el.fieldImageFile = document.getElementById('field-image-file');
        el.fieldImagePreview = document.getElementById('field-image-preview');
        el.fieldDescription = document.getElementById('field-description');
        el.fieldFormFeedback = document.getElementById('field-form-feedback');
        el.fieldSaveBtn = document.getElementById('field-save-btn');
        el.fieldResetBtn = document.getElementById('field-form-reset');

        el.cancelModal = document.getElementById('admin-cancel-modal');
        el.cancelSummary = document.getElementById('admin-cancel-summary');
        el.cancelForm = document.getElementById('admin-cancel-form');
        el.cancelReason = document.getElementById('admin-cancel-reason');
        el.cancelFeedback = document.getElementById('admin-cancel-feedback');
        el.cancelSubmit = document.getElementById('admin-cancel-submit');
    }

    function bindEvents() {
        Array.prototype.forEach.call(document.querySelectorAll('[data-admin-tab]'), function(btn) {
            btn.addEventListener('click', function() {
                switchTab(btn.getAttribute('data-admin-tab'));
            });
        });

        Array.prototype.forEach.call(document.querySelectorAll('[data-switch-tab]'), function(btn) {
            btn.addEventListener('click', function() {
                switchTab(btn.getAttribute('data-switch-tab'));
            });
        });

        if (el.refreshBtn) {
            el.refreshBtn.addEventListener('click', loadAdminData);
        }

        Array.prototype.forEach.call(document.querySelectorAll('[data-booking-status]'), function(btn) {
            btn.addEventListener('click', function() {
                state.bookingStatusFilter = btn.getAttribute('data-booking-status') || 'ALL';
                state.bookingPage = 1;
                Array.prototype.forEach.call(document.querySelectorAll('[data-booking-status]'), function(t) {
                    t.classList.toggle('active', t === btn);
                });
                renderBookingsTable();
            });
        });

        if (el.bookingSearch) {
            el.bookingSearch.addEventListener('input', function() {
                state.bookingSearch = this.value;
                state.bookingPage = 1;
                renderBookingsTable();
            });
        }

        if (el.bookingsPrevPage) {
            el.bookingsPrevPage.addEventListener('click', function() {
                if (state.bookingPage > 1) {
                    state.bookingPage -= 1;
                    renderBookingsTable();
                }
            });
        }

        if (el.bookingsNextPage) {
            el.bookingsNextPage.addEventListener('click', function() {
                state.bookingPage += 1;
                renderBookingsTable();
            });
        }

        if (el.fieldSearch) {
            el.fieldSearch.addEventListener('input', function() {
                state.fieldSearch = this.value;
                renderFieldsTable();
            });
        }

        if (el.fieldSportFilter) {
            el.fieldSportFilter.addEventListener('change', function() {
                state.fieldSportFilter = this.value;
                renderFieldsTable();
            });
        }

        if (el.openCreateFieldBtn) {
            el.openCreateFieldBtn.addEventListener('click', openCreateFieldDrawer);
        }
        if (el.fieldsTabAddBtn) {
            el.fieldsTabAddBtn.addEventListener('click', openCreateFieldDrawer);
        }
        if (el.closeDrawerBtn) {
            el.closeDrawerBtn.addEventListener('click', closeFieldDrawer);
        }
        if (el.drawer) {
            el.drawer.addEventListener('click', function(e) {
                if (e.target === el.drawer) closeFieldDrawer();
            });
        }

        if (el.fieldForm) el.fieldForm.addEventListener('submit', handleFieldFormSubmit);
        if (el.fieldResetBtn) el.fieldResetBtn.addEventListener('click', resetFieldForm);
        if (el.fieldImageFile) el.fieldImageFile.addEventListener('change', handleFileSelection);
        if (el.fieldImageUrl) {
            el.fieldImageUrl.addEventListener('input', function() {
                renderImagePreview(this.value);
            });
        }

        if (el.fieldAmenities) {
            el.fieldAmenities.addEventListener('input', syncAmenityPresetButtons);
        }

        Array.prototype.forEach.call(document.querySelectorAll('.amenity-preset-btn'), function(btn) {
            btn.addEventListener('click', function() {
                toggleAmenityPreset(btn.getAttribute('data-amenity'));
            });
        });

        if (el.cancelForm) el.cancelForm.addEventListener('submit', handleAdminCancelSubmit);
        if (el.cancelModal) {
            el.cancelModal.addEventListener('click', function(e) {
                if (e.target === el.cancelModal || (e.target.closest && e.target.closest('[data-close-admin-cancel]'))) {
                    closeCancelModal();
                }
            });
        }

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeFieldDrawer();
                closeCancelModal();
            }
        });
    }

    function verifyAndHydrate() {
        var session = S.loadAuthSession();
        if (!session.token) {
            denyAccess('Không tìm thấy phiên đăng nhập. Vui lòng đăng nhập bằng tài khoản ADMIN hoặc OWNER.');
            return;
        }

        S.apiRequest('/auth/me', { method: 'GET', token: session.token })
            .then(function(user) {
                var role = S.normalizeRole(user && user.role);
                if (!user || (role !== 'ADMIN' && role !== 'OWNER')) {
                    throw new Error('Tài khoản hiện tại (' + S.getRoleLabel(role) + ') không có quyền truy cập trang quản trị.');
                }

                S.persistAuthSession(user, session.token);
                S.updateNavbarAuthUI();
                state.currentUser = user;
                state.role = role;

                if (el.accessAlert) el.accessAlert.classList.add('hidden');
                if (el.workspace) el.workspace.classList.remove('hidden');
                if (el.profileName) el.profileName.textContent = user.fullName || user.email;
                if (el.profileRole) el.profileRole.textContent = S.getRoleLabel(role);
                if (el.sessionText) {
                    el.sessionText.textContent = 'Đang đăng nhập: ' + (user.fullName || user.email) + ' · Quyền ' + S.getRoleLabel(role);
                }

                configureRoleVisibility(role);
                loadAdminData();
            })
            .catch(function(err) {
                denyAccess(err.message || 'Không thể xác minh quyền quản trị.');
            });
    }

    function configureRoleVisibility(role) {
        var isAdmin = role === 'ADMIN';
        if (el.tabBookingsBtn) el.tabBookingsBtn.classList.toggle('hidden', !isAdmin);
        if (el.kpiGrid) el.kpiGrid.classList.toggle('hidden', !isAdmin);
        if (el.analyticsGrid) el.analyticsGrid.classList.toggle('hidden', !isAdmin);
        if (el.overviewPendingPanel) el.overviewPendingPanel.classList.toggle('hidden', !isAdmin);

        if (!isAdmin) {
            switchTab('fields');
        }
    }

    function denyAccess(message) {
        if (el.accessText) el.accessText.textContent = message;
        if (el.accessAlert) el.accessAlert.classList.remove('hidden');
        if (el.workspace) el.workspace.classList.add('hidden');
    }

    function switchTab(tabName) {
        state.activeTab = tabName || 'overview';
        Array.prototype.forEach.call(document.querySelectorAll('[data-admin-tab]'), function(btn) {
            var active = btn.getAttribute('data-admin-tab') === state.activeTab;
            btn.classList.toggle('active', active);
            btn.setAttribute('aria-selected', String(active));
        });

        var panels = {
            overview: document.getElementById('admin-panel-overview'),
            bookings: document.getElementById('admin-panel-bookings'),
            fields: document.getElementById('admin-panel-fields')
        };

        Object.keys(panels).forEach(function(key) {
            if (panels[key]) {
                panels[key].classList.toggle('hidden', key !== state.activeTab);
            }
        });
    }

    function loadAdminData() {
        var isAdmin = state.role === 'ADMIN';
        var requests = [S.apiRequest('/fields', { method: 'GET' })];

        if (isAdmin) {
            requests.push(S.apiRequest('/admin/revenue/summary', { method: 'GET' }));
            requests.push(S.apiRequest('/admin/bookings', { method: 'GET' }));
        }

        Promise.all(requests)
            .then(function(results) {
                var allFields = Array.isArray(results[0]) ? results[0] : [];
                state.fields = isAdmin
                    ? allFields
                    : allFields.filter(function(f) { return String(f.ownerId) === String(state.currentUser.id); });

                if (isAdmin) {
                    state.revenueSummary = results[1] || {};
                    state.bookings = Array.isArray(results[2]) ? results[2] : [];
                    renderSummary();
                    renderAnalyticsCharts();
                    renderOverviewPending();
                    renderBookingsTable();
                }
                renderFieldsTable();
            })
            .catch(function(err) {
                S.showToast(err.message || 'Không thể tải dữ liệu quản trị.', 'error');
            });
    }

    function renderSummary() {
        var summary = state.revenueSummary || {};
        var pendingCount = summary.pendingBookings != null
            ? summary.pendingBookings
            : state.bookings.filter(function(b) { return S.normalizeBookingStatus(b.status) === 'PENDING'; }).length;

        if (el.revenue) el.revenue.textContent = S.formatCurrency(summary.totalRevenue || 0) + ' đ';
        if (el.bookings) el.bookings.textContent = String(summary.totalBookings || 0);
        if (el.pending) el.pending.textContent = String(pendingCount);
        if (el.confirmed) el.confirmed.textContent = String(summary.confirmedBookings || 0);
        if (el.pendingBadge) el.pendingBadge.textContent = String(pendingCount);
    }

    function renderAnalyticsCharts() {
        if (el.chartStatusBars) {
            var counts = { CONFIRMED: 0, PENDING: 0, HOLD: 0, CANCELLED: 0 };
            state.bookings.forEach(function(b) {
                var st = S.normalizeBookingStatus(b.status);
                if (st === 'COMPLETED') st = 'CONFIRMED';
                if (Object.prototype.hasOwnProperty.call(counts, st)) counts[st] += 1;
            });
            var total = Math.max(1, state.bookings.length);
            var statusRows = [
                { label: 'Đã xác nhận', value: counts.CONFIRMED, cls: '' },
                { label: 'Chờ duyệt', value: counts.PENDING, cls: 'warning' },
                { label: 'Đang giữ chỗ', value: counts.HOLD, cls: 'info' },
                { label: 'Đã hủy', value: counts.CANCELLED, cls: 'danger' }
            ];
            el.chartStatusBars.innerHTML = statusRows.map(function(row) {
                var pct = Math.round((row.value / total) * 100);
                return '<div class="chart-bar-row">' +
                    '  <span class="chart-bar-label">' + S.escapeHtml(row.label) + '</span>' +
                    '  <div class="chart-bar-track"><div class="chart-bar-fill ' + row.cls + '" style="width:' + pct + '%;"></div></div>' +
                    '  <span class="chart-bar-value">' + row.value + ' (' + pct + '%)</span>' +
                    '</div>';
            }).join('');
        }

        if (el.chartSportBars) {
            var revBySport = {};
            state.bookings.forEach(function(b) {
                if (S.normalizeBookingStatus(b.status) === 'CANCELLED') return;
                var sport = (b.field && b.field.sportType) || 'OTHER';
                revBySport[sport] = (revBySport[sport] || 0) + Number(b.totalPrice || 0);
            });
            var entries = Object.keys(revBySport).map(function(k) {
                return { sport: k, label: S.getSportMeta(k).label, value: revBySport[k] };
            }).sort(function(a, b) { return b.value - a.value; });

            if (!entries.length) {
                el.chartSportBars.innerHTML = '<p class="secondary-text">Chưa có dữ liệu doanh thu theo môn.</p>';
            } else {
                var maxRev = Math.max(1, entries[0].value);
                el.chartSportBars.innerHTML = entries.map(function(entry) {
                    var pct = Math.round((entry.value / maxRev) * 100);
                    return '<div class="chart-bar-row">' +
                        '  <span class="chart-bar-label">' + S.escapeHtml(entry.label) + '</span>' +
                        '  <div class="chart-bar-track"><div class="chart-bar-fill" style="width:' + pct + '%;"></div></div>' +
                        '  <span class="chart-bar-value">' + S.formatCurrency(entry.value) + ' đ</span>' +
                        '</div>';
                }).join('');
            }
        }
    }

    function renderOverviewPending() {
        if (!el.overviewPendingBody) return;
        var pendingList = state.bookings.filter(function(b) {
            var st = S.normalizeBookingStatus(b.status);
            return st === 'PENDING' || st === 'HOLD';
        }).slice(0, 5);

        if (!pendingList.length) {
            el.overviewPendingBody.innerHTML = '<tr><td colspan="7" class="table-empty">Không có booking nào đang chờ duyệt.</td></tr>';
            return;
        }

        el.overviewPendingBody.innerHTML = pendingList.map(buildBookingRowHtml).join('');
        bindBookingRowActions(el.overviewPendingBody);
        S.refreshIcons(el.overviewPendingBody);
    }

    function renderBookingsTable() {
        if (!el.bookingsBody) return;
        var q = (state.bookingSearch || '').trim().toLowerCase();

        var filtered = state.bookings.filter(function(b) {
            var status = S.normalizeBookingStatus(b.status);
            if (state.bookingStatusFilter !== 'ALL' && status !== state.bookingStatusFilter) {
                return false;
            }
            if (q) {
                var user = b.user || {};
                var field = b.field || {};
                var hay = [user.fullName, user.email, b.customerPhone, field.name].join(' ').toLowerCase();
                if (hay.indexOf(q) === -1) return false;
            }
            return true;
        });

        var totalItems = filtered.length;
        var totalPages = Math.max(1, Math.ceil(totalItems / state.bookingPageSize));
        if (state.bookingPage > totalPages) state.bookingPage = totalPages;
        var startIdx = (state.bookingPage - 1) * state.bookingPageSize;
        var pageItems = filtered.slice(startIdx, startIdx + state.bookingPageSize);

        if (el.bookingsPageInfo) {
            el.bookingsPageInfo.textContent = totalItems
                ? ('Hiển thị ' + (startIdx + 1) + '–' + (startIdx + pageItems.length) + ' / ' + totalItems + ' booking (Trang ' + state.bookingPage + '/' + totalPages + ')')
                : '0 kết quả';
        }
        if (el.bookingsPrevPage) el.bookingsPrevPage.disabled = state.bookingPage <= 1;
        if (el.bookingsNextPage) el.bookingsNextPage.disabled = state.bookingPage >= totalPages;

        if (!pageItems.length) {
            el.bookingsBody.innerHTML = '<tr><td colspan="7" class="table-empty">Không có booking nào khớp bộ lọc.</td></tr>';
            return;
        }

        el.bookingsBody.innerHTML = pageItems.map(buildBookingRowHtml).join('');
        bindBookingRowActions(el.bookingsBody);
        S.refreshIcons(el.bookingsBody);
    }

    function getInitials(name) {
        var parts = String(name || 'K').trim().split(/\s+/).filter(Boolean);
        if (!parts.length) return 'K';
        return parts.slice(-2).map(function(w) { return w.charAt(0).toUpperCase(); }).join('');
    }

    function buildBookingRowHtml(b) {
        var user = b.user || {};
        var field = b.field || {};
        var status = S.normalizeBookingStatus(b.status);
        var canConfirm = status === 'PENDING' || status === 'HOLD';
        var canCancel = status !== 'CANCELLED' && status !== 'COMPLETED';
        var customerName = user.fullName || user.email || 'Khách';

        var actionsHtml = '';
        if (canConfirm) {
            actionsHtml += '<button class="btn btn-primary btn-compact" type="button" data-action="confirm-booking" data-id="' + S.escapeHtml(b.id) + '">Xác nhận</button>';
            actionsHtml += '<button class="btn btn-danger-soft btn-compact" type="button" data-action="reject-booking" data-id="' + S.escapeHtml(b.id) + '">Từ chối</button>';
        }
        if (canCancel) {
            actionsHtml += '<button class="btn btn-danger-soft btn-compact" type="button" data-action="cancel-booking" data-id="' + S.escapeHtml(b.id) + '">Hủy</button>';
        }
        if (!actionsHtml) {
            actionsHtml = '<span class="secondary-text">Đã đóng</span>';
        }

        return '<tr>' +
            '<td><div class="admin-customer-cell">' +
            '  <span class="admin-customer-avatar">' + S.escapeHtml(getInitials(customerName)) + '</span>' +
            '  <div><strong>' + S.escapeHtml(customerName) + '</strong>' +
            (b.customerPhone ? '<div class="admin-subtext tabular-nums">' + S.escapeHtml(b.customerPhone) + '</div>' : '') +
            '  </div>' +
            '</div></td>' +
            '<td><strong>' + S.escapeHtml(field.name || 'Sân thể thao') + '</strong></td>' +
            '<td class="tabular-nums">' + S.escapeHtml(S.formatDate(b.bookingDate)) + '</td>' +
            '<td class="tabular-nums">' + S.escapeHtml(S.formatTimeRange(b.startTime, b.endTime)) + '</td>' +
            '<td>' + S.renderBookingStatusBadge(status) + '</td>' +
            '<td class="tabular-nums"><strong>' + S.escapeHtml(S.formatCurrency(b.totalPrice || 0)) + ' đ</strong></td>' +
            '<td><div class="admin-actions-cell">' + actionsHtml + '</div></td>' +
            '</tr>';
    }

    function bindBookingRowActions(container) {
        Array.prototype.forEach.call(container.querySelectorAll('[data-action="confirm-booking"]'), function(btn) {
            btn.addEventListener('click', function() {
                confirmBooking(btn.getAttribute('data-id'), btn);
            });
        });

        Array.prototype.forEach.call(container.querySelectorAll('[data-action="reject-booking"]'), function(btn) {
            btn.addEventListener('click', function() {
                var reason = window.prompt('Nhập lý do từ chối booking:');
                if (reason === null) return;
                if (reason.trim().length < 5) {
                    S.showToast('Lý do cần có ít nhất 5 ký tự.', 'error');
                    return;
                }
                btn.disabled = true;
                S.apiRequest('/admin/bookings/' + encodeURIComponent(btn.getAttribute('data-id')) + '/reject', {
                    method: 'PATCH', body: JSON.stringify({ reason: reason.trim() })
                }).then(function() {
                    S.showToast('Đã từ chối booking và gửi thông báo cho khách.', 'success');
                    loadAdminData();
                }).catch(function(err) {
                    S.showToast(err.message || 'Không thể từ chối booking.', 'error');
                    btn.disabled = false;
                });
            });
        });

        Array.prototype.forEach.call(container.querySelectorAll('[data-action="cancel-booking"]'), function(btn) {
            btn.addEventListener('click', function() {
                var id = btn.getAttribute('data-id');
                var booking = state.bookings.find(function(item) { return String(item.id) === String(id); });
                if (booking) openAdminCancelModal(booking);
            });
        });
    }

    function confirmBooking(bookingId, btn) {
        if (btn) btn.disabled = true;
        S.apiRequest('/admin/bookings/' + encodeURIComponent(bookingId) + '/confirm', { method: 'PATCH' })
            .then(function() {
                S.showToast('Đã xác nhận booking #' + bookingId, 'success');
                loadAdminData();
            })
            .catch(function(err) {
                S.showToast(err.message || 'Không thể xác nhận booking.', 'error');
                if (btn) btn.disabled = false;
            });
    }

    function openAdminCancelModal(booking) {
        state.cancelingBooking = booking;
        var user = booking.user || {};
        var field = booking.field || {};
        if (el.cancelSummary) {
            el.cancelSummary.textContent = (user.fullName || 'Khách') + ' · ' + (field.name || 'Sân') + ' · ' + S.formatDate(booking.bookingDate) + ' (' + S.formatTimeRange(booking.startTime, booking.endTime) + ')';
        }
        if (el.cancelReason) el.cancelReason.value = '';
        if (el.cancelFeedback) el.cancelFeedback.className = 'booking-feedback hidden';
        if (el.cancelModal) {
            el.cancelModal.classList.remove('hidden');
            el.cancelModal.setAttribute('aria-hidden', 'false');
            document.body.classList.add('modal-open');
            window.setTimeout(function() { if (el.cancelReason) el.cancelReason.focus(); }, 20);
        }
    }

    function closeCancelModal() {
        if (!el.cancelModal || el.cancelModal.classList.contains('hidden')) return;
        el.cancelModal.classList.add('hidden');
        el.cancelModal.setAttribute('aria-hidden', 'true');
        state.cancelingBooking = null;
        if (!document.querySelector('.modal:not(.hidden)')) {
            document.body.classList.remove('modal-open');
        }
    }

    function handleAdminCancelSubmit(e) {
        e.preventDefault();
        var booking = state.cancelingBooking;
        if (!booking) return;

        var reason = el.cancelReason ? el.cancelReason.value.trim() : '';
        if (reason.length < 5) {
            if (el.cancelFeedback) {
                el.cancelFeedback.textContent = 'Vui lòng nhập lý do hủy (ít nhất 5 ký tự).';
                el.cancelFeedback.className = 'booking-feedback error';
            }
            return;
        }

        if (el.cancelSubmit) el.cancelSubmit.disabled = true;
        S.apiRequest('/bookings/' + encodeURIComponent(booking.id) + '/cancel', {
            method: 'PATCH',
            body: JSON.stringify({ reason: reason })
        })
            .then(function() {
                closeCancelModal();
                S.showToast('Đã hủy booking #' + booking.id, 'info');
                loadAdminData();
            })
            .catch(function(err) {
                if (el.cancelFeedback) {
                    el.cancelFeedback.textContent = err.message || 'Không thể hủy booking.';
                    el.cancelFeedback.className = 'booking-feedback error';
                }
            })
            .then(function() {
                if (el.cancelSubmit) el.cancelSubmit.disabled = false;
            });
    }

    // ===== Fields Management & Slide-over Drawer =====

    function renderFieldsTable() {
        if (!el.fieldsBody) return;
        var q = (state.fieldSearch || '').trim().toLowerCase();
        var sport = state.fieldSportFilter || '';
        var canDelete = state.role === 'ADMIN';

        var filtered = state.fields.filter(function(f) {
            if (sport && String(f.sportType || '').toUpperCase() !== sport) return false;
            if (q) {
                var hay = [f.name, f.location, f.city, f.amenities].join(' ').toLowerCase();
                if (hay.indexOf(q) === -1) return false;
            }
            return true;
        });

        if (!filtered.length) {
            el.fieldsBody.innerHTML = '<tr><td colspan="6" class="table-empty">Không có sân nào phù hợp.</td></tr>';
            return;
        }

        el.fieldsBody.innerHTML = filtered.map(function(field) {
            var sportMeta = S.getSportMeta(field.sportType);
            var statusHtml = field.isAvailable !== false
                ? '<span class="status-badge success"><i data-lucide="check-circle-2" aria-hidden="true"></i><span>Mở đặt</span></span>'
                : '<span class="status-badge error"><i data-lucide="ban" aria-hidden="true"></i><span>Tạm ngưng</span></span>';

            return '<tr>' +
                '<td class="tabular-nums"><span class="admin-id-pill">#' + S.escapeHtml(field.id) + '</span></td>' +
                '<td><strong>' + S.escapeHtml(field.name) + '</strong><div class="admin-subtext">' + S.escapeHtml(field.location || '') + '</div></td>' +
                '<td><span class="match-chip">' + S.escapeHtml(sportMeta.label) + '</span></td>' +
                '<td class="tabular-nums"><strong>' + S.formatCurrency(field.pricePerHour || 0) + ' đ</strong></td>' +
                '<td>' + statusHtml + '</td>' +
                '<td><div class="admin-actions-cell">' +
                '  <button class="btn btn-secondary btn-compact" type="button" data-field-edit="' + S.escapeHtml(field.id) + '">Sửa</button>' +
                (canDelete ? '<button class="btn btn-danger-soft btn-compact" type="button" data-field-delete="' + S.escapeHtml(field.id) + '">Xóa</button>' : '') +
                '</div></td>' +
                '</tr>';
        }).join('');

        Array.prototype.forEach.call(el.fieldsBody.querySelectorAll('[data-field-edit]'), function(btn) {
            btn.addEventListener('click', function() {
                openEditFieldDrawer(btn.getAttribute('data-field-edit'));
            });
        });

        Array.prototype.forEach.call(el.fieldsBody.querySelectorAll('[data-field-delete]'), function(btn) {
            btn.addEventListener('click', function() {
                confirmDeleteField(btn.getAttribute('data-field-delete'));
            });
        });

        S.refreshIcons(el.fieldsBody);
    }

    function openCreateFieldDrawer() {
        resetFieldForm();
        if (el.drawerTitle) el.drawerTitle.textContent = 'Thêm sân mới';
        openFieldDrawer();
    }

    function openEditFieldDrawer(fieldId) {
        var field = state.fields.find(function(f) { return String(f.id) === String(fieldId); });
        if (!field) return;

        state.editingFieldId = field.id;
        if (el.drawerTitle) el.drawerTitle.textContent = 'Chỉnh sửa sân #' + field.id;
        if (el.fieldId) el.fieldId.value = field.id || '';
        if (el.fieldName) el.fieldName.value = field.name || '';
        if (el.fieldSport) el.fieldSport.value = field.sportType || 'FOOTBALL';
        if (el.fieldPrice) el.fieldPrice.value = field.pricePerHour || '';
        if (el.fieldLocation) el.fieldLocation.value = field.location || '';
        if (el.fieldCity) el.fieldCity.value = field.city || '';
        if (el.fieldProvince) el.fieldProvince.value = field.province || '';
        if (el.fieldCapacity) el.fieldCapacity.value = field.capacity || '';
        if (el.fieldAmenities) el.fieldAmenities.value = field.amenities || '';
        if (el.fieldImageUrl) el.fieldImageUrl.value = field.imageUrl || '';
        if (el.fieldImageFile) el.fieldImageFile.value = '';
        if (el.fieldDescription) el.fieldDescription.value = field.description || '';
        if (el.fieldAvailable) el.fieldAvailable.checked = field.isAvailable !== false;

        syncAmenityPresetButtons();
        renderImagePreview(field.imageUrl || '');
        showFormFeedback('', false);
        openFieldDrawer();
    }

    function openFieldDrawer() {
        if (!el.drawer) return;
        el.drawer.classList.remove('hidden');
        el.drawer.setAttribute('aria-hidden', 'false');
        document.body.classList.add('drawer-open');
        window.setTimeout(function() {
            if (el.fieldName) el.fieldName.focus();
        }, 20);
    }

    function closeFieldDrawer() {
        if (!el.drawer || el.drawer.classList.contains('hidden')) return;
        el.drawer.classList.add('hidden');
        el.drawer.setAttribute('aria-hidden', 'true');
        document.body.classList.remove('drawer-open');
    }

    function resetFieldForm() {
        state.editingFieldId = null;
        if (el.fieldForm) el.fieldForm.reset();
        if (el.fieldId) el.fieldId.value = '';
        if (el.fieldSport) el.fieldSport.value = 'FOOTBALL';
        if (el.fieldAvailable) el.fieldAvailable.checked = true;
        if (el.fieldImageFile) el.fieldImageFile.value = '';
        syncAmenityPresetButtons();
        renderImagePreview('');
        showFormFeedback('', false);
    }

    function toggleAmenityPreset(amenity) {
        if (!el.fieldAmenities || !amenity) return;
        var list = S.parseAmenities(el.fieldAmenities.value);
        var idx = list.indexOf(amenity);
        if (idx === -1) {
            list.push(amenity);
        } else {
            list.splice(idx, 1);
        }
        el.fieldAmenities.value = list.join(', ');
        syncAmenityPresetButtons();
    }

    function syncAmenityPresetButtons() {
        if (!el.fieldAmenities) return;
        var current = S.parseAmenities(el.fieldAmenities.value);
        Array.prototype.forEach.call(document.querySelectorAll('.amenity-preset-btn'), function(btn) {
            var val = btn.getAttribute('data-amenity');
            btn.classList.toggle('is-selected', current.indexOf(val) !== -1);
        });
    }

    function handleFileSelection(e) {
        var file = e.target && e.target.files ? e.target.files[0] : null;
        if (!file) return;
        if (!/^image\//.test(file.type)) {
            showFormFeedback('Vui lòng chọn tệp ảnh hợp lệ (.jpg, .png, .webp).', true);
            e.target.value = '';
            return;
        }
        if (file.size > 5 * 1024 * 1024) {
            showFormFeedback('Dung lượng ảnh không được vượt quá 5MB.', true);
            e.target.value = '';
            return;
        }
        var reader = new FileReader();
        reader.onload = function(loadEvent) {
            renderImagePreview(loadEvent.target.result);
        };
        reader.readAsDataURL(file);
    }

    function renderImagePreview(url) {
        if (!el.fieldImagePreview) return;
        var resolved = S.resolveMediaUrl(url);
        if (!resolved) {
            el.fieldImagePreview.innerHTML = '';
            el.fieldImagePreview.classList.add('hidden');
            return;
        }
        el.fieldImagePreview.innerHTML = '<img src="' + S.escapeHtml(resolved) + '" alt="Ảnh xem trước sân">';
        el.fieldImagePreview.classList.remove('hidden');
    }

    function handleFieldFormSubmit(e) {
        e.preventDefault();

        var name = valueOf(el.fieldName);
        var sportType = valueOf(el.fieldSport);
        var location = valueOf(el.fieldLocation);
        var price = Number(valueOf(el.fieldPrice) || 0);
        var capacity = parseOptionalInt(valueOf(el.fieldCapacity));

        if (!name || !sportType || !location || !(price > 0)) {
            showFormFeedback('Vui lòng nhập đầy đủ Tên sân, Môn thể thao, Địa chỉ và Giá/giờ lớn hơn 0.', true);
            return;
        }

        var payload = {
            name: name,
            sportType: sportType,
            location: location,
            city: valueOf(el.fieldCity) || null,
            province: valueOf(el.fieldProvince) || null,
            pricePerHour: price,
            capacity: capacity,
            amenities: valueOf(el.fieldAmenities) || null,
            imageUrl: valueOf(el.fieldImageUrl) || null,
            description: valueOf(el.fieldDescription) || null,
            isAvailable: !!(el.fieldAvailable && el.fieldAvailable.checked)
        };

        var fieldId = state.editingFieldId;
        var method = fieldId ? 'PUT' : 'POST';
        var path = fieldId ? ('/fields/' + encodeURIComponent(fieldId)) : '/fields';

        showFormFeedback(fieldId ? 'Đang cập nhật sân...' : 'Đang tạo sân mới...', false);
        if (el.fieldSaveBtn) el.fieldSaveBtn.disabled = true;

        S.apiRequest(path, {
            method: method,
            body: JSON.stringify(payload)
        })
            .then(function(savedField) {
                var imageFile = el.fieldImageFile && el.fieldImageFile.files ? el.fieldImageFile.files[0] : null;
                if (imageFile && savedField && savedField.id) {
                    showFormFeedback('Đang tải ảnh lên máy chủ...', false);
                    return uploadFieldImage(savedField.id, imageFile);
                }
                return savedField;
            })
            .then(function() {
                closeFieldDrawer();
                S.showToast(fieldId ? 'Cập nhật sân thành công.' : 'Đã thêm sân mới thành công.', 'success');
                loadAdminData();
            })
            .catch(function(err) {
                showFormFeedback(err.message || 'Không thể lưu thông tin sân.', true);
            })
            .then(function() {
                if (el.fieldSaveBtn) el.fieldSaveBtn.disabled = false;
            });
    }

    function uploadFieldImage(fieldId, file) {
        var formData = new FormData();
        formData.append('file', file);
        return S.apiRequest('/fields/' + encodeURIComponent(fieldId) + '/image', {
            method: 'POST',
            isFormData: true,
            body: formData
        });
    }

    function confirmDeleteField(fieldId) {
        var field = state.fields.find(function(f) { return String(f.id) === String(fieldId); });
        var fieldName = field ? field.name : ('#' + fieldId);

        S.openConfirmDialog({
            title: 'Xóa sân thể thao',
            message: 'Bạn chắc chắn muốn xóa "' + fieldName + '"? Hành động này không thể hoàn tác.',
            confirmText: 'Xóa sân',
            cancelText: 'Giữ lại',
            danger: true
        }).then(function(confirmed) {
            if (!confirmed) return;
            S.apiRequest('/fields/' + encodeURIComponent(fieldId), { method: 'DELETE' })
                .then(function() {
                    S.showToast('Đã xóa sân "' + fieldName + '".', 'info');
                    loadAdminData();
                })
                .catch(function(err) {
                    S.showToast(err.message || 'Không thể xóa sân.', 'error');
                });
        });
    }

    function showFormFeedback(msg, isError) {
        if (!el.fieldFormFeedback) return;
        if (!msg) {
            el.fieldFormFeedback.textContent = '';
            el.fieldFormFeedback.className = 'booking-feedback hidden';
            return;
        }
        el.fieldFormFeedback.textContent = msg;
        el.fieldFormFeedback.className = 'booking-feedback ' + (isError ? 'error' : 'info');
    }

    function valueOf(node) {
        return node ? String(node.value || '').trim() : '';
    }

    function parseOptionalInt(val) {
        if (!val) return null;
        var n = parseInt(val, 10);
        return Number.isFinite(n) ? n : null;
    }
})();
