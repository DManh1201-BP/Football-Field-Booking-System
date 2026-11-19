(function() {
    'use strict';

    var S = window.SportHubShared;
    var state = { profile: null, requestId: null };
    document.addEventListener('DOMContentLoaded', init);

    function init() {
        S.initSharedNavbar();
        var session = S.loadAuthSession();
        var targetId = new URLSearchParams(window.location.search).get('id');
        if (!session.token || !targetId) {
            showError(!session.token ? 'Đăng nhập để xem trang cá nhân.' : 'Thiếu mã người dùng.');
            return;
        }
        S.apiRequest('/users/' + encodeURIComponent(targetId) + '/profile')
            .then(function(profile) {
                state.profile = profile;
                renderProfile(profile, session.currentUser);
            })
            .catch(function(error) { showError(error.message || 'Bạn không thể xem hồ sơ này.', error.status); });

        document.getElementById('profile-friend-action').addEventListener('click', handleFriendAction);
        document.getElementById('profile-message-action').addEventListener('click', function() {
            if (state.profile) window.location.href = 'community.html?with=' + encodeURIComponent(state.profile.id);
        });
    }

    function renderProfile(profile, currentUser) {
        document.getElementById('public-profile-card').classList.remove('hidden');
        document.getElementById('public-profile-name').textContent = profile.fullName || 'Người dùng SportHub';
        document.getElementById('public-profile-role').textContent = S.getRoleLabel(profile.role);
        document.getElementById('public-profile-bio').textContent = profile.bio || 'Người dùng chưa thêm phần giới thiệu.';
        document.getElementById('public-profile-meta').textContent = profile.role === 'CUSTOMER' ? 'Elo ' + (profile.eloRating || 1000) : '';
        var avatar = document.getElementById('public-profile-avatar');
        var initials = String(profile.fullName || 'U').trim().split(/\s+/).slice(-2).map(function(part) { return part.charAt(0).toUpperCase(); }).join('') || 'U';
        avatar.textContent = initials;
        if (profile.avatarUrl) {
            avatar.style.backgroundImage = 'url("' + S.resolveMediaUrl(profile.avatarUrl).replace(/["\\]/g, '') + '")';
            avatar.classList.add('has-image');
            avatar.textContent = '';
        }

        var friendButton = document.getElementById('profile-friend-action');
        var messageButton = document.getElementById('profile-message-action');
        if (String(profile.id) === String(currentUser.id)) {
            friendButton.classList.add('hidden');
            messageButton.classList.add('hidden');
            document.getElementById('public-profile-meta').textContent = 'Đây là hồ sơ của bạn.';
            return;
        }
        if (profile.relationshipStatus === 'FRIENDS') {
            friendButton.classList.add('hidden');
            messageButton.classList.remove('hidden');
        } else if (profile.relationshipStatus === 'PENDING_SENT') {
            friendButton.textContent = 'Đã gửi lời mời';
            friendButton.disabled = true;
        } else if (profile.relationshipStatus === 'PENDING_RECEIVED') {
            friendButton.textContent = 'Chấp nhận lời mời';
        }
    }

    function handleFriendAction() {
        var profile = state.profile;
        if (!profile) return;
        var button = document.getElementById('profile-friend-action');
        button.disabled = true;
        var action;
        if (profile.relationshipStatus === 'PENDING_RECEIVED') {
            action = S.apiRequest('/social/requests').then(function(requests) {
                var incoming = (Array.isArray(requests) ? requests : []).find(function(item) {
                    return item.direction === 'INCOMING' && String(item.user.id) === String(profile.id);
                });
                if (!incoming) throw new Error('Không còn lời mời kết bạn đang chờ.');
                return S.apiRequest('/social/requests/' + incoming.id + '/accept', { method: 'PATCH' });
            });
        } else {
            action = S.apiRequest('/social/requests/' + encodeURIComponent(profile.id), { method: 'POST' });
        }
        action.then(function() { window.location.reload(); })
            .catch(function(error) {
                S.showToast(error.message || 'Không thể xử lý lời mời.', 'error');
                button.disabled = false;
            });
    }

    function showError(message, status) {
        var text = status === 404
            ? 'Không tìm thấy hồ sơ này trong database mà API đang kết nối. Hãy kiểm tra ID người dùng và SportHubDb. Nếu bạn vừa cập nhật code, hãy dừng rồi chạy lại backend để nạp route /api/users/{id}/profile. Chi tiết: ' + message
            : message;
        document.getElementById('profile-error-message').textContent = text;
        document.getElementById('profile-error').classList.remove('hidden');
    }
})();
