/**
 * SportHub Frontend - Main JavaScript File
 *
 * Handles API communication, rendering, filtering, and booking demo flow.
 */

// ================================================================
// Configuration
// ================================================================

var DEFAULT_API_BASE_URL = 'http://localhost:8081/api';
var config = getSportHubConfig();
var API_BASE_URL = config.apiBaseUrl || localStorage.getItem('sporthubApiBaseUrl') || DEFAULT_API_BASE_URL;
var FIELDS_ENDPOINT = trimTrailingSlash(API_BASE_URL) + '/fields';
var BOOKINGS_ENDPOINT = trimTrailingSlash(API_BASE_URL) + '/bookings';
var AUTH_LOGIN_ENDPOINT = trimTrailingSlash(API_BASE_URL) + '/auth/login';
var AUTH_REGISTER_ENDPOINT = trimTrailingSlash(API_BASE_URL) + '/auth/register';
var AUTH_ME_ENDPOINT = trimTrailingSlash(API_BASE_URL) + '/auth/me';
var MY_BOOKINGS_ENDPOINT = trimTrailingSlash(API_BASE_URL) + '/bookings/me';
var ADMIN_BOOKINGS_ENDPOINT = trimTrailingSlash(API_BASE_URL) + '/admin/bookings';
var ADMIN_REVENUE_ENDPOINT = trimTrailingSlash(API_BASE_URL) + '/admin/revenue/summary';
var DEMO_BOOKINGS_STORAGE_KEY = 'sporthubDemoBookings';
var CUSTOMER_BOOKINGS_STORAGE_KEY = 'sporthubCustomerBookings';
var AUTH_SESSION_STORAGE_KEY = 'sporthubAuthSession';

var SPORT_TYPE_MAP = {
    FOOTBALL: 'Bóng đá',
    VOLLEYBALL: 'Bóng chuyền',
    BADMINTON: 'Cầu lông',
    BASKETBALL: 'Bóng rổ',
    TENNIS: 'Tennis',
    PING_PONG: 'Bóng bàn'
};

var state = {
    allFields: [],
    filteredFields: [],
    searchQuery: '',
    sportFilter: '',
    selectedField: null,
    pendingBookingField: null,
    pendingBookingDraft: null,
    modalOpen: false,
    authModalOpen: false,
    activeAuthTab: 'login',
    currentUser: null,
    currentRole: null,
    authToken: '',
    customerBookings: [],
    chatbotOpen: false,
    chatbotLoading: false,
    previouslyFocusedElement: null
};

var elements = {};

// ================================================================
// Initialization
// ================================================================

document.addEventListener('DOMContentLoaded', initApp);

function initApp() {
    cacheElements();
    loadAuthSession();
    bindEvents();
    updateNavigation();
    renderAuthState();
    refreshLucideIcons();
    loadFields();
    syncAuthenticatedUser();

    console.log('SportHub frontend initialized');
    console.log('API Base URL:', API_BASE_URL);
}

function cacheElements() {
    elements.searchInput = document.getElementById('field-search');
    elements.sportFilter = document.getElementById('sport-filter');
    elements.searchButton = document.getElementById('search-btn');
    elements.resetButton = document.getElementById('reset-btn');
    elements.retryButton = document.getElementById('retry-btn');
    elements.errorMessage = document.getElementById('error-message');
    elements.errorText = document.getElementById('error-text');
    elements.errorRetryButton = document.getElementById('error-retry-btn');
    elements.errorCloseButton = document.querySelector('#error-message .close-btn');
    elements.loading = document.getElementById('loading');
    elements.noResults = document.getElementById('no-results');
    elements.noResultsText = document.getElementById('no-results-text');
    elements.fieldsGrid = document.getElementById('fields-grid');
    elements.stateSection = document.getElementById('state-section');
    elements.resultSection = document.getElementById('fields');
    elements.statsSection = document.getElementById('stats-section');
    elements.totalFields = document.getElementById('total-fields');
    elements.availableFields = document.getElementById('available-fields');
    elements.modal = document.getElementById('field-modal');
    elements.modalContent = document.querySelector('#field-modal .modal-content');
    elements.closeModalButton = document.getElementById('close-modal-btn');
    elements.authModal = document.getElementById('auth-modal');
    elements.authModalContent = document.querySelector('.auth-modal-content');
    elements.closeAuthModalButton = document.getElementById('close-auth-modal-btn');
    elements.authModalTitle = document.getElementById('auth-modal-title');
    elements.authModalDescription = document.getElementById('auth-modal-description');
    elements.authLoginTab = document.getElementById('auth-login-tab');
    elements.authRegisterTab = document.getElementById('auth-register-tab');
    elements.loginForm = document.getElementById('login-form');
    elements.loginEmail = document.getElementById('login-email');
    elements.loginPassword = document.getElementById('login-password');
    elements.registerForm = document.getElementById('register-form');
    elements.registerName = document.getElementById('register-name');
    elements.registerEmail = document.getElementById('register-email');
    elements.registerPhone = document.getElementById('register-phone');
    elements.registerPassword = document.getElementById('register-password');
    elements.registerConfirmPassword = document.getElementById('register-confirm-password');
    elements.authFeedback = document.getElementById('auth-feedback');
    elements.bookingForm = document.getElementById('booking-form');
    elements.bookingDate = document.getElementById('booking-date');
    elements.bookingStartTime = document.getElementById('booking-start-time');
    elements.bookingEndTime = document.getElementById('booking-end-time');
    elements.bookingPhone = document.getElementById('booking-phone');
    elements.bookingNotes = document.getElementById('booking-notes');
    elements.bookingFeedback = document.getElementById('booking-feedback');
    elements.cancelBookingButton = document.getElementById('cancel-booking-btn');
    elements.modalName = document.getElementById('modal-field-name');
    elements.modalImage = document.getElementById('modal-field-image');
    elements.modalLocation = document.getElementById('modal-field-location');
    elements.modalSport = document.getElementById('modal-field-sport');
    elements.modalPrice = document.getElementById('modal-field-price');
    elements.modalCapacity = document.getElementById('modal-field-capacity');
    elements.modalDescription = document.getElementById('modal-field-description');
    elements.modalStatus = document.getElementById('modal-field-status');
    elements.openLoginButton = document.getElementById('open-login-btn');
    elements.openRegisterButton = document.getElementById('open-register-btn');
    elements.logoutButton = document.getElementById('logout-btn');
    elements.dashboardNavButton = document.getElementById('dashboard-nav-btn');
    elements.chatbotToggle = document.getElementById('chatbot-toggle');
    elements.chatbotPanel = document.getElementById('chatbot-panel');
    elements.chatbotClose = document.getElementById('chatbot-close');
    elements.chatbotMessages = document.getElementById('chatbot-messages');
    elements.chatbotForm = document.getElementById('chatbot-form');
    elements.chatbotInput = document.getElementById('chatbot-input');
}

