var adminConfig = getSportHubConfig();
var adminApiBaseUrl = String(adminConfig.apiBaseUrl || 'http://localhost:8081/api').replace(/\/+$/, '');
var authSessionKey = 'sporthubAuthSession';
var sportTypeMap = {
    FOOTBALL: 'Bóng đá',
    VOLLEYBALL: 'Bóng chuyền',
    BADMINTON: 'Cầu lông',
    BASKETBALL: 'Bóng rổ',
    TENNIS: 'Tennis'
};

var adminState = {
    token: '',
    currentUser: null,
    fields: [],
    bookings: [],
    revenueSummary: null,
    editingFieldId: null
};

var adminElements = {};

document.addEventListener('DOMContentLoaded', initAdminPage);

function initAdminPage() {
    cacheAdminElements();
    bindAdminEvents();
    refreshAdminIcons();
    hydrateAdminSession();
}

function cacheAdminElements() {
    adminElements.sessionText = document.getElementById('admin-session-text');
    adminElements.accessAlert = document.getElementById('admin-access-alert');
    adminElements.accessText = document.getElementById('admin-access-text');
    adminElements.logoutButton = document.getElementById('admin-logout-btn');
    adminElements.revenue = document.getElementById('dashboard-revenue');
    adminElements.bookings = document.getElementById('dashboard-bookings');
    adminElements.confirmed = document.getElementById('dashboard-confirmed');
    adminElements.bookingsTableBody = document.getElementById('bookings-table-body');
    adminElements.fieldsTableBody = document.getElementById('fields-table-body');
    adminElements.fieldForm = document.getElementById('field-form');
    adminElements.fieldFormReset = document.getElementById('field-form-reset');
    adminElements.fieldFormFeedback = document.getElementById('field-form-feedback');
    adminElements.fieldId = document.getElementById('field-id');
    adminElements.fieldName = document.getElementById('field-name');
    adminElements.fieldSport = document.getElementById('field-sport');
    adminElements.fieldLocation = document.getElementById('field-location');
    adminElements.fieldCity = document.getElementById('field-city');
    adminElements.fieldProvince = document.getElementById('field-province');
    adminElements.fieldPrice = document.getElementById('field-price');
    adminElements.fieldCapacity = document.getElementById('field-capacity');
    adminElements.fieldOwnerId = document.getElementById('field-owner-id');
    adminElements.fieldImageUrl = document.getElementById('field-image-url');
    adminElements.fieldImageFile = document.getElementById('field-image-file');
    adminElements.fieldImagePreview = document.getElementById('field-image-preview');
    adminElements.fieldDescription = document.getElementById('field-description');
    adminElements.fieldAvailable = document.getElementById('field-available');
}

function bindAdminEvents() {
    if (adminElements.logoutButton) {
        adminElements.logoutButton.addEventListener('click', function() {
            localStorage.removeItem(authSessionKey);
            window.location.href = 'index.html';
        });
    }

    if (adminElements.fieldForm) {
        adminElements.fieldForm.addEventListener('submit', handleFieldFormSubmit);
    }

    if (adminElements.fieldFormReset) {
        adminElements.fieldFormReset.addEventListener('click', resetFieldForm);
    }

    if (adminElements.fieldImageFile) {
        adminElements.fieldImageFile.addEventListener('change', handleFieldImageSelection);
    }

    if (adminElements.fieldImageUrl) {
        adminElements.fieldImageUrl.addEventListener('input', function() {
            renderFieldImagePreview(this.value);
        });
    }
}

function hydrateAdminSession() {
    var rawSession = localStorage.getItem(authSessionKey);

    if (!rawSession) {
        return denyAdminAccess('Không tìm thấy phiên đăng nhập. Vui lòng đăng nhập lại bằng tài khoản admin.');
    }

    try {
        var parsedSession = JSON.parse(rawSession);
        adminState.token = parsedSession && parsedSession.token ? parsedSession.token : '';
        adminState.currentUser = parsedSession && parsedSession.currentUser ? parsedSession.currentUser : null;
    } catch (error) {
        return denyAdminAccess('Phiên đăng nhập không hợp lệ. Vui lòng đăng nhập lại.');
    }

    if (!adminState.token) {
        return denyAdminAccess('Thiếu access token admin. Vui lòng đăng nhập lại.');
    }

    verifyAdmin();
}

