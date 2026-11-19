using Microsoft.EntityFrameworkCore;
using SportHub.API.Data;
using SportHub.API.DTOs;
using SportHub.API.Models;

namespace SportHub.API.Services;

public class SocialService
{
    private readonly SportHubDbContext _db;
    private readonly NotificationService _notifications;

    public SocialService(SportHubDbContext db, NotificationService notifications)
    {
        _db = db;
        _notifications = notifications;
    }

    public async Task<PublicUserProfileDto> GetProfileAsync(long viewerId, long targetId, CancellationToken ct)
    {
        var viewer = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == viewerId && u.IsActive, ct)
            ?? throw new KeyNotFoundException("Tài khoản không tồn tại hoặc đã bị vô hiệu hóa.");
        var target = await _db.Users.AsNoTracking().FirstOrDefaultAsync(u => u.Id == targetId && u.IsActive, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy hồ sơ người dùng.");

        if (viewer.Id != target.Id && !CanConnect(viewer.Role, target.Role))
            throw new UnauthorizedAccessException("Bạn không có quyền xem hồ sơ role này.");

        var relation = await FindRelationAsync(viewerId, targetId, ct);
        var relationshipStatus = relation is null
            ? "NONE"
            : relation.Status == "ACCEPTED" ? "FRIENDS"
            : relation.FromUserId == viewerId ? "PENDING_SENT"
            : relation.Status == "PENDING" ? "PENDING_RECEIVED" : "NONE";
        return ToPublicProfile(target, relationshipStatus);
    }

    public async Task<List<FriendRequestDto>> GetRequestsAsync(long userId, CancellationToken ct)
    {
        var requests = await _db.FriendRequests.AsNoTracking()
            .Where(r => r.Status == "PENDING" && (r.FromUserId == userId || r.ToUserId == userId))
            .OrderByDescending(r => r.CreatedAt).ToListAsync(ct);
        var otherIds = requests.Select(r => r.FromUserId == userId ? r.ToUserId : r.FromUserId).Distinct().ToList();
        var users = await _db.Users.AsNoTracking().Where(u => otherIds.Contains(u.Id)).ToDictionaryAsync(u => u.Id, ct);

        return requests.Where(r => users.ContainsKey(r.FromUserId == userId ? r.ToUserId : r.FromUserId))
            .Select(r => new FriendRequestDto
            {
                Id = r.Id,
                Direction = r.ToUserId == userId ? "INCOMING" : "OUTGOING",
                Status = r.Status,
                User = ToPublicProfile(users[r.FromUserId == userId ? r.ToUserId : r.FromUserId], "NONE"),
                CreatedAt = r.CreatedAt
            }).ToList();
    }