function bindEvents() {
    if (elements.searchInput) {
        elements.searchInput.addEventListener('input', function() {
            state.searchQuery = this.value;
            applyFilters();
        });
        elements.searchInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                state.searchQuery = this.value;
                applyFilters();
            }
        });
    }

    if (elements.sportFilter) {
        elements.sportFilter.addEventListener('change', function() {
            state.sportFilter = this.value;
            applyFilters();
        });
    }

    if (elements.searchButton) {
        elements.searchButton.addEventListener('click', function() {
            if (elements.searchInput) {
                state.searchQuery = elements.searchInput.value;
            }
            applyFilters();
        });
    }

    if (elements.resetButton) {
        elements.resetButton.addEventListener('click', resetFilters);
    }

    if (elements.retryButton) {
        elements.retryButton.addEventListener('click', function() {
            loadFields();
        });
    }

    if (elements.errorRetryButton) {
        elements.errorRetryButton.addEventListener('click', function() {
            loadFields();
        });
    }

    if (elements.errorCloseButton) {
        elements.errorCloseButton.addEventListener('click', closeError);
    }

    if (elements.closeModalButton) {
        elements.closeModalButton.addEventListener('click', closeModal);
    }

    if (elements.cancelBookingButton) {
        elements.cancelBookingButton.addEventListener('click', closeModal);
    }

    if (elements.bookingForm) {
        elements.bookingForm.addEventListener('submit', handleBookingSubmit);
    }

    if (elements.openLoginButton) {
        elements.openLoginButton.addEventListener('click', function() {
            openAuthModal('login');
        });
    }

    if (elements.openRegisterButton) {
        elements.openRegisterButton.addEventListener('click', function() {
            openAuthModal('register');
        });
    }

    if (elements.logoutButton) {
        elements.logoutButton.addEventListener('click', handleLogout);
    }

    if (elements.dashboardNavButton) {
        elements.dashboardNavButton.addEventListener('click', handleDashboardNavigation);
    }

    if (elements.chatbotToggle) {
        elements.chatbotToggle.addEventListener('click', toggleChatbotPanel);
    }

    if (elements.chatbotClose) {
        elements.chatbotClose.addEventListener('click', closeChatbotPanel);
    }

    if (elements.chatbotForm) {
        elements.chatbotForm.addEventListener('submit', handleChatbotSubmit);
    }

    if (elements.closeAuthModalButton) {
        elements.closeAuthModalButton.addEventListener('click', closeAuthModal);
    }

    if (elements.authModal) {
        elements.authModal.addEventListener('click', function(event) {
            if (event.target === elements.authModal) {
                closeAuthModal();
            }
        });
    }

    if (elements.authLoginTab) {
        elements.authLoginTab.addEventListener('click', function() {
            setAuthModalTab('login');
        });
    }

    if (elements.authRegisterTab) {
        elements.authRegisterTab.addEventListener('click', function() {
            setAuthModalTab('register');
        });
    }

    if (elements.loginForm) {
        elements.loginForm.addEventListener('submit', handleLoginSubmit);
    }

    if (elements.registerForm) {
        elements.registerForm.addEventListener('submit', handleRegisterSubmit);
    }

    if (elements.modal) {
        elements.modal.addEventListener('click', function(event) {
            if (event.target === elements.modal) {
                closeModal();
            }
        });
    }

    document.addEventListener('keydown', handleGlobalKeydown);
}

// ================================================================
// Data Loading
// ================================================================

function loadFields() {
    showLoading(true);
    hideError();

    fetch(FIELDS_ENDPOINT, {
        method: 'GET',
        headers: {
            Accept: 'application/json'
        }
    })
        .then(function(response) {
            if (!response.ok) {
                throw new Error('HTTP error! status: ' + response.status);
            }
            return response.json();
        })
        .then(function(data) {
            if (!Array.isArray(data)) {
                throw new Error('API response is not an array');
            }

            state.allFields = data.map(normalizeField).filter(Boolean);
            applyFilters();
            hideError();
        })
        .catch(function(error) {
            console.error('Error loading fields:', error);
            state.allFields = [];
            state.filteredFields = [];
            renderFields([]);
            updateStatistics();
            showNoResults(false);
            showError('Không thể tải danh sách sân. Kiểm tra Backend hoặc thử lại sau.', true);
        })
        .finally(function() {
            showLoading(false);
        });
}

function normalizeField(field) {
    if (!field || typeof field !== 'object') {
        return null;
    }

    var price = Number(field.pricePerHour);
    if (!Number.isFinite(price)) {
        price = parseFloat(field.pricePerHour);
    }

    return {
        id: field.id || null,
        name: field.name || 'Sân chưa đặt tên',
        description: field.description || '',
        location: field.location || '',
        city: field.city || '',
        province: field.province || '',
        imageUrl: field.imageUrl || '',
        pricePerHour: Number.isFinite(price) ? price : 0,
        capacity: field.capacity != null ? field.capacity : 0,
        sportType: field.sportType || '',
        isAvailable: field.isAvailable !== false,
        ownerId: field.ownerId || null
    };
}

// ================================================================
// Filtering
// ================================================================

