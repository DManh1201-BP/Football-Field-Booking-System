(function() {
    'use strict';

    var S = window.SportHubShared;

    var state = {
        currentUser: null,
        role: null,
        fields: [],
        users: [],
        bookings: [],
        claims: [],
        reports: [],
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
        el.bannerTitle = document.getElementById('admin-banner-title');
        el.pendingBadge = document.getElementById('admin-pending-badge');
        el.tabBookingsBtn = document.getElementById('admin-tab-bookings-btn');
        el.tabUsersBtn = document.getElementById('admin-tab-users-btn');
        el.tabModerationBtn = document.getElementById('admin-tab-moderation-btn');
        el.moderationBadge = document.getElementById('admin-moderation-badge');
        el.claimsBody = document.getElementById('admin-claims-body');
        el.reportsBody = document.getElementById('admin-reports-body');
        el.usersBody = document.getElementById('admin-users-body');
        el.refreshBtn = document.getElementById('admin-refresh-btn');
        el.openWalkinBtn = document.getElementById('open-walkin-btn');
        el.walkinModal = document.getElementById('walkin-modal');
        el.walkinForm = document.getElementById('walkin-form');
        el.walkinFieldId = document.getElementById('walkin-field-id');
        el.walkinDate = document.getElementById('walkin-date');
        el.walkinStart = document.getElementById('walkin-start');
        el.walkinEnd = document.getElementById('walkin-end');
        el.walkinName = document.getElementById('walkin-name');
        el.walkinPhone = document.getElementById('walkin-phone');
        el.walkinPlayers = document.getElementById('walkin-players');
        el.walkinNotes = document.getElementById('walkin-notes');
        el.walkinSubmit = document.getElementById('walkin-submit');
        el.walkinFeedback = document.getElementById('walkin-feedback');

        el.kpiGrid = document.getElementById('admin-kpi-grid');
        el.analyticsGrid = document.getElementById('admin-analytics-grid');
        el.adminOverviewNote = document.getElementById('admin-overview-note');
        el.ownerDashboard = document.getElementById('owner-dashboard');
        el.adminPlayers = document.getElementById('dashboard-players');
        el.adminOwners = document.getElementById('dashboard-owners');
        el.bookings = document.getElementById('dashboard-bookings');
        el.pending = document.getElementById('dashboard-pending');
        el.chartStatusBars = document.getElementById('chart-status-bars');
        el.ownerRevenueTotal = document.getElementById('owner-revenue-total');
        el.ownerCompletedCount = document.getElementById('owner-completed-count');
        el.ownerFieldCount = document.getElementById('owner-field-count');
        el.ownerIncomeChart = document.getElementById('owner-income-chart');

        el.bookingSearch = document.getElementById('admin-booking-search');
        el.bookingsBody = document.getElementById('bookings-table-body');
        el.bookingsPageInfo = document.getElementById('bookings-page-info');
        el.bookingsPrevPage = document.getElementById('bookings-prev-page');
        el.bookingsNextPage = document.getElementById('bookings-next-page');

        el.fieldSearch = document.getElementById('admin-field-search');
        el.fieldSportFilter = document.getElementById('admin-field-sport-filter');
        el.fieldsBody = document.getElementById('fields-table-body');
        el.fieldOwnerField = document.getElementById('field-owner-field');
        el.fieldOwnerId = document.getElementById('field-owner-id');

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
        el.fieldIndoor = document.getElementById('field-indoor');
        el.fieldLatitude = document.getElementById('field-latitude');
        el.fieldLongitude = document.getElementById('field-longitude');
        el.fieldMapUrl = document.getElementById('field-map-url');
        el.fieldVenueSourceWrap = document.getElementById('field-venue-source-wrap');
        el.fieldVenueSource = document.getElementById('field-venue-source');
        el.fieldAmenities = document.getElementById('field-amenities');
        el.fieldImageUrl = document.getElementById('field-image-url');
        el.fieldImageFile = document.getElementById('field-image-file');
        el.fieldImagePreview = document.getElementById('field-image-preview');
        el.fieldVerificationDocFile = document.getElementById('field-verification-doc-file');
        el.fieldVerificationDocLink = document.getElementById('field-verification-doc-link');
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

        if (el.usersBody) el.usersBody.addEventListener('click', function(e) {
            var button = e.target.closest('[data-user-role-save]');
            if (!button) return;
            var id = button.getAttribute('data-user-role-save');
            var select = el.usersBody.querySelector('[data-user-role="' + id + '"]');
            if (!select) return;
            button.disabled = true;
            S.apiRequest('/admin/users/' + encodeURIComponent(id) + '/role', {
                method: 'PATCH', body: JSON.stringify({ role: select.value })
            }).then(function() {
                S.showToast('Role đã cập nhật. Người dùng cần đăng nhập lại để nhận quyền mới.', 'success');
                loadAdminData();
            }).catch(function(err) {
                S.showToast(err.message || 'Không thể cập nhật role.', 'error');
                button.disabled = false;
            });
        });

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
        if (el.openWalkinBtn) el.openWalkinBtn.addEventListener('click', openWalkinModal);
        if (el.walkinForm) el.walkinForm.addEventListener('submit', handleWalkinSubmit);
        if (el.walkinModal) {
            el.walkinModal.addEventListener('click', function(e) {
                if (e.target === el.walkinModal || (e.target.closest && e.target.closest('[data-close-walkin]'))) {
                    closeWalkinModal();
                }
            });
        }
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
                closeWalkinModal();
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
                if (el.bannerTitle) el.bannerTitle.textContent = role === 'ADMIN' ? 'Tổng quan hệ thống' : 'Tổng quan chủ sân';
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
        if (el.tabUsersBtn) el.tabUsersBtn.classList.toggle('hidden', !isAdmin);
        if (el.tabModerationBtn) el.tabModerationBtn.classList.toggle('hidden', !isAdmin);
        if (el.openWalkinBtn) el.openWalkinBtn.classList.toggle('hidden', isAdmin);
        if (el.fieldOwnerField) el.fieldOwnerField.classList.toggle('hidden', !isAdmin);
        if (el.fieldVenueSourceWrap) el.fieldVenueSourceWrap.classList.toggle('hidden', !isAdmin);
        if (el.tabBookingsBtn) el.tabBookingsBtn.classList.remove('hidden');
        if (el.kpiGrid) el.kpiGrid.classList.toggle('hidden', !isAdmin);
        if (el.analyticsGrid) el.analyticsGrid.classList.toggle('hidden', !isAdmin);
        if (el.adminOverviewNote) el.adminOverviewNote.classList.toggle('hidden', !isAdmin);
        if (el.ownerDashboard) el.ownerDashboard.classList.toggle('hidden', isAdmin);

        if (!isAdmin) {
            var bookingsLabel = el.tabBookingsBtn && el.tabBookingsBtn.querySelector('.admin-nav-tab-left span:last-child');
            if (bookingsLabel) bookingsLabel.textContent = 'Booking sân của tôi';
            var panelTitle = document.querySelector('#admin-panel-bookings .panel-head h3');
            var panelDescription = document.querySelector('#admin-panel-bookings .panel-head p');
            if (panelTitle) panelTitle.textContent = 'Booking tại sân của tôi';
            if (panelDescription) panelDescription.textContent = 'Xem yêu cầu đặt sân và xác nhận hoặc từ chối booking thuộc các sân bạn sở hữu.';
        }
        switchTab('overview');
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
            fields: document.getElementById('admin-panel-fields'),
            users: document.getElementById('admin-panel-users'),
            moderation: document.getElementById('admin-panel-moderation')
        };

        Object.keys(panels).forEach(function(key) {
            if (panels[key]) {
                panels[key].classList.toggle('hidden', key !== state.activeTab);
            }
        });
    }

    function loadAdminData() {
        var isAdmin = state.role === 'ADMIN';
        var requests = [S.apiRequest('/fields/manage', { method: 'GET' })];

        if (isAdmin) {
            requests.push(S.apiRequest('/admin/bookings', { method: 'GET' }));
            requests.push(S.apiRequest('/admin/users', { method: 'GET' }));
            requests.push(S.apiRequest('/admin/field-claims', { method: 'GET' }));
            requests.push(S.apiRequest('/admin/field-reports', { method: 'GET' }));
        } else {
            requests.push(S.apiRequest('/owner/bookings', { method: 'GET' }));
        }

        Promise.all(requests)
            .then(function(results) {
                state.fields = Array.isArray(results[0]) ? results[0] : [];

                if (isAdmin) {
                    state.bookings = Array.isArray(results[1]) ? results[1] : [];
                    state.users = Array.isArray(results[2]) ? results[2] : [];
                    state.claims = Array.isArray(results[3]) ? results[3] : [];
                    state.reports = Array.isArray(results[4]) ? results[4] : [];
                    renderSummary();
                    renderAnalyticsCharts();
                    renderBookingsTable();
                    renderUsersTable();
                    renderModerationTables();
                    populateOwnerSelect();
                } else {
                    state.bookings = Array.isArray(results[1]) ? results[1] : [];
                    renderOwnerDashboard();
                    renderBookingsTable();
                }
                renderFieldsTable();
            })
            .catch(function(err) {
                S.showToast(err.message || 'Không thể tải dữ liệu quản trị.', 'error');
            });
    }

    function renderSummary() {
        var activePlayers = state.users.filter(function(user) {
            return user.isActive && S.normalizeRole(user.role) === 'CUSTOMER';
        }).length;
        var activeOwners = state.users.filter(function(user) {
            return user.isActive && S.normalizeRole(user.role) === 'OWNER';
        }).length;
        var pendingCount = state.bookings.filter(function(b) {
            var status = S.normalizeBookingStatus(b.status);
            return status === 'PENDING' || status === 'HOLD';
        }).length;

        if (el.adminPlayers) el.adminPlayers.textContent = String(activePlayers);
        if (el.adminOwners) el.adminOwners.textContent = String(activeOwners);
        if (el.bookings) el.bookings.textContent = String(state.bookings.length);
        if (el.pending) el.pending.textContent = String(pendingCount);
        if (el.pendingBadge) el.pendingBadge.textContent = String(pendingCount);
    }

    function renderAnalyticsCharts() {
        if (el.chartStatusBars) {
            var counts = { PENDING: 0, HOLD: 0, CONFIRMED: 0, COMPLETED: 0, CANCELLED: 0 };
            state.bookings.forEach(function(b) {
                var st = S.normalizeBookingStatus(b.status);
                if (Object.prototype.hasOwnProperty.call(counts, st)) counts[st] += 1;
            });
            var total = state.bookings.length;
            var statusRows = [
                { label: 'Chờ xác nhận', value: counts.PENDING, cls: 'warning' },
                { label: 'Đang giữ chỗ', value: counts.HOLD, cls: 'info' },
                { label: 'Đã xác nhận', value: counts.CONFIRMED, cls: '' },
                { label: 'Hoàn thành', value: counts.COMPLETED, cls: '' },
                { label: 'Đã hủy', value: counts.CANCELLED, cls: 'danger' }
            ];
            el.chartStatusBars.innerHTML = statusRows.map(function(row) {
                var pct = total ? Math.round((row.value / total) * 100) : 0;
                return '<div class="chart-bar-row">' +
                    '  <span class="chart-bar-label">' + S.escapeHtml(row.label) + '</span>' +
                    '  <div class="chart-bar-track"><div class="chart-bar-fill ' + row.cls + '" style="width:' + pct + '%;"></div></div>' +
                    '  <span class="chart-bar-value">' + row.value + ' (' + pct + '%)</span>' +
                    '</div>';
            }).join('');
        }
    }

    function renderOwnerDashboard() {
        var months = [];
        var today = new Date();
        var firstMonth = new Date(today.getFullYear(), today.getMonth() - 11, 1);
        for (var i = 0; i < 12; i += 1) {
            var date = new Date(firstMonth.getFullYear(), firstMonth.getMonth() + i, 1);
            months.push({
                key: date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0'),
                label: date.toLocaleDateString('vi-VN', { month: 'short' }).replace('.', ''),
                value: 0
            });
        }

        var byMonth = {};
        months.forEach(function(month) { byMonth[month.key] = month; });
        state.bookings.forEach(function(booking) {
            if (S.normalizeBookingStatus(booking.status) !== 'COMPLETED') return;
            var key = String(booking.bookingDate || '').slice(0, 7);
            if (byMonth[key]) byMonth[key].value += Number(booking.totalPrice || 0);
        });

        var total = months.reduce(function(sum, month) { return sum + month.value; }, 0);
        var completedCount = state.bookings.filter(function(booking) {
            return S.normalizeBookingStatus(booking.status) === 'COMPLETED';
        }).length;
        if (el.ownerRevenueTotal) el.ownerRevenueTotal.textContent = S.formatCurrency(total) + ' đ';
        if (el.ownerCompletedCount) el.ownerCompletedCount.textContent = String(completedCount);
        if (el.ownerFieldCount) el.ownerFieldCount.textContent = String(state.fields.length);

        if (el.ownerIncomeChart) {
            var maxValue = Math.max.apply(Math, months.map(function(month) { return month.value; }).concat([1]));
            if (!total) {
                el.ownerIncomeChart.innerHTML = '<p class="secondary-text owner-chart-empty">Chưa có booking hoàn thành trong khoảng thời gian này.</p>';
            } else {
                el.ownerIncomeChart.innerHTML = months.map(function(month) {
                    var height = month.value ? Math.max(4, Math.round((month.value / maxValue) * 100)) : 0;
                    var title = month.label + ': ' + S.formatCurrency(month.value) + ' đ';
                    return '<div class="owner-income-column" title="' + S.escapeHtml(title) + '">' +
                        '<span class="owner-income-value">' + (month.value ? S.escapeHtml(S.formatCurrency(month.value)) : '') + '</span>' +
                        '<div class="owner-income-track"><div class="owner-income-bar" style="height:' + height + '%"></div></div>' +
                        '<span class="owner-income-month">' + S.escapeHtml(month.label) + '</span>' +
                    '</div>';
                }).join('');
            }
        }
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
        var canCancel = state.role === 'ADMIN' && status !== 'CANCELLED' && status !== 'COMPLETED' && status !== 'EXPIRED' && status !== 'RAIN_OUT';
        var canRainOut = (status === 'PENDING' || status === 'HOLD' || status === 'CONFIRMED') && !field.isIndoor;
        var customerName = user.fullName || user.email || 'Khách';
        var walkInTag = b.bookingType === 'WALK_IN' ? ' <span class="match-chip">Walk-in</span>' : '';
        var customerNameMarkup = state.role === 'OWNER' && user.id
            ? '<a class="social-profile-link" href="profile.html?id=' + encodeURIComponent(user.id) + '">' + S.escapeHtml(customerName) + '</a>'
            : S.escapeHtml(customerName);

        var actionsHtml = '';
        if (canConfirm) {
            actionsHtml += '<button class="btn btn-primary btn-compact" type="button" data-action="confirm-booking" data-id="' + S.escapeHtml(b.id) + '">Xác nhận</button>';
            actionsHtml += '<button class="btn btn-danger-soft btn-compact" type="button" data-action="reject-booking" data-id="' + S.escapeHtml(b.id) + '">Từ chối</button>';
        }
        if (canRainOut) {
            actionsHtml += '<button class="btn btn-secondary btn-compact" type="button" data-action="rainout-booking" data-id="' + S.escapeHtml(b.id) + '" title="Hoãn bất khả kháng do thời tiết">Hoãn mưa</button>';
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
            '  <div><strong>' + customerNameMarkup + '</strong>' + walkInTag +
            (b.customerPhone ? '<div class="admin-subtext tabular-nums">' + S.escapeHtml(b.customerPhone) + '</div>' : '') +
            (b.notes ? '<div class="admin-subtext">' + S.escapeHtml(b.notes) + '</div>' : '') +
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
            var endpoint = state.role === 'OWNER' ? '/owner/bookings/' : '/admin/bookings/';
            S.apiRequest(endpoint + encodeURIComponent(btn.getAttribute('data-id')) + '/reject', {
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

        Array.prototype.forEach.call(container.querySelectorAll('[data-action="rainout-booking"]'), function(btn) {
            btn.addEventListener('click', function() {
                var id = btn.getAttribute('data-id');
                var reason = window.prompt('Lý do hoãn thời tiết (RAIN_OUT):', 'Trời mưa to không thể thi đấu');
                if (reason === null) return;
                btn.disabled = true;
                var endpoint = state.role === 'OWNER' ? '/owner/bookings/' : '/admin/bookings/';
                S.apiRequest(endpoint + encodeURIComponent(id) + '/rain-out', {
                    method: 'PATCH', body: JSON.stringify({ reason: reason.trim() })
                }).then(function() {
                    S.showToast('Đã chuyển booking sang trạng thái Hoãn thời tiết (RAIN_OUT).', 'info');
                    loadAdminData();
                }).catch(function(err) {
                    S.showToast(err.message || 'Không thể hoãn lịch.', 'error');
                    btn.disabled = false;
                });
            });
        });
    }

    function confirmBooking(bookingId, btn) {
        if (btn) btn.disabled = true;
        var endpoint = state.role === 'OWNER' ? '/owner/bookings/' : '/admin/bookings/';
        S.apiRequest(endpoint + encodeURIComponent(bookingId) + '/confirm', { method: 'PATCH' })
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
            var statusHtml = S.getFieldTrustBadge(field) + ' ' + (field.isAvailable !== false
                ? '<span class="status-badge success"><span>Mở đặt</span></span>'
                : '<span class="status-badge error"><span>Đang khóa</span></span>');
            var mapUrl = field.mapUrl || (field.latitude != null && field.longitude != null ? ('https://maps.google.com/?q=' + field.latitude + ',' + field.longitude) : '');
            var docUrl = field.verificationDocUrl ? S.resolveMediaUrl(field.verificationDocUrl) : '';
            var proofHtml = (mapUrl ? '<a class="social-profile-link" href="' + S.escapeHtml(mapUrl) + '" target="_blank" rel="noopener">Bản đồ</a>' : '') +
                (mapUrl && docUrl ? ' · ' : '') +
                (docUrl ? '<a class="social-profile-link" href="' + S.escapeHtml(docUrl) + '" target="_blank" rel="noopener">Hồ sơ/Bảng giá</a>' : '');
            var canVerify = state.role === 'ADMIN' && field.verificationStatus === 'PENDING_REVIEW';

            return '<tr>' +
                '<td class="tabular-nums"><span class="admin-id-pill">#' + S.escapeHtml(field.id) + '</span></td>' +
                '<td><strong>' + S.escapeHtml(field.name) + '</strong><div class="admin-subtext">' + S.escapeHtml(field.location || '') + '</div>' + (proofHtml ? ('<div class="admin-subtext">' + proofHtml + '</div>') : '') + '</td>' +
                '<td><span class="match-chip">' + S.escapeHtml(sportMeta.label) + '</span></td>' +
                '<td class="tabular-nums"><strong>' + S.formatCurrency(field.pricePerHour || 0) + ' đ</strong></td>' +
                '<td>' + statusHtml + '</td>' +
                '<td><div class="admin-actions-cell">' +
                (canVerify ? '<button class="btn btn-primary btn-compact" type="button" data-field-verify="' + S.escapeHtml(field.id) + ':APPROVED">Duyệt</button><button class="btn btn-danger-soft btn-compact" type="button" data-field-verify="' + S.escapeHtml(field.id) + ':REJECTED">Từ chối</button>' : '') +
                '  <button class="btn btn-secondary btn-compact" type="button" data-field-edit="' + S.escapeHtml(field.id) + '">Sửa</button>' +
                (canDelete ? '<button class="btn btn-danger-soft btn-compact" type="button" data-field-delete="' + S.escapeHtml(field.id) + '">Xóa</button>' : '') +
                '</div></td>' +
                '</tr>';
        }).join('');

        Array.prototype.forEach.call(el.fieldsBody.querySelectorAll('[data-field-verify]'), function(btn) {
            btn.addEventListener('click', function() {
                var parts = btn.getAttribute('data-field-verify').split(':');
                verifyFieldAction(parts[0], parts[1], btn);
            });
        });

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

    function renderUsersTable() {
        if (!el.usersBody) return;
        if (!state.users.length) {
            el.usersBody.innerHTML = '<tr><td colspan="5" class="table-empty">Chưa có tài khoản.</td></tr>';
            return;
        }
        el.usersBody.innerHTML = state.users.map(function(user) {
            var isSelf = state.currentUser && String(user.id) === String(state.currentUser.id);
            var options = ['CUSTOMER', 'OWNER', 'ADMIN'].map(function(role) {
                return '<option value="' + role + '" ' + (user.role === role ? 'selected' : '') + '>' + role + '</option>';
            }).join('');
            var userName = user.role === 'OWNER'
                ? '<a class="social-profile-link" href="profile.html?id=' + encodeURIComponent(user.id) + '">' + S.escapeHtml(user.fullName) + '</a>'
                : S.escapeHtml(user.fullName);
            return '<tr><td><strong>' + userName + '</strong></td>' +
                '<td>' + S.escapeHtml(user.email) + '</td><td>' + S.escapeHtml(user.phone || '—') + '</td>' +
                '<td><select class="admin-sport-select" data-user-role="' + S.escapeHtml(user.id) + '" ' + (isSelf ? 'disabled' : '') + '>' + options + '</select></td>' +
                '<td><button class="btn btn-primary btn-compact" type="button" data-user-role-save="' + S.escapeHtml(user.id) + '" ' + (isSelf ? 'disabled title="Không thể đổi role của chính mình"' : '') + '>Lưu role</button></td></tr>';
        }).join('');
    }

    function populateOwnerSelect() {
        if (!el.fieldOwnerId) return;
        var owners = state.users.filter(function(user) { return user.role === 'OWNER'; });
        var selected = el.fieldOwnerId.value;
        el.fieldOwnerId.innerHTML = '<option value="">Chưa gán chủ sân</option>' + owners.map(function(owner) {
            return '<option value="' + S.escapeHtml(owner.id) + '">' + S.escapeHtml(owner.fullName + ' · ' + owner.email) + '</option>';
        }).join('');
        if (selected) el.fieldOwnerId.value = selected;
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
        if (el.fieldIndoor) el.fieldIndoor.checked = !!field.isIndoor;
        if (el.fieldLatitude) el.fieldLatitude.value = field.latitude != null ? field.latitude : '';
        if (el.fieldLongitude) el.fieldLongitude.value = field.longitude != null ? field.longitude : '';
        if (el.fieldMapUrl) el.fieldMapUrl.value = field.mapUrl || '';
        if (el.fieldVenueSource) el.fieldVenueSource.value = field.venueSource || 'PARTNER';
        if (el.fieldVerificationDocFile) el.fieldVerificationDocFile.value = '';
        if (el.fieldVerificationDocLink) {
            if (field.verificationDocUrl) {
                el.fieldVerificationDocLink.innerHTML = '<a class="social-profile-link" href="' + S.escapeHtml(S.resolveMediaUrl(field.verificationDocUrl)) + '" target="_blank" rel="noopener">Xem hồ sơ xác thực hiện tại</a>';
                el.fieldVerificationDocLink.classList.remove('hidden');
            } else {
                el.fieldVerificationDocLink.innerHTML = '';
                el.fieldVerificationDocLink.classList.add('hidden');
            }
        }
        if (el.fieldOwnerId) el.fieldOwnerId.value = field.ownerId == null ? '' : String(field.ownerId);

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
        if (el.fieldIndoor) el.fieldIndoor.checked = false;
        if (el.fieldLatitude) el.fieldLatitude.value = '';
        if (el.fieldLongitude) el.fieldLongitude.value = '';
        if (el.fieldMapUrl) el.fieldMapUrl.value = '';
        if (el.fieldVenueSource) el.fieldVenueSource.value = 'PARTNER';
        if (el.fieldVerificationDocFile) el.fieldVerificationDocFile.value = '';
        if (el.fieldVerificationDocLink) {
            el.fieldVerificationDocLink.innerHTML = '';
            el.fieldVerificationDocLink.classList.add('hidden');
        }
        if (el.fieldOwnerId) el.fieldOwnerId.value = '';
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

        var latRaw = valueOf(el.fieldLatitude);
        var lngRaw = valueOf(el.fieldLongitude);
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
            isAvailable: !!(el.fieldAvailable && el.fieldAvailable.checked),
            isIndoor: !!(el.fieldIndoor && el.fieldIndoor.checked),
            latitude: latRaw ? Number(latRaw) : null,
            longitude: lngRaw ? Number(lngRaw) : null,
            mapUrl: valueOf(el.fieldMapUrl) || null
        };
        if (state.role === 'ADMIN') {
            var selectedOwnerId = valueOf(el.fieldOwnerId);
            if (selectedOwnerId) payload.ownerId = Number(selectedOwnerId);
            else if (state.editingFieldId) payload.clearOwner = true;
            if (el.fieldVenueSource) payload.venueSource = el.fieldVenueSource.value;
        }

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
                var targetId = savedField && savedField.id;
                var imageFile = el.fieldImageFile && el.fieldImageFile.files ? el.fieldImageFile.files[0] : null;
                var docFile = el.fieldVerificationDocFile && el.fieldVerificationDocFile.files ? el.fieldVerificationDocFile.files[0] : null;
                var chain = Promise.resolve(savedField);
                if (imageFile && targetId) {
                    chain = chain.then(function() {
                        showFormFeedback('Đang tải ảnh sân lên máy chủ...', false);
                        return uploadFieldImage(targetId, imageFile);
                    });
                }
                if (docFile && targetId) {
                    chain = chain.then(function() {
                        showFormFeedback('Đang tải hồ sơ xác thực lên máy chủ...', false);
                        return uploadVerificationDoc(targetId, docFile);
                    });
                }
                return chain;
            })
            .then(function() {
                closeFieldDrawer();
                var msg = fieldId
                    ? 'Cập nhật sân thành công.'
                    : (state.role === 'OWNER' ? 'Đã tạo sân mới ở trạng thái Chờ Admin duyệt xác thực.' : 'Đã thêm sân mới thành công.');
                S.showToast(msg, 'success');
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

    function uploadVerificationDoc(fieldId, file) {
        var formData = new FormData();
        formData.append('file', file);
        return S.apiRequest('/fields/' + encodeURIComponent(fieldId) + '/verification-doc', {
            method: 'POST',
            isFormData: true,
            body: formData
        });
    }

    function verifyFieldAction(fieldId, decision, btn) {
        var notes = decision === 'REJECTED'
            ? window.prompt('Nhập lý do từ chối hồ sơ sân:', 'Ảnh/giấy tờ bảng giá chưa rõ ràng')
            : 'Đã kiểm tra ảnh chụp, tọa độ và giấy tờ hợp lệ.';
        if (notes === null) return;
        if (btn) btn.disabled = true;
        S.apiRequest('/admin/fields/' + encodeURIComponent(fieldId) + '/verify', {
            method: 'PATCH',
            body: JSON.stringify({ decision: decision, notes: notes.trim() })
        }).then(function() {
            S.showToast(decision === 'APPROVED' ? 'Đã duyệt sân và mở đặt công khai.' : 'Đã từ chối hồ sơ sân.', 'success');
            loadAdminData();
        }).catch(function(err) {
            S.showToast(err.message || 'Không thể duyệt sân.', 'error');
            if (btn) btn.disabled = false;
        });
    }

    function renderModerationTables() {
        var pendingClaims = state.claims.filter(function(c) { return c.status === 'PENDING'; }).length;
        var openReports = state.reports.filter(function(r) { return r.status === 'OPEN'; }).length;
        var pendingFields = state.fields.filter(function(f) { return f.verificationStatus === 'PENDING_REVIEW'; }).length;
        if (el.moderationBadge) el.moderationBadge.textContent = String(pendingClaims + openReports + pendingFields);

        if (el.claimsBody) {
            if (!state.claims.length) {
                el.claimsBody.innerHTML = '<tr><td colspan="5" class="table-empty">Chưa có yêu cầu nhận quyền chủ sân nào.</td></tr>';
            } else {
                el.claimsBody.innerHTML = state.claims.map(function(c) {
                    var proof = [];
                    if (c.mapUrl) proof.push('<a class="social-profile-link" href="' + S.escapeHtml(c.mapUrl) + '" target="_blank" rel="noopener">Google Maps</a>');
                    if (c.evidenceDocUrl) proof.push('<a class="social-profile-link" href="' + S.escapeHtml(S.resolveMediaUrl(c.evidenceDocUrl)) + '" target="_blank" rel="noopener">Giấy tờ</a>');
                    var actions = c.status === 'PENDING'
                        ? '<button class="btn btn-primary btn-compact" type="button" data-claim-review="' + S.escapeHtml(c.id) + ':APPROVED">Duyệt</button><button class="btn btn-danger-soft btn-compact" type="button" data-claim-review="' + S.escapeHtml(c.id) + ':REJECTED">Từ chối</button>'
                        : '<span class="secondary-text">Đã xử lý</span>';
                    return '<tr>' +
                        '<td><strong>' + S.escapeHtml(c.fieldName) + '</strong></td>' +
                        '<td>' + S.escapeHtml(c.claimantName) + '<div class="admin-subtext">' + S.escapeHtml(c.claimantEmail) + '</div></td>' +
                        '<td>' + S.escapeHtml(c.notes || '') + (proof.length ? ('<div class="admin-subtext">' + proof.join(' · ') + '</div>') : '') + '</td>' +
                        '<td><span class="match-chip">' + S.escapeHtml(c.status) + '</span></td>' +
                        '<td><div class="admin-actions-cell">' + actions + '</div></td>' +
                        '</tr>';
                }).join('');
                Array.prototype.forEach.call(el.claimsBody.querySelectorAll('[data-claim-review]'), function(btn) {
                    btn.addEventListener('click', function() {
                        var parts = btn.getAttribute('data-claim-review').split(':');
                        var note = parts[1] === 'REJECTED' ? window.prompt('Lý do từ chối claim:') : 'Xác minh hợp lệ';
                        if (note === null) return;
                        btn.disabled = true;
                        S.apiRequest('/admin/field-claims/' + encodeURIComponent(parts[0]) + '/review', {
                            method: 'PATCH', body: JSON.stringify({ decision: parts[1], adminNote: note })
                        }).then(function() {
                            S.showToast('Đã xử lý yêu cầu nhận quyền sân.', 'success');
                            loadAdminData();
                        }).catch(function(err) {
                            S.showToast(err.message || 'Lỗi xử lý claim.', 'error');
                            btn.disabled = false;
                        });
                    });
                });
            }
        }

        if (el.reportsBody) {
            if (!state.reports.length) {
                el.reportsBody.innerHTML = '<tr><td colspan="5" class="table-empty">Chưa có báo cáo sân nào từ cộng đồng.</td></tr>';
            } else {
                el.reportsBody.innerHTML = state.reports.map(function(r) {
                    var actions = r.status === 'OPEN'
                        ? '<button class="btn btn-secondary btn-compact" type="button" data-report-resolve="' + S.escapeHtml(r.id) + ':DISMISSED:0">Bỏ qua</button><button class="btn btn-danger-soft btn-compact" type="button" data-report-resolve="' + S.escapeHtml(r.id) + ':RESOLVED:1">Tạm ngưng sân</button>'
                        : '<span class="secondary-text">Đã xử lý</span>';
                    return '<tr>' +
                        '<td><strong>' + S.escapeHtml(r.fieldName) + '</strong></td>' +
                        '<td>' + S.escapeHtml(r.reporterName) + '</td>' +
                        '<td><strong>' + S.escapeHtml(r.reason) + '</strong>' + (r.details ? ('<div class="admin-subtext">' + S.escapeHtml(r.details) + '</div>') : '') + '</td>' +
                        '<td><span class="match-chip">' + S.escapeHtml(r.status) + '</span></td>' +
                        '<td><div class="admin-actions-cell">' + actions + '</div></td>' +
                        '</tr>';
                }).join('');
                Array.prototype.forEach.call(el.reportsBody.querySelectorAll('[data-report-resolve]'), function(btn) {
                    btn.addEventListener('click', function() {
                        var parts = btn.getAttribute('data-report-resolve').split(':');
                        btn.disabled = true;
                        S.apiRequest('/admin/field-reports/' + encodeURIComponent(parts[0]) + '/resolve', {
                            method: 'PATCH',
                            body: JSON.stringify({ status: parts[1], suspendField: parts[2] === '1' })
                        }).then(function() {
                            S.showToast('Đã xử lý báo cáo sân.', 'info');
                            loadAdminData();
                        }).catch(function(err) {
                            S.showToast(err.message || 'Lỗi xử lý báo cáo.', 'error');
                            btn.disabled = false;
                        });
                    });
                });
            }
        }
    }

    function openWalkinModal() {
        if (!el.walkinModal) return;
        if (el.walkinFieldId) {
            el.walkinFieldId.innerHTML = state.fields.map(function(f) {
                return '<option value="' + S.escapeHtml(f.id) + '">' + S.escapeHtml(f.name) + '</option>';
            }).join('');
        }
        if (el.walkinDate) {
            el.walkinDate.min = S.formatDateForInput(new Date());
            el.walkinDate.value = S.formatDateForInput(new Date());
        }
        if (el.walkinFeedback) el.walkinFeedback.className = 'booking-feedback hidden';
        el.walkinModal.classList.remove('hidden');
        el.walkinModal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
    }

    function closeWalkinModal() {
        if (!el.walkinModal || el.walkinModal.classList.contains('hidden')) return;
        el.walkinModal.classList.add('hidden');
        el.walkinModal.setAttribute('aria-hidden', 'true');
        if (!document.querySelector('.modal:not(.hidden)')) document.body.classList.remove('modal-open');
    }

    function handleWalkinSubmit(e) {
        e.preventDefault();
        var fieldId = el.walkinFieldId ? Number(el.walkinFieldId.value) : 0;
        var name = el.walkinName ? el.walkinName.value.trim() : '';
        if (!fieldId || !name) {
            if (el.walkinFeedback) {
                el.walkinFeedback.textContent = 'Vui lòng chọn sân và nhập tên khách.';
                el.walkinFeedback.className = 'booking-feedback error';
            }
            return;
        }
        if (el.walkinSubmit) el.walkinSubmit.disabled = true;
        S.apiRequest('/owner/bookings/walk-in', {
            method: 'POST',
            body: JSON.stringify({
                fieldId: fieldId,
                bookingDate: el.walkinDate.value,
                startTime: el.walkinStart.value,
                endTime: el.walkinEnd.value,
                customerName: name,
                customerPhone: el.walkinPhone ? el.walkinPhone.value.trim() || null : null,
                expectedPlayers: el.walkinPlayers && el.walkinPlayers.value ? Number(el.walkinPlayers.value) : null,
                notes: el.walkinNotes ? el.walkinNotes.value.trim() || null : null
            })
        }).then(function() {
            closeWalkinModal();
            S.showToast('Đã khóa lịch khách vãng lai thành công!', 'success');
            loadAdminData();
        }).catch(function(err) {
            if (el.walkinFeedback) {
                el.walkinFeedback.textContent = err.message || 'Không thể khóa lịch.';
                el.walkinFeedback.className = 'booking-feedback error';
            }
        }).then(function() {
            if (el.walkinSubmit) el.walkinSubmit.disabled = false;
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
