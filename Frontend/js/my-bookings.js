var bookingsConfig = getSportHubConfig();
var bookingsApiBaseUrl = String(bookingsConfig.apiBaseUrl || 'http://localhost:8081/api').replace(/\/+$/, '');
var bookingsSessionKey = 'sporthubAuthSession';

var bookingsState = {
    token: '',
    currentUser: null,
    bookings: [],
    editingBooking: null,
    cancelingBooking: null,
    lastFocused: null,
    feedbackTimer: null
};

var bookingsElements = {};

document.addEventListener('DOMContentLoaded', initMyBookingsPage);

function initMyBookingsPage() {
    cacheBookingsElements();
    bindBookingsEvents();
    refreshBookingsIcons();
    hydrateBookingsSession();
}

function cacheBookingsElements() {
    bookingsElements.sessionText = document.getElementById('bookings-session-text');
    bookingsElements.accessAlert = document.getElementById('bookings-access-alert');
    bookingsElements.accessText = document.getElementById('bookings-access-text');
    bookingsElements.logoutButton = document.getElementById('bookings-logout-btn');
    bookingsElements.bookingCount = document.getElementById('customer-booking-count');
    bookingsElements.confirmedCount = document.getElementById('customer-confirmed-count');
    bookingsElements.pendingCount = document.getElementById('customer-pending-count');
    bookingsElements.bookingsBody = document.getElementById('customer-bookings-body');

    bookingsElements.currentList = document.getElementById('current-bookings-list');
    bookingsElements.currentFeedback = document.getElementById('current-bookings-feedback');

    bookingsElements.editModal = document.getElementById('edit-booking-modal');
    bookingsElements.editForm = document.getElementById('edit-booking-form');
    bookingsElements.editSummary = document.getElementById('edit-booking-summary');
    bookingsElements.editDate = document.getElementById('edit-booking-date');
    bookingsElements.editStart = document.getElementById('edit-booking-start');
    bookingsElements.editEnd = document.getElementById('edit-booking-end');
    bookingsElements.editPhone = document.getElementById('edit-booking-phone');
    bookingsElements.editNotes = document.getElementById('edit-booking-notes');
    bookingsElements.editFeedback = document.getElementById('edit-booking-feedback');
    bookingsElements.editSubmit = document.getElementById('edit-booking-submit');

    bookingsElements.cancelModal = document.getElementById('cancel-booking-modal');
    bookingsElements.cancelForm = document.getElementById('cancel-booking-form');
    bookingsElements.cancelSummary = document.getElementById('cancel-booking-summary');
    bookingsElements.cancelReason = document.getElementById('cancel-booking-reason');
    bookingsElements.cancelFeedback = document.getElementById('cancel-booking-feedback');
    bookingsElements.cancelSubmit = document.getElementById('cancel-booking-submit');
}

function bindBookingsEvents() {
    if (bookingsElements.logoutButton) {
        bookingsElements.logoutButton.addEventListener('click', function() {
            localStorage.removeItem(bookingsSessionKey);
            window.location.href = 'index.html';
        });
    }

    if (bookingsElements.currentList) {
        bookingsElements.currentList.addEventListener('click', handleCurrentListClick);
    }

    if (bookingsElements.editForm) {
        bookingsElements.editForm.addEventListener('submit', handleEditSubmit);
    }

    if (bookingsElements.cancelForm) {
        bookingsElements.cancelForm.addEventListener('submit', handleCancelSubmit);
    }

    if (bookingsElements.cancelReason) {
        bookingsElements.cancelReason.addEventListener('input', function() {
            hideInlineFeedback(bookingsElements.cancelFeedback);
        });
    }

    if (bookingsElements.editForm) {
        bookingsElements.editForm.addEventListener('input', function() {
            hideInlineFeedback(bookingsElements.editFeedback);
        });
    }

    [bookingsElements.editModal, bookingsElements.cancelModal].forEach(function(modal) {
        if (!modal) {
            return;
        }

        modal.addEventListener('click', function(event) {
            if (event.target === modal || (event.target.closest && event.target.closest('[data-close-modal]'))) {
                closeBookingsModal(modal);
            }
        });
    });

    document.addEventListener('keydown', function(event) {
        if (event.key === 'Escape') {
            closeBookingsModal(bookingsElements.editModal);
            closeBookingsModal(bookingsElements.cancelModal);
        }
    });
}