function applyFilters() {
    var query = (state.searchQuery || '').trim().toLowerCase();
    var sportFilter = state.sportFilter || '';

    state.filteredFields = state.allFields.filter(function(field) {
        var sportMatches = !sportFilter || field.sportType === sportFilter;
        var searchableText = [
            field.name,
            field.location,
            field.city,
            field.province,
            field.sportType
        ].join(' ').toLowerCase();
        var searchMatches = !query || searchableText.indexOf(query) !== -1;
        return sportMatches && searchMatches;
    });

    renderFields(state.filteredFields);
    updateStatistics();

    if (state.filteredFields.length === 0) {
        showNoResults(true, query || sportFilter ? 'Không tìm thấy sân phù hợp với bộ lọc hiện tại.' : 'Không có sân nào để hiển thị.');
    } else {
        showNoResults(false);
    }
}

function resetFilters() {
    state.searchQuery = '';
    state.sportFilter = '';

    if (elements.searchInput) {
        elements.searchInput.value = '';
    }

    if (elements.sportFilter) {
        elements.sportFilter.value = '';
    }

    applyFilters();
}

// ================================================================
// Rendering
// ================================================================

function renderFields(fields) {
    if (!elements.fieldsGrid) {
        return;
    }

    elements.fieldsGrid.innerHTML = '';

    if (!fields || fields.length === 0) {
        return;
    }

    fields.forEach(function(field) {
        elements.fieldsGrid.appendChild(createFieldCard(field));
    });
}

function createFieldCard(field) {
    var card = document.createElement('article');
    card.className = 'field-card';
    card.setAttribute('tabindex', '0');
    card.setAttribute('role', 'button');
    card.setAttribute('aria-label', 'Xem chi tiết ' + field.name);

    var formattedPrice = formatPrice(field.pricePerHour);
    var sportTypeDisplay = SPORT_TYPE_MAP[field.sportType] || field.sportType || 'Chưa phân loại';
    var statusClass = field.isAvailable ? 'available' : 'unavailable';
    var statusText = field.isAvailable ? 'Khả dụng' : 'Không khả dụng';
    var fallbackImage = '<div class="field-image error" aria-hidden="true">' + renderLucideIcon('image-off', 'image-fallback-icon') + '</div>';
    var imageMarkup = field.imageUrl
        ? '<img src="' + escapeHtml(field.imageUrl) + '" alt="' + escapeHtml(field.name) + '" class="field-image" onerror="handleImageError(this)">'
        : fallbackImage;
    var badgeMarkup = field.isAvailable ? '<span class="field-badge">Giá tốt</span>' : '';

    card.innerHTML = [
        '<div class="field-image-container">',
        imageMarkup,
        badgeMarkup,
        '</div>',
        '<div class="field-content">',
        '<h3 class="field-name">' + escapeHtml(field.name) + '</h3>',
        '<span class="field-sport">' + escapeHtml(sportTypeDisplay) + '</span>',
        '<div class="field-location">',
        '<span class="field-location-icon">' + renderLucideIcon('map-pin', 'field-inline-icon') + '</span>',
        '<span>' + escapeHtml(field.location || 'Chưa cập nhật địa chỉ') + '</span>',
        '</div>',
        '<div class="field-price">',
        '<span>' + formattedPrice + '</span>',
        '<span class="field-price-unit">VND/giờ</span>',
        '</div>',
        '<div class="field-capacity"><span class="field-capacity-icon">' + renderLucideIcon('users', 'field-inline-icon') + '</span><span>Sức chứa: ' + escapeHtml(String(field.capacity || 0)) + ' người</span></div>',
        '<span class="field-status ' + statusClass + '">' + statusText + '</span>',
        '<div class="field-actions">',
        '<button class="btn btn-primary field-detail-btn" type="button">Xem chi tiết</button>',
        '<button class="btn btn-secondary field-book-btn" type="button">Đặt sân</button>',
        '</div>',
        '</div>'
    ].join('');

    card.querySelector('.field-detail-btn').addEventListener('click', function(event) {
        event.stopPropagation();
        openFieldModal(field);
    });

    card.querySelector('.field-book-btn').addEventListener('click', function(event) {
        event.stopPropagation();
        requestBookingForField(field);
    });

    card.addEventListener('click', function() {
        openFieldModal(field);
    });

    card.addEventListener('keydown', function(event) {
        if (event.target !== card) {
            return;
        }

        if (event.key === 'Enter' || event.key === ' ') {
            event.preventDefault();
            openFieldModal(field);
        }
    });

    refreshLucideIcons(card);

    return card;
}

function handleImageError(img) {
    var container = img.parentElement;
    if (!container) {
        return;
    }

    img.style.display = 'none';
    var errorDiv = document.createElement('div');
    errorDiv.className = 'field-image error';
    errorDiv.setAttribute('aria-hidden', 'true');
    errorDiv.innerHTML = renderLucideIcon('image-off', 'image-fallback-icon');
    container.insertBefore(errorDiv, img);
    refreshLucideIcons(container);
}

// ================================================================
// Modal & Booking
// ================================================================

function openFieldModal(field, options) {
    if (!field) {
        return;
    }

    state.selectedField = field;
    state.previouslyFocusedElement = document.activeElement;

    if (elements.modalName) {
        elements.modalName.textContent = field.name;
    }
    if (elements.modalImage) {
        elements.modalImage.src = field.imageUrl || '';
        elements.modalImage.alt = field.name;
    }
    if (elements.modalLocation) {
        elements.modalLocation.textContent = field.location || 'Chưa cập nhật';
    }
    if (elements.modalSport) {
        elements.modalSport.textContent = SPORT_TYPE_MAP[field.sportType] || field.sportType || 'Chưa phân loại';
    }
    if (elements.modalPrice) {
        elements.modalPrice.textContent = formatPrice(field.pricePerHour);
    }
    if (elements.modalCapacity) {
        elements.modalCapacity.textContent = field.capacity || 0;
    }
    if (elements.modalDescription) {
        elements.modalDescription.textContent = field.description || 'Không có mô tả';
    }
    if (elements.modalStatus) {
        elements.modalStatus.textContent = field.isAvailable ? 'Khả dụng' : 'Không khả dụng';
    }

    prepareBookingForm(field);
    showBookingFeedback('');

    if (elements.modal) {
        elements.modal.classList.remove('hidden');
        elements.modal.setAttribute('aria-hidden', 'false');
    }
    if (elements.modalContent) {
        elements.modalContent.scrollTop = 0;
    }

    document.body.classList.add('modal-open');
    state.modalOpen = true;

    window.setTimeout(function() {
        if (options && options.focusBooking && elements.bookingDate) {
            elements.bookingDate.focus();
        } else if (elements.closeModalButton) {
            elements.closeModalButton.focus();
        }
    }, 0);
}