function verifyAdmin() {
    fetch(adminApiBaseUrl + '/auth/me', {
        method: 'GET',
        headers: createAdminHeaders()
    })
        .then(handleAdminJsonResponse)
        .then(function(user) {
            if (!user || String(user.role || '').toUpperCase() !== 'ADMIN') {
                throw new Error('Tài khoản hiện tại không có quyền admin.');
            }

            adminState.currentUser = user;
            syncDefaultOwnerId();
            if (adminElements.sessionText) {
                adminElements.sessionText.textContent = 'Đang đăng nhập với quyền admin: ' + (user.fullName || user.email);
            }
            hideAdminAccessAlert();
            loadAdminData();
        })
        .catch(function(error) {
            denyAdminAccess(error.message || 'Không thể xác minh quyền admin.');
        });
}

function loadAdminData() {
    Promise.all([
        fetch(adminApiBaseUrl + '/admin/revenue/summary', {
            method: 'GET',
            headers: createAdminHeaders()
        }).then(handleAdminJsonResponse),
        fetch(adminApiBaseUrl + '/admin/bookings', {
            method: 'GET',
            headers: createAdminHeaders()
        }).then(handleAdminJsonResponse),
        fetch(adminApiBaseUrl + '/fields', {
            method: 'GET',
            headers: createAdminHeaders()
        }).then(handleAdminJsonResponse)
    ])
        .then(function(results) {
            adminState.revenueSummary = results[0] || {};
            adminState.bookings = Array.isArray(results[1]) ? results[1] : [];
            adminState.fields = Array.isArray(results[2]) ? results[2] : [];
            renderAdminSummary();
            renderBookingsTable();
            renderFieldsTable();
        })
        .catch(function(error) {
            denyAdminAccess(error.message || 'Không thể tải dữ liệu admin.');
        });
}

function handleFieldFormSubmit(event) {
    event.preventDefault();

    var ownerId = parseOptionalInteger(valueOf(adminElements.fieldOwnerId));
    if (!ownerId && adminState.currentUser && adminState.currentUser.id) {
        ownerId = adminState.currentUser.id;
    }

    var payload = {
        name: valueOf(adminElements.fieldName),
        sportType: valueOf(adminElements.fieldSport),
        location: valueOf(adminElements.fieldLocation),
        city: valueOf(adminElements.fieldCity),
        province: valueOf(adminElements.fieldProvince),
        pricePerHour: Number(valueOf(adminElements.fieldPrice) || 0),
        capacity: parseOptionalInteger(valueOf(adminElements.fieldCapacity)),
        ownerId: ownerId,
        description: valueOf(adminElements.fieldDescription),
        isAvailable: !!(adminElements.fieldAvailable && adminElements.fieldAvailable.checked)
    };

    if (!payload.name || !payload.sportType || !payload.location || !payload.pricePerHour) {
        return showFieldFormFeedback('Vui lòng nhập đủ tên sân, loại thể thao, địa chỉ và giá.', true);
    }

    var fieldId = adminState.editingFieldId;
    var url = fieldId ? adminApiBaseUrl + '/fields/' + fieldId : adminApiBaseUrl + '/fields';
    var method = fieldId ? 'PUT' : 'POST';

    showFieldFormFeedback(fieldId ? 'Đang cập nhật sân...' : 'Đang tạo sân...', false);

    fetch(url, {
        method: method,
        headers: createAdminHeaders({
            'Content-Type': 'application/json'
        }),
        body: JSON.stringify(payload)
    })
        .then(handleAdminJsonResponse)
        .then(function(createdField) {
            // After field is created/updated, upload image if one was selected
            var imageFile = adminElements.fieldImageFile && adminElements.fieldImageFile.files 
                ? adminElements.fieldImageFile.files[0] 
                : null;

            if (imageFile && createdField && createdField.id) {
                return uploadFieldImage(createdField.id, imageFile);
            }
            return createdField;
        })
        .then(function() {
            showFieldFormFeedback(fieldId ? 'Đã cập nhật sân.' : 'Đã tạo sân mới.', false);
            resetFieldForm();
            loadAdminData();
        })
        .catch(function(error) {
            showFieldFormFeedback(error.message || 'Không thể lưu sân.', true);
        });
}