function hydrateBookingsSession() {
    var rawSession = localStorage.getItem(bookingsSessionKey);

    if (!rawSession) {
        return denyBookingsAccess('Không tìm thấy phiên đăng nhập. Vui lòng đăng nhập lại.');
    }

    try {
        var parsedSession = JSON.parse(rawSession);
        bookingsState.token = parsedSession && parsedSession.token ? parsedSession.token : '';
        bookingsState.currentUser = parsedSession && parsedSession.currentUser ? parsedSession.currentUser : null;
    } catch (error) {
        return denyBookingsAccess('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
    }

    if (!bookingsState.token) {
        return denyBookingsAccess('Thiếu access token. Vui lòng đăng nhập lại.');
    }

    verifyCustomerSession();
}

function verifyCustomerSession() {
    fetch(bookingsApiBaseUrl + '/auth/me', {
        method: 'GET',
        headers: createBookingsHeaders()
    })
        .then(handleBookingsJsonResponse)
        .then(function(user) {
            if (!user || String(user.role || '').toUpperCase() !== 'CUSTOMER') {
                throw new Error('Tài khoản hiện tại không phải customer.');
            }

            bookingsState.currentUser = user;
            if (bookingsElements.sessionText) {
                bookingsElements.sessionText.textContent = 'Đang đăng nhập: ' + (user.fullName || user.email);
            }
            hideBookingsAccessAlert();
            loadMyBookings(false);
        })
        .catch(function(error) {
            denyBookingsAccess(error.message || 'Không thể xác minh phiên đăng nhập customer.');
        });
}

function loadMyBookings(silent) {
    if (!bookingsElements.bookingsBody) {
        return;
    }

    if (!silent) {
        bookingsElements.bookingsBody.innerHTML = '<tr><td colspan="6" class="table-empty">Đang tải lịch sử booking...</td></tr>';
        if (bookingsElements.currentList) {
            bookingsElements.currentList.innerHTML = '<p class="table-empty">Đang tải booking hiện tại...</p>';
        }
    }

    fetch(bookingsApiBaseUrl + '/bookings/me', {
        method: 'GET',
        headers: createBookingsHeaders()
    })
        .then(handleBookingsJsonResponse)
        .then(function(data) {
            bookingsState.bookings = Array.isArray(data) ? data : [];
            renderBookingsSummary();
            renderCurrentBookings();
            renderBookingsTable();
        })
        .catch(function(error) {
            if (silent) {
                showCurrentFeedback(error.message || 'Không thể tải lại danh sách booking.', true);
                return;
            }
            denyBookingsAccess(error.message || 'Không thể tải lịch sử booking.');
        });
}

function renderBookingsSummary() {
    var list = Array.isArray(bookingsState.bookings) ? bookingsState.bookings : [];
    var confirmed = list.filter(function(booking) {
        return normalizeStatus(booking.status) === 'CONFIRMED';
    }).length;
    var pending = list.filter(function(booking) {
        return normalizeStatus(booking.status) === 'PENDING';
    }).length;

    if (bookingsElements.bookingCount) bookingsElements.bookingCount.textContent = String(list.length);
    if (bookingsElements.confirmedCount) bookingsElements.confirmedCount.textContent = String(confirmed);
    if (bookingsElements.pendingCount) bookingsElements.pendingCount.textContent = String(pending);
}

// ================================================================
// Booking hiện tại (sửa / hủy)
// ================================================================

function renderCurrentBookings() {
    if (!bookingsElements.currentList) {
        return;
    }

    var current = (Array.isArray(bookingsState.bookings) ? bookingsState.bookings : [])
        .filter(isCurrentBooking)
        .sort(function(a, b) {
            return getBookingStart(a) - getBookingStart(b);
        });

    if (!current.length) {
        bookingsElements.currentList.innerHTML = '<p class="table-empty">Bạn chưa có booking nào sắp tới.</p>';
        return;
    }

    bookingsElements.currentList.innerHTML = current.map(function(booking) {
        var field = booking.field || {};
        var status = normalizeStatus(booking.status);
        var id = escapeHtml(booking.id);
        var noteText = booking.notes ? escapeHtml(booking.notes) : 'Không có ghi chú';

        return [
            '<article class="current-booking-card ', status === 'CONFIRMED' ? 'is-confirmed' : 'is-pending', '">',
            '<div class="current-booking-head">',
            '<h4>', escapeHtml(field.name || 'Sân thể thao'), '</h4>',
            '<span class="booking-status ', getStatusClass(status), '">', escapeHtml(status), '</span>',
            '</div>',
            '<div class="current-booking-meta">',
            '<span><i data-lucide="calendar" class="field-inline-icon"></i>', escapeHtml(formatDate(booking.bookingDate)), '</span>',
            '<span><i data-lucide="clock" class="field-inline-icon"></i>', escapeHtml(formatTimeRange(booking.startTime, booking.endTime)), '</span>',
            '<span><i data-lucide="wallet" class="field-inline-icon"></i>', escapeHtml(formatCurrency(booking.totalPrice || 0)), ' VND</span>',
            '<span><i data-lucide="sticky-note" class="field-inline-icon"></i>', noteText, '</span>',
            '</div>',
            '<div class="current-booking-actions">',
            '<button class="btn btn-secondary btn-compact" type="button" data-action="edit-booking" data-id="', id, '">Sửa</button>',
            '<button class="btn btn-secondary btn-compact btn-danger-soft" type="button" data-action="cancel-booking" data-id="', id, '">Hủy booking</button>',
            '</div>',
            '</article>'
        ].join('');
    }).join('');

    refreshBookingsIcons();
}

function handleCurrentListClick(event) {
    var button = event.target.closest ? event.target.closest('[data-action]') : null;
    if (!button) {
        return;
    }

    var booking = findBookingById(button.getAttribute('data-id'));
    if (!booking) {
        return;
    }

    var action = button.getAttribute('data-action');
    if (action === 'edit-booking') {
        openEditModal(booking);
    } else if (action === 'cancel-booking') {
        openCancelModal(booking);
    }
}

function findBookingById(id) {
    var list = Array.isArray(bookingsState.bookings) ? bookingsState.bookings : [];
    for (var i = 0; i < list.length; i++) {
        if (String(list[i].id) === String(id)) {
            return list[i];
        }
    }
    return null;
}

function isCurrentBooking(booking) {
    var status = normalizeStatus(booking.status);
    if (status !== 'CONFIRMED' && status !== 'PENDING') {
        return false;
    }

    var end = getBookingEnd(booking);
    return !!end && end.getTime() >= Date.now();
}

function getBookingStart(booking) {
    var parsed = parseBookingDateTime(booking.bookingDate, booking.startTime, '00:00');
    return parsed ? parsed.getTime() : 0;
}

function getBookingEnd(booking) {
    return parseBookingDateTime(booking.bookingDate, booking.endTime, '23:59');
}

function parseBookingDateTime(dateValue, timeValue, fallbackTime) {
    var datePart = String(dateValue || '').slice(0, 10);
    var timePart = String(timeValue || fallbackTime).slice(0, 5);
    var parsed = new Date(datePart + 'T' + timePart + ':00');
    return isNaN(parsed.getTime()) ? null : parsed;
}

function getBookingSummaryText(booking) {
    var field = booking.field || {};
    return (field.name || 'Sân thể thao') + ' · ' + formatDate(booking.bookingDate) + ' · ' + formatTimeRange(booking.startTime, booking.endTime);
}

function getBookingFieldId(booking) {
    if (booking.fieldId != null) {
        return booking.fieldId;
    }
    if (booking.field && booking.field.id != null) {
        return booking.field.id;
    }
    return null;
}

// ---------- Sửa booking ----------

function openEditModal(booking) {
    bookingsState.editingBooking = booking;

    bookingsElements.editSummary.textContent = getBookingSummaryText(booking);
    bookingsElements.editDate.min = getTodayString();
    bookingsElements.editDate.value = String(booking.bookingDate || '').slice(0, 10);
    bookingsElements.editStart.value = String(booking.startTime || '').slice(0, 5);
    bookingsElements.editEnd.value = String(booking.endTime || '').slice(0, 5);
    bookingsElements.editPhone.value = booking.customerPhone || booking.phone ||
        (bookingsState.currentUser && (bookingsState.currentUser.phone || bookingsState.currentUser.phoneNumber)) || '';
    bookingsElements.editNotes.value = booking.notes || '';

    hideInlineFeedback(bookingsElements.editFeedback);
    openBookingsModal(bookingsElements.editModal, bookingsElements.editDate);
}

function handleEditSubmit(event) {
    event.preventDefault();

    var booking = bookingsState.editingBooking;
    if (!booking) {
        return;
    }

    var bookingDate = bookingsElements.editDate.value;
    var startTime = bookingsElements.editStart.value;
    var endTime = bookingsElements.editEnd.value;
    var phone = bookingsElements.editPhone.value.trim();
    var notes = bookingsElements.editNotes.value.trim();

    var validationMessage = validateEditForm(bookingDate, startTime, endTime, phone);
    if (validationMessage) {
        showInlineFeedback(bookingsElements.editFeedback, validationMessage, true);
        return;
    }

    var payload = {
        bookingDate: bookingDate,
        startTime: startTime,
        endTime: endTime,
        customerPhone: phone,
        notes: notes
    };

    var fieldId = getBookingFieldId(booking);
    if (fieldId != null) {
        payload.fieldId = fieldId;
    }

    showInlineFeedback(bookingsElements.editFeedback, 'Đang lưu thay đổi...', false);
    bookingsElements.editSubmit.disabled = true;

    fetch(bookingsApiBaseUrl + '/bookings/' + encodeURIComponent(booking.id), {
        method: 'PUT',
        headers: createBookingsHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload)
    })
        .then(handleBookingsActionResponse)
        .then(function() {
            closeBookingsModal(bookingsElements.editModal);
            showCurrentFeedback('Đã cập nhật booking thành công.', false);
            loadMyBookings(true);
        })
        .catch(function(error) {
            showInlineFeedback(bookingsElements.editFeedback, error.message || 'Không thể cập nhật booking.', true);
        })
        .then(function() {
            bookingsElements.editSubmit.disabled = false;
        });
}