function closeModal() {
    if (elements.modal) {
        elements.modal.classList.add('hidden');
        elements.modal.setAttribute('aria-hidden', 'true');
    }

    document.body.classList.remove('modal-open');
    state.modalOpen = false;
    state.selectedField = null;

    if (state.previouslyFocusedElement && typeof state.previouslyFocusedElement.focus === 'function') {
        state.previouslyFocusedElement.focus();
    }
}

function prepareBookingForm(field) {
    if (!elements.bookingForm) {
        return;
    }

    var today = new Date();
    var tomorrow = new Date(today.getTime() + 24 * 60 * 60 * 1000);

    if (elements.bookingDate) {
        elements.bookingDate.min = formatDateForInput(today);
        elements.bookingDate.value = formatDateForInput(tomorrow);
    }
    if (elements.bookingStartTime) {
        elements.bookingStartTime.value = '18:00';
    }
    if (elements.bookingEndTime) {
        elements.bookingEndTime.value = '19:00';
    }
    if (elements.bookingPhone) {
        elements.bookingPhone.value = '';
    }
    if (elements.bookingNotes) {
        elements.bookingNotes.value = 'Yeu cau dat san demo cho ' + field.name;
    }
}

function handleBookingSubmit(event) {
    event.preventDefault();

    if (!state.selectedField) {
        showBookingFeedback('Vui lòng chọn sân trước khi đặt.', true);
        return;
    }

    if (!state.currentUser) {
        var pendingField = state.selectedField;
        state.pendingBookingDraft = {
            bookingDate: elements.bookingDate ? elements.bookingDate.value : '',
            startTime: elements.bookingStartTime ? elements.bookingStartTime.value : '',
            endTime: elements.bookingEndTime ? elements.bookingEndTime.value : '',
            phone: elements.bookingPhone ? elements.bookingPhone.value : '',
            notes: elements.bookingNotes ? elements.bookingNotes.value : ''
        };
        showBookingFeedback('Vui lòng đăng nhập để tiếp tục đặt sân.', true);
        closeModal();
        openAuthModal('login', {
            bookingField: pendingField,
            message: 'Đăng nhập để gửi yêu cầu đặt sân.'
        });
        return;
    }

    var bookingDate = elements.bookingDate ? elements.bookingDate.value : '';
    var startTime = elements.bookingStartTime ? elements.bookingStartTime.value : '';
    var endTime = elements.bookingEndTime ? elements.bookingEndTime.value : '';
    var phone = elements.bookingPhone ? elements.bookingPhone.value.trim() : '';
    var notes = elements.bookingNotes ? elements.bookingNotes.value.trim() : '';

    if (!bookingDate || !startTime || !endTime || !phone) {
        showBookingFeedback('Vui long nhap day du ngay dat, gio va so dien thoai.', true);
        return;
    }

    if (endTime <= startTime) {
        showBookingFeedback('Gio ket thuc phai sau gio bat dau.', true);
        return;
    }

    if (phone.length < 9) {
        showBookingFeedback('So dien thoai khong hop le.', true);
        return;
    }

    var bookingPayload = {
        fieldId: state.selectedField.id,
        bookingDate: bookingDate,
        startTime: startTime,
        endTime: endTime,
        customerPhone: phone,
        notes: notes
    };

    var bookingRecord = {
        bookingId: 'local-' + Date.now(),
        fieldId: state.selectedField.id,
        fieldName: state.selectedField.name,
        bookingDate: bookingDate,
        startTime: startTime,
        endTime: endTime,
        phone: phone,
        notes: notes,
        customerName: state.currentUser.name || state.currentUser.fullName || state.currentUser.email,
        customerEmail: state.currentUser.email,
        customerRole: state.currentRole || state.currentUser.role,
        totalPrice: calculateBookingTotal(state.selectedField.pricePerHour, startTime, endTime),
        status: 'PENDING',
        createdAt: new Date().toISOString()
    };

    submitBooking(bookingPayload, bookingRecord);
}

function submitBooking(bookingPayload, bookingRecord) {
    showBookingFeedback('Dang gui yeu cau dat san...', false);

    fetch(BOOKINGS_ENDPOINT, {
        method: 'POST',
        headers: createAuthHeaders({
            'Content-Type': 'application/json'
        }),
        body: JSON.stringify(bookingPayload)
    })
        .then(handleJsonResponse)
        .then(function() {
            showBookingFeedback('Yeu cau dat san da duoc tao thanh cong. Ban co the xem lai trong trang Lich cua toi.', false);
            window.setTimeout(function() {
                closeModal();
            }, 900);
        })
        .catch(function(error) {
            if (error && error.isBackendError) {
                showBookingFeedback(error.message || 'Khong the tao booking tren backend.', true);
                return;
            }

            console.error('Backend booking request failed:', error);
            showBookingFeedback(
                'Khong the ket noi backend. Vui long kiem tra ket noi va thu lai.',
                true
            );
        });
}

function showBookingFeedback(message, isError) {
    if (!elements.bookingFeedback) {
        return;
    }

    if (!message) {
        elements.bookingFeedback.textContent = '';
        elements.bookingFeedback.className = 'booking-feedback hidden';
        return;
    }

    elements.bookingFeedback.textContent = message;
    elements.bookingFeedback.className = 'booking-feedback ' + (isError ? 'error' : 'success');
}

function hideBookingFeedback() {
    showBookingFeedback('', false);
}

function bookField(field) {
    if (field) {
        requestBookingForField(field);
        return;
    }

    if (state.selectedField) {
        requestBookingForField(state.selectedField);
        return;
    }

    showError('Vui lòng chọn sân trước khi đặt.', false);
}