function editField(fieldId) {
    var field = adminState.fields.find(function(item) {
        return String(item.id) === String(fieldId);
    });

    if (!field) {
        return;
    }

    adminState.editingFieldId = field.id;
    if (adminElements.fieldId) adminElements.fieldId.value = field.id || '';
    if (adminElements.fieldName) adminElements.fieldName.value = field.name || '';
    if (adminElements.fieldSport) adminElements.fieldSport.value = field.sportType || 'FOOTBALL';
    if (adminElements.fieldLocation) adminElements.fieldLocation.value = field.location || '';
    if (adminElements.fieldCity) adminElements.fieldCity.value = field.city || '';
    if (adminElements.fieldProvince) adminElements.fieldProvince.value = field.province || '';
    if (adminElements.fieldPrice) adminElements.fieldPrice.value = field.pricePerHour || '';
    if (adminElements.fieldCapacity) adminElements.fieldCapacity.value = field.capacity || '';
    if (adminElements.fieldOwnerId) adminElements.fieldOwnerId.value = field.ownerId || '';
    if (adminElements.fieldImageUrl) adminElements.fieldImageUrl.value = field.imageUrl || '';
    if (adminElements.fieldImageFile) adminElements.fieldImageFile.value = '';
    if (adminElements.fieldDescription) adminElements.fieldDescription.value = field.description || '';
    if (adminElements.fieldAvailable) adminElements.fieldAvailable.checked = field.isAvailable !== false;
    renderFieldImagePreview(field.imageUrl || '');

    showFieldFormFeedback('Đang chỉnh sửa sân #' + field.id, false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function deleteField(fieldId) {
    if (!window.confirm('Xóa sân này? Hành động này không thể hoàn tác.')) {
        return;
    }

    fetch(adminApiBaseUrl + '/fields/' + fieldId, {
        method: 'DELETE',
        headers: createAdminHeaders()
    })
        .then(function(response) {
            if (!response.ok) {
                return handleAdminJsonResponse(response);
            }
            return null;
        })
        .then(function() {
            if (String(adminState.editingFieldId) === String(fieldId)) {
                resetFieldForm();
            }
            loadAdminData();
        })
        .catch(function(error) {
            showFieldFormFeedback(error.message || 'Không thể xóa sân.', true);
        });
}

function resetFieldForm() {
    adminState.editingFieldId = null;
    if (adminElements.fieldForm) adminElements.fieldForm.reset();
    if (adminElements.fieldAvailable) adminElements.fieldAvailable.checked = true;
    if (adminElements.fieldSport) adminElements.fieldSport.value = 'FOOTBALL';
    if (adminElements.fieldId) adminElements.fieldId.value = '';
    if (adminElements.fieldImageFile) adminElements.fieldImageFile.value = '';
    syncDefaultOwnerId();
    renderFieldImagePreview('');
    showFieldFormFeedback('', false);
}

function syncDefaultOwnerId() {
    if (!adminElements.fieldOwnerId) {
        return;
    }

    if (adminState.editingFieldId) {
        return;
    }

    var currentValue = valueOf(adminElements.fieldOwnerId);
    if (currentValue) {
        return;
    }

    if (adminState.currentUser && adminState.currentUser.id) {
        adminElements.fieldOwnerId.value = String(adminState.currentUser.id);
    }
}

function renderAdminSummary() {
    var summary = adminState.revenueSummary || {};
    if (adminElements.revenue) adminElements.revenue.textContent = formatCurrency(summary.totalRevenue || 0);
    if (adminElements.bookings) adminElements.bookings.textContent = String(summary.totalBookings || 0);
    if (adminElements.confirmed) adminElements.confirmed.textContent = String(summary.confirmedBookings || 0);
}

function renderBookingsTable() {
    if (!adminElements.bookingsTableBody) {
        return;
    }

    if (!adminState.bookings.length) {
        adminElements.bookingsTableBody.innerHTML = '<tr><td colspan="6" class="table-empty">Chưa có booking nào.</td></tr>';
        return;
    }

    adminElements.bookingsTableBody.innerHTML = adminState.bookings.slice(0, 30).map(function(booking) {
        var user = booking.user || {};
        var field = booking.field || {};
        var status = String(booking.status || 'PENDING').toUpperCase();
        var actionButton = status === 'CONFIRMED'
            ? '<span class="admin-inline-note">Đã xác nhận</span>'
            : '<button class="btn btn-secondary btn-compact" type="button" data-action="confirm-booking" data-id="' + booking.id + '">Xác nhận</button>';
        return [
            '<tr>',
            '<td>', escapeHtml(user.fullName || user.email || 'Khách'), '</td>',
            '<td>', escapeHtml(field.name || 'Sân thể thao'), '</td>',
            '<td>', escapeHtml(formatDate(booking.bookingDate)), '</td>',
            '<td>', escapeHtml(formatTimeRange(booking.startTime, booking.endTime)), '</td>',
            '<td><span class="booking-status ', getStatusClass(status), '">', escapeHtml(status), '</span></td>',
            '<td>', escapeHtml(formatCurrency(booking.totalPrice || 0)), '</td>',
            '<td class="admin-actions-cell">', actionButton, '</td>',
            '</tr>'
        ].join('');
    }).join('');

    Array.prototype.forEach.call(adminElements.bookingsTableBody.querySelectorAll('button[data-action="confirm-booking"]'), function(button) {
        button.addEventListener('click', function() {
            confirmBooking(this.getAttribute('data-id'));
        });
    });
}

function renderFieldsTable() {
    if (!adminElements.fieldsTableBody) {
        return;
    }

    if (!adminState.fields.length) {
        adminElements.fieldsTableBody.innerHTML = '<tr><td colspan="6" class="table-empty">Chưa có sân nào.</td></tr>';
        return;
    }

    adminElements.fieldsTableBody.innerHTML = adminState.fields.map(function(field) {
        return [
            '<tr>',
            '<td>', escapeHtml(String(field.id || '')), '</td>',
            '<td>', escapeHtml(field.name || ''), '</td>',
            '<td>', escapeHtml(sportTypeMap[field.sportType] || field.sportType || ''), '</td>',
            '<td>', escapeHtml(formatCurrency(field.pricePerHour || 0)), '</td>',
            '<td>', field.isAvailable === false ? 'Không' : 'Có', '</td>',
            '<td class="admin-actions-cell">',
            '<button class="btn btn-secondary btn-compact" type="button" data-action="edit" data-id="', field.id, '">Sửa</button>',
            '<button class="btn btn-secondary btn-compact btn-danger-soft" type="button" data-action="delete" data-id="', field.id, '">Xóa</button>',
            '</td>',
            '</tr>'
        ].join('');
    }).join('');

    Array.prototype.forEach.call(adminElements.fieldsTableBody.querySelectorAll('button[data-action="edit"]'), function(button) {
        button.addEventListener('click', function() {
            editField(this.getAttribute('data-id'));
        });
    });

    Array.prototype.forEach.call(adminElements.fieldsTableBody.querySelectorAll('button[data-action="delete"]'), function(button) {
        button.addEventListener('click', function() {
            deleteField(this.getAttribute('data-id'));
        });
    });
}

function denyAdminAccess(message) {
    if (adminElements.sessionText) {
        adminElements.sessionText.textContent = 'Chưa thể truy cập trang quản trị.';
    }
    if (adminElements.accessText) {
        adminElements.accessText.textContent = message;
    }
    if (adminElements.accessAlert) {
        adminElements.accessAlert.classList.remove('hidden');
    }
}

function hideAdminAccessAlert() {
    if (adminElements.accessAlert) {
        adminElements.accessAlert.classList.add('hidden');
    }
}

function showFieldFormFeedback(message, isError) {
    if (!adminElements.fieldFormFeedback) {
        return;
    }

    if (!message) {
        adminElements.fieldFormFeedback.textContent = '';
        adminElements.fieldFormFeedback.className = 'booking-feedback hidden';
        return;
    }

    adminElements.fieldFormFeedback.textContent = message;
    adminElements.fieldFormFeedback.className = 'booking-feedback ' + (isError ? 'error' : 'success');
}

function handleFieldImageSelection(event) {
    var file = event.target && event.target.files ? event.target.files[0] : null;
    if (!file) {
        return;
    }

    if (!/^image\//.test(file.type)) {
        showFieldFormFeedback('Vui lòng chọn file ảnh hợp lệ.', true);
        return;
    }

    var reader = new FileReader();
    reader.onload = function(loadEvent) {
        var dataUrl = loadEvent && loadEvent.target ? loadEvent.target.result : '';
        if (adminElements.fieldImageUrl) {
            adminElements.fieldImageUrl.value = dataUrl;
        }
        renderFieldImagePreview(dataUrl);
        showFieldFormFeedback('Đã nạp ảnh từ máy. Ảnh sẽ được lưu cùng thông tin sân.', false);
    };
    reader.readAsDataURL(file);
}

function renderFieldImagePreview(imageUrl) {
    if (!adminElements.fieldImagePreview) {
        return;
    }

    if (!imageUrl) {
        adminElements.fieldImagePreview.innerHTML = '';
        adminElements.fieldImagePreview.classList.add('hidden');
        return;
    }

    adminElements.fieldImagePreview.innerHTML = '<img src="' + escapeHtml(imageUrl) + '" alt="Ảnh xem trước sân">';
    adminElements.fieldImagePreview.classList.remove('hidden');
}

function confirmBooking(bookingId) {
    fetch(adminApiBaseUrl + '/admin/bookings/' + bookingId + '/confirm', {
        method: 'PATCH',
        headers: createAdminHeaders()
    })
        .then(handleAdminJsonResponse)
        .then(function() {
            loadAdminData();
        })
        .catch(function(error) {
            denyAdminAccess(error.message || 'Không thể xác nhận booking.');
        });
}

function createAdminHeaders(extraHeaders) {
    var headers = {
        Accept: 'application/json',
        Authorization: 'Bearer ' + adminState.token
    };

    if (extraHeaders) {
        Object.keys(extraHeaders).forEach(function(key) {
            headers[key] = extraHeaders[key];
        });
    }

    return headers;
}

function handleAdminJsonResponse(response) {
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

function parseOptionalInteger(value) {
    if (!value) {
        return null;
    }

    var parsed = parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : null;
}

function valueOf(element) {
    return element ? String(element.value || '').trim() : '';
}

function formatCurrency(value) {
    var numeric = Number(value || 0);
    return new Intl.NumberFormat('vi-VN').format(numeric);
}

function formatDate(value) {
    if (!value) {
        return '--';
    }

    return new Date(value).toLocaleDateString('vi-VN');
}

function formatTimeRange(startTime, endTime) {
    return String(startTime || '--:--') + ' - ' + String(endTime || '--:--');
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

function refreshAdminIcons() {
    if (!window.lucide || typeof window.lucide.createIcons !== 'function') {
        return;
    }

    window.lucide.createIcons({
        attrs: {
            'stroke-width': 1.8
        }
    });
}