function validateEditForm(bookingDate, startTime, endTime, phone) {
    if (!bookingDate || !startTime || !endTime) {
        return 'Vui lòng nhập đầy đủ ngày và giờ.';
    }

    if (endTime <= startTime) {
        return 'Giờ kết thúc phải sau giờ bắt đầu.';
    }

    var start = new Date(bookingDate + 'T' + startTime + ':00');
    if (isNaN(start.getTime()) || start.getTime() < Date.now()) {
        return 'Thời gian bắt đầu phải ở tương lai.';
    }

    if (!/^[0-9+\s().-]{9,15}$/.test(phone)) {
        return 'Số điện thoại không hợp lệ.';
    }

    return '';
}

// ---------- Hủy booking ----------

function openCancelModal(booking) {
    bookingsState.cancelingBooking = booking;

    bookingsElements.cancelSummary.textContent = getBookingSummaryText(booking);
    bookingsElements.cancelReason.value = '';

    hideInlineFeedback(bookingsElements.cancelFeedback);
    openBookingsModal(bookingsElements.cancelModal, bookingsElements.cancelReason);
}

function handleCancelSubmit(event) {
    event.preventDefault();

    var booking = bookingsState.cancelingBooking;
    if (!booking) {
        return;
    }

    var reason = bookingsElements.cancelReason.value.trim();
    if (reason.length < 5) {
        showInlineFeedback(bookingsElements.cancelFeedback, 'Vui lòng nhập lý do hủy (ít nhất 5 ký tự).', true);
        return;
    }

    showInlineFeedback(bookingsElements.cancelFeedback, 'Đang hủy booking...', false);
    bookingsElements.cancelSubmit.disabled = true;

    fetch(bookingsApiBaseUrl + '/bookings/' + encodeURIComponent(booking.id) + '/cancel', {
        method: 'PATCH',
        headers: createBookingsHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ reason: reason })
    })
        .then(handleBookingsActionResponse)
        .then(function() {
            closeBookingsModal(bookingsElements.cancelModal);
            showCurrentFeedback('Đã hủy booking.', false);
            loadMyBookings(true);
        })
        .catch(function(error) {
            showInlineFeedback(bookingsElements.cancelFeedback, error.message || 'Không thể hủy booking.', true);
        })
        .then(function() {
            bookingsElements.cancelSubmit.disabled = false;
        });
}