function requestBookingForField(field) {
    if (!field) {
        return;
    }

    state.selectedField = field;

    if (!state.currentUser) {
        openAuthModal('login', {
            bookingField: field,
            message: 'Đăng nhập để tiếp tục gửi yêu cầu đặt sân.'
        });
        return;
    }

    openFieldModal(field, { focusBooking: true });
}

// ================================================================
// Auth & Dashboard
// ================================================================

function normalizeStoredUser(user) {
    if (!user || typeof user !== 'object') {
        return null;
    }

    return {
        id: user.id != null ? user.id : Date.now(),
        backendUserId: user.backendUserId != null ? user.backendUserId : user.id,
        name: user.name || user.fullName || 'Người dùng',
        email: String(user.email || '').trim().toLowerCase(),
        phone: user.phone || '',
        address: user.address || '',
        role: normalizeRole(user.role),
        createdAt: user.createdAt || new Date().toISOString()
    };
}

function normalizeRole(role) {
    var normalized = String(role || 'CUSTOMER').toUpperCase();
    if (normalized === 'USER') {
        return 'CUSTOMER';
    }
    if (normalized === 'STAFF') {
        return 'ADMIN';
    }
    return normalized === 'ADMIN' ? 'ADMIN' : 'CUSTOMER';
}

function loadAuthSession() {
    try {
        var rawSession = localStorage.getItem(AUTH_SESSION_STORAGE_KEY);
        if (!rawSession) {
            state.currentUser = null;
            state.currentRole = null;
            state.authToken = '';
            state.customerBookings = [];
            return;
        }

        var session = JSON.parse(rawSession);
        if (!session || !session.currentUser) {
            clearAuthSession(false);
            return;
        }

        state.currentUser = normalizeStoredUser(session.currentUser);
        state.currentRole = normalizeRole(state.currentUser && state.currentUser.role);
        state.authToken = session.token || '';
    } catch (error) {
        console.warn('Could not load auth session:', error);
        clearAuthSession(false);
    }
}

function persistAuthSession(user, token) {
    var sessionUser = normalizeStoredUser(user);
    localStorage.setItem(AUTH_SESSION_STORAGE_KEY, JSON.stringify({
        token: token,
        currentUser: sessionUser
    }));
    state.currentUser = sessionUser;
    state.currentRole = normalizeRole(sessionUser && sessionUser.role);
    state.authToken = token;
}

function clearAuthSession(updateUi) {
    localStorage.removeItem(AUTH_SESSION_STORAGE_KEY);
    state.currentUser = null;
    state.currentRole = null;
    state.authToken = '';
    state.customerBookings = [];
    state.pendingBookingField = null;
    state.pendingBookingDraft = null;

    if (updateUi !== false) {
        renderAuthState();
    }
}

function openAuthModal(tab, options) {
    state.authModalOpen = true;
    state.activeAuthTab = tab === 'register' ? 'register' : 'login';
    state.pendingBookingField = options && Object.prototype.hasOwnProperty.call(options, 'bookingField')
        ? options.bookingField
        : null;
    if (!state.pendingBookingField) {
        state.pendingBookingDraft = null;
    }
    if (elements.loginForm) {
        elements.loginForm.reset();
    }
    if (elements.registerForm) {
        elements.registerForm.reset();
    }
    state.previouslyFocusedElement = document.activeElement;
    setAuthModalTab(state.activeAuthTab);

    if (elements.authModal) {
        elements.authModal.classList.remove('hidden');
        elements.authModal.setAttribute('aria-hidden', 'false');
    }

    document.body.classList.add('modal-open');
    showAuthFeedback(options && options.message ? options.message : '', false);

    window.setTimeout(function() {
        if (state.activeAuthTab === 'register' && elements.registerName) {
            elements.registerName.focus();
        } else if (elements.loginEmail) {
            elements.loginEmail.focus();
        }
    }, 0);
}

function closeAuthModal() {
    if (elements.authModal) {
        elements.authModal.classList.add('hidden');
        elements.authModal.setAttribute('aria-hidden', 'true');
    }

    document.body.classList.remove('modal-open');
    state.authModalOpen = false;

    if (state.previouslyFocusedElement && typeof state.previouslyFocusedElement.focus === 'function') {
        state.previouslyFocusedElement.focus();
    }
}

function setAuthModalTab(tab) {
    state.activeAuthTab = tab === 'register' ? 'register' : 'login';

    if (elements.authLoginTab) {
        elements.authLoginTab.classList.toggle('active', state.activeAuthTab === 'login');
    }
    if (elements.authRegisterTab) {
        elements.authRegisterTab.classList.toggle('active', state.activeAuthTab === 'register');
    }
    if (elements.loginForm) {
        elements.loginForm.classList.toggle('hidden', state.activeAuthTab !== 'login');
    }
    if (elements.registerForm) {
        elements.registerForm.classList.toggle('hidden', state.activeAuthTab !== 'register');
    }
    if (elements.authModalTitle) {
        elements.authModalTitle.textContent = state.activeAuthTab === 'register' ? 'Tạo tài khoản' : 'Đăng nhập';
    }
    if (elements.authModalDescription) {
        elements.authModalDescription.textContent = state.activeAuthTab === 'register'
            ? 'Tạo tài khoản customer để lưu lịch đặt sân và quay lại dễ dàng hơn.'
            : 'Dùng tài khoản demo hoặc đăng nhập bằng tài khoản đã tạo.';
    }
    showAuthFeedback('', false);
}

