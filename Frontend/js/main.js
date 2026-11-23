(function() {
    'use strict';

    var S = window.SportHubShared;

    var PREVIEW_FIELDS = [
        { id: 1, name: 'Sân Bóng Đá 7v7 Premium Mỹ Phước', description: 'Sân cỏ nhân tạo chuẩn FIFA, hệ thống đèn LED chống chói và phòng thay đồ riêng biệt.', location: '111 Đường Mỹ Phước, Thủ Dầu Một', city: 'Thủ Dầu Một', province: 'Bình Dương', imageUrl: '', pricePerHour: 200000, capacity: 14, sportType: 'FOOTBALL', amenities: 'Cỏ FIFA, Đèn LED, Phòng tắm, Căng tin', isAvailable: true },
        { id: 2, name: 'Sân Tennis Hard Court Thủ Dầu Một', description: 'Bề mặt sân cứng tiêu chuẩn giải đấu, không gian thoáng đãng kèm khu vực nghỉ có mái che.', location: '222 Đường Mỹ Phước, Thủ Dầu Một', city: 'Thủ Dầu Một', province: 'Bình Dương', imageUrl: '', pricePerHour: 180000, capacity: 4, sportType: 'TENNIS', amenities: 'Hard court, Đèn LED, Khu nghỉ', isAvailable: true },
        { id: 3, name: 'Sân Cầu Lông Thảm PVC Huỳnh Văn Lũy', description: 'Cụm sân thảm PVC độ bám cao, trang bị điều hòa toàn khu vực và trần cao chuẩn thi đấu.', location: '789 Đường Huỳnh Văn Lũy, Thủ Dầu Một', city: 'Thủ Dầu Một', province: 'Bình Dương', imageUrl: '', pricePerHour: 80000, capacity: 8, sportType: 'BADMINTON', amenities: 'Điều hòa, Thảm PVC, Phòng thay đồ', isAvailable: true },
        { id: 4, name: 'Sân Bóng Đá 5v5 Trường Chinh', description: 'Mặt cỏ mới, đường biên rộng an toàn, phù hợp đá giao hữu sau giờ làm việc.', location: '123 Đường Trường Chinh, Thủ Dầu Một', city: 'Thủ Dầu Một', province: 'Bình Dương', imageUrl: '', pricePerHour: 150000, capacity: 10, sportType: 'FOOTBALL', amenities: 'Đèn LED, Bãi giữ xe, Nước uống', isAvailable: true },
        { id: 5, name: 'Sân Bóng Rổ Arena Lê Lợi', description: 'Mặt sân sinh thái độ nảy chuẩn, bảng rổ kính cường lực và khán đài mini cho cổ động viên.', location: '999 Đường Lê Lợi, Thủ Dầu Một', city: 'Thủ Dầu Một', province: 'Bình Dương', imageUrl: '', pricePerHour: 120000, capacity: 15, sportType: 'BASKETBALL', amenities: 'Đèn LED, Khán đài mini', isAvailable: true },
        { id: 6, name: 'Sân Bóng Chuyền Pro 30 Tháng 4', description: 'Sân tiêu chuẩn thi đấu phong trào và bán chuyên, có khu khởi động riêng.', location: '444 Đường 30 Tháng 4, Thủ Dầu Một', city: 'Thủ Dầu Một', province: 'Bình Dương', imageUrl: '', pricePerHour: 130000, capacity: 14, sportType: 'VOLLEYBALL', amenities: 'Đèn LED, Lưới chuẩn thi đấu', isAvailable: true },
        { id: 7, name: 'Sân Tennis Indoor Quốc Lộ 13', description: 'Sân tennis trong nhà có mái che cách nhiệt và hệ thống thông gió hiện đại, thi đấu mọi thời tiết.', location: '777 Quốc Lộ 13, Thủ Dầu Một', city: 'Thủ Dầu Một', province: 'Bình Dương', imageUrl: '', pricePerHour: 200000, capacity: 4, sportType: 'TENNIS', amenities: 'Trong nhà, Điều hòa, Phòng tắm', isAvailable: true },
        { id: 8, name: 'Nhà Thi Đấu Futsal Quốc Lộ 1', description: 'Mặt sàn futsal tiêu chuẩn trong nhà, âm thanh và chiếu sáng đồng bộ cho giải nội bộ.', location: '666 Quốc Lộ 1, Thủ Dầu Một', city: 'Thủ Dầu Một', province: 'Bình Dương', imageUrl: '', pricePerHour: 160000, capacity: 12, sportType: 'FOOTBALL', amenities: 'Trong nhà, Đèn LED, Phòng thay đồ', isAvailable: true },
        { id: 9, name: 'Cụm 2 Sân Cầu Lông Đôi Tân Uyên', description: 'Hai court liền kề độc lập, ánh sáng chống lóa mắt, giữ xe miễn phí.', location: '333 Đường Tân Uyên, Thủ Dầu Một', city: 'Thủ Dầu Một', province: 'Bình Dương', imageUrl: '', pricePerHour: 75000, capacity: 10, sportType: 'BADMINTON', amenities: 'Điều hòa, 2 sân đôi, Bãi giữ xe', isAvailable: true },
        { id: 10, name: 'Sân Bóng Chuyền Nguyễn Hữu Cảnh', description: 'Sân bóng chuyền mặt phẳng chuẩn, chiếu sáng đồng đều, phù hợp giao hữu tối.', location: '456 Đường Nguyễn Hữu Cảnh, Thủ Dầu Một', city: 'Thủ Dầu Một', province: 'Bình Dương', imageUrl: '', pricePerHour: 100000, capacity: 12, sportType: 'VOLLEYBALL', amenities: 'Đèn chiếu sáng, Bãi giữ xe', isAvailable: true },
        { id: 11, name: 'Sân Bóng Chuyền Cát Tân Uyên', description: 'Sân bóng chuyền cát tự nhiên ngoài trời, trang bị vòi tắm tráng sạch sẽ.', location: '888 Đường Tân Uyên, Thủ Dầu Một', city: 'Thủ Dầu Một', province: 'Bình Dương', imageUrl: '', pricePerHour: 70000, capacity: 12, sportType: 'VOLLEYBALL', amenities: 'Cát tự nhiên, Vòi tắm tráng', isAvailable: true },
        { id: 12, name: 'Sân Bóng Rổ 3v3 Lý Tự Trọng', description: 'Không gian half-court luyện kỹ thuật cá nhân và thi đấu 3x3 nhịp độ cao.', location: '555 Đường Lý Tự Trọng, Thủ Dầu Một', city: 'Thủ Dầu Một', province: 'Bình Dương', imageUrl: '', pricePerHour: 90000, capacity: 8, sportType: 'BASKETBALL', amenities: 'Đèn chiếu sáng', isAvailable: false }
    ];

    var SLOT_PRESETS = [
        { label: '07:00 - 08:30', start: '07:00', end: '08:30' },
        { label: '16:00 - 17:30', start: '16:00', end: '17:30' },
        { label: '17:30 - 19:00', start: '17:30', end: '19:00' },
        { label: '19:00 - 20:30', start: '19:00', end: '20:30' },
        { label: '20:30 - 22:00', start: '20:30', end: '22:00' }
    ];

    var state = {
        allFields: [],
        filteredFields: [],
        searchQuery: '',
        sportFilter: '',
        maxPrice: '',
        amenityQuery: '',
        availableOnly: false,
        sortBy: 'default',
        serverFilteredIds: null,
        selectedField: null,
        fieldBookings: [],
        pendingBookingField: null,
        pendingBookingDraft: null,
        modalOpen: false,
        chatbotOpen: false,
        previouslyFocusedElement: null
    };

    var el = {};

    document.addEventListener('DOMContentLoaded', initApp);

    function initApp() {
        cacheElements();
        S.initSharedNavbar({
            onAuthSuccess: handleAuthSuccess,
            onLogout: handleAfterLogout
        });
        bindEvents();
        updateSectionNavigation();
        initDefaultDates();
        loadFields();
        S.syncCurrentUser();
    }

    function cacheElements() {
        el.heroTotalFields = document.getElementById('hero-total-fields');
        el.heroAvailableFields = document.getElementById('hero-available-fields');
        el.heroSearchForm = document.getElementById('hero-search-form');
        el.searchInput = document.getElementById('field-search');
        el.sportFilter = document.getElementById('sport-filter');
        el.filterDate = document.getElementById('filter-date');
        el.filterMaxPrice = document.getElementById('filter-max-price');
        el.filterAmenity = document.getElementById('filter-amenity');
        el.filterStartTime = document.getElementById('filter-start-time');
        el.filterEndTime = document.getElementById('filter-end-time');
        el.applyAdvancedBtn = document.getElementById('apply-advanced-btn');
        el.resetBtn = document.getElementById('reset-btn');
        el.emptyResetBtn = document.getElementById('empty-reset-btn');
        el.availableOnlyToggle = document.getElementById('available-only-toggle');
        el.sortSelect = document.getElementById('sort-fields');

        el.stateSection = document.getElementById('state-section');
        el.loading = document.getElementById('loading');
        el.errorMessage = document.getElementById('error-message');
        el.errorText = document.getElementById('error-text');
        el.errorRetryBtn = document.getElementById('error-retry-btn');
        el.errorCloseBtn = document.querySelector('#error-message .close-btn');
        el.noResults = document.getElementById('no-results');
        el.noResultsText = document.getElementById('no-results-text');

        el.resultsSection = document.getElementById('fields');
        el.previewBanner = document.getElementById('preview-mode-banner');
        el.previewReconnectBtn = document.getElementById('preview-reconnect-btn');
        el.resultsCountPill = document.getElementById('results-count-pill');
        el.resultsAvailableNote = document.getElementById('results-available-note');
        el.fieldsGrid = document.getElementById('fields-grid');

        el.modal = document.getElementById('field-modal');
        el.modalContent = document.querySelector('#field-modal .modal-content');
        el.closeModalBtn = document.getElementById('close-modal-btn');
        el.modalName = document.getElementById('modal-field-name');
        el.modalSubtitle = document.getElementById('modal-field-subtitle');
        el.modalMedia = document.getElementById('modal-field-media');
        el.modalLocation = document.getElementById('modal-field-location');
        el.modalSport = document.getElementById('modal-field-sport');
        el.modalPrice = document.getElementById('modal-field-price');
        el.modalCapacity = document.getElementById('modal-field-capacity');
        el.modalStatus = document.getElementById('modal-field-status');
        el.modalDescription = document.getElementById('modal-field-description');
        el.modalAmenities = document.getElementById('modal-field-amenities');
        el.modalOwnerRow = document.getElementById('modal-field-owner-row');
        el.modalOwnerLink = document.getElementById('modal-field-owner-link');

        el.slotStatusSummary = document.getElementById('slot-status-summary');
        el.slotPresets = document.getElementById('slot-presets');
        el.bookedSlotsWrapper = document.getElementById('booked-slots-wrapper');
        el.bookedSlotsList = document.getElementById('booked-slots-list');

        el.bookingForm = document.getElementById('booking-form');
        el.bookingDate = document.getElementById('booking-date');
        el.bookingStartTime = document.getElementById('booking-start-time');
        el.bookingEndTime = document.getElementById('booking-end-time');
        el.bookingPhone = document.getElementById('booking-phone');
        el.bookingExpectedPlayers = document.getElementById('booking-expected-players');
        el.bookingNotes = document.getElementById('booking-notes');
        el.bookingHoldOnly = document.getElementById('booking-hold-only');
        el.bookingDurationText = document.getElementById('booking-duration-text');
        el.bookingTotalPreview = document.getElementById('booking-total-preview');
        el.submitBookingBtn = document.getElementById('submit-booking-btn');
        el.cancelBookingBtn = document.getElementById('cancel-booking-btn');
        el.bookingFeedback = document.getElementById('booking-feedback');

        el.modalMapRow = document.getElementById('modal-field-map-row');
        el.modalMapLink = document.getElementById('modal-field-map-link');
        el.communityFieldPanel = document.getElementById('community-field-panel');
        el.communityCreateMatchLink = document.getElementById('community-create-match-link');
        el.onlineBookingContainer = document.getElementById('online-booking-container');

        el.openSuggestBtn = document.getElementById('open-suggest-field-btn');
        el.suggestModal = document.getElementById('suggest-field-modal');
        el.suggestForm = document.getElementById('suggest-field-form');
        el.suggestFeedback = document.getElementById('suggest-feedback');
        el.suggestSubmitBtn = document.getElementById('suggest-submit-btn');

        el.openClaimBtn = document.getElementById('open-claim-field-btn');
        el.claimModal = document.getElementById('claim-field-modal');
        el.claimSubtitle = document.getElementById('claim-field-subtitle');
        el.claimForm = document.getElementById('claim-field-form');
        el.claimFeedback = document.getElementById('claim-feedback');
        el.claimSubmitBtn = document.getElementById('claim-submit-btn');

        el.openReportBtn = document.getElementById('open-report-field-btn');
        el.reportModal = document.getElementById('report-field-modal');
        el.reportSubtitle = document.getElementById('report-field-subtitle');
        el.reportForm = document.getElementById('report-field-form');
        el.reportFeedback = document.getElementById('report-feedback');
        el.reportSubmitBtn = document.getElementById('report-submit-btn');

        el.chatbotToggle = document.getElementById('chatbot-toggle');
        el.chatbotPanel = document.getElementById('chatbot-panel');
        el.chatbotClose = document.getElementById('chatbot-close');
        el.chatbotMessages = document.getElementById('chatbot-messages');
        el.chatbotForm = document.getElementById('chatbot-form');
        el.chatbotInput = document.getElementById('chatbot-input');
    }

    function initDefaultDates() {
        var todayStr = S.formatDateForInput(new Date());
        if (el.filterDate) {
            el.filterDate.min = todayStr;
        }
    }

    function bindEvents() {
        if (el.heroSearchForm) {
            el.heroSearchForm.addEventListener('submit', function(e) {
                e.preventDefault();
                runCombinedSearch(true);
            });
        }

        if (el.searchInput) {
            el.searchInput.addEventListener('input', function() {
                state.searchQuery = this.value;
                applyFilters();
            });
        }

        if (el.sportFilter) {
            el.sportFilter.addEventListener('change', function() {
                state.sportFilter = this.value;
                applyFilters();
            });
        }

        if (el.filterMaxPrice) {
            el.filterMaxPrice.addEventListener('change', function() {
                state.maxPrice = this.value;
                applyFilters();
            });
        }

        if (el.filterAmenity) {
            el.filterAmenity.addEventListener('input', function() {
                state.amenityQuery = this.value;
                applyFilters();
            });
        }

        if (el.applyAdvancedBtn) {
            el.applyAdvancedBtn.addEventListener('click', function() {
                runCombinedSearch(false);
            });
        }

        if (el.resetBtn) {
            el.resetBtn.addEventListener('click', resetFilters);
        }

        if (el.emptyResetBtn) {
            el.emptyResetBtn.addEventListener('click', resetFilters);
        }

        if (el.availableOnlyToggle) {
            el.availableOnlyToggle.addEventListener('change', function() {
                state.availableOnly = !!this.checked;
                applyFilters();
            });
        }

        if (el.sortSelect) {
            el.sortSelect.addEventListener('change', function() {
                state.sortBy = this.value;
                applyFilters();
            });
        }

        if (el.errorRetryBtn) {
            el.errorRetryBtn.addEventListener('click', loadFields);
        }

        if (el.previewReconnectBtn) {
            el.previewReconnectBtn.addEventListener('click', loadFields);
        }

        if (el.errorCloseBtn) {
            el.errorCloseBtn.addEventListener('click', hideError);
        }

        if (el.closeModalBtn) el.closeModalBtn.addEventListener('click', closeModal);
        if (el.cancelBookingBtn) el.cancelBookingBtn.addEventListener('click', closeModal);

        if (el.modal) {
            el.modal.addEventListener('click', function(e) {
                if (e.target === el.modal) closeModal();
            });
        }

        if (el.bookingForm) {
            el.bookingForm.addEventListener('submit', handleBookingSubmit);
        }

        if (el.bookingDate) {
            el.bookingDate.addEventListener('change', function() {
                renderSlotTimeline();
                updateBookingPricePreview();
            });
        }

        if (el.bookingStartTime) {
            el.bookingStartTime.addEventListener('input', function() {
                syncPresetButtonsActiveState();
                updateBookingPricePreview();
            });
        }

        if (el.bookingEndTime) {
            el.bookingEndTime.addEventListener('input', function() {
                syncPresetButtonsActiveState();
                updateBookingPricePreview();
            });
        }

        if (el.chatbotToggle) {
            el.chatbotToggle.addEventListener('click', toggleChatbot);
        }

        if (el.chatbotClose) {
            el.chatbotClose.addEventListener('click', closeChatbot);
        }

        if (el.chatbotForm) {
            el.chatbotForm.addEventListener('submit', handleChatbotSubmit);
        }

        if (el.openSuggestBtn) el.openSuggestBtn.addEventListener('click', openSuggestModal);
        if (el.suggestForm) el.suggestForm.addEventListener('submit', handleSuggestSubmit);
        if (el.openClaimBtn) el.openClaimBtn.addEventListener('click', openClaimModal);
        if (el.claimForm) el.claimForm.addEventListener('submit', handleClaimSubmit);
        if (el.openReportBtn) el.openReportBtn.addEventListener('click', openReportModal);
        if (el.reportForm) el.reportForm.addEventListener('submit', handleReportSubmit);

        [el.suggestModal, el.claimModal, el.reportModal].forEach(function(m) {
            if (!m) return;
            m.addEventListener('click', function(e) {
                if (e.target === m || (e.target.closest && e.target.closest('[data-close-index-modal]'))) {
                    closeSecondaryModal(m);
                }
            });
        });

        Array.prototype.forEach.call(document.querySelectorAll('.chatbot-quick-chip'), function(chip) {
            chip.addEventListener('click', function() {
                var q = chip.getAttribute('data-chat-query') || '';
                if (!q) return;
                processAssistantQuery(q);
            });
        });

        document.addEventListener('keydown', function(e) {
            if (state.chatbotOpen && e.key === 'Escape' && !state.modalOpen) {
                closeChatbot();
            }
            if (state.modalOpen) {
                if (e.key === 'Escape') {
                    e.preventDefault();
                    closeModal();
                } else if (e.key === 'Tab') {
                    S.trapModalFocus(e, el.modalContent);
                }
            }
        });
    }

    function loadFields() {
        showLoading(true);
        hideError();
        if (el.previewBanner) el.previewBanner.classList.add('hidden');

        S.apiRequest('/fields', { method: 'GET', token: '' })
            .then(function(data) {
                if (!Array.isArray(data)) {
                    throw new Error('Phản hồi danh sách sân không hợp lệ.');
                }
                state.allFields = data.map(normalizeField).filter(Boolean);
                state.serverFilteredIds = null;
                updateHeroStats();
                applyFilters();
            })
            .catch(function(err) {
                if (!err || !err.isBackendError) {
                    state.allFields = PREVIEW_FIELDS.map(normalizeField).filter(Boolean);
                    state.serverFilteredIds = null;
                    if (el.previewBanner) el.previewBanner.classList.remove('hidden');
                    updateHeroStats();
                    applyFilters();
                    return;
                }
                state.allFields = [];
                state.filteredFields = [];
                renderFields([]);
                updateToolbarStats();
                showNoResults(false);
                showError(err.message || 'Không thể tải danh sách sân. Kiểm tra Backend hoặc thử lại sau.');
            })
            .then(function() {
                showLoading(false);
            });
    }

    function normalizeField(field) {
        if (!field || typeof field !== 'object') return null;
        var price = Number(field.pricePerHour);
        return {
            id: field.id || null,
            name: field.name || 'Sân thể thao',
            description: field.description || '',
            location: field.location || '',
            city: field.city || '',
            province: field.province || '',
            imageUrl: field.imageUrl || '',
            pricePerHour: Number.isFinite(price) ? price : 0,
            capacity: field.capacity != null ? Number(field.capacity) : 0,
            sportType: String(field.sportType || '').toUpperCase(),
            amenities: field.amenities || '',
            isAvailable: field.isAvailable !== false,
            ownerId: field.ownerId || null,
            venueSource: String(field.venueSource || 'PARTNER').toUpperCase(),
            verificationStatus: String(field.verificationStatus || 'APPROVED').toUpperCase(),
            latitude: field.latitude != null ? Number(field.latitude) : null,
            longitude: field.longitude != null ? Number(field.longitude) : null,
            mapUrl: field.mapUrl || '',
            isIndoor: !!field.isIndoor
        };
    }

    function runCombinedSearch(scrollToResults) {
        state.searchQuery = el.searchInput ? el.searchInput.value : '';
        state.sportFilter = el.sportFilter ? el.sportFilter.value : '';
        state.maxPrice = el.filterMaxPrice ? el.filterMaxPrice.value : '';
        state.amenityQuery = el.filterAmenity ? el.filterAmenity.value : '';

        var dateVal = el.filterDate ? el.filterDate.value : '';
        var startVal = el.filterStartTime ? el.filterStartTime.value : '';
        var endVal = el.filterEndTime ? el.filterEndTime.value : '';

        if (startVal && endVal && endVal <= startVal) {
            S.showToast('Giờ kết thúc tìm kiếm phải sau giờ bắt đầu.', 'error');
            return;
        }

        if (dateVal && startVal && endVal) {
            var params = new URLSearchParams();
            params.set('date', dateVal);
            params.set('startTime', startVal);
            params.set('endTime', endVal);
            if (state.sportFilter) params.set('sportType', state.sportFilter);
            if (state.maxPrice) params.set('maxPrice', state.maxPrice);
            if (state.amenityQuery.trim()) params.set('amenity', state.amenityQuery.trim());

            showLoading(true);
            S.apiRequest('/fields/search?' + params.toString(), { method: 'GET', token: '' })
                .then(function(list) {
                    var ids = {};
                    (Array.isArray(list) ? list : []).forEach(function(item) {
                        if (item && item.id != null) ids[String(item.id)] = true;
                    });
                    state.serverFilteredIds = ids;
                    applyFilters();
                    if (scrollToResults && el.resultsSection) {
                        el.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                })
                .catch(function(err) {
                    S.showToast(err.message || 'Không thể lọc lịch trống theo giờ.', 'error');
                })
                .then(function() {
                    showLoading(false);
                });
            return;
        }

        state.serverFilteredIds = null;
        applyFilters();
        if (scrollToResults && el.resultsSection) {
            el.resultsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
    }

    function applyFilters() {
        var query = (state.searchQuery || '').trim().toLowerCase();
        var sportFilter = state.sportFilter || '';
        var maxPrice = state.maxPrice ? Number(state.maxPrice) : null;
        var amenityFilter = (state.amenityQuery || '').trim().toLowerCase();

        var filtered = state.allFields.filter(function(field) {
            if (state.serverFilteredIds && !state.serverFilteredIds[String(field.id)]) {
                return false;
            }
            if (sportFilter && field.sportType !== sportFilter) {
                return false;
            }
            if (state.availableOnly && !field.isAvailable) {
                return false;
            }
            if (maxPrice != null && Number.isFinite(maxPrice) && field.pricePerHour > maxPrice) {
                return false;
            }
            if (amenityFilter && String(field.amenities || '').toLowerCase().indexOf(amenityFilter) === -1) {
                return false;
            }
            if (query) {
                var sportLabel = S.getSportMeta(field.sportType).label;
                var haystack = [
                    field.name,
                    field.location,
                    field.city,
                    field.province,
                    field.amenities,
                    field.sportType,
                    sportLabel
                ].join(' ').toLowerCase();
                if (haystack.indexOf(query) === -1) {
                    return false;
                }
            }
            return true;
        });

        if (state.sortBy === 'price-asc') {
            filtered.sort(function(a, b) { return a.pricePerHour - b.pricePerHour; });
        } else if (state.sortBy === 'price-desc') {
            filtered.sort(function(a, b) { return b.pricePerHour - a.pricePerHour; });
        } else if (state.sortBy === 'capacity-desc') {
            filtered.sort(function(a, b) { return b.capacity - a.capacity; });
        }

        state.filteredFields = filtered;
        renderFields(filtered);
        updateToolbarStats();
        showNoResults(filtered.length === 0 && state.allFields.length > 0);
    }

    function resetFilters() {
        state.searchQuery = '';
        state.sportFilter = '';
        state.maxPrice = '';
        state.amenityQuery = '';
        state.availableOnly = false;
        state.sortBy = 'default';
        state.serverFilteredIds = null;

        if (el.searchInput) el.searchInput.value = '';
        if (el.sportFilter) el.sportFilter.value = '';
        if (el.filterDate) el.filterDate.value = '';
        if (el.filterMaxPrice) el.filterMaxPrice.value = '';
        if (el.filterAmenity) el.filterAmenity.value = '';
        if (el.filterStartTime) el.filterStartTime.value = '';
        if (el.filterEndTime) el.filterEndTime.value = '';
        if (el.availableOnlyToggle) el.availableOnlyToggle.checked = false;
        if (el.sortSelect) el.sortSelect.value = 'default';

        applyFilters();
    }

    function updateHeroStats() {
        var total = state.allFields.length;
        var available = state.allFields.filter(function(f) { return f.isAvailable; }).length;
        if (el.heroTotalFields) el.heroTotalFields.textContent = String(total);
        if (el.heroAvailableFields) el.heroAvailableFields.textContent = String(available);
    }

    function updateToolbarStats() {
        var count = state.filteredFields.length;
        var availableCount = state.filteredFields.filter(function(f) { return f.isAvailable; }).length;

        if (el.resultsCountPill) {
            el.resultsCountPill.textContent = count + ' sân';
        }
        if (el.resultsAvailableNote) {
            el.resultsAvailableNote.textContent = count
                ? (availableCount + ' sân sẵn sàng nhận lịch' + (state.serverFilteredIds ? ' (đã lọc theo giờ trống)' : ''))
                : 'Không có sân khớp tiêu chí';
        }
    }

    function renderFields(fields) {
        if (!el.fieldsGrid) return;
        el.fieldsGrid.innerHTML = '';
        if (!fields || !fields.length) return;

        var fragment = document.createDocumentFragment();
        fields.forEach(function(field) {
            fragment.appendChild(createFieldCard(field));
        });
        el.fieldsGrid.appendChild(fragment);
        S.refreshIcons(el.fieldsGrid);
    }

    function createFieldCard(field) {
        var card = document.createElement('article');
        card.className = 'field-card' + (field.isAvailable ? '' : ' is-unavailable');
        card.setAttribute('tabindex', '0');
        card.setAttribute('role', 'button');
        card.setAttribute('aria-label', 'Xem chi tiết ' + field.name);

        var sportMeta = S.getSportMeta(field.sportType);
        var amenities = S.parseAmenities(field.amenities);
        var visibleAmenities = amenities.slice(0, 3);
        var extraAmenitiesCount = Math.max(0, amenities.length - 3);

        var amenitiesHtml = visibleAmenities.map(function(tag) {
            return '<span class="amenity-tag">' + S.escapeHtml(tag) + '</span>';
        }).join('') + (extraAmenitiesCount > 0 ? '<span class="amenity-tag">+' + extraAmenitiesCount + '</span>' : '');

        var isCommunity = field.venueSource === 'COMMUNITY_UNCLAIMED';
        var statusBadge = isCommunity
            ? S.getFieldTrustBadge(field)
            : (field.isAvailable
                ? S.getFieldTrustBadge(field)
                : '<span class="status-badge error"><i data-lucide="ban" aria-hidden="true"></i><span>Tạm ngưng</span></span>');

        var locationText = field.location || field.city || 'Chưa cập nhật địa chỉ';
        var bookDisabledAttr = (!isCommunity && !field.isAvailable) ? ' disabled title="Sân hiện đang tạm ngưng nhận đặt"' : '';
        var bookBtnLabel = isCommunity ? 'Hẹn kèo' : 'Đặt lịch';
        var priceMarkup = isCommunity
            ? '<span class="field-price">Cộng đồng</span><span class="field-price-unit">Tự liên hệ sân</span>'
            : '<span class="field-price">' + S.formatCurrency(field.pricePerHour) + '₫</span><span class="field-price-unit">Mỗi giờ</span>';

        card.innerHTML =
            '<div class="field-image-container">' +
            '  ' + S.renderFieldMediaMarkup(field, 'field-image') +
            '  <span class="field-sport-pill">' + sportMeta.iconSvg + '<span>' + S.escapeHtml(sportMeta.label) + '</span></span>' +
            '  <div class="field-status-overlay">' + statusBadge + '</div>' +
            '</div>' +
            '<div class="field-content">' +
            '  <div class="field-card-kicker">' +
            '    <span>' + S.escapeHtml(field.city || 'Thủ Dầu Một') + '</span>' +
            '    <span class="tabular-nums">Tối đa ' + S.escapeHtml(String(field.capacity || 0)) + ' người</span>' +
            '  </div>' +
            '  <h3 class="field-name">' + S.escapeHtml(field.name) + '</h3>' +
            '  <div class="field-meta-list">' +
            '    <div class="field-meta-item"><i data-lucide="map-pin" aria-hidden="true"></i><span>' + S.escapeHtml(locationText) + '</span></div>' +
            '  </div>' +
            (amenitiesHtml ? '<div class="field-amenities">' + amenitiesHtml + '</div>' : '') +
            '  <div class="field-card-footer">' +
            '    <div class="field-price-block">' + priceMarkup + '</div>' +
            '    <div class="field-actions">' +
            '      <button class="btn btn-secondary btn-sm field-detail-btn" type="button">Chi tiết</button>' +
            '      <button class="btn btn-primary btn-sm field-book-btn" type="button"' + bookDisabledAttr + '>' + bookBtnLabel + '</button>' +
            '    </div>' +
            '  </div>' +
            '</div>';

        card.querySelector('.field-detail-btn').addEventListener('click', function(e) {
            e.stopPropagation();
            openFieldModal(field);
        });

        card.querySelector('.field-book-btn').addEventListener('click', function(e) {
            e.stopPropagation();
            requestBookingForField(field);
        });

        card.addEventListener('click', function() {
            openFieldModal(field);
        });

        card.addEventListener('keydown', function(e) {
            if (e.target === card && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                openFieldModal(field);
            }
        });

        return card;
    }

    // ===== Field Detail & Smart Booking Modal =====

    function requestBookingForField(field) {
        if (!field) return;
        if (field.venueSource === 'COMMUNITY_UNCLAIMED') {
            openFieldModal(field);
            return;
        }
        if (!field.isAvailable) {
            S.showToast('Sân này hiện đang tạm ngưng nhận đặt.', 'error');
            return;
        }

        var session = S.loadAuthSession();
        if (!session.currentUser) {
            state.pendingBookingField = field;
            S.openAuthModal('login', {
                message: 'Đăng nhập để tiếp tục đặt sân "' + field.name + '".'
            });
            return;
        }

        openFieldModal(field, { focusBooking: true });
    }

    function openFieldModal(field, options) {
        if (!field) return;
        state.selectedField = field;
        state.fieldBookings = [];
        state.previouslyFocusedElement = document.activeElement;

        var sportMeta = S.getSportMeta(field.sportType);
        if (el.modalName) el.modalName.textContent = field.name;
        if (el.modalSubtitle) {
            el.modalSubtitle.textContent = [sportMeta.label, field.city, field.province].filter(Boolean).join(' · ');
        }
        if (el.modalMedia) {
            el.modalMedia.innerHTML = S.renderFieldMediaMarkup(field, 'field-image');
        }
        if (el.modalLocation) {
            el.modalLocation.textContent = [field.location, field.city, field.province].filter(Boolean).join(', ') || 'Chưa cập nhật';
        }
        if (el.modalSport) el.modalSport.textContent = sportMeta.label;
        if (el.modalPrice) el.modalPrice.textContent = S.formatCurrency(field.pricePerHour);
        if (el.modalCapacity) el.modalCapacity.textContent = String(field.capacity || 0);
        if (el.modalStatus) {
            el.modalStatus.textContent = field.isAvailable ? 'Đang mở đặt sân' : 'Tạm ngưng nhận lịch';
        }
        if (el.modalDescription) {
            el.modalDescription.textContent = field.description || 'Sân đạt tiêu chuẩn tập luyện và thi đấu phong trào.';
        }
        if (el.modalAmenities) {
            var tags = S.parseAmenities(field.amenities);
            el.modalAmenities.innerHTML = tags.map(function(tag) {
                return '<span class="amenity-tag">' + S.escapeHtml(tag) + '</span>';
            }).join('');
        }
        if (el.modalOwnerRow && el.modalOwnerLink) {
            var session = S.loadAuthSession();
            var canViewOwner = !!(field.ownerId && session.token);
            el.modalOwnerRow.classList.toggle('hidden', !canViewOwner);
            if (canViewOwner) el.modalOwnerLink.href = 'profile.html?id=' + encodeURIComponent(field.ownerId);
        }
        if (el.modalMapRow && el.modalMapLink) {
            var mapHref = field.mapUrl || (field.latitude != null && field.longitude != null
                ? ('https://maps.google.com/?q=' + field.latitude + ',' + field.longitude)
                : '');
            el.modalMapRow.classList.toggle('hidden', !mapHref);
            if (mapHref) el.modalMapLink.href = mapHref;
        }
        var isCommunity = field.venueSource === 'COMMUNITY_UNCLAIMED';
        if (el.communityFieldPanel) el.communityFieldPanel.classList.toggle('hidden', !isCommunity);
        if (el.onlineBookingContainer) el.onlineBookingContainer.classList.toggle('hidden', isCommunity);
        if (el.communityCreateMatchLink && isCommunity) {
            el.communityCreateMatchLink.href = 'matches.html?fieldId=' + encodeURIComponent(field.id);
        }

        prepareBookingForm(field);
        showBookingFeedback('');

        if (el.modal) {
            el.modal.classList.remove('hidden');
            el.modal.setAttribute('aria-hidden', 'false');
        }
        if (el.modalContent) el.modalContent.scrollTop = 0;
        document.body.classList.add('modal-open');
        state.modalOpen = true;
        S.refreshIcons(el.modal);

        loadFieldSchedule(field.id);

        window.setTimeout(function() {
            if (options && options.focusBooking && el.bookingDate) {
                el.bookingDate.focus();
            } else if (el.closeModalBtn) {
                el.closeModalBtn.focus();
            }
        }, 20);
    }

    function closeModal() {
        if (el.modal) {
            el.modal.classList.add('hidden');
            el.modal.setAttribute('aria-hidden', 'true');
        }
        if (!document.querySelector('.modal:not(.hidden)')) {
            document.body.classList.remove('modal-open');
        }
        state.modalOpen = false;
        state.selectedField = null;

        if (state.previouslyFocusedElement && typeof state.previouslyFocusedElement.focus === 'function') {
            state.previouslyFocusedElement.focus();
        }
    }

    function prepareBookingForm(field) {
        var today = new Date();
        var defaultDate = (el.filterDate && el.filterDate.value)
            ? el.filterDate.value
            : S.formatDateForInput(new Date(today.getTime() + 24 * 60 * 60 * 1000));
        var session = S.loadAuthSession();

        if (el.bookingDate) {
            el.bookingDate.min = S.formatDateForInput(today);
            el.bookingDate.value = defaultDate;
        }
        if (el.bookingStartTime) {
            el.bookingStartTime.value = (el.filterStartTime && el.filterStartTime.value) || '17:30';
        }
        if (el.bookingEndTime) {
            el.bookingEndTime.value = (el.filterEndTime && el.filterEndTime.value) || '19:00';
        }
        if (el.bookingPhone) {
            el.bookingPhone.value = (session.currentUser && session.currentUser.phone) || '';
        }
        if (el.bookingNotes) {
            el.bookingNotes.value = '';
        }
        if (el.bookingHoldOnly) {
            el.bookingHoldOnly.checked = false;
        }
        if (el.submitBookingBtn) {
            el.submitBookingBtn.disabled = !field.isAvailable;
        }

        renderSlotTimeline();
        updateBookingPricePreview();
    }

    function loadFieldSchedule(fieldId) {
        if (!fieldId) return;
        if (el.slotStatusSummary) el.slotStatusSummary.textContent = 'Đang tải lịch trống...';

        S.apiRequest('/bookings/field/' + encodeURIComponent(fieldId), { method: 'GET', token: '' })
            .then(function(list) {
                state.fieldBookings = Array.isArray(list) ? list : [];
                renderSlotTimeline();
            })
            .catch(function() {
                state.fieldBookings = [];
                if (el.slotStatusSummary) el.slotStatusSummary.textContent = 'Chưa tải được lịch sân';
            });
    }

    function getActiveBookingsOnDate(dateStr) {
        if (!dateStr) return [];
        var nowMs = Date.now();
        return state.fieldBookings.filter(function(b) {
            if (!b || String(b.bookingDate || '').slice(0, 10) !== dateStr) return false;
            var status = S.normalizeBookingStatus(b.status);
            if (status === 'CANCELLED') return false;
            if (status === 'HOLD' && b.holdExpiresAt) {
                var exp = new Date(b.holdExpiresAt).getTime();
                if (!isNaN(exp) && exp <= nowMs) return false;
            }
            return true;
        });
    }

    function hasTimeOverlap(startA, endA, startB, endB) {
        return S.formatTime(startA) < S.formatTime(endB) && S.formatTime(endA) > S.formatTime(startB);
    }

    function renderSlotTimeline() {
        if (!el.slotPresets) return;
        var dateStr = el.bookingDate ? el.bookingDate.value : '';
        var activeBookings = getActiveBookingsOnDate(dateStr);

        if (el.slotStatusSummary) {
            el.slotStatusSummary.textContent = activeBookings.length
                ? (activeBookings.length + ' khung giờ đã đặt')
                : 'Trống cả ngày';
        }

        if (el.bookedSlotsWrapper && el.bookedSlotsList) {
            if (activeBookings.length) {
                el.bookedSlotsWrapper.classList.remove('hidden');
                el.bookedSlotsList.innerHTML = activeBookings.map(function(b) {
                    return '<span class="booked-slot-chip">' + S.escapeHtml(S.formatTimeRange(b.startTime, b.endTime)) + '</span>';
                }).join('');
            } else {
                el.bookedSlotsWrapper.classList.add('hidden');
                el.bookedSlotsList.innerHTML = '';
            }
        }

        el.slotPresets.innerHTML = '';
        SLOT_PRESETS.forEach(function(preset) {
            var isBooked = activeBookings.some(function(b) {
                return hasTimeOverlap(preset.start, preset.end, b.startTime, b.endTime);
            });
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'slot-preset-btn' + (isBooked ? ' is-booked' : '');
            btn.textContent = preset.label;
            btn.disabled = isBooked;
            btn.setAttribute('data-start', preset.start);
            btn.setAttribute('data-end', preset.end);
            btn.title = isBooked ? 'Khung giờ này đã có người đặt' : 'Chọn nhanh khung ' + preset.label;
            btn.addEventListener('click', function() {
                if (el.bookingStartTime) el.bookingStartTime.value = preset.start;
                if (el.bookingEndTime) el.bookingEndTime.value = preset.end;
                syncPresetButtonsActiveState();
                updateBookingPricePreview();
            });
            el.slotPresets.appendChild(btn);
        });

        syncPresetButtonsActiveState();
    }

    function syncPresetButtonsActiveState() {
        if (!el.slotPresets) return;
        var currentStart = el.bookingStartTime ? el.bookingStartTime.value : '';
        var currentEnd = el.bookingEndTime ? el.bookingEndTime.value : '';
        Array.prototype.forEach.call(el.slotPresets.querySelectorAll('.slot-preset-btn'), function(btn) {
            var matches = btn.getAttribute('data-start') === currentStart && btn.getAttribute('data-end') === currentEnd;
            btn.classList.toggle('is-active', matches && !btn.disabled);
        });
    }

    function updateBookingPricePreview() {
        if (!state.selectedField) return;
        var start = el.bookingStartTime ? el.bookingStartTime.value : '';
        var end = el.bookingEndTime ? el.bookingEndTime.value : '';
        var hours = S.getHoursBetweenTimes(start, end);
        var total = S.calculateBookingTotal(state.selectedField.pricePerHour, start, end);

        if (el.bookingDurationText) {
            el.bookingDurationText.textContent = hours > 0
                ? (Math.round(hours * 100) / 100) + ' giờ × ' + S.formatCurrency(state.selectedField.pricePerHour) + ' đ'
                : 'Chọn giờ hợp lệ';
        }
        if (el.bookingTotalPreview) {
            el.bookingTotalPreview.textContent = S.formatCurrency(total) + ' đ';
        }
    }

    function handleBookingSubmit(e) {
        e.preventDefault();
        if (!state.selectedField) return;

        if (!state.selectedField.isAvailable) {
            showBookingFeedback('Sân này hiện đang tạm ngưng nhận đặt.', true);
            return;
        }

        var bookingDate = el.bookingDate ? el.bookingDate.value : '';
        var startTime = el.bookingStartTime ? el.bookingStartTime.value : '';
        var endTime = el.bookingEndTime ? el.bookingEndTime.value : '';
        var phone = el.bookingPhone ? el.bookingPhone.value.trim() : '';
        var expectedPlayersRaw = el.bookingExpectedPlayers ? parseInt(el.bookingExpectedPlayers.value, 10) : NaN;
        var expectedPlayers = Number.isFinite(expectedPlayersRaw) && expectedPlayersRaw > 0 ? expectedPlayersRaw : null;
        var notes = el.bookingNotes ? el.bookingNotes.value.trim() : '';
        var holdOnly = !!(el.bookingHoldOnly && el.bookingHoldOnly.checked);

        var session = S.loadAuthSession();
        if (!session.currentUser || !session.token) {
            state.pendingBookingField = state.selectedField;
            state.pendingBookingDraft = {
                bookingDate: bookingDate,
                startTime: startTime,
                endTime: endTime,
                phone: phone,
                notes: notes,
                holdOnly: holdOnly
            };
            closeModal();
            S.openAuthModal('login', {
                message: 'Đăng nhập để hoàn tất yêu cầu đặt sân.'
            });
            return;
        }

        if (!bookingDate || !startTime || !endTime || !phone) {
            showBookingFeedback('Vui lòng nhập đầy đủ ngày đặt, khung giờ và số điện thoại.', true);
            return;
        }

        if (endTime <= startTime) {
            showBookingFeedback('Giờ kết thúc phải sau giờ bắt đầu.', true);
            return;
        }

        if (!/^[0-9+\s().-]{9,15}$/.test(phone)) {
            showBookingFeedback('Số điện thoại không hợp lệ (cần 9–15 chữ số).', true);
            return;
        }

        var activeOnDate = getActiveBookingsOnDate(bookingDate);
        var conflict = activeOnDate.find(function(b) {
            return hasTimeOverlap(startTime, endTime, b.startTime, b.endTime);
        });
        if (conflict) {
            showBookingFeedback('Khung giờ này trùng với lịch đã đặt (' + S.formatTimeRange(conflict.startTime, conflict.endTime) + '). Vui lòng chọn giờ khác.', true);
            return;
        }

        showBookingFeedback('Đang gửi yêu cầu đặt sân...', false);
        if (el.submitBookingBtn) el.submitBookingBtn.disabled = true;

        S.apiRequest('/bookings', {
            method: 'POST',
            token: session.token,
            body: JSON.stringify({
                fieldId: state.selectedField.id,
                bookingDate: bookingDate,
                startTime: startTime,
                endTime: endTime,
                customerPhone: phone,
                expectedPlayers: expectedPlayers,
                notes: notes,
                holdOnly: holdOnly
            })
        })
            .then(function() {
                S.showToast(holdOnly ? 'Đã giữ chỗ tạm trong 10 phút!' : 'Gửi yêu cầu đặt sân thành công!', 'success');
                showBookingFeedback('Đã tạo lịch thành công. Bạn có thể theo dõi trong mục Lịch của tôi.', false);
                window.setTimeout(closeModal, 900);
            })
            .catch(function(err) {
                showBookingFeedback(err.message || 'Không thể tạo booking. Vui lòng thử lại.', true);
            })
            .then(function() {
                if (el.submitBookingBtn && state.selectedField) {
                    el.submitBookingBtn.disabled = !state.selectedField.isAvailable;
                }
            });
    }

    function showBookingFeedback(message, isError) {
        if (!el.bookingFeedback) return;
        if (!message) {
            el.bookingFeedback.textContent = '';
            el.bookingFeedback.className = 'booking-feedback hidden';
            return;
        }
        el.bookingFeedback.textContent = message;
        el.bookingFeedback.className = 'booking-feedback ' + (isError ? 'error' : 'success');
    }

    function restoreBookingDraft(draft) {
        if (!draft) return;
        if (el.bookingDate && draft.bookingDate) el.bookingDate.value = draft.bookingDate;
        if (el.bookingStartTime && draft.startTime) el.bookingStartTime.value = draft.startTime;
        if (el.bookingEndTime && draft.endTime) el.bookingEndTime.value = draft.endTime;
        if (el.bookingPhone && draft.phone) el.bookingPhone.value = draft.phone;
        if (el.bookingNotes && draft.notes) el.bookingNotes.value = draft.notes;
        if (el.bookingHoldOnly && typeof draft.holdOnly === 'boolean') el.bookingHoldOnly.checked = draft.holdOnly;
        renderSlotTimeline();
        updateBookingPricePreview();
    }

    function handleAuthSuccess() {
        if (state.pendingBookingField) {
            var field = state.pendingBookingField;
            var draft = state.pendingBookingDraft;
            state.pendingBookingField = null;
            state.pendingBookingDraft = null;
            window.setTimeout(function() {
                openFieldModal(field, { focusBooking: true });
                restoreBookingDraft(draft);
            }, 80);
        }
    }

    function handleAfterLogout() {
        state.pendingBookingField = null;
        state.pendingBookingDraft = null;
    }

    function openSecondaryModal(modal) {
        if (!modal) return;
        modal.classList.remove('hidden');
        modal.setAttribute('aria-hidden', 'false');
        document.body.classList.add('modal-open');
        S.refreshIcons(modal);
    }

    function closeSecondaryModal(modal) {
        if (!modal || modal.classList.contains('hidden')) return;
        modal.classList.add('hidden');
        modal.setAttribute('aria-hidden', 'true');
        if (!document.querySelector('.modal:not(.hidden)')) {
            document.body.classList.remove('modal-open');
        }
    }

    function setBoxFeedback(node, msg, isError) {
        if (!node) return;
        if (!msg) {
            node.textContent = '';
            node.className = 'booking-feedback hidden';
            return;
        }
        node.textContent = msg;
        node.className = 'booking-feedback ' + (isError ? 'error' : 'success');
    }

    function openSuggestModal() {
        var session = S.loadAuthSession();
        if (!session.token) {
            S.openAuthModal('login', { message: 'Đăng nhập để đề xuất sân cộng đồng mới.' });
            return;
        }
        if (el.suggestForm) el.suggestForm.reset();
        setBoxFeedback(el.suggestFeedback, '', false);
        openSecondaryModal(el.suggestModal);
    }

    function handleSuggestSubmit(e) {
        e.preventDefault();
        var name = document.getElementById('suggest-name').value.trim();
        var sportType = document.getElementById('suggest-sport').value;
        var location = document.getElementById('suggest-location').value.trim();
        if (!name || !location) {
            setBoxFeedback(el.suggestFeedback, 'Vui lòng nhập tên sân và địa chỉ.', true);
            return;
        }
        var latVal = document.getElementById('suggest-lat').value;
        var lngVal = document.getElementById('suggest-lng').value;
        var payload = {
            name: name,
            sportType: sportType,
            location: location,
            city: document.getElementById('suggest-city').value.trim() || null,
            province: document.getElementById('suggest-province').value.trim() || null,
            capacity: parseInt(document.getElementById('suggest-capacity').value, 10) || null,
            latitude: latVal ? Number(latVal) : null,
            longitude: lngVal ? Number(lngVal) : null,
            mapUrl: document.getElementById('suggest-map-url').value.trim() || null,
            description: document.getElementById('suggest-desc').value.trim() || null
        };
        if (el.suggestSubmitBtn) el.suggestSubmitBtn.disabled = true;
        S.apiRequest('/fields/community-suggest', { method: 'POST', body: JSON.stringify(payload) })
            .then(function() {
                closeSecondaryModal(el.suggestModal);
                S.showToast('Đã gửi đề xuất sân cộng đồng để Admin kiểm duyệt!', 'success');
            })
            .catch(function(err) {
                setBoxFeedback(el.suggestFeedback, err.message || 'Không thể gửi đề xuất.', true);
            })
            .then(function() {
                if (el.suggestSubmitBtn) el.suggestSubmitBtn.disabled = false;
            });
    }

    function openClaimModal() {
        if (!state.selectedField) return;
        var session = S.loadAuthSession();
        if (!session.token) {
            closeModal();
            S.openAuthModal('login', { message: 'Đăng nhập để gửi yêu cầu xác minh quyền sở hữu sân.' });
            return;
        }
        if (el.claimForm) el.claimForm.reset();
        if (el.claimSubtitle) el.claimSubtitle.textContent = state.selectedField.name;
        setBoxFeedback(el.claimFeedback, '', false);
        openSecondaryModal(el.claimModal);
    }

    function handleClaimSubmit(e) {
        e.preventDefault();
        if (!state.selectedField) return;
        var notes = document.getElementById('claim-notes').value.trim();
        var mapUrl = document.getElementById('claim-map-url').value.trim() || null;
        var fileInput = document.getElementById('claim-evidence-file');
        var file = fileInput && fileInput.files ? fileInput.files[0] : null;
        if (!notes) {
            setBoxFeedback(el.claimFeedback, 'Vui lòng mô tả thông tin chứng minh quyền sở hữu.', true);
            return;
        }
        if (el.claimSubmitBtn) el.claimSubmitBtn.disabled = true;
        var uploadPromise = Promise.resolve(null);
        if (file) {
            var fd = new FormData();
            fd.append('file', file);
            uploadPromise = S.apiRequest('/fields/claim-evidence', { method: 'POST', isFormData: true, body: fd })
                .then(function(res) { return res && res.url ? res.url : null; });
        }
        uploadPromise
            .then(function(evidenceUrl) {
                return S.apiRequest('/fields/' + encodeURIComponent(state.selectedField.id) + '/claim', {
                    method: 'POST',
                    body: JSON.stringify({ mapUrl: mapUrl, evidenceDocUrl: evidenceUrl, notes: notes })
                });
            })
            .then(function() {
                closeSecondaryModal(el.claimModal);
                S.showToast('Đã gửi hồ sơ xác minh quyền chủ sân! Admin sẽ xét duyệt sớm.', 'success');
            })
            .catch(function(err) {
                setBoxFeedback(el.claimFeedback, err.message || 'Không thể gửi yêu cầu xác minh.', true);
            })
            .then(function() {
                if (el.claimSubmitBtn) el.claimSubmitBtn.disabled = false;
            });
    }

    function openReportModal() {
        if (!state.selectedField) return;
        var session = S.loadAuthSession();
        if (!session.token) {
            closeModal();
            S.openAuthModal('login', { message: 'Đăng nhập để báo cáo thông tin sân.' });
            return;
        }
        if (el.reportForm) el.reportForm.reset();
        if (el.reportSubtitle) el.reportSubtitle.textContent = state.selectedField.name;
        setBoxFeedback(el.reportFeedback, '', false);
        openSecondaryModal(el.reportModal);
    }

    function handleReportSubmit(e) {
        e.preventDefault();
        if (!state.selectedField) return;
        var reason = document.getElementById('report-reason').value;
        var details = document.getElementById('report-details').value.trim() || null;
        if (el.reportSubmitBtn) el.reportSubmitBtn.disabled = true;
        S.apiRequest('/fields/' + encodeURIComponent(state.selectedField.id) + '/report', {
            method: 'POST',
            body: JSON.stringify({ reason: reason, details: details })
        })
            .then(function() {
                closeSecondaryModal(el.reportModal);
                S.showToast('Đã ghi nhận báo cáo của bạn để Admin kiểm tra.', 'info');
            })
            .catch(function(err) {
                setBoxFeedback(el.reportFeedback, err.message || 'Không thể gửi báo cáo.', true);
            })
            .then(function() {
                if (el.reportSubmitBtn) el.reportSubmitBtn.disabled = false;
            });
    }

    // ===== Interactive Local Field Finder Assistant =====

    function toggleChatbot() {
        if (!el.chatbotPanel) return;
        if (state.chatbotOpen) {
            closeChatbot();
        } else {
            state.chatbotOpen = true;
            el.chatbotPanel.classList.remove('hidden');
            window.setTimeout(function() {
                if (el.chatbotInput) el.chatbotInput.focus();
            }, 20);
        }
    }

    function closeChatbot() {
        if (!el.chatbotPanel) return;
        state.chatbotOpen = false;
        el.chatbotPanel.classList.add('hidden');
    }

    function handleChatbotSubmit(e) {
        e.preventDefault();
        if (!el.chatbotInput) return;
        var text = el.chatbotInput.value.trim();
        if (!text) return;
        el.chatbotInput.value = '';
        processAssistantQuery(text);
    }

    function processAssistantQuery(query) {
        appendChatBubble('user', query);
        var lower = query.toLowerCase();

        if (/hướng dẫn|cách đặt|hủy|huỷ/.test(lower)) {
            appendChatBubble('bot', 'Để đặt sân: Chọn sân -> Chọn ngày để xem các khung giờ đã có người đặt -> Nhập giờ bắt đầu/kết thúc và SĐT -> Gửi yêu cầu. Bạn có thể sửa hoặc hủy (cần nhập lý do) tại trang "Lịch của tôi".');
            return;
        }

        var sportMatch = null;
        if (/bóng đá|futsal|5v5|7v7/.test(lower)) sportMatch = 'FOOTBALL';
        else if (/bóng chuyền/.test(lower)) sportMatch = 'VOLLEYBALL';
        else if (/cầu lông/.test(lower)) sportMatch = 'BADMINTON';
        else if (/bóng rổ|3v3/.test(lower)) sportMatch = 'BASKETBALL';
        else if (/tennis/.test(lower)) sportMatch = 'TENNIS';

        var maxBudget = null;
        var priceRegex = lower.match(/(\d+)\s*(k|nghìn|nghin)/);
        if (priceRegex) {
            maxBudget = Number(priceRegex[1]) * 1000;
        }

        var candidates = state.allFields.filter(function(f) {
            if (!f.isAvailable) return false;
            if (sportMatch && f.sportType !== sportMatch) return false;
            if (maxBudget && f.pricePerHour > maxBudget) return false;
            if (!sportMatch && !maxBudget) {
                var blob = (f.name + ' ' + f.location + ' ' + f.amenities + ' ' + S.getSportMeta(f.sportType).label).toLowerCase();
                return lower.split(/\s+/).some(function(word) {
                    return word.length >= 2 && blob.indexOf(word) !== -1;
                });
            }
            return true;
        }).slice(0, 4);

        if (!candidates.length) {
            appendChatBubble('bot', 'Mình chưa tìm thấy sân khả dụng khớp yêu cầu "' + query + '". Bạn thử chọn môn thể thao hoặc mức giá cao hơn nhé.');
            return;
        }

        appendChatSuggestions(
            'Mình tìm thấy ' + candidates.length + ' sân phù hợp (bấm vào sân để xem lịch trống):',
            candidates
        );
    }

    function appendChatBubble(role, text) {
        if (!el.chatbotMessages) return;
        var item = document.createElement('article');
        item.className = 'chatbot-message ' + (role === 'user' ? 'user' : 'bot');
        var p = document.createElement('p');
        p.textContent = text;
        item.appendChild(p);
        el.chatbotMessages.appendChild(item);
        el.chatbotMessages.scrollTop = el.chatbotMessages.scrollHeight;
    }

    function appendChatSuggestions(introText, fields) {
        if (!el.chatbotMessages) return;
        var item = document.createElement('article');
        item.className = 'chatbot-message bot';

        var p = document.createElement('p');
        p.textContent = introText;
        item.appendChild(p);

        var list = document.createElement('div');
        list.className = 'chatbot-suggestion-list';

        fields.forEach(function(field) {
            var btn = document.createElement('button');
            btn.type = 'button';
            btn.className = 'chatbot-suggestion-btn';
            btn.innerHTML = '<span>' + S.escapeHtml(field.name) + '</span><strong class="tabular-nums">' + S.formatCurrency(field.pricePerHour) + 'đ</strong>';
            btn.addEventListener('click', function() {
                closeChatbot();
                openFieldModal(field, { focusBooking: true });
            });
            list.appendChild(btn);
        });

        item.appendChild(list);
        el.chatbotMessages.appendChild(item);
        el.chatbotMessages.scrollTop = el.chatbotMessages.scrollHeight;
    }

    // ===== Helpers & UI State =====

    function showLoading(show) {
        if (el.loading) el.loading.classList.toggle('hidden', !show);
        if (el.fieldsGrid) el.fieldsGrid.classList.toggle('hidden', !!show);
        syncStateSectionVisibility();
    }

    function showError(message) {
        if (!el.errorMessage || !el.errorText) return;
        el.errorText.textContent = message;
        el.errorMessage.classList.remove('hidden');
        syncStateSectionVisibility();
    }

    function hideError() {
        if (!el.errorMessage) return;
        el.errorMessage.classList.add('hidden');
        syncStateSectionVisibility();
    }

    function showNoResults(show) {
        if (!el.noResults) return;
        el.noResults.classList.toggle('hidden', !show);
        syncStateSectionVisibility();
    }

    function syncStateSectionVisibility() {
        if (!el.stateSection) return;
        var visible = (el.loading && !el.loading.classList.contains('hidden')) ||
            (el.errorMessage && !el.errorMessage.classList.contains('hidden')) ||
            (el.noResults && !el.noResults.classList.contains('hidden'));
        el.stateSection.classList.toggle('hidden', !visible);
    }

    function updateSectionNavigation() {
        var navLinks = Array.prototype.slice.call(document.querySelectorAll('.nav-links a[href^="#"]'));
        var sectionIds = ['home', 'fields', 'about', 'contact'];
        var sections = sectionIds.map(function(id) { return document.getElementById(id); }).filter(Boolean);

        function setActive(id) {
            navLinks.forEach(function(link) {
                link.classList.toggle('active', link.getAttribute('href') === '#' + id);
            });
        }

        if ('IntersectionObserver' in window) {
            var observer = new IntersectionObserver(function(entries) {
                var visible = entries.filter(function(en) { return en.isIntersecting; })
                    .sort(function(a, b) { return b.intersectionRatio - a.intersectionRatio; })[0];
                if (visible && visible.target && visible.target.id) {
                    setActive(visible.target.id);
                }
            }, { threshold: [0.25, 0.5], rootMargin: '-15% 0px -55% 0px' });

            sections.forEach(function(sec) { observer.observe(sec); });
        }
    }
})();