// ---------- Modal & feedback ----------

function openBookingsModal(modal, focusTarget) {
    if (!modal) {
        return;
    }

    bookingsState.lastFocused = document.activeElement;
    modal.classList.remove('hidden');
    modal.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');

    window.setTimeout(function() {
        if (focusTarget) {
            focusTarget.focus();
        }
    }, 30);
}

function closeBookingsModal(modal) {
    if (!modal || modal.classList.contains('hidden')) {
        return;
    }

    modal.classList.add('hidden');
    modal.setAttribute('aria-hidden', 'true');

    if (modal === bookingsElements.editModal) {
        bookingsState.editingBooking = null;
    }
    if (modal === bookingsElements.cancelModal) {
        bookingsState.cancelingBooking = null;
    }

    var anyOpen = document.querySelector('.modal:not(.hidden)');
    if (!anyOpen) {
        document.body.classList.remove('modal-open');
    }

    if (bookingsState.lastFocused && typeof bookingsState.lastFocused.focus === 'function') {
        bookingsState.lastFocused.focus();
    }
}

function showInlineFeedback(element, message, isError) {
    if (!element) {
        return;
    }

    element.textContent = message;
    element.className = 'booking-feedback ' + (isError ? 'error' : 'success');
}

function hideInlineFeedback(element) {
    if (!element) {
        return;
    }

    element.textContent = '';
    element.className = 'booking-feedback hidden';
}