function handleLoginSubmit(event) {
    event.preventDefault();

    var email = elements.loginEmail ? elements.loginEmail.value.trim().toLowerCase() : '';
    var password = elements.loginPassword ? elements.loginPassword.value : '';

    if (!email || !password) {
        showAuthFeedback('Vui lòng nhập email và mật khẩu.', true);
        return;
    }

    showAuthFeedback('Đang đăng nhập...', false);

    fetch(AUTH_LOGIN_ENDPOINT, {
        method: 'POST',
        headers: createAuthHeaders({
            'Content-Type': 'application/json'
        }),
        body: JSON.stringify({
            email: email,
            password: password
        })
    })
        .then(handleJsonResponse)
        .then(function(data) {
            if (!data || !data.user || !data.token) {
                throw new Error('Phản hồi đăng nhập không hợp lệ.');
            }

            persistAuthSession(data.user, data.token);
            closeAuthModal();
            renderAuthState();

            if (state.pendingBookingField) {
                var pendingField = state.pendingBookingField;
                var pendingDraft = state.pendingBookingDraft;
                state.pendingBookingField = null;
                state.pendingBookingDraft = null;
                window.setTimeout(function() {
                    openFieldModal(pendingField, { focusBooking: true });
                    restoreBookingFormDraft(pendingDraft);
                }, 120);
            }
        })
        .catch(function(error) {
            showAuthFeedback(error.message || 'Sai email hoặc mật khẩu.', true);
        });
}

function handleRegisterSubmit(event) {
    event.preventDefault();

    var name = elements.registerName ? elements.registerName.value.trim() : '';
    var email = elements.registerEmail ? elements.registerEmail.value.trim().toLowerCase() : '';
    var phone = elements.registerPhone ? elements.registerPhone.value.trim() : '';
    var password = elements.registerPassword ? elements.registerPassword.value : '';
    var confirmPassword = elements.registerConfirmPassword ? elements.registerConfirmPassword.value : '';

    if (!name || !email || !phone || !password || !confirmPassword) {
        showAuthFeedback('Vui lòng nhập đầy đủ thông tin đăng ký.', true);
        return;
    }

    if (password !== confirmPassword) {
        showAuthFeedback('Mật khẩu xác nhận không khớp.', true);
        return;
    }

    if (password.length < 6) {
        showAuthFeedback('Mật khẩu phải có ít nhất 6 ký tự.', true);
        return;
    }

    showAuthFeedback('Đang tạo tài khoản...', false);

    fetch(AUTH_REGISTER_ENDPOINT, {
        method: 'POST',
        headers: createAuthHeaders({
            'Content-Type': 'application/json'
        }),
        body: JSON.stringify({
            fullName: name,
            email: email,
            phone: phone,
            password: password
        })
    })
        .then(handleJsonResponse)
        .then(function(data) {
            if (!data || !data.user || !data.token) {
                throw new Error('Không thể tạo tài khoản.');
            }

            persistAuthSession(data.user, data.token);
            closeAuthModal();
            renderAuthState();

            if (state.pendingBookingField) {
                var pendingField = state.pendingBookingField;
                var pendingDraft = state.pendingBookingDraft;
                state.pendingBookingField = null;
                state.pendingBookingDraft = null;
                window.setTimeout(function() {
                    openFieldModal(pendingField, { focusBooking: true });
                    restoreBookingFormDraft(pendingDraft);
                }, 120);
            }
        })
        .catch(function(error) {
            showAuthFeedback(error.message || 'Không thể tạo tài khoản.', true);
        });
}

function handleLogout() {
    clearAuthSession();
    hideAuthFeedback();
    hideBookingFeedback();
}

function renderAuthState() {
    var isAuthenticated = !!state.currentUser;
    var isAdmin = state.currentRole === 'ADMIN';
    var isCustomer = state.currentRole === 'CUSTOMER';

    if (elements.openLoginButton) {
        elements.openLoginButton.classList.toggle('hidden', isAuthenticated);
    }
    if (elements.openRegisterButton) {
        elements.openRegisterButton.classList.toggle('hidden', isAuthenticated);
    }
    if (elements.logoutButton) {
        elements.logoutButton.classList.toggle('hidden', !isAuthenticated);
    }
    if (elements.dashboardNavButton) {
        elements.dashboardNavButton.classList.toggle('hidden', !isAuthenticated);
        if (elements.dashboardNavButton.querySelector('span')) {
            elements.dashboardNavButton.querySelector('span').textContent = isAdmin ? 'Trang quản trị' : 'Lịch của tôi';
        }
    }

    if (!isAuthenticated) {
        hideAuthFeedback();
    }
}

function normalizeCustomerBooking(booking) {
    if (!booking || typeof booking !== 'object') {
        return null;
    }

    var field = booking.field || {};
    var user = booking.user || {};

    return {
        bookingId: booking.id || booking.bookingId || ('booking-' + Date.now()),
        fieldId: field.id || booking.fieldId || null,
        fieldName: field.name || booking.fieldName || 'Sân thể thao',
        bookingDate: booking.bookingDate || booking.booking_date || '',
        startTime: booking.startTime || booking.start_time || '',
        endTime: booking.endTime || booking.end_time || '',
        phone: booking.customerPhone || user.phone || '',
        notes: booking.notes || '',
        customerName: user.fullName || user.name || state.currentUser.name,
        customerEmail: user.email || state.currentUser.email,
        customerRole: normalizeRole(user.role || state.currentRole),
        totalPrice: Number(booking.totalPrice || 0),
        status: normalizeBookingStatus(booking.status),
        createdAt: booking.createdAt || booking.created_at || new Date().toISOString()
    };
}

function formatBookingTimeRange(startTime, endTime) {
    return (startTime || '--:--') + ' - ' + (endTime || '--:--');
}

function normalizeBookingStatus(status) {
    var value = String(status || 'PENDING').toUpperCase();
    if (value === 'DONE' || value === 'APPROVED') {
        return 'CONFIRMED';
    }
    return value;
}

function getBookingStatusClass(status) {
    var normalized = normalizeBookingStatus(status);
    if (normalized === 'CONFIRMED') {
        return 'success';
    }
    if (normalized === 'CANCELLED') {
        return 'error';
    }
    return 'pending';
}

function calculateBookingTotal(pricePerHour, startTime, endTime) {
    var price = Number(pricePerHour);
    if (!Number.isFinite(price)) {
        price = 0;
    }

    return Math.max(0, Math.round(price * getHoursBetweenTimes(startTime, endTime)));
}

