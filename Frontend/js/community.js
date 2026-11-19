(function() {
    'use strict';

    var S = window.SportHubShared;
    var state = { currentUser: null, friends: [], requests: [], selectedFriend: null, lastMessageId: 0, pollTimer: null, sending: false };
    var el = {};
    document.addEventListener('DOMContentLoaded', init);

    function init() {
        el.login = document.getElementById('community-login');
        el.layout = document.getElementById('community-layout');
        el.friends = document.getElementById('community-friends');
        el.requests = document.getElementById('community-requests');
        el.empty = document.getElementById('chat-empty');
        el.active = document.getElementById('chat-active');
        el.avatar = document.getElementById('chat-avatar');
        el.name = document.getElementById('chat-name');
        el.profileLink = document.getElementById('chat-profile-link');
        el.messages = document.getElementById('chat-messages');
        el.form = document.getElementById('chat-form');
        el.input = document.getElementById('chat-input');
        el.send = document.getElementById('chat-send');
        S.initSharedNavbar({ onAuthSuccess: loadCommunity });
        el.form.addEventListener('submit', sendMessage);
        el.friends.addEventListener('click', handleFriendClick);
        el.requests.addEventListener('click', handleRequestClick);
        var session = S.loadAuthSession();
        if (!session.token) {
            el.login.classList.remove('hidden');
            return;
        }
        S.apiRequest('/auth/me').then(function(user) {
            state.currentUser = user;
            S.persistAuthSession(user, session.token);
            S.updateNavbarAuthUI();
            loadCommunity();
        }).catch(function(error) {
            S.showToast(error.message || 'Không thể xác minh phiên đăng nhập.', 'error');
            el.login.classList.remove('hidden');
        });
    }

    function loadCommunity() {
        var session = S.loadAuthSession();
        if (!session.token) return;
        state.currentUser = session.currentUser;
        Promise.all([S.apiRequest('/social/friends'), S.apiRequest('/social/requests')])
            .then(function(results) {
                state.friends = Array.isArray(results[0]) ? results[0] : [];
                state.requests = Array.isArray(results[1]) ? results[1] : [];
                el.login.classList.add('hidden');
                el.layout.classList.remove('hidden');
                renderFriends();
                renderRequests();
                var requestedId = new URLSearchParams(window.location.search).get('with');
                var requestedFriend = requestedId && state.friends.find(function(friend) { return String(friend.user.id) === String(requestedId); });
                if (requestedFriend) selectFriend(requestedFriend);
                else if (state.selectedFriend) {
                    var fresh = state.friends.find(function(friend) { return String(friend.user.id) === String(state.selectedFriend.user.id); });
                    if (fresh) state.selectedFriend = fresh;
                }
                if (state.selectedFriend) loadMessages(true);
            })
            .catch(function(error) { S.showToast(error.message || 'Không thể tải bạn bè và lời mời.', 'error'); });
    }

    function avatarMarkup(user) {
        var initials = String(user.fullName || 'U').trim().split(/\s+/).slice(-2).map(function(part) { return part.charAt(0).toUpperCase(); }).join('') || 'U';
        var style = user.avatarUrl ? ' style="background-image:url(&quot;' + S.escapeHtml(S.resolveMediaUrl(user.avatarUrl)) + '&quot;)"' : '';
        return '<span class="community-avatar"' + style + '>' + (user.avatarUrl ? '' : S.escapeHtml(initials)) + '</span>';
    }

    function renderFriends() {
        if (!state.friends.length) {
            el.friends.innerHTML = '<p class="secondary-text social-empty-note">Chưa có bạn bè. Mở hồ sơ người chơi hoặc owner để gửi lời mời.</p>';
            return;
        }
        el.friends.innerHTML = state.friends.map(function(friend) {
            var user = friend.user;
            var active = state.selectedFriend && String(state.selectedFriend.user.id) === String(user.id);
            var preview = friend.lastMessage || S.getRoleLabel(user.role);
            return '<button class="community-friend' + (active ? ' is-selected' : '') + '" type="button" data-chat-user="' + S.escapeHtml(user.id) + '">' +
                avatarMarkup(user) + '<span class="community-friend-copy"><strong>' + S.escapeHtml(user.fullName) + '</strong><small>' + S.escapeHtml(preview) + '</small></span></button>';
        }).join('');
    }

    function renderRequests() {
        var incoming = state.requests.filter(function(request) { return request.direction === 'INCOMING'; });
        var outgoing = state.requests.filter(function(request) { return request.direction === 'OUTGOING'; });
        var html = incoming.map(function(request) {
            return '<article class="community-request">' + avatarMarkup(request.user) + '<div class="community-request-copy"><strong>' + S.escapeHtml(request.user.fullName) + '</strong><small>Lời mời đến</small></div><div class="community-request-actions"><button type="button" class="icon-btn" aria-label="Chấp nhận" data-request-action="accept" data-request-id="' + S.escapeHtml(request.id) + '"><i data-lucide="check" aria-hidden="true"></i></button><button type="button" class="icon-btn" aria-label="Từ chối" data-request-action="reject" data-request-id="' + S.escapeHtml(request.id) + '"><i data-lucide="x" aria-hidden="true"></i></button></div></article>';
        }).join('');
        html += outgoing.map(function(request) {
            return '<article class="community-request">' + avatarMarkup(request.user) + '<div class="community-request-copy"><strong>' + S.escapeHtml(request.user.fullName) + '</strong><small>Đang chờ phản hồi</small></div></article>';
        }).join('');
        el.requests.innerHTML = html || '<p class="secondary-text social-empty-note">Không có lời mời đang chờ.</p>';
        S.refreshIcons(el.requests);
    }

    function handleFriendClick(event) {
        var button = event.target.closest('[data-chat-user]');
        if (!button) return;
        var friend = state.friends.find(function(item) { return String(item.user.id) === String(button.getAttribute('data-chat-user')); });
        if (friend) selectFriend(friend);
    }

    function selectFriend(friend) {
        state.selectedFriend = friend;
        state.lastMessageId = 0;
        el.empty.classList.add('hidden');
        el.active.classList.remove('hidden');
        el.name.textContent = friend.user.fullName;
        el.profileLink.href = 'profile.html?id=' + encodeURIComponent(friend.user.id);
        var initials = String(friend.user.fullName || 'U').trim().split(/\s+/).slice(-2).map(function(part) { return part.charAt(0).toUpperCase(); }).join('') || 'U';
        el.avatar.textContent = initials;
        el.avatar.style.backgroundImage = friend.user.avatarUrl ? 'url("' + S.resolveMediaUrl(friend.user.avatarUrl).replace(/["\\]/g, '') + '")' : '';
        el.avatar.classList.toggle('has-image', !!friend.user.avatarUrl);
        el.messages.innerHTML = '<p class="table-empty">Đang tải tin nhắn...</p>';
        renderFriends();
        if (state.pollTimer) window.clearInterval(state.pollTimer);
        loadMessages(false);
        state.pollTimer = window.setInterval(function() { loadMessages(true); }, 3500);
    }

    function loadMessages(silent) {
        var friend = state.selectedFriend;
        if (!friend) return Promise.resolve();
        return S.apiRequest('/social/conversations/' + encodeURIComponent(friend.user.id) + '/messages?afterId=' + state.lastMessageId)
            .then(function(messages) {
                var batch = Array.isArray(messages) ? messages : [];
                if (!silent) el.messages.innerHTML = '';
                batch.forEach(function(message) {
                    state.lastMessageId = Math.max(state.lastMessageId, Number(message.id) || 0);
                    var own = String(message.senderUserId) === String(state.currentUser.id);
                    var bubble = document.createElement('div');
                    bubble.className = 'chat-message' + (own ? ' is-own' : '');
                    bubble.innerHTML = '<p>' + S.escapeHtml(message.content) + '</p><time>' + S.escapeHtml(new Date(message.createdAt).toLocaleString('vi-VN', { dateStyle: 'short', timeStyle: 'short' })) + '</time>';
                    el.messages.appendChild(bubble);
                });
                if (!silent && !batch.length) el.messages.innerHTML = '<p class="secondary-text chat-start-note">Hãy gửi lời chào đầu tiên.</p>';
                if (batch.length) el.messages.scrollTop = el.messages.scrollHeight;
            })
            .catch(function(error) { if (!silent) S.showToast(error.message || 'Không thể tải cuộc trò chuyện.', 'error'); });
    }

    function sendMessage(event) {
        event.preventDefault();
        var friend = state.selectedFriend;
        var content = el.input.value.trim();
        if (!friend || !content || state.sending) return;
        state.sending = true;
        el.send.disabled = true;
        S.apiRequest('/social/conversations/' + encodeURIComponent(friend.user.id) + '/messages', {
            method: 'POST', body: JSON.stringify({ content: content })
        }).then(function() {
            el.input.value = '';
            return loadMessages(true);
        }).then(loadCommunity)
            .catch(function(error) { S.showToast(error.message || 'Không thể gửi tin nhắn.', 'error'); })
            .then(function() { state.sending = false; el.send.disabled = false; el.input.focus(); });
    }

    function handleRequestClick(event) {
        var button = event.target.closest('[data-request-action]');
        if (!button) return;
        button.disabled = true;
        S.apiRequest('/social/requests/' + encodeURIComponent(button.getAttribute('data-request-id')) + '/' + button.getAttribute('data-request-action'), { method: 'PATCH' })
            .then(loadCommunity)
            .catch(function(error) { S.showToast(error.message || 'Không thể xử lý lời mời.', 'error'); button.disabled = false; });
    }
})();