function showCurrentFeedback(message, isError) {
    if (!bookingsElements.currentFeedback) {
        return;
    }

    showInlineFeedback(bookingsElements.currentFeedback, message, isError);

    if (bookingsState.feedbackTimer) {
        window.clearTimeout(bookingsState.feedbackTimer);
    }
    bookingsState.feedbackTimer = window.setTimeout(function() {
        hideInlineFeedback(bookingsElements.currentFeedback);
    }, 6000);
}

// ================================================================
// Lịch sử đặt sân
// ================================================================

function renderBookingsTable() {
    if (!bookingsElements.bookingsBody) {
        return;
    }

    var list = (Array.isArray(bookingsState.bookings) ? bookingsState.bookings : [])
        .filter(function(booking) {
            return !isCurrentBooking(booking);
        })
        .sort(function(a, b) {
            return getBookingStart(b) - getBookingStart(a);
        });

    if (!list.length) {
        bookingsElements.bookingsBody.innerHTML = '<tr><td colspan="6" class="table-empty">Chưa có booking nào đã diễn ra hoặc đã hủy.</td></tr>';
        return;
    }

    bookingsElements.bookingsBody.innerHTML = list.map(function(booking) {
        var field = booking.field || {};
        var status = normalizeStatus(booking.status);
        return [
            '<tr>',
            '<td>', escapeHtml(field.name || 'Sân thể thao'), '</td>',
            '<td>', escapeHtml(formatDate(booking.bookingDate)), '</td>',
            '<td>', escapeHtml(formatTimeRange(booking.startTime, booking.endTime)), '</td>',
            '<td><span class="booking-status ', getStatusClass(status), '">', escapeHtml(status), '</span></td>',
            '<td>', escapeHtml(formatCurrency(booking.totalPrice || 0)), '</td>',
            '<td>', escapeHtml(getBookingNote(booking, status)), '</td>',
            '</tr>'
        ].join('');
    }).join('');
}