function getHoursBetweenTimes(startTime, endTime) {
    if (!startTime || !endTime) {
        return 1;
    }

    var startParts = String(startTime).split(':');
    var endParts = String(endTime).split(':');
    var startMinutes = (Number(startParts[0]) || 0) * 60 + (Number(startParts[1]) || 0);
    var endMinutes = (Number(endParts[0]) || 0) * 60 + (Number(endParts[1]) || 0);
    var diff = endMinutes - startMinutes;

    if (!Number.isFinite(diff) || diff <= 0) {
        return 1;
    }

    return Math.max(1, diff / 60);
}

function showAuthFeedback(message, isError) {
    if (!elements.authFeedback) {
        return;
    }

    if (!message) {
        elements.authFeedback.textContent = '';
        elements.authFeedback.className = 'booking-feedback hidden';
        return;
    }

    elements.authFeedback.textContent = message;
    elements.authFeedback.className = 'booking-feedback ' + (isError ? 'error' : 'success');
}

function hideAuthFeedback() {
    showAuthFeedback('', false);
}

function handleDashboardNavigation() {
    if (state.currentRole === 'ADMIN') {
        window.location.href = 'admin.html';
        return;
    }

    window.location.href = 'my-bookings.html';
}

function toggleChatbotPanel() {
    if (!elements.chatbotPanel) {
        return;
    }

    if (state.chatbotOpen) {
        closeChatbotPanel();
        return;
    }

    state.chatbotOpen = true;
    elements.chatbotPanel.classList.remove('hidden');

    window.setTimeout(function() {
        if (elements.chatbotInput) {
            elements.chatbotInput.focus();
        }
    }, 0);
}

function closeChatbotPanel() {
    if (!elements.chatbotPanel) {
        return;
    }

    state.chatbotOpen = false;
    elements.chatbotPanel.classList.add('hidden');
}

function handleChatbotSubmit(event) {
    event.preventDefault();

    if (!elements.chatbotInput) {
        return;
    }

    var prompt = elements.chatbotInput.value.trim();

    if (!prompt) {
        return;
    }

    appendChatbotMessage('user', prompt);
    elements.chatbotInput.value = '';
    appendChatbotMessage('bot', 'Tính năng trợ lý AI đang được tạm khóa. Vui lòng dùng bộ lọc sân hoặc liên hệ hỗ trợ.');
}

function appendChatbotMessage(role, message) {
    if (!elements.chatbotMessages || !message) {
        return;
    }

    var item = document.createElement('article');
    item.className = 'chatbot-message ' + (role === 'user' ? 'user' : 'bot');

    var paragraph = document.createElement('p');
    paragraph.textContent = message;
    item.appendChild(paragraph);

    elements.chatbotMessages.appendChild(item);
    elements.chatbotMessages.scrollTop = elements.chatbotMessages.scrollHeight;
}

function setChatbotLoading(isLoading) {
    state.chatbotLoading = !!isLoading;

    if (!elements.chatbotForm) {
        return;
    }

    elements.chatbotForm.classList.toggle('is-loading', state.chatbotLoading);

    if (elements.chatbotInput) {
        elements.chatbotInput.disabled = state.chatbotLoading;
    }

    var submitButton = elements.chatbotForm.querySelector('button[type="submit"]');
    if (submitButton) {
        submitButton.disabled = state.chatbotLoading;
        submitButton.textContent = state.chatbotLoading ? 'Đang gửi...' : 'Gửi';
    }
}

function restoreBookingFormDraft(draft) {
    if (!draft) {
        return;
    }

    if (elements.bookingDate && draft.bookingDate) {
        elements.bookingDate.value = draft.bookingDate;
    }
    if (elements.bookingStartTime && draft.startTime) {
        elements.bookingStartTime.value = draft.startTime;
    }
    if (elements.bookingEndTime && draft.endTime) {
        elements.bookingEndTime.value = draft.endTime;
    }
    if (elements.bookingPhone && draft.phone) {
        elements.bookingPhone.value = draft.phone;
    }
    if (elements.bookingNotes && draft.notes) {
        elements.bookingNotes.value = draft.notes;
    }
}

function handleGlobalKeydown(event) {
    if (state.chatbotOpen && event.key === 'Escape' && !state.modalOpen && !state.authModalOpen) {
        closeChatbotPanel();
    }

    if (state.authModalOpen) {
        if (event.key === 'Escape') {
            event.preventDefault();
            closeAuthModal();
            return;
        }

        if (event.key === 'Tab') {
            trapFocus(event, elements.authModalContent);
        }
        return;
    }

    if (!state.modalOpen) {
        return;
    }

    if (event.key === 'Escape') {
        event.preventDefault();
        closeModal();
        return;
    }

    if (event.key === 'Tab') {
        trapFocus(event, elements.modalContent);
    }
}

function trapFocus(event, modalContent) {
    if (!modalContent) {
        return;
    }

    var focusableElements = modalContent.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    if (!focusableElements.length) {
        return;
    }

    var firstElement = focusableElements[0];
    var lastElement = focusableElements[focusableElements.length - 1];

    if (event.shiftKey && document.activeElement === firstElement) {
        event.preventDefault();
        lastElement.focus();
    } else if (!event.shiftKey && document.activeElement === lastElement) {
        event.preventDefault();
        firstElement.focus();
    }
}

// ================================================================
// Navigation
// ================================================================

function updateNavigation() {
    var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-menu a'));
    var sectionIds = ['home', 'fields', 'about', 'contact'];
    var sections = sectionIds
        .map(function(id) {
            return document.getElementById(id);
        })
        .filter(Boolean);

    function setActiveLink(sectionId) {
        navLinks.forEach(function(link) {
            link.classList.toggle('active', link.getAttribute('href') === '#' + sectionId);
        });
    }

    if ('IntersectionObserver' in window) {
        var observer = new IntersectionObserver(function(entries) {
            var visibleEntry = entries
                .filter(function(entry) {
                    return entry.isIntersecting;
                })
                .sort(function(a, b) {
                    return b.intersectionRatio - a.intersectionRatio;
                })[0];

            if (visibleEntry && visibleEntry.target && visibleEntry.target.id) {
                setActiveLink(visibleEntry.target.id);
            }
        }, {
            threshold: [0.3, 0.5, 0.75],
            rootMargin: '-15% 0px -55% 0px'
        });

        sections.forEach(function(section) {
            observer.observe(section);
        });
    } else {
        window.addEventListener('scroll', function() {
            var scrollPosition = window.scrollY + 180;
            var activeSectionId = 'home';

            sections.forEach(function(section) {
                if (section.offsetTop <= scrollPosition) {
                    activeSectionId = section.id;
                }
            });

            setActiveLink(activeSectionId);
        });
    }

    setActiveLink('home');
}