    public async Task<FriendRequestDto> SendRequestAsync(long fromUserId, long toUserId, CancellationToken ct)
    {
        if (fromUserId == toUserId) throw new ArgumentException("Bạn không thể kết bạn với chính mình.");
        var from = await _db.Users.FirstOrDefaultAsync(u => u.Id == fromUserId && u.IsActive, ct)
            ?? throw new KeyNotFoundException("Tài khoản gửi không tồn tại.");
        var to = await _db.Users.FirstOrDefaultAsync(u => u.Id == toUserId && u.IsActive, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy người dùng.");
        if (!CanConnect(from.Role, to.Role))
            throw new UnauthorizedAccessException("Không hỗ trợ kết nối giữa hai role này.");

        var existing = await FindRelationAsync(fromUserId, toUserId, ct);
        if (existing?.Status == "ACCEPTED") throw new ArgumentException("Hai bạn đã là bạn bè.");
        if (existing?.Status == "PENDING") throw new ArgumentException("Lời mời kết bạn đang chờ xử lý.");

        if (existing is null)
        {
            existing = new FriendRequest { FromUserId = fromUserId, ToUserId = toUserId };
            _db.FriendRequests.Add(existing);
        }
        else
        {
            existing.FromUserId = fromUserId;
            existing.ToUserId = toUserId;
            existing.Status = "PENDING";
            existing.UpdatedAt = DateTime.Now;
        }

        await _db.SaveChangesAsync(ct);
        await _notifications.CreateEventAsync(toUserId, "FRIEND_REQUEST", fromUserId,
            $"{from.FullName} đã gửi lời mời kết bạn.", ct);
        return new FriendRequestDto
        {
            Id = existing.Id,
            Direction = "OUTGOING",
            Status = existing.Status,
            User = ToPublicProfile(to, "PENDING_SENT"),
            CreatedAt = existing.CreatedAt
        };
    }

    public async Task RespondToRequestAsync(long userId, long requestId, bool accept, CancellationToken ct)
    {
        var request = await _db.FriendRequests.FirstOrDefaultAsync(r => r.Id == requestId, ct)
            ?? throw new KeyNotFoundException("Không tìm thấy lời mời kết bạn.");
        if (request.ToUserId != userId) throw new UnauthorizedAccessException("Bạn không thể xử lý lời mời này.");
        if (request.Status != "PENDING") throw new ArgumentException("Lời mời này đã được xử lý.");

        request.Status = accept ? "ACCEPTED" : "REJECTED";
        request.UpdatedAt = DateTime.Now;
        await _db.SaveChangesAsync(ct);
        if (accept)
        {
            var acceptedBy = await _db.Users.AsNoTracking().Where(u => u.Id == userId).Select(u => u.FullName).FirstOrDefaultAsync(ct);
            await _notifications.CreateEventAsync(request.FromUserId, "FRIEND_ACCEPTED", userId,
                $"{acceptedBy ?? "Người dùng"} đã chấp nhận lời mời kết bạn.", ct);
        }
    }

    public async Task RemoveFriendAsync(long userId, long otherUserId, CancellationToken ct)
    {
        var relation = await FindRelationAsync(userId, otherUserId, ct);
        if (relation is null || relation.Status != "ACCEPTED")
            throw new KeyNotFoundException("Không tìm thấy tình bạn.");
        _db.FriendRequests.Remove(relation);
        await _db.SaveChangesAsync(ct);
    }

    public async Task<List<SocialFriendDto>> GetFriendsAsync(long userId, CancellationToken ct)
    {
        var relationships = await _db.FriendRequests.AsNoTracking()
            .Where(r => r.Status == "ACCEPTED" && (r.FromUserId == userId || r.ToUserId == userId))
            .OrderByDescending(r => r.UpdatedAt).ToListAsync(ct);
        var otherIds = relationships.Select(r => r.FromUserId == userId ? r.ToUserId : r.FromUserId).Distinct().ToList();
        var users = await _db.Users.AsNoTracking().Where(u => otherIds.Contains(u.Id) && u.IsActive).ToListAsync(ct);
        var result = new List<SocialFriendDto>();
        foreach (var friend in users)
        {
            var conversation = await FindConversationAsync(userId, friend.Id, ct);
            var lastMessage = conversation is null ? null : await _db.ChatMessages.AsNoTracking()
                .Where(m => m.ConversationId == conversation.Id).OrderByDescending(m => m.Id)
                .Select(m => new { m.Content, m.CreatedAt }).FirstOrDefaultAsync(ct);
            result.Add(new SocialFriendDto
            {
                User = ToPublicProfile(friend, "FRIENDS"),
                LastMessage = lastMessage?.Content,
                LastMessageAt = lastMessage?.CreatedAt
            });
        }
        return result.OrderByDescending(f => f.LastMessageAt).ToList();
    }

    public async Task<List<ChatMessageDto>> GetMessagesAsync(long userId, long otherUserId, long afterId, CancellationToken ct)
    {
        await EnsureFriendsAsync(userId, otherUserId, ct);
        var conversation = await GetOrCreateConversationAsync(userId, otherUserId, ct);
        return await _db.ChatMessages.AsNoTracking()
            .Where(m => m.ConversationId == conversation.Id && m.Id > afterId)
            .OrderBy(m => m.Id).Take(100)
            .Select(m => new ChatMessageDto { Id = m.Id, SenderUserId = m.SenderUserId, Content = m.Content, CreatedAt = m.CreatedAt })
            .ToListAsync(ct);
    }

    public async Task<ChatMessageDto> SendMessageAsync(long userId, long otherUserId, string content, CancellationToken ct)
    {
        var message = content.Trim();
        if (string.IsNullOrWhiteSpace(message)) throw new ArgumentException("Tin nhắn không được để trống.");
        if (message.Length > 2000) throw new ArgumentException("Tin nhắn tối đa 2000 ký tự.");
        await EnsureFriendsAsync(userId, otherUserId, ct);
        var conversation = await GetOrCreateConversationAsync(userId, otherUserId, ct);
        var entity = new ChatMessage { ConversationId = conversation.Id, SenderUserId = userId, Content = message };
        _db.ChatMessages.Add(entity);
        await _db.SaveChangesAsync(ct);
        var senderName = await _db.Users.AsNoTracking().Where(u => u.Id == userId).Select(u => u.FullName).FirstOrDefaultAsync(ct);
        await _notifications.CreateEventAsync(otherUserId, "CHAT_MESSAGE", userId,
            $"Tin nhắn mới từ {senderName ?? "người dùng"}.", ct);
        return new ChatMessageDto { Id = entity.Id, SenderUserId = entity.SenderUserId, Content = entity.Content, CreatedAt = entity.CreatedAt };
    }

    private Task<FriendRequest?> FindRelationAsync(long userId, long otherUserId, CancellationToken ct) =>
        _db.FriendRequests.FirstOrDefaultAsync(r =>
            (r.FromUserId == userId && r.ToUserId == otherUserId) ||
            (r.FromUserId == otherUserId && r.ToUserId == userId), ct);

    private async Task EnsureFriendsAsync(long userId, long otherUserId, CancellationToken ct)
    {
        if (userId == otherUserId) throw new ArgumentException("Không thể nhắn tin cho chính mình.");
        var relation = await FindRelationAsync(userId, otherUserId, ct);
        if (relation?.Status != "ACCEPTED") throw new UnauthorizedAccessException("Hai tài khoản cần chấp nhận kết bạn trước khi trò chuyện.");
    }

    private Task<Conversation?> FindConversationAsync(long userId, long otherUserId, CancellationToken ct)
    {
        var (first, second) = OrderedPair(userId, otherUserId);
        return _db.Conversations.FirstOrDefaultAsync(c => c.ParticipantOneId == first && c.ParticipantTwoId == second, ct);
    }

    private async Task<Conversation> GetOrCreateConversationAsync(long userId, long otherUserId, CancellationToken ct)
    {
        var existing = await FindConversationAsync(userId, otherUserId, ct);
        if (existing is not null) return existing;
        var (first, second) = OrderedPair(userId, otherUserId);
        var conversation = new Conversation { ParticipantOneId = first, ParticipantTwoId = second };
        _db.Conversations.Add(conversation);
        await _db.SaveChangesAsync(ct);
        return conversation;
    }

    private static (long First, long Second) OrderedPair(long a, long b) => a < b ? (a, b) : (b, a);

    private static bool CanConnect(string firstRole, string secondRole)
    {
        var a = UserRoleExtensions.NormalizeRole(firstRole);
        var b = UserRoleExtensions.NormalizeRole(secondRole);
        return (a == "CUSTOMER" && b == "CUSTOMER") ||
               (a == "OWNER" && b == "CUSTOMER") ||
               (a == "CUSTOMER" && b == "OWNER") ||
               (a == "ADMIN" && b == "OWNER") ||
               (a == "OWNER" && b == "ADMIN");
    }

    private static PublicUserProfileDto ToPublicProfile(User user, string relationshipStatus) => new()
    {
        Id = user.Id,
        FullName = user.FullName,
        Role = UserRoleExtensions.NormalizeRole(user.Role),
        Bio = user.Bio,
        AvatarUrl = user.AvatarUrl,
        EloRating = user.EloRating,
        RelationshipStatus = relationshipStatus
    };
}