function getBookingNote(booking, status) {
    if (status === 'CANCELLED' && booking.cancelReason) {
        return 'Lý do hủy: ' + booking.cancelReason;
    }
    return booking.notes || 'Không có ghi chú';
}

function denyBookingsAccess(message) {
    if (bookingsElements.sessionText) {
        bookingsElements.sessionText.textContent = 'Chưa thể truy cập lịch sử đặt sân.';
    }
    if (bookingsElements.accessText) {
        bookingsElements.accessText.textContent = message;
    }
    if (bookingsElements.accessAlert) {
        bookingsElements.accessAlert.classList.remove('hidden');
    }
}

function hideBookingsAccessAlert() {
    if (bookingsElements.accessAlert) {
        bookingsElements.accessAlert.classList.add('hidden');
    }
}

function createBookingsHeaders(extraHeaders) {
    var headers = {
        Accept: 'application/json',
        Authorization: 'Bearer ' + bookingsState.token
    };

    if (extraHeaders) {
        Object.keys(extraHeaders).forEach(function(key) {
            headers[key] = extraHeaders[key];
        });
    }

    return headers;
}

function handleBookingsJsonResponse(response) {
    if (!response.ok) {
        return response.json()
            .catch(function() {
                return {};
            })
            .then(function(errorBody) {
                throw new Error(errorBody.message || ('HTTP error! status: ' + response.status));
            });
    }

    return response.json();
}

// Dùng cho PUT/PATCH: backend có thể trả 204 (không có body)
function handleBookingsActionResponse(response) {
    if (!response.ok) {
        return response.json()
            .catch(function() {
                return {};
            })
            .then(function(errorBody) {
                var message = errorBody.message || errorBody.title;
                if (!message && (response.status === 404 || response.status === 405)) {
                    message = 'Backend chưa hỗ trợ chức năng này (HTTP ' + response.status + ').';
                }
                throw new Error(message || ('HTTP error! status: ' + response.status));
            });
    }

    return response.text().then(function(text) {
        if (!text) {
            return null;
        }
        try {
            return JSON.parse(text);
        } catch (error) {
            return null;
        }
    });
}

function normalizeStatus(status) {
    var value = String(status || 'PENDING').toUpperCase();
    if (value === 'DONE' || value === 'APPROVED') {
        return 'CONFIRMED';
    }
    return value;
}

function getStatusClass(status) {
    if (status === 'CONFIRMED') {
        return 'success';
    }
    if (status === 'CANCELLED') {
        return 'error';
    }
    return 'pending';
}

function getTodayString() {
    var now = new Date();
    var month = ('0' + (now.getMonth() + 1)).slice(-2);
    var day = ('0' + now.getDate()).slice(-2);
    return now.getFullYear() + '-' + month + '-' + day;
}

function formatCurrency(value) {
    return new Intl.NumberFormat('vi-VN').format(Number(value || 0));
}

function formatDate(value) {
    if (!value) {
        return '--';
    }

    return new Date(value).toLocaleDateString('vi-VN');
}

function formatTimeRange(startTime, endTime) {
    return String(startTime || '--:--').slice(0, 5) + ' - ' + String(endTime || '--:--').slice(0, 5);
}

function escapeHtml(text) {
    return String(text == null ? '' : text).replace(/[&<>"']/g, function(character) {
        var map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#039;'
        };
        return map[character];
    });
}

function refreshBookingsIcons() {
    if (!window.lucide || typeof window.lucide.createIcons !== 'function') {
        return;
    }

    window.lucide.createIcons({
        attrs: {
            'stroke-width': 1.8
        }
    });
}