// ================================================================
// UI Helpers
// ================================================================

function showLoading(show) {
    if (!elements.loading) {
        return;
    }

    elements.loading.classList.toggle('hidden', !show);
    if (elements.resultSection) {
        elements.resultSection.classList.toggle('hidden', !!show);
    }
    if (elements.statsSection) {
        elements.statsSection.classList.toggle('hidden', true);
    }
    syncStateSectionVisibility();
}

function showError(message, canRetry) {
    if (!elements.errorMessage || !elements.errorText) {
        return;
    }

    elements.errorText.textContent = message;
    elements.errorMessage.classList.remove('hidden');
    setRetryButtonsVisible(!!canRetry);
    syncStateSectionVisibility();
}

function hideError() {
    if (!elements.errorMessage) {
        return;
    }

    elements.errorMessage.classList.add('hidden');
    setRetryButtonsVisible(false);
    syncStateSectionVisibility();
}

function closeError() {
    hideError();
}

function setRetryButtonsVisible(visible) {
    if (elements.retryButton) {
        elements.retryButton.classList.toggle('hidden', !visible);
    }
    if (elements.errorRetryButton) {
        elements.errorRetryButton.classList.toggle('hidden', !visible);
    }
}

function showNoResults(show, message) {
    if (!elements.noResults) {
        return;
    }

    elements.noResults.classList.toggle('hidden', !show);
    if (show && elements.noResultsText && message) {
        elements.noResultsText.textContent = message;
    }
    syncStateSectionVisibility();
}

function updateStatistics() {
    var totalFields = state.filteredFields.length;
    var availableFields = state.filteredFields.filter(function(field) {
        return field.isAvailable;
    }).length;

    if (elements.totalFields) {
        elements.totalFields.textContent = totalFields;
    }

    if (elements.availableFields) {
        elements.availableFields.textContent = availableFields;
    }

    if (elements.resultSection) {
        elements.resultSection.classList.toggle('hidden', totalFields === 0);
    }

    if (elements.statsSection) {
        elements.statsSection.classList.toggle('hidden', totalFields === 0);
    }
}

function syncStateSectionVisibility() {
    if (!elements.stateSection) {
        return;
    }

    var hasVisibleLoading = elements.loading && !elements.loading.classList.contains('hidden');
    var hasVisibleError = elements.errorMessage && !elements.errorMessage.classList.contains('hidden');
    var hasVisibleEmpty = elements.noResults && !elements.noResults.classList.contains('hidden');

    elements.stateSection.classList.toggle('hidden', !(hasVisibleLoading || hasVisibleError || hasVisibleEmpty));
}

function syncAuthenticatedUser() {
    if (!state.authToken) {
        return;
    }

    fetch(AUTH_ME_ENDPOINT, {
        method: 'GET',
        headers: createAuthHeaders()
    })
        .then(handleJsonResponse)
        .then(function(user) {
            if (!user) {
                throw new Error('Không thể tải hồ sơ người dùng.');
            }

            persistAuthSession(user, state.authToken);
            renderAuthState();
        })
        .catch(function(error) {
            console.warn('Could not restore authenticated session:', error);
            clearAuthSession();
        });
}

function createAuthHeaders(extraHeaders) {
    var headers = {
        Accept: 'application/json'
    };

    if (state.authToken) {
        headers.Authorization = 'Bearer ' + state.authToken;
    }

    if (extraHeaders && typeof extraHeaders === 'object') {
        Object.keys(extraHeaders).forEach(function(key) {
            headers[key] = extraHeaders[key];
        });
    }

    return headers;
}

function handleJsonResponse(response) {
    if (!response.ok) {
        return response.json()
            .catch(function() {
                return {};
            })
            .then(function(errorBody) {
                var error = new Error(errorBody.message || ('HTTP error! status: ' + response.status));
                error.status = response.status;
                error.isBackendError = true;
                throw error;
            });
    }

    return response.json();
}

// ================================================================
// Utility Functions
// ================================================================

function trimTrailingSlash(value) {
    return String(value || '').replace(/\/+$/, '');
}

function renderLucideIcon(name, className) {
    var resolvedClassName = className ? ' ' + className : '';
    return '<i data-lucide="' + escapeHtml(name) + '" class="lucide-icon' + resolvedClassName + '"></i>';
}

function refreshLucideIcons(root) {
    if (!window.lucide || typeof window.lucide.createIcons !== 'function') {
        return;
    }

    if (root) {
        window.lucide.createIcons({
            attrs: {
                'stroke-width': 1.8
            },
            root: root
        });
        return;
    }

    window.lucide.createIcons({
        attrs: {
            'stroke-width': 1.8
        }
    });
}

function formatPrice(price) {
    var numericPrice = Number(price);
    if (!Number.isFinite(numericPrice)) {
        numericPrice = 0;
    }

    return new Intl.NumberFormat('vi-VN').format(numericPrice);
}

function escapeHtml(text) {
    if (text == null) {
        return '';
    }

    return String(text).replace(/[&<>"']/g, function(character) {
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

function formatDateForInput(date) {
    var year = date.getFullYear();
    var month = String(date.getMonth() + 1).padStart(2, '0');
    var day = String(date.getDate()).padStart(2, '0');
    return year + '-' + month + '-' + day;
}

function formatDate(dateString) {
    return new Date(dateString).toLocaleDateString('vi-VN', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
    });
}

// ================================================================
// Debug Hooks
// ================================================================

window.addEventListener('error', function(event) {
    console.error('Global error caught:', event.error);
});

window.addEventListener('unhandledrejection', function(event) {
    console.error('Unhandled promise rejection:', event.reason);
});

console.log('SportHub Frontend v1.0 loaded');
