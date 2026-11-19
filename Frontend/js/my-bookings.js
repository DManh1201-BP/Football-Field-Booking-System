(function() {
    'use strict';

    var S = window.SportHubShared;

    var state = {
        bookings: [],
        historyFilter: 'ALL',
        historyQuery: '',
        editingBooking: null,
        editingFieldBookings: [],
        cancelingBooking: null,
        lastFocused: null
    };

    var el = {};

    document.addEventListener('DOMContentLoaded', initPage);

    function initPage() {
        cacheElements();
        S.initSharedNavbar({
            onAuthSuccess: verifyAndLoadBookings,
            onLogout: function() {
                showUnauthenticated('Bạn đã đăng xuất. Đăng nhập lại để xem lịch đặt sân.');
            }
        });
        bindEvents();
        verifyAndLoadBookings();
    }

    function cacheElements() {
        el.sessionText = document.getElementById('bookings-session-text');
        el.accessAlert = document.getElementById('bookings-access-alert');
        el.accessText = document.getElementById('bookings-access-text');
        el.content = document.getElementById('bookings-content');
        el.notifications = document.getElementById('customer-notifications');
        el.refreshBtn = document.getElementById('refresh-bookings-btn');

        el.totalCount = document.getElementById('customer-booking-count');
        el.upcomingCount = document.getElementById('customer-upcoming-count');
        el.confirmedCount = document.getElementById('customer-confirmed-count');
        el.pendingCount = document.getElementById('customer-pending-count');
        el.activityGrid = document.getElementById('activity-grid');
        el.activityMonths = document.getElementById('activity-month-labels');
        el.activityActiveDays = document.getElementById('activity-active-days');
        el.activityTotalSessions = document.getElementById('activity-total-sessions');

        el.currentList = document.getElementById('current-bookings-list');
        el.currentFeedback = document.getElementById('current-bookings-feedback');
        el.bookingsBody = document.getElementById('customer-bookings-body');
        el.mobileHistoryList = document.getElementById('mobile-history-list');
        el.historySearchInput = document.getElementById('history-search-input');

        el.editModal = document.getElementById('edit-booking-modal');
        el.editForm = document.getElementById('edit-booking-form');
        el.editSummary = document.getElementById('edit-booking-summary');
        el.editSlotConflictBox = document.getElementById('edit-slot-conflict-box');
        el.editBookedSlotsList = document.getElementById('edit-booked-slots-list');
        el.editDate = document.getElementById('edit-booking-date');
        el.editStart = document.getElementById('edit-booking-start');
        el.editEnd = document.getElementById('edit-booking-end');
        el.editPhone = document.getElementById('edit-booking-phone');
        el.editNotes = document.getElementById('edit-booking-notes');
        el.editDurationText = document.getElementById('edit-duration-text');
        el.editPricePreview = document.getElementById('edit-price-preview');
        el.editFeedback = document.getElementById('edit-booking-feedback');
        el.editSubmit = document.getElementById('edit-booking-submit');

        el.cancelModal = document.getElementById('cancel-booking-modal');
        el.cancelForm = document.getElementById('cancel-booking-form');
        el.cancelSummary = document.getElementById('cancel-booking-summary');
        el.cancelReason = document.getElementById('cancel-booking-reason');
        el.cancelFeedback = document.getElementById('cancel-booking-feedback');
        el.cancelSubmit = document.getElementById('cancel-booking-submit');
    }

    function bindEvents() {
        if (el.refreshBtn) {
            el.refreshBtn.addEventListener('click', function() {
                loadMyBookings(false);
                loadNotifications();
            });
        }

        if (el.currentList) {
            el.currentList.addEventListener('click', handleCurrentListClick);
        }

        if (el.notifications) el.notifications.addEventListener('click', function(e) {
            var button = e.target.closest('[data-notification-read]');
            if (!button) return;
            button.disabled = true;
            S.apiRequest('/notifications/' + encodeURIComponent(button.getAttribute('data-notification-read')) + '/read', { method: 'PATCH' })
                .then(loadNotifications).catch(function(err) {
                    S.showToast(err.message || 'Không thể cập nhật thông báo.', 'error');
                    button.disabled = false;
                });
        });

        if (el.historySearchInput) {
            el.historySearchInput.addEventListener('input', function() {
                state.historyQuery = this.value;
                renderHistory();
            });
        }

        Array.prototype.forEach.call(document.querySelectorAll('[data-history-filter]'), function(tab) {
            tab.addEventListener('click', function() {
                state.historyFilter = tab.getAttribute('data-history-filter') || 'ALL';
                Array.prototype.forEach.call(document.querySelectorAll('[data-history-filter]'), function(t) {
                    t.classList.toggle('active', t === tab);
                });
                renderHistory();
            });
        });

        if (el.editForm) el.editForm.addEventListener('submit', handleEditSubmit);
        if (el.cancelForm) el.cancelForm.addEventListener('submit', handleCancelSubmit);

        if (el.editDate) {
            el.editDate.addEventListener('change', renderEditBookedSlots);
        }
        if (el.editStart) el.editStart.addEventListener('input', updateEditPricePreview);
        if (el.editEnd) el.editEnd.addEventListener('input', updateEditPricePreview);

        [el.editModal, el.cancelModal].forEach(function(modal) {
            if (!modal) return;
            modal.addEventListener('click', function(e) {
                if (e.target === modal || (e.target.closest && e.target.closest('[data-close-modal]'))) {
                    closeModal(modal);
                }
            });
        });

        document.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                closeModal(el.editModal);
                closeModal(el.cancelModal);
            }
        });
    }

    function verifyAndLoadBookings() {
        var session = S.loadAuthSession();
        if (!session.token) {
            showUnauthenticated('Vui lòng đăng nhập tài khoản để xem và quản lý các lịch đặt sân của bạn.');
            return;
        }

        S.apiRequest('/auth/me', { method: 'GET', token: session.token })
            .then(function(user) {
                if (!user) throw new Error('Không thể xác minh tài khoản.');
                S.persistAuthSession(user, session.token);
                S.updateNavbarAuthUI();

                if (el.sessionText) {
                    el.sessionText.textContent = 'Tài khoản: ' + (user.fullName || user.email) + ' (' + S.getRoleLabel(user.role) + ')';
                }
                if (el.accessAlert) el.accessAlert.classList.add('hidden');
                if (el.content) el.content.classList.remove('hidden');
                loadMyBookings(false);
                loadNotifications();
            })
            .catch(function(err) {
                S.clearAuthSession();
                S.updateNavbarAuthUI();
                showUnauthenticated(err.message || 'Phiên đăng nhập đã hết hạn. Vui lòng đăng nhập lại.');
            });
    }

    function loadNotifications() {
        if (!el.notifications) return;
        S.apiRequest('/notifications/me', { method: 'GET' }).then(function(items) {
            var list = Array.isArray(items) ? items : [];
            if (!list.length) {
                el.notifications.innerHTML = '<p class="table-empty">Bạn chưa có thông báo nào.</p>';
                return;
            }
            el.notifications.innerHTML = list.map(function(item) {
                return '<article class="notification-item ' + (item.isRead ? '' : 'is-unread') + '"><div><p>' + S.escapeHtml(item.message) + '</p><small>' + S.escapeHtml(S.formatDate(item.createdAt)) + '</small></div>' +
                    (item.isRead ? '<span class="secondary-text">Đã đọc</span>' : '<button class="btn btn-secondary btn-sm" type="button" data-notification-read="' + S.escapeHtml(item.id) + '">Đánh dấu đã đọc</button>') + '</article>';
            }).join('');
        }).catch(function(err) {
            el.notifications.innerHTML = '<p class="booking-feedback error">' + S.escapeHtml(err.message || 'Không thể tải thông báo.') + '</p>';
        });
    }

    function showUnauthenticated(message) {
        if (el.sessionText) el.sessionText.textContent = 'Chưa đăng nhập';
        if (el.accessText) el.accessText.textContent = message;
        if (el.accessAlert) el.accessAlert.classList.remove('hidden');
        if (el.content) el.content.classList.add('hidden');
    }

    function loadMyBookings(silent) {
        if (!silent && el.bookingsBody) {
            el.bookingsBody.innerHTML = '<tr><td colspan="6" class="table-empty">Đang tải lịch sử đặt sân...</td></tr>';
        }
        if (!silent && el.currentList) {
            el.currentList.innerHTML = '<p class="table-empty">Đang tải booking sắp tới...</p>';
        }

        S.apiRequest('/bookings/me', { method: 'GET' })
            .then(function(data) {
                state.bookings = Array.isArray(data) ? data : [];
                renderSummary();
                renderActivityHeatmap();
                renderCurrentBookings();
                renderHistory();
            })
            .catch(function(err) {
                S.showToast(err.message || 'Không thể tải danh sách booking.', 'error');
            });
    }

    function isCurrentBooking(booking) {
        var status = S.normalizeBookingStatus(booking.status);
        if (status !== 'CONFIRMED' && status !== 'PENDING' && status !== 'HOLD') {
            return false;
        }
        var end = parseBookingDateTime(booking.bookingDate, booking.endTime, '23:59');
        return !!end && end.getTime() >= Date.now();
    }

    function parseBookingDateTime(dateVal, timeVal, fallback) {
        var datePart = String(dateVal || '').slice(0, 10);
        var timePart = String(timeVal || fallback).slice(0, 5);
        var d = new Date(datePart + 'T' + timePart + ':00');
        return isNaN(d.getTime()) ? null : d;
    }

    function getBookingStartMs(booking) {
        var d = parseBookingDateTime(booking.bookingDate, booking.startTime, '00:00');
        return d ? d.getTime() : 0;
    }

    function renderSummary() {
        var list = state.bookings;
        var upcoming = list.filter(isCurrentBooking).length;
        var confirmed = list.filter(function(b) { return S.normalizeBookingStatus(b.status) === 'CONFIRMED'; }).length;
        var pending = list.filter(function(b) {
            var st = S.normalizeBookingStatus(b.status);
            return st === 'PENDING' || st === 'HOLD';
        }).length;

        if (el.totalCount) el.totalCount.textContent = String(list.length);
        if (el.upcomingCount) el.upcomingCount.textContent = String(upcoming);
        if (el.confirmedCount) el.confirmedCount.textContent = String(confirmed);
        if (el.pendingCount) el.pendingCount.textContent = String(pending);
    }

    function renderActivityHeatmap() {
        if (!el.activityGrid) return;

        var completedPerDay = {};
        state.bookings.forEach(function(booking) {
            if (S.normalizeBookingStatus(booking.status) !== 'COMPLETED') return;
            var key = String(booking.bookingDate || '').slice(0, 10);
            if (!/^\d{4}-\d{2}-\d{2}$/.test(key)) return;
            completedPerDay[key] = (completedPerDay[key] || 0) + 1;
        });

        var today = new Date();
        today.setHours(0, 0, 0, 0);
        var mondayOffset = (today.getDay() + 6) % 7;
        var firstDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() - mondayOffset - (52 * 7));
        var cells = [];
        var monthLabels = [];
        var lastMonthLabel = '';
        var activeDays = 0;
        var sessions = 0;

        for (var week = 0; week < 53; week += 1) {
            var weekDate = new Date(firstDay.getFullYear(), firstDay.getMonth(), firstDay.getDate() + week * 7);
            var monthKey = weekDate.getFullYear() + '-' + weekDate.getMonth();
            if (week === 0 || monthKey !== lastMonthLabel) {
                monthLabels.push('<span style="grid-column:' + (week + 1) + '">' + S.escapeHtml(weekDate.toLocaleDateString('vi-VN', { month: 'short' }).replace('.', '')) + '</span>');
                lastMonthLabel = monthKey;
            }

            for (var day = 0; day < 7; day += 1) {
                var date = new Date(firstDay.getFullYear(), firstDay.getMonth(), firstDay.getDate() + (week * 7) + day);
                var key = date.getFullYear() + '-' + String(date.getMonth() + 1).padStart(2, '0') + '-' + String(date.getDate()).padStart(2, '0');
                var count = completedPerDay[key] || 0;
                if (count > 0) {
                    activeDays += 1;
                    sessions += count;
                }
                var level = count === 0 ? 0 : Math.min(4, count);
                var future = date > today;
                var dateLabel = date.toLocaleDateString('vi-VN', { day: 'numeric', month: 'long', year: 'numeric' });
                var title = dateLabel + ': ' + count + ' lượt hoàn thành';
                cells.push('<span class="activity-day activity-level-' + level + (future ? ' is-future' : '') + '" title="' + S.escapeHtml(title) + '" aria-hidden="true"></span>');
            }
        }

        el.activityGrid.innerHTML = cells.join('');
        if (el.activityMonths) el.activityMonths.innerHTML = monthLabels.join('');
        if (el.activityActiveDays) el.activityActiveDays.textContent = activeDays + ' ngày chơi';
        if (el.activityTotalSessions) el.activityTotalSessions.textContent = sessions + ' lượt đã hoàn thành trong 52 tuần gần nhất';
        el.activityGrid.setAttribute('aria-label', 'Trong 52 tuần gần nhất: ' + activeDays + ' ngày chơi, ' + sessions + ' booking hoàn thành.');
    }

    function renderCurrentBookings() {
        if (!el.currentList) return;

        var current = state.bookings.filter(isCurrentBooking).sort(function(a, b) {
            return getBookingStartMs(a) - getBookingStartMs(b);
        });

        if (!current.length) {
            el.currentList.innerHTML =
                '<div class="empty-state">' +
                '  <span class="empty-state-icon"><i data-lucide="calendar-plus" aria-hidden="true"></i></span>' +
                '  <h3>Chưa có lịch đặt sân sắp tới</h3>' +
                '  <p>Chọn sân yêu thích và đặt khung giờ phù hợp cho trận đấu tiếp theo.</p>' +
                '  <a class="btn btn-primary btn-sm" href="index.html#fields">Tìm sân ngay</a>' +
                '</div>';
            S.refreshIcons(el.currentList);
            return;
        }

        el.currentList.innerHTML = current.map(function(booking) {
            var field = booking.field || {};
            var status = S.normalizeBookingStatus(booking.status);
            var cardClass = status === 'CONFIRMED' ? 'is-confirmed' : (status === 'HOLD' ? 'is-hold' : 'is-pending');
            var locationLine = field.location || field.city || 'Chưa cập nhật địa chỉ';
            var notesLine = booking.notes ? booking.notes : 'Không có ghi chú';

            return '<article class="current-booking-card ' + cardClass + '">' +
                '  <div class="current-booking-head">' +
                '    <h4>' + S.escapeHtml(field.name || 'Sân thể thao') + '</h4>' +
                '    ' + S.renderBookingStatusBadge(status) +
                '  </div>' +
                '  <div class="booking-pass-slot">' +
                '    <span class="booking-pass-datetime tabular-nums"><i data-lucide="calendar-clock" aria-hidden="true"></i>' + S.escapeHtml(S.formatDate(booking.bookingDate)) + ' · ' + S.escapeHtml(S.formatTimeRange(booking.startTime, booking.endTime)) + '</span>' +
                '    <span class="booking-pass-price tabular-nums">' + S.escapeHtml(S.formatCurrency(booking.totalPrice || 0)) + ' đ</span>' +
                '  </div>' +
                '  <div class="current-booking-meta">' +
                '    <span><i data-lucide="map-pin" aria-hidden="true"></i>' + S.escapeHtml(locationLine) + '</span>' +
                '    <span><i data-lucide="sticky-note" aria-hidden="true"></i>' + S.escapeHtml(notesLine) + '</span>' +
                '  </div>' +
                '  <div class="current-booking-actions">' +
                '    <button class="btn btn-secondary btn-compact" type="button" data-action="edit-booking" data-id="' + S.escapeHtml(booking.id) + '">' +
                '      <i data-lucide="pencil" class="btn-icon" aria-hidden="true"></i><span>Đổi giờ</span>' +
                '    </button>' +
                '    <button class="btn btn-danger-soft btn-compact" type="button" data-action="cancel-booking" data-id="' + S.escapeHtml(booking.id) + '">' +
                '      <i data-lucide="x-circle" class="btn-icon" aria-hidden="true"></i><span>Hủy lịch</span>' +
                '    </button>' +
                '  </div>' +
                '</article>';
        }).join('');

        S.refreshIcons(el.currentList);
    }

    function renderHistory() {
        var q = (state.historyQuery || '').trim().toLowerCase();
        var list = state.bookings.filter(function(b) {
            return !isCurrentBooking(b);
        }).filter(function(b) {
            var status = S.normalizeBookingStatus(b.status);
            if (state.historyFilter === 'CONFIRMED' && status !== 'CONFIRMED' && status !== 'COMPLETED') return false;
            if (state.historyFilter === 'CANCELLED' && status !== 'CANCELLED') return false;
            if (state.historyFilter === 'PAST' && status === 'CANCELLED') return false;

            if (q) {
                var fieldName = (b.field && b.field.name) || '';
                var hay = (fieldName + ' ' + (b.notes || '')).toLowerCase();
                if (hay.indexOf(q) === -1) return false;
            }
            return true;
        }).sort(function(a, b) {
            return getBookingStartMs(b) - getBookingStartMs(a);
        });

        if (el.bookingsBody) {
            if (!list.length) {
                el.bookingsBody.innerHTML = '<tr><td colspan="6" class="table-empty">Không có lịch sử booking phù hợp bộ lọc.</td></tr>';
            } else {
                el.bookingsBody.innerHTML = list.map(function(b) {
                    var field = b.field || {};
                    var status = S.normalizeBookingStatus(b.status);
                    var noteText = (status === 'CANCELLED' && (b.cancellationReason || b.cancelReason))
                        ? ('Lý do hủy: ' + (b.cancellationReason || b.cancelReason))
                        : (b.notes || 'Không có ghi chú');
                    return '<tr>' +
                        '<td><strong>' + S.escapeHtml(field.name || 'Sân thể thao') + '</strong></td>' +
                        '<td class="tabular-nums">' + S.escapeHtml(S.formatDate(b.bookingDate)) + '</td>' +
                        '<td class="tabular-nums">' + S.escapeHtml(S.formatTimeRange(b.startTime, b.endTime)) + '</td>' +
                        '<td>' + S.renderBookingStatusBadge(status) + '</td>' +
                        '<td class="tabular-nums"><strong>' + S.escapeHtml(S.formatCurrency(b.totalPrice || 0)) + ' đ</strong></td>' +
                        '<td>' + S.escapeHtml(noteText) + '</td>' +
                        '</tr>';
                }).join('');
                S.refreshIcons(el.bookingsBody);
            }
        }

        if (el.mobileHistoryList) {
            if (!list.length) {
                el.mobileHistoryList.innerHTML = '<p class="table-empty">Không có lịch sử booking phù hợp.</p>';
            } else {
                el.mobileHistoryList.innerHTML = list.map(function(b) {
                    var field = b.field || {};
                    var status = S.normalizeBookingStatus(b.status);
                    return '<article class="mobile-booking-item">' +
                        '  <div class="mobile-booking-top">' +
                        '    <strong>' + S.escapeHtml(field.name || 'Sân thể thao') + '</strong>' +
                        '    ' + S.renderBookingStatusBadge(status) +
                        '  </div>' +
                        '  <div class="secondary-text tabular-nums">' + S.escapeHtml(S.formatDate(b.bookingDate)) + ' · ' + S.escapeHtml(S.formatTimeRange(b.startTime, b.endTime)) + '</div>' +
                        '  <div class="tabular-nums"><strong>' + S.escapeHtml(S.formatCurrency(b.totalPrice || 0)) + ' đ</strong></div>' +
                        '</article>';
                }).join('');
                S.refreshIcons(el.mobileHistoryList);
            }
        }
    }

    function handleCurrentListClick(e) {
        var btn = e.target.closest ? e.target.closest('[data-action]') : null;
        if (!btn) return;
        var id = btn.getAttribute('data-id');
        var booking = state.bookings.find(function(b) { return String(b.id) === String(id); });
        if (!booking) return;

        var action = btn.getAttribute('data-action');
        if (action === 'edit-booking') {
            openEditModal(booking);
        } else if (action === 'cancel-booking') {
            openCancelModal(booking);
        }
    }

    function openEditModal(booking) {
        state.editingBooking = booking;
        state.editingFieldBookings = [];
        var field = booking.field || {};

        if (el.editSummary) {
            el.editSummary.textContent = (field.name || 'Sân thể thao') + ' · ' + S.formatDate(booking.bookingDate) + ' · ' + S.formatTimeRange(booking.startTime, booking.endTime);
        }
        if (el.editDate) {
            el.editDate.min = S.formatDateForInput(new Date());
            el.editDate.value = String(booking.bookingDate || '').slice(0, 10);
        }
        if (el.editStart) el.editStart.value = S.formatTime(booking.startTime);
        if (el.editEnd) el.editEnd.value = S.formatTime(booking.endTime);
        if (el.editPhone) {
            var session = S.loadAuthSession();
            el.editPhone.value = booking.customerPhone || (session.currentUser && session.currentUser.phone) || '';
        }
        if (el.editNotes) el.editNotes.value = booking.notes || '';

        hideInlineFeedback(el.editFeedback);
        updateEditPricePreview();
        openModal(el.editModal, el.editDate);

        var fieldId = field.id || booking.fieldId;
        if (fieldId) {
            S.apiRequest('/bookings/field/' + encodeURIComponent(fieldId), { method: 'GET', token: '' })
                .then(function(list) {
                    state.editingFieldBookings = Array.isArray(list) ? list : [];
                    renderEditBookedSlots();
                })
                .catch(function() {
                    state.editingFieldBookings = [];
                    renderEditBookedSlots();
                });
        }
    }

    function renderEditBookedSlots() {
        if (!el.editSlotConflictBox || !el.editBookedSlotsList || !state.editingBooking) return;
        var dateStr = el.editDate ? el.editDate.value : '';
        var currentId = String(state.editingBooking.id);
        var others = state.editingFieldBookings.filter(function(b) {
            if (!b || String(b.id) === currentId) return false;
            if (String(b.bookingDate || '').slice(0, 10) !== dateStr) return false;
            return S.normalizeBookingStatus(b.status) !== 'CANCELLED';
        });

        if (!others.length) {
            el.editSlotConflictBox.classList.add('hidden');
            el.editBookedSlotsList.innerHTML = '';
            return;
        }

        el.editSlotConflictBox.classList.remove('hidden');
        el.editBookedSlotsList.innerHTML = others.map(function(b) {
            return '<span class="booked-slot-chip">' + S.escapeHtml(S.formatTimeRange(b.startTime, b.endTime)) + '</span>';
        }).join('');
    }

    function updateEditPricePreview() {
        if (!state.editingBooking) return;
        var field = state.editingBooking.field || {};
        var pricePerHour = Number(field.pricePerHour || 0);
        var start = el.editStart ? el.editStart.value : '';
        var end = el.editEnd ? el.editEnd.value : '';
        var hours = S.getHoursBetweenTimes(start, end);
        var total = S.calculateBookingTotal(pricePerHour, start, end);

        if (el.editDurationText) {
            el.editDurationText.textContent = hours > 0
                ? (Math.round(hours * 100) / 100) + ' giờ × ' + S.formatCurrency(pricePerHour) + ' đ'
                : 'Giờ chưa hợp lệ';
        }
        if (el.editPricePreview) {
            el.editPricePreview.textContent = S.formatCurrency(total) + ' đ';
        }
    }

    function handleEditSubmit(e) {
        e.preventDefault();
        var booking = state.editingBooking;
        if (!booking) return;

        var bookingDate = el.editDate ? el.editDate.value : '';
        var startTime = el.editStart ? el.editStart.value : '';
        var endTime = el.editEnd ? el.editEnd.value : '';
        var phone = el.editPhone ? el.editPhone.value.trim() : '';
        var notes = el.editNotes ? el.editNotes.value.trim() : '';

        if (!bookingDate || !startTime || !endTime) {
            showInlineFeedback(el.editFeedback, 'Vui lòng chọn đầy đủ ngày và giờ.', true);
            return;
        }
        if (endTime <= startTime) {
            showInlineFeedback(el.editFeedback, 'Giờ kết thúc phải sau giờ bắt đầu.', true);
            return;
        }
        var startDt = new Date(bookingDate + 'T' + startTime + ':00');
        if (isNaN(startDt.getTime()) || startDt.getTime() < Date.now()) {
            showInlineFeedback(el.editFeedback, 'Thời gian bắt đầu phải ở tương lai.', true);
            return;
        }
        if (!/^[0-9+\s().-]{9,15}$/.test(phone)) {
            showInlineFeedback(el.editFeedback, 'Số điện thoại không hợp lệ.', true);
            return;
        }

        var fieldId = (booking.field && booking.field.id) || booking.fieldId;
        var payload = {
            fieldId: fieldId,
            bookingDate: bookingDate,
            startTime: startTime,
            endTime: endTime,
            customerPhone: phone,
            notes: notes
        };

        showInlineFeedback(el.editFeedback, 'Đang lưu thay đổi...', false);
        if (el.editSubmit) el.editSubmit.disabled = true;

        S.apiRequest('/bookings/' + encodeURIComponent(booking.id), {
            method: 'PUT',
            body: JSON.stringify(payload)
        })
            .then(function() {
                closeModal(el.editModal);
                S.showToast('Đã cập nhật lịch đặt sân thành công.', 'success');
                loadMyBookings(true);
            })
            .catch(function(err) {
                showInlineFeedback(el.editFeedback, err.message || 'Không thể cập nhật booking.', true);
            })
            .then(function() {
                if (el.editSubmit) el.editSubmit.disabled = false;
            });
    }

    function openCancelModal(booking) {
        state.cancelingBooking = booking;
        var field = booking.field || {};
        if (el.cancelSummary) {
            el.cancelSummary.textContent = (field.name || 'Sân thể thao') + ' · ' + S.formatDate(booking.bookingDate) + ' · ' + S.formatTimeRange(booking.startTime, booking.endTime);
        }
        if (el.cancelReason) el.cancelReason.value = '';
        hideInlineFeedback(el.cancelFeedback);
        openModal(el.cancelModal, el.cancelReason);
    }

    function handleCancelSubmit(e) {
        e.preventDefault();
        var booking = state.cancelingBooking;
        if (!booking) return;

        var reason = el.cancelReason ? el.cancelReason.value.trim() : '';
        if (reason.length < 5) {
            showInlineFeedback(el.cancelFeedback, 'Vui lòng nhập lý do hủy (ít nhất 5 ký tự).', true);
            return;
        }

        showInlineFeedback(el.cancelFeedback, 'Đang hủy booking...', false);
        if (el.cancelSubmit) el.cancelSubmit.disabled = true;

        S.apiRequest('/bookings/' + encodeURIComponent(booking.id) + '/cancel', {
            method: 'PATCH',
            body: JSON.stringify({ reason: reason })
        })
            .then(function() {
                closeModal(el.cancelModal);
                S.showToast('Đã hủy lịch đặt sân.', 'info');
                loadMyBookings(true);
            })
            .catch(function(err) {
                showInlineFeedback(el.cancelFeedback, err.message || 'Không thể hủy booking.', true);
            })
            .then(function() {
                if (el.cancelSubmit) el.cancelSubmit.disabled = false;
            });
    }

    function openModal(modal, focusEl) {
        if (!modal) return;
        state.lastFocused = document.activeElement;
        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
        window.setTimeout(function() {
            if (focusEl) focusEl.focus();
        }, 20);
    }

    function closeModal(modal) {
        if (!modal || modal.classList.contains('hidden')) return;
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
        if (modal === el.editModal) state.editingBooking = null;
        if (modal === el.cancelModal) state.cancelingBooking = null;
        if (!document.querySelector('.modal:not(.hidden)')) {
            document.body.classList.remove('modal-open');
        }
        if (state.lastFocused && typeof state.lastFocused.focus === 'function') {
            state.lastFocused.focus();
        }
    }

    function showInlineFeedback(target, msg, isError) {
        if (!target) return;
        target.textContent = msg;
        target.className = 'booking-feedback ' + (isError ? 'error' : 'info');
    }

    function hideInlineFeedback(target) {
        if (!target) return;
        target.textContent = '';
        target.className = 'booking-feedback hidden';
    }
})();
