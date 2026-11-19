(function() {
    'use strict';

    var S = window.SportHubShared;
    var el = {};
    var loading = false;
    document.addEventListener('DOMContentLoaded', init);

    function init() {
        S.initSharedNavbar();
        el.login = document.getElementById('notification-login');
        el.content = document.getElementById('notification-content');
        el.list = document.getElementById('notification-list');
        el.summary = document.getElementById('notification-summary');
        el.refresh = document.getElementById('notification-refresh');
        el.announcementPanel = document.getElementById('announcement-panel');
        el.feedbackPanel = document.getElementById('feedback-panel');
        el.announcementForm = document.getElementById('announcement-form');
        el.feedbackForm = document.getElementById('feedback-form');

        var session = S.loadAuthSession();
        if (!session.token) {
            el.login.classList.remove('hidden');
            return;
        }
        el.content.classList.remove('hidden');
        var role = S.normalizeRole(session.currentRole);
        if (role === 'ADMIN') el.announcementPanel.classList.remove('hidden');
        else el.feedbackPanel.classList.remove('hidden');

        el.refresh.addEventListener('click', loadNotifications);
        el.list.addEventListener('click', handleNotificationClick);
        el.announcementForm.addEventListener('submit', submitAnnouncement);
        el.feedbackForm.addEventListener('submit', submitFeedback);
        loadNotifications();
        window.setInterval(loadNotifications, 30000);
    }

    function loadNotifications() {
        if (loading) return;
        loading = true;
        el.refresh.disabled = true;
        S.apiRequest('/notifications/me').then(function(items) {
            renderNotifications(Array.isArray(items) ? items : []);
        }).catch(function(error) {
            el.list.innerHTML = '<p class="booking-feedback error">' + S.escapeHtml(error.message || 'Không thể tải thông báo.') + '</p>';
        }).then(function() { loading = false; el.refresh.disabled = false; });
    }

    function categoryLabel(category) {
        return ({
            BOOKING: 'Đặt sân',
            FRIEND_REQUEST: 'Lời mời kết bạn',
            FRIEND_ACCEPTED: 'Kết bạn',
            CHAT_MESSAGE: 'Tin nhắn',
            SYSTEM: 'Hệ thống',
            FEEDBACK: 'Góp ý từ người dùng'
        })[category] || 'Thông báo';
    }

    function notificationHref(item) {
        if (item.category === 'CHAT_MESSAGE' && item.referenceId) return 'community.html?with=' + encodeURIComponent(item.referenceId);
        if (item.category === 'FRIEND_REQUEST' || item.category === 'FRIEND_ACCEPTED') return 'profile.html?id=' + encodeURIComponent(item.referenceId || '');
        if (item.category === 'BOOKING') return 'my-bookings.html';
        return '';
    }

    function renderNotifications(items) {
        var unread = items.filter(function(item) { return !item.isRead; }).length;
        el.summary.textContent = items.length + ' thông báo · ' + unread + ' chưa đọc';
        if (!items.length) {
            el.list.innerHTML = '<p class="secondary-text social-empty-note">Hộp thư của bạn đang trống.</p>';
            return;
        }
        el.list.innerHTML = items.map(function(item) {
            var href = notificationHref(item);
            var action = href ? '<a class="notification-open-link" href="' + S.escapeHtml(href) + '" data-notification-open="' + S.escapeHtml(item.id) + '">Mở</a>' : '';
            var mark = item.isRead ? '<span class="notification-read-label">Đã đọc</span>' : '<button class="btn btn-ghost btn-sm" type="button" data-notification-read="' + S.escapeHtml(item.id) + '">Đánh dấu đã đọc</button>';
            return '<article class="notification-center-item ' + (item.isRead ? '' : 'is-unread') + '">' +
                '<span class="notification-type-icon"><i data-lucide="' + iconFor(item.category) + '" aria-hidden="true"></i></span>' +
                '<div class="notification-center-copy"><div class="notification-center-meta"><strong>' + S.escapeHtml(categoryLabel(item.category)) + '</strong><time>' + S.escapeHtml(new Date(item.createdAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })) + '</time></div>' +
                '<p>' + S.escapeHtml(item.message) + '</p></div><div class="notification-center-actions">' + action + mark + '</div></article>';
        }).join('');
        S.refreshIcons(el.list);
    }

    function iconFor(category) {
        return ({ FRIEND_REQUEST: 'user-round-plus', FRIEND_ACCEPTED: 'user-round-check', CHAT_MESSAGE: 'messages-square', SYSTEM: 'megaphone', FEEDBACK: 'message-square-text', BOOKING: 'calendar-check' })[category] || 'bell';
    }

    function handleNotificationClick(event) {
        var readButton = event.target.closest('[data-notification-read]');
        var openLink = event.target.closest('[data-notification-open]');
        var id = readButton ? readButton.getAttribute('data-notification-read') : openLink && openLink.getAttribute('data-notification-open');
        if (!id) return;
        event.preventDefault();
        S.apiRequest('/notifications/' + encodeURIComponent(id) + '/read', { method: 'PATCH' })
            .then(function() {
                if (openLink) window.location.href = openLink.href;
                else loadNotifications();
            })
            .catch(function(error) { S.showToast(error.message || 'Không thể cập nhật thông báo.', 'error'); });
    }

    function submitAnnouncement(event) {
        event.preventDefault();
        var message = document.getElementById('announcement-message').value.trim();
        if (!message) return;
        setFormBusy(el.announcementForm, true);
        S.apiRequest('/notifications/announcements', { method: 'POST', body: JSON.stringify({ message: message }) })
            .then(function(result) {
                el.announcementForm.reset();
                S.showToast('Đã gửi thông báo đến ' + (result.recipients || 0) + ' tài khoản.', 'success');
                loadNotifications();
            }).catch(function(error) { S.showToast(error.message || 'Không thể gửi thông báo.', 'error'); })
            .then(function() { setFormBusy(el.announcementForm, false); });
    }

    function submitFeedback(event) {
        event.preventDefault();
        var message = document.getElementById('feedback-message').value.trim();
        if (!message) return;
        setFormBusy(el.feedbackForm, true);
        S.apiRequest('/notifications/feedback', { method: 'POST', body: JSON.stringify({ message: message }) })
            .then(function() {
                el.feedbackForm.reset();
                S.showToast('Góp ý đã được gửi đến admin.', 'success');
            }).catch(function(error) { S.showToast(error.message || 'Không thể gửi góp ý.', 'error'); })
            .then(function() { setFormBusy(el.feedbackForm, false); });
    }

    function setFormBusy(form, busy) {
        Array.prototype.forEach.call(form.querySelectorAll('button[type="submit"]'), function(button) { button.disabled = busy; });
    }
})();
