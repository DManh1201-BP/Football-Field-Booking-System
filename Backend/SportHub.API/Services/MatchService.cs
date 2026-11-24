using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Http;
using Microsoft.EntityFrameworkCore;
using SportHub.API.Data;
using SportHub.API.DTOs;
using SportHub.API.Models;
using SportHub.API.Repositories;

namespace SportHub.API.Services;

public class MatchService : IMatchService
{
    private const int DefaultEloKFactor = 32;
    private const int MinReliabilityForSolo = 50;
    private static readonly HashSet<string> AllowedEvidenceExtensions = new(StringComparer.OrdinalIgnoreCase)
    {
        ".jpg", ".jpeg", ".png", ".webp"
    };
    private const long MaxEvidenceBytes = 5 * 1024 * 1024;

    private readonly SportHubDbContext _db;
    private readonly IMatchRepository _matchRepository;
    private readonly IUserRepository _userRepository;
    private readonly IFieldRepository _fieldRepository;
    private readonly IBookingRepository _bookingRepository;
    private readonly NotificationService _notifications;
    private readonly IWebHostEnvironment _environment;

    public MatchService(
        SportHubDbContext db,
        IMatchRepository matchRepository,
        IUserRepository userRepository,
        IFieldRepository fieldRepository,
        IBookingRepository bookingRepository,
        NotificationService notifications,
        IWebHostEnvironment environment)
    {
        _db = db;
        _matchRepository = matchRepository;
        _userRepository = userRepository;
        _fieldRepository = fieldRepository;
        _bookingRepository = bookingRepository;
        _notifications = notifications;
        _environment = environment;
    }

    public async Task<List<MatchResponseDto>> GetMatchesAsync(
        string? sportType = null,
        string? city = null,
        string? skillLevel = null,
        string? status = null,
        CancellationToken cancellationToken = default)
    {
        var matches = await _matchRepository.GetAllAsync(sportType, city, skillLevel, status, cancellationToken);
        return matches.Select(MatchResponseDto.FromEntity).ToList();
    }

    public async Task<MatchResponseDto> GetMatchByIdAsync(long id, CancellationToken cancellationToken = default)
    {
        var match = await _matchRepository.GetByIdAsync(id, cancellationToken)
            ?? throw new KeyNotFoundException($"Match not found: {id}");

        return MatchResponseDto.FromEntity(match);
    }

    public async Task<MatchResponseDto> CreateMatchAsync(
        long hostUserId,
        MatchCreateDto request,
        CancellationToken cancellationToken = default)
    {
        var hostUser = await _userRepository.GetByIdAsync(hostUserId, cancellationToken)
            ?? throw new KeyNotFoundException($"User not found: {hostUserId}");

        Booking? linkedBooking = null;
        if (request.BookingId.HasValue)
        {
            linkedBooking = await _bookingRepository.GetByIdAsync(request.BookingId.Value, cancellationToken)
                ?? throw new KeyNotFoundException($"Booking not found: {request.BookingId.Value}");
            if (linkedBooking.UserId != hostUserId)
                throw new UnauthorizedAccessException("Bạn chỉ có thể tạo kèo từ booking của chính mình.");
            if (linkedBooking.Status is "CANCELLED" or "EXPIRED" or "RAIN_OUT")
                throw new ArgumentException("Booking này đã hủy hoặc hết hạn, không thể tạo kèo.");
        }

        Field? field = linkedBooking?.Field;
        if (field is null && request.FieldId.HasValue)
        {
            field = await _fieldRepository.GetByIdAsync(request.FieldId.Value, cancellationToken)
                ?? throw new KeyNotFoundException($"Field not found: {request.FieldId.Value}");
        }

        var mode = NormalizeMatchMode(request.MatchMode);
        var matchDate = linkedBooking?.BookingDate ?? request.MatchDate ?? throw new ArgumentException("Match date is required");
        var startTime = linkedBooking?.StartTime ?? request.StartTime ?? throw new ArgumentException("Start time is required");
        var endTime = linkedBooking?.EndTime ?? request.EndTime ?? throw new ArgumentException("End time is required");
        if (endTime <= startTime) throw new ArgumentException("End time must be after start time");

        int maxSlots;
        int preReserved;
        int missingPlayers;
        string initialStatus;

        if (mode == "CUSTOM_PRIVATE")
        {
            maxSlots = Math.Clamp(request.MaxSlots ?? Math.Max(2, request.MissingPlayers), 2, 50);
            preReserved = maxSlots;
            missingPlayers = 0;
            initialStatus = "MATCHED";
        }
        else if (mode == "SOLO_LOBBY")
        {
            maxSlots = Math.Clamp(request.MaxSlots ?? Math.Max(2, request.MissingPlayers + 1), 2, 50);
            preReserved = Math.Clamp(request.PreReservedSlots ?? 1, 1, maxSlots - 1);
            missingPlayers = Math.Max(0, maxSlots - preReserved);
            initialStatus = missingPlayers == 0 ? "MATCHED" : "OPEN";
        }
        else
        {
            maxSlots = 2;
            preReserved = 1;
            missingPlayers = 1;
            initialStatus = "OPEN";
        }

        var canBeRanked = field is not null && field.VenueSource == "PARTNER" && field.VerificationStatus == "APPROVED";
        var isRanked = canBeRanked && (request.IsRanked ?? true);

        var match = new Match
        {
            Title = request.Title.Trim(),
            SportType = (field?.SportType ?? request.SportType).Trim().ToUpperInvariant(),
            SkillLevel = string.IsNullOrWhiteSpace(request.SkillLevel)
                ? "INTERMEDIATE"
                : request.SkillLevel.Trim().ToUpperInvariant(),
            City = string.IsNullOrWhiteSpace(request.City) ? field?.City : request.City.Trim(),
            Location = string.IsNullOrWhiteSpace(request.Location) ? field?.Location : request.Location.Trim(),
            FieldId = field?.Id,
            Field = field,
            BookingId = linkedBooking?.Id,
            HostUserId = hostUser.Id,
            HostUser = hostUser,
            MatchDate = matchDate,
            StartTime = startTime,
            EndTime = endTime,
            MatchMode = mode,
            MaxSlots = maxSlots,
            PreReservedSlots = preReserved,
            MissingPlayers = missingPlayers,
            IsRanked = isRanked,
            Status = initialStatus,
            ScoreStatus = "NONE",
            Notes = request.Notes?.Trim()
        };

        var saved = await _matchRepository.AddAsync(match, cancellationToken);

        _db.MatchParticipants.Add(new MatchParticipant
        {
            MatchId = saved.Id,
            UserId = hostUser.Id,
            TeamSide = "A",
            GuestCount = mode == "SOLO_LOBBY" ? Math.Max(0, preReserved - 1) : 0,
            Status = "JOINED",
            JoinedAt = DateTime.Now
        });
        await _db.SaveChangesAsync(cancellationToken);

        var reloaded = await _matchRepository.GetByIdAsync(saved.Id, cancellationToken) ?? saved;
        return MatchResponseDto.FromEntity(reloaded);
    }

    public async Task<MatchResponseDto> JoinMatchAsync(
        long matchId,
        long challengerUserId,
        MatchJoinDto? joinDto = null,
        CancellationToken cancellationToken = default)
    {
        var match = await _matchRepository.GetByIdAsync(matchId, cancellationToken)
            ?? throw new KeyNotFoundException($"Match not found: {matchId}");

        if (match.Status is "COMPLETED" or "CANCELLED")
        {
            throw new ArgumentException("Trận đấu đã kết thúc hoặc bị hủy.");
        }

        if (match.MatchMode == "CUSTOM_PRIVATE")
        {
            throw new ArgumentException("Đây là trận riêng tư do Chủ kèo tự quản lý quân số.");
        }

        if (match.HostUserId == challengerUserId)
        {
            throw new ArgumentException("Chủ kèo không thể tự tham gia lại trận của mình.");
        }

        var alreadyActive = match.Participants.Any(p =>
            p.UserId == challengerUserId && p.Status is "JOINED" or "CHECKED_IN" or "WAITLISTED");
        if (alreadyActive || match.ChallengerUserId == challengerUserId)
        {
            throw new ArgumentException("Bạn đã đăng ký tham gia trận đấu này rồi.");
        }

        var user = await _userRepository.GetByIdAsync(challengerUserId, cancellationToken)
            ?? throw new KeyNotFoundException($"User not found: {challengerUserId}");

        await EnsureNoTimeOverlapAsync(challengerUserId, match, cancellationToken);

        if (match.MatchMode == "TEAM_CHALLENGE")
        {
            if (!string.Equals(match.Status, "OPEN", StringComparison.OrdinalIgnoreCase))
            {
                throw new ArgumentException("Match is no longer open for joining");
            }

            match.ChallengerUserId = user.Id;
            match.ChallengerUser = user;
            match.MissingPlayers = 0;
            match.Status = "MATCHED";

            _db.MatchParticipants.Add(new MatchParticipant
            {
                MatchId = match.Id,
                UserId = user.Id,
                TeamSide = "B",
                GuestCount = 0,
                Status = "JOINED",
                JoinedAt = DateTime.Now
            });

            await _db.SaveChangesAsync(cancellationToken);
            await _notifications.CreateEventAsync(match.HostUserId, "MATCH", match.Id,
                $"{user.FullName} đã nhận kèo \"{match.Title}\" của bạn!", cancellationToken);
        }
        else
        {
            if (user.ReliabilityScore < MinReliabilityForSolo)
            {
                throw new ArgumentException(
                    $"Điểm uy tín của bạn ({user.ReliabilityScore}/100) dưới ngưỡng {MinReliabilityForSolo}. Vui lòng hoàn thành các lịch đặt sân đúng giờ để khôi phục.");
            }

            var guestCount = Math.Clamp(joinDto?.GuestCount ?? 0, 0, 1);
            var slotsNeeded = 1 + guestCount;
            var occupied = ComputeOccupiedSlots(match);
            var remaining = Math.Max(0, match.MaxSlots - occupied);

            var side = NormalizeTeamSide(joinDto?.TeamSide);
            if (side == "ANY")
            {
                side = AutoAssignTeamSide(match);
            }

            if (remaining >= slotsNeeded)
            {
                _db.MatchParticipants.Add(new MatchParticipant
                {
                    MatchId = match.Id,
                    UserId = user.Id,
                    TeamSide = side,
                    GuestCount = guestCount,
                    Status = "JOINED",
                    JoinedAt = DateTime.Now
                });
                await _db.SaveChangesAsync(cancellationToken);
                await SyncMatchSlotCountsAsync(match, cancellationToken);

                await _notifications.CreateEventAsync(match.HostUserId, "MATCH", match.Id,
                    $"{user.FullName} đã đăng ký {(slotsNeeded > 1 ? $"{slotsNeeded} slot " : "1 slot ")}vào phòng \"{match.Title}\".",
                    cancellationToken);
            }
            else if (remaining == 0 && guestCount == 0)
            {
                _db.MatchParticipants.Add(new MatchParticipant
                {
                    MatchId = match.Id,
                    UserId = user.Id,
                    TeamSide = side,
                    GuestCount = 0,
                    Status = "WAITLISTED",
                    JoinedAt = DateTime.Now
                });
                await _db.SaveChangesAsync(cancellationToken);
                await _notifications.CreateEventAsync(user.Id, "MATCH", match.Id,
                    $"Phòng \"{match.Title}\" đã đủ người. Bạn đang ở danh sách chờ (Waitlist).", cancellationToken);
            }
            else
            {
                throw new ArgumentException($"Phòng chỉ còn {remaining} chỗ trống, không đủ cho {slotsNeeded} slot.");
            }
        }

        var reloaded = await _matchRepository.GetByIdAsync(match.Id, cancellationToken) ?? match;
        return MatchResponseDto.FromEntity(reloaded);
    }

    public async Task<MatchResponseDto> LeaveMatchAsync(long matchId, long userId, CancellationToken cancellationToken = default)
    {
        var match = await _matchRepository.GetByIdAsync(matchId, cancellationToken)
            ?? throw new KeyNotFoundException($"Match not found: {matchId}");

        if (match.HostUserId == userId)
        {
            throw new ArgumentException("Chủ kèo không thể rời phòng; hãy hủy hoặc quản lý kèo.");
        }

        if (match.Status is "COMPLETED" or "CANCELLED")
        {
            throw new ArgumentException("Không thể rời trận đã kết thúc hoặc đã hủy.");
        }

        var participant = match.Participants.FirstOrDefault(p =>
            p.UserId == userId && p.Status is "JOINED" or "CHECKED_IN" or "WAITLISTED")
            ?? throw new ArgumentException("Bạn chưa tham gia trận đấu này.");

        var wasActiveSlot = participant.Status is "JOINED" or "CHECKED_IN";
        participant.Status = "CANCELLED";

        if (wasActiveSlot)
        {
            var kickoff = match.MatchDate.ToDateTime(match.StartTime);
            if ((kickoff - DateTime.Now).TotalHours < 2)
            {
                var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
                if (user is not null)
                {
                    user.ReliabilityScore = Math.Max(0, user.ReliabilityScore - 5);
                    await _userRepository.UpdateAsync(user, cancellationToken);
                }
            }

            if (match.MatchMode == "TEAM_CHALLENGE" && match.ChallengerUserId == userId)
            {
                match.ChallengerUserId = null;
                match.ChallengerUser = null;
                match.MissingPlayers = 1;
                match.Status = "OPEN";
            }
        }

        await _db.SaveChangesAsync(cancellationToken);

        if (wasActiveSlot && match.MatchMode == "SOLO_LOBBY")
        {
            await PromoteWaitlistAsync(match, cancellationToken);
            await SyncMatchSlotCountsAsync(match, cancellationToken);
        }

        var reloaded = await _matchRepository.GetByIdAsync(match.Id, cancellationToken) ?? match;
        return MatchResponseDto.FromEntity(reloaded);
    }

    public async Task<MatchResponseDto> CheckInParticipantAsync(long matchId, long userId, CancellationToken cancellationToken = default)
    {
        var match = await _matchRepository.GetByIdAsync(matchId, cancellationToken)
            ?? throw new KeyNotFoundException($"Match not found: {matchId}");

        var participant = match.Participants.FirstOrDefault(p =>
            p.UserId == userId && p.Status is "JOINED" or "CHECKED_IN")
            ?? throw new ArgumentException("Bạn không nằm trong danh sách người chơi của trận này.");

        var now = DateTime.Now;
        var startDt = match.MatchDate.ToDateTime(match.StartTime);
        var endDt = match.MatchDate.ToDateTime(match.EndTime);
        if (now < startDt.AddMinutes(-45) || now > endDt.AddMinutes(60))
        {
            throw new ArgumentException("Chỉ có thể check-in trong khoảng 45 phút trước giờ đá đến 60 phút sau khi kết thúc.");
        }

        if (participant.Status != "CHECKED_IN")
        {
            participant.Status = "CHECKED_IN";
            participant.CheckedInAt = now;
            var user = await _userRepository.GetByIdAsync(userId, cancellationToken);
            if (user is not null)
            {
                user.ReliabilityScore = Math.Min(100, user.ReliabilityScore + 1);
            }
            await _db.SaveChangesAsync(cancellationToken);
        }

        var reloaded = await _matchRepository.GetByIdAsync(match.Id, cancellationToken) ?? match;
        return MatchResponseDto.FromEntity(reloaded);
    }

    public async Task<MatchResponseDto> MarkNoShowAsync(long matchId, long targetUserId, long requesterUserId, bool isAdmin, CancellationToken cancellationToken = default)
    {
        var match = await _matchRepository.GetByIdAsync(matchId, cancellationToken)
            ?? throw new KeyNotFoundException($"Match not found: {matchId}");

        var isFieldOwner = match.Field?.OwnerId == requesterUserId;
        if (!isAdmin && match.HostUserId != requesterUserId && !isFieldOwner)
        {
            throw new UnauthorizedAccessException("Chỉ chủ kèo, chủ sân hoặc Admin mới có quyền đánh dấu vắng mặt.");
        }

        if (targetUserId == match.HostUserId && !isAdmin && !isFieldOwner)
        {
            throw new ArgumentException("Chủ kèo không thể tự đánh dấu bản thân vắng mặt.");
        }

        if (DateTime.Now < match.MatchDate.ToDateTime(match.StartTime))
        {
            throw new ArgumentException("Chưa tới giờ thi đấu, chưa thể đánh dấu vắng mặt (NO_SHOW).");
        }

        var participant = match.Participants.FirstOrDefault(p =>
            p.UserId == targetUserId && p.Status is "JOINED")
            ?? throw new ArgumentException("Không tìm thấy người chơi ở trạng thái chưa check-in.");

        participant.Status = "NO_SHOW";
        var targetUser = await _userRepository.GetByIdAsync(targetUserId, cancellationToken);
        if (targetUser is not null)
        {
            targetUser.ReliabilityScore = Math.Max(0, targetUser.ReliabilityScore - 15);
        }
        await _db.SaveChangesAsync(cancellationToken);

        await _notifications.CreateEventAsync(targetUserId, "MATCH", match.Id,
            $"Bạn bị ghi nhận vắng mặt (NO_SHOW) tại trận \"{match.Title}\" (-15 điểm uy tín).", cancellationToken);

        var reloaded = await _matchRepository.GetByIdAsync(match.Id, cancellationToken) ?? match;
        return MatchResponseDto.FromEntity(reloaded);
    }

    public async Task<MatchResponseDto> ProposeScoreAsync(
        long matchId,
        long requesterUserId,
        bool isAdmin,
        MatchResultDto result,
        CancellationToken cancellationToken = default)
    {
        var match = await _matchRepository.GetByIdAsync(matchId, cancellationToken)
            ?? throw new KeyNotFoundException($"Match not found: {matchId}");

        if (string.Equals(match.Status, "COMPLETED", StringComparison.OrdinalIgnoreCase))
            throw new ArgumentException("Trận đấu đã hoàn tất chốt tỉ số.");
        if (string.Equals(match.Status, "CANCELLED", StringComparison.OrdinalIgnoreCase))
            throw new ArgumentException("Trận đấu đã bị hủy.");

        var isParticipant = match.HostUserId == requesterUserId
            || match.ChallengerUserId == requesterUserId
            || match.Participants.Any(p => p.UserId == requesterUserId && p.Status is "JOINED" or "CHECKED_IN");

        if (!isAdmin && !isParticipant)
        {
            throw new UnauthorizedAccessException("Chỉ thành viên tham gia trận đấu hoặc Admin mới có quyền nhập tỉ số.");
        }

        if (!isAdmin && DateTime.Now < match.MatchDate.ToDateTime(match.StartTime))
        {
            throw new ArgumentException("Chưa tới giờ thi đấu, chưa thể nhập tỉ số.");
        }

        if (match.MatchMode == "TEAM_CHALLENGE" && !match.ChallengerUserId.HasValue)
        {
            throw new ArgumentException("Trận đấu chưa có đối thủ.");
        }

        if (match.MatchMode == "SOLO_LOBBY" && match.Participants.Count(p => p.Status is "JOINED" or "CHECKED_IN") < 2)
        {
            throw new ArgumentException("Phòng ghép lẻ cần ít nhất 2 tài khoản tham gia mới có thể ghi tỉ số.");
        }

        var hostScore = result.HostScore ?? throw new ArgumentException("Host score is required");
        var challengerScore = result.ChallengerScore ?? throw new ArgumentException("Challenger score is required");

        if (isAdmin)
        {
            await FinalizeMatchScoreAsync(match, hostScore, challengerScore, "CONFIRMED", cancellationToken);
            return MatchResponseDto.FromEntity(await _matchRepository.GetByIdAsync(match.Id, cancellationToken) ?? match);
        }

        match.ProposedHostScore = hostScore;
        match.ProposedChallengerScore = challengerScore;
        match.ScoreSubmittedByUserId = requesterUserId;
        match.ScoreSubmittedAt = DateTime.Now;
        match.ScoreConfirmDeadline = DateTime.Now.AddHours(24);
        match.ScoreStatus = "PENDING_CONFIRMATION";
        await _db.SaveChangesAsync(cancellationToken);

        var notifyTargets = GetScoreConfirmationTargets(match, requesterUserId);
        foreach (var targetId in notifyTargets)
        {
            await _notifications.CreateEventAsync(targetId, "MATCH", match.Id,
                $"Tỉ số trận \"{match.Title}\" được đề xuất là {hostScore} : {challengerScore}. Vui lòng xác nhận hoặc khiếu nại trong 24h.",
                cancellationToken);
        }

        return MatchResponseDto.FromEntity(await _matchRepository.GetByIdAsync(match.Id, cancellationToken) ?? match);
    }

    public async Task<MatchResponseDto> ConfirmScoreAsync(long matchId, long requesterUserId, bool isAdmin, CancellationToken cancellationToken = default)
    {
        var match = await _matchRepository.GetByIdAsync(matchId, cancellationToken)
            ?? throw new KeyNotFoundException($"Match not found: {matchId}");

        if (match.ScoreStatus != "PENDING_CONFIRMATION" || !match.ProposedHostScore.HasValue || !match.ProposedChallengerScore.HasValue)
        {
            throw new ArgumentException("Trận đấu hiện không có tỉ số đang chờ xác nhận.");
        }

        if (!isAdmin)
        {
            if (match.ScoreSubmittedByUserId == requesterUserId)
            {
                throw new ArgumentException("Người gửi tỉ số không thể tự xác nhận; cần đối thủ xác nhận.");
            }
            var allowed = GetScoreConfirmationTargets(match, match.ScoreSubmittedByUserId ?? 0);
            if (!allowed.Contains(requesterUserId))
            {
                throw new UnauthorizedAccessException("Bạn không có quyền xác nhận tỉ số trận đấu này.");
            }
        }

        await FinalizeMatchScoreAsync(match, match.ProposedHostScore.Value, match.ProposedChallengerScore.Value, "CONFIRMED", cancellationToken);
        return MatchResponseDto.FromEntity(await _matchRepository.GetByIdAsync(match.Id, cancellationToken) ?? match);
    }

    public async Task<MatchResponseDto> DisputeScoreAsync(long matchId, long requesterUserId, MatchScoreDisputeDto dispute, CancellationToken cancellationToken = default)
    {
        var match = await _matchRepository.GetByIdAsync(matchId, cancellationToken)
            ?? throw new KeyNotFoundException($"Match not found: {matchId}");

        if (match.ScoreStatus != "PENDING_CONFIRMATION")
        {
            throw new ArgumentException("Chỉ có thể khiếu nại khi tỉ số đang ở trạng thái chờ xác nhận.");
        }

        var allowed = GetScoreConfirmationTargets(match, match.ScoreSubmittedByUserId ?? 0);
        if (!allowed.Contains(requesterUserId))
        {
            throw new UnauthorizedAccessException("Bạn không nằm trong danh sách đối thủ xác nhận tỉ số trận này.");
        }

        match.ScoreStatus = "DISPUTED";
        match.DisputedHostScore = dispute.HostScore;
        match.DisputedChallengerScore = dispute.ChallengerScore;
        match.DisputeReason = dispute.Reason.Trim();
        match.DisputeEvidenceUrl = dispute.EvidenceUrl?.Trim();
        await _db.SaveChangesAsync(cancellationToken);

        await _notifications.NotifyAdminsAsync("MATCH", match.Id,
            $"Tranh chấp tỉ số trận \"{match.Title}\" (#{match.Id}): Đề xuất {match.ProposedHostScore}:{match.ProposedChallengerScore} vs Khiếu nại {dispute.HostScore}:{dispute.ChallengerScore}.",
            cancellationToken);

        if (match.Field?.OwnerId is long ownerId)
        {
            await _notifications.CreateEventAsync(ownerId, "MATCH", match.Id,
                $"Trận đấu tại sân \"{match.Field.Name}\" đang có tranh chấp tỉ số. Chủ sân có thể hỗ trợ phân xử.",
                cancellationToken);
        }

        return MatchResponseDto.FromEntity(await _matchRepository.GetByIdAsync(match.Id, cancellationToken) ?? match);
    }

    public async Task<MatchResponseDto> ResolveScoreAsync(long matchId, long requesterUserId, bool isAdmin, MatchScoreResolveDto resolve, CancellationToken cancellationToken = default)
    {
        var match = await _matchRepository.GetByIdAsync(matchId, cancellationToken)
            ?? throw new KeyNotFoundException($"Match not found: {matchId}");

        var isVerifiedFieldOwner = match.Field is not null
            && match.Field.OwnerId == requesterUserId
            && match.Field.VerificationStatus == "APPROVED";

        if (!isAdmin && !isVerifiedFieldOwner)
        {
            throw new UnauthorizedAccessException("Chỉ Admin hoặc Chủ sân đã xác thực mới có quyền phân xử tranh chấp.");
        }

        var decision = resolve.Decision.Trim().ToUpperInvariant();
        if (decision == "VOID")
        {
            match.ScoreStatus = "VOIDED";
            match.Status = "COMPLETED";
            match.HostScore = null;
            match.ChallengerScore = null;
            await ApplyDisputePenaltyIfRequestedAsync(resolve.PenalizeUserId, cancellationToken);
            await _db.SaveChangesAsync(cancellationToken);

            await _notifications.CreateEventAsync(match.HostUserId, "MATCH", match.Id,
                $"Trận \"{match.Title}\" đã được phân xử hủy tính điểm (VOIDED) do tranh chấp tỉ số.", cancellationToken);
            if (match.ChallengerUserId.HasValue)
            {
                await _notifications.CreateEventAsync(match.ChallengerUserId.Value, "MATCH", match.Id,
                    $"Trận \"{match.Title}\" đã được phân xử hủy tính điểm (VOIDED) do tranh chấp tỉ số.", cancellationToken);
            }
        }
        else if (decision == "CONFIRM")
        {
            var finalHost = resolve.HostScore ?? match.ProposedHostScore ?? throw new ArgumentException("Host score is required");
            var finalChallenger = resolve.ChallengerScore ?? match.ProposedChallengerScore ?? throw new ArgumentException("Challenger score is required");
            await ApplyDisputePenaltyIfRequestedAsync(resolve.PenalizeUserId, cancellationToken);
            await FinalizeMatchScoreAsync(match, finalHost, finalChallenger, "CONFIRMED", cancellationToken);
        }
        else
        {
            throw new ArgumentException("Decision must be CONFIRM or VOID");
        }

        return MatchResponseDto.FromEntity(await _matchRepository.GetByIdAsync(match.Id, cancellationToken) ?? match);
    }

    public async Task<string> UploadDisputeEvidenceAsync(long matchId, long requesterUserId, IFormFile file, CancellationToken cancellationToken = default)
    {
        var match = await _matchRepository.GetByIdAsync(matchId, cancellationToken)
            ?? throw new KeyNotFoundException($"Match not found: {matchId}");

        var isParticipant = match.HostUserId == requesterUserId
            || match.ChallengerUserId == requesterUserId
            || match.Participants.Any(p => p.UserId == requesterUserId);
        if (!isParticipant)
        {
            throw new UnauthorizedAccessException("Chỉ thành viên trận đấu mới được tải bằng chứng.");
        }

        if (file is null || file.Length == 0) throw new ArgumentException("Image file is required");
        if (file.Length > MaxEvidenceBytes) throw new ArgumentException("Image size must not exceed 5 MB");
        var ext = Path.GetExtension(file.FileName);
        if (string.IsNullOrWhiteSpace(ext) || !AllowedEvidenceExtensions.Contains(ext))
            throw new ArgumentException("Only .jpg, .jpeg, .png, and .webp images are supported");

        var webRoot = _environment.WebRootPath ?? Path.Combine(_environment.ContentRootPath, "wwwroot");
        var folder = Path.Combine(webRoot, "uploads", "disputes");
        Directory.CreateDirectory(folder);
        var fileName = $"match_{matchId}_{requesterUserId}_{Guid.NewGuid():N}{ext.ToLowerInvariant()}";
        var fullPath = Path.Combine(folder, fileName);
        await using (var stream = new FileStream(fullPath, FileMode.Create))
        {
            await file.CopyToAsync(stream, cancellationToken);
        }
        return $"/uploads/disputes/{fileName}";
    }

    public Task<MatchResponseDto> RecordResultAsync(
        long matchId,
        long requesterUserId,
        bool isAdmin,
        MatchResultDto result,
        CancellationToken cancellationToken = default)
    {
        return ProposeScoreAsync(matchId, requesterUserId, isAdmin, result, cancellationToken);
    }

    public async Task<int> AutoConfirmElapsedScoresAsync(CancellationToken cancellationToken = default)
    {
        var now = DateTime.Now;
        var pendingIds = await _db.Matches
            .Where(m => m.ScoreStatus == "PENDING_CONFIRMATION"
                        && m.ScoreConfirmDeadline != null
                        && m.ScoreConfirmDeadline <= now
                        && m.ProposedHostScore != null
                        && m.ProposedChallengerScore != null)
            .Select(m => m.Id)
            .ToListAsync(cancellationToken);

        foreach (var id in pendingIds)
        {
            var match = await _matchRepository.GetByIdAsync(id, cancellationToken);
            if (match is null || match.ProposedHostScore is null || match.ProposedChallengerScore is null) continue;
            await FinalizeMatchScoreAsync(match, match.ProposedHostScore.Value, match.ProposedChallengerScore.Value, "AUTO_CONFIRMED", cancellationToken);
        }
        return pendingIds.Count;
    }

    public async Task<List<LeaderboardEntryDto>> GetLeaderboardAsync(int limit = 20, string? sportType = null, CancellationToken cancellationToken = default)
    {
        var clampedLimit = Math.Clamp(limit, 1, 100);
        if (!string.IsNullOrWhiteSpace(sportType))
        {
            var normalizedSport = sportType.Trim().ToUpperInvariant();
            var sportRows = await _db.UserSportRatings
                .AsNoTracking()
                .Include(r => r.User)
                .Where(r => r.SportType == normalizedSport && r.User.IsActive)
                .OrderByDescending(r => r.EloRating)
                .ThenByDescending(r => r.Wins)
                .Take(clampedLimit)
                .ToListAsync(cancellationToken);

            return sportRows.Select((r, idx) => new LeaderboardEntryDto
            {
                Rank = idx + 1,
                UserId = r.UserId,
                FullName = r.User.FullName,
                Address = r.User.Address,
                SportType = r.SportType,
                EloRating = r.EloRating,
                ReliabilityScore = r.User.ReliabilityScore,
                MatchesPlayed = r.MatchesPlayed
            }).ToList();
        }

        var users = await _userRepository.GetLeaderboardAsync(clampedLimit, cancellationToken);
        return users.Select((u, idx) => new LeaderboardEntryDto
        {
            Rank = idx + 1,
            UserId = u.Id,
            FullName = u.FullName,
            Address = u.Address,
            EloRating = u.EloRating,
            ReliabilityScore = u.ReliabilityScore,
            MatchesPlayed = 0
        }).ToList();
    }

    private async Task FinalizeMatchScoreAsync(Match match, int hostScore, int challengerScore, string finalScoreStatus, CancellationToken ct)
    {
        match.HostScore = hostScore;
        match.ChallengerScore = challengerScore;
        match.ScoreStatus = finalScoreStatus;
        match.Status = "COMPLETED";

        if (match.IsRanked)
        {
            await ApplySportEloAsync(match, hostScore, challengerScore, ct);
        }

        await _db.SaveChangesAsync(ct);

        var modeNote = match.IsRanked ? "và cập nhật Elo" : "(Giao hữu không tính Elo)";
        await _notifications.CreateEventAsync(match.HostUserId, "MATCH", match.Id,
            $"Tỉ số trận \"{match.Title}\" đã chốt ({hostScore}:{challengerScore}) {modeNote}.", ct);
        if (match.ChallengerUserId.HasValue)
        {
            await _notifications.CreateEventAsync(match.ChallengerUserId.Value, "MATCH", match.Id,
                $"Tỉ số trận \"{match.Title}\" đã chốt ({hostScore}:{challengerScore}) {modeNote}.", ct);
        }
    }

    private async Task ApplySportEloAsync(Match match, int hostScore, int challengerScore, CancellationToken ct)
    {
        var sport = match.SportType.Trim().ToUpperInvariant();
        var actualTeamA = hostScore > challengerScore ? 1.0 : (hostScore < challengerScore ? 0.0 : 0.5);
        var actualTeamB = 1.0 - actualTeamA;

        if (match.MatchMode == "TEAM_CHALLENGE" && match.ChallengerUserId.HasValue)
        {
            var kFactor = await ComputeAntiWinTradingKFactorAsync(match.HostUserId, match.ChallengerUserId.Value, sport, ct);
            if (kFactor <= 0) return;

            var hostRating = await GetOrCreateSportRatingAsync(match.HostUserId, sport, ct);
            var oppRating = await GetOrCreateSportRatingAsync(match.ChallengerUserId.Value, sport, ct);

            var expectedA = 1.0 / (1.0 + Math.Pow(10.0, (oppRating.EloRating - hostRating.EloRating) / 400.0));
            var expectedB = 1.0 - expectedA;

            UpdateRatingRow(hostRating, expectedA, actualTeamA, kFactor);
            UpdateRatingRow(oppRating, expectedB, actualTeamB, kFactor);

            await SyncUserHeadlineEloAsync(match.HostUserId, ct);
            await SyncUserHeadlineEloAsync(match.ChallengerUserId.Value, ct);
        }
        else if (match.MatchMode == "SOLO_LOBBY")
        {
            var active = match.Participants
                .Where(p => p.Status is "JOINED" or "CHECKED_IN")
                .ToList();
            var teamAIds = active.Where(p => p.TeamSide == "A").Select(p => p.UserId).Distinct().ToList();
            var teamBIds = active.Where(p => p.TeamSide != "A").Select(p => p.UserId).Distinct().ToList();
            if (teamAIds.Count == 0 || teamBIds.Count == 0) return;

            var ratingsA = new List<UserSportRating>();
            var ratingsB = new List<UserSportRating>();
            foreach (var uid in teamAIds) ratingsA.Add(await GetOrCreateSportRatingAsync(uid, sport, ct));
            foreach (var uid in teamBIds) ratingsB.Add(await GetOrCreateSportRatingAsync(uid, sport, ct));

            var avgA = ratingsA.Average(r => r.EloRating);
            var avgB = ratingsB.Average(r => r.EloRating);
            var expectedA = 1.0 / (1.0 + Math.Pow(10.0, (avgB - avgA) / 400.0));
            var expectedB = 1.0 - expectedA;

            foreach (var r in ratingsA)
            {
                UpdateRatingRow(r, expectedA, actualTeamA, 24);
                await SyncUserHeadlineEloAsync(r.UserId, ct);
            }
            foreach (var r in ratingsB)
            {
                UpdateRatingRow(r, expectedB, actualTeamB, 24);
                await SyncUserHeadlineEloAsync(r.UserId, ct);
            }
        }
    }

    private async Task<int> ComputeAntiWinTradingKFactorAsync(long userA, long userB, string sport, CancellationToken ct)
    {
        var windowStart = DateTime.Now.AddDays(-7);
        var recentSamePair = await _db.Matches.AsNoTracking()
            .CountAsync(m =>
                m.IsRanked &&
                m.Status == "COMPLETED" &&
                m.ScoreStatus != "VOIDED" &&
                m.SportType == sport &&
                m.UpdatedAt >= windowStart &&
                ((m.HostUserId == userA && m.ChallengerUserId == userB) ||
                 (m.HostUserId == userB && m.ChallengerUserId == userA)),
                ct);

        if (recentSamePair >= 3) return 0; // Anti-farming cap after 3 matches in 7 days
        if (recentSamePair == 2) return 8;
        return DefaultEloKFactor;
    }

    private async Task<UserSportRating> GetOrCreateSportRatingAsync(long userId, string sport, CancellationToken ct)
    {
        var existing = await _db.UserSportRatings.FirstOrDefaultAsync(r => r.UserId == userId && r.SportType == sport, ct);
        if (existing is not null) return existing;

        var created = new UserSportRating
        {
            UserId = userId,
            SportType = sport,
            EloRating = 1000
        };
        _db.UserSportRatings.Add(created);
        await _db.SaveChangesAsync(ct);
        return created;
    }

    private static void UpdateRatingRow(UserSportRating row, double expected, double actual, int kFactor)
    {
        row.EloRating = Math.Max(100, (int)Math.Round(row.EloRating + kFactor * (actual - expected)));
        row.MatchesPlayed += 1;
        if (actual > 0.75) row.Wins += 1;
        else if (actual < 0.25) row.Losses += 1;
        else row.Draws += 1;
        row.UpdatedAt = DateTime.Now;
    }

    private async Task SyncUserHeadlineEloAsync(long userId, CancellationToken ct)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == userId, ct);
        if (user is null) return;
        var maxElo = await _db.UserSportRatings
            .Where(r => r.UserId == userId)
            .Select(r => (int?)r.EloRating)
            .MaxAsync(ct);
        if (maxElo.HasValue)
        {
            user.EloRating = maxElo.Value;
        }
    }

    private async Task ApplyDisputePenaltyIfRequestedAsync(long? penalizeUserId, CancellationToken ct)
    {
        if (!penalizeUserId.HasValue) return;
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Id == penalizeUserId.Value, ct);
        if (user is not null)
        {
            user.ReliabilityScore = Math.Max(0, user.ReliabilityScore - 10);
        }
    }

    private async Task EnsureNoTimeOverlapAsync(long userId, Match target, CancellationToken ct)
    {
        var conflicts = await _db.Matches.AsNoTracking()
            .Where(m => m.Id != target.Id
                        && m.MatchDate == target.MatchDate
                        && m.Status != "CANCELLED"
                        && m.Status != "COMPLETED"
                        && m.StartTime < target.EndTime
                        && m.EndTime > target.StartTime
                        && (m.HostUserId == userId
                            || m.ChallengerUserId == userId
                            || m.Participants.Any(p => p.UserId == userId && (p.Status == "JOINED" || p.Status == "CHECKED_IN"))))
            .Select(m => m.Title)
            .FirstOrDefaultAsync(ct);

        if (conflicts is not null)
        {
            throw new ArgumentException($"Bạn đã tham gia trận \"{conflicts}\" trùng khung giờ này.");
        }
    }

    private async Task PromoteWaitlistAsync(Match match, CancellationToken ct)
    {
        var occupied = ComputeOccupiedSlots(match);
        var remaining = Math.Max(0, match.MaxSlots - occupied);
        if (remaining <= 0) return;

        var candidates = await _db.MatchParticipants
            .Where(p => p.MatchId == match.Id && p.Status == "WAITLISTED")
            .OrderBy(p => p.JoinedAt)
            .ToListAsync(ct);

        foreach (var candidate in candidates)
        {
            var needed = 1 + candidate.GuestCount;
            if (needed <= remaining)
            {
                candidate.Status = "JOINED";
                remaining -= needed;
                await _notifications.CreateEventAsync(candidate.UserId, "MATCH", match.Id,
                    $"Có người vừa rời trận \"{match.Title}\" — bạn đã được đôn từ danh sách chờ lên chính thức!", ct);
                if (remaining == 0) break;
            }
        }
        await _db.SaveChangesAsync(ct);
    }

    private async Task SyncMatchSlotCountsAsync(Match match, CancellationToken ct)
    {
        await _db.Entry(match).Collection(m => m.Participants).LoadAsync(ct);
        var occupied = ComputeOccupiedSlots(match);
        match.MissingPlayers = Math.Max(0, match.MaxSlots - occupied);
        match.Status = match.MissingPlayers == 0 ? "MATCHED" : "OPEN";
        await _db.SaveChangesAsync(ct);
    }

    private static int ComputeOccupiedSlots(Match match)
    {
        var others = match.Participants
            .Where(p => p.UserId != match.HostUserId && p.Status is "JOINED" or "CHECKED_IN")
            .Sum(p => 1 + p.GuestCount);
        return Math.Min(match.MaxSlots, match.PreReservedSlots + others);
    }

    private static string AutoAssignTeamSide(Match match)
    {
        var countA = match.PreReservedSlots + match.Participants
            .Where(p => p.UserId != match.HostUserId && p.TeamSide == "A" && p.Status is "JOINED" or "CHECKED_IN")
            .Sum(p => 1 + p.GuestCount);
        var countB = match.Participants
            .Where(p => p.TeamSide == "B" && p.Status is "JOINED" or "CHECKED_IN")
            .Sum(p => 1 + p.GuestCount);
        return countA <= countB ? "A" : "B";
    }

    private static string NormalizeMatchMode(string? mode)
    {
        var upper = (mode ?? "TEAM_CHALLENGE").Trim().ToUpperInvariant();
        return upper is "TEAM_CHALLENGE" or "CUSTOM_PRIVATE" or "SOLO_LOBBY" ? upper : "TEAM_CHALLENGE";
    }

    private static string NormalizeTeamSide(string? side)
    {
        var upper = (side ?? "ANY").Trim().ToUpperInvariant();
        return upper is "A" or "B" ? upper : "ANY";
    }

    private static HashSet<long> GetScoreConfirmationTargets(Match match, long submitterId)
    {
        var targets = new HashSet<long>();
        if (match.MatchMode == "TEAM_CHALLENGE")
        {
            if (match.HostUserId != submitterId) targets.Add(match.HostUserId);
            if (match.ChallengerUserId.HasValue && match.ChallengerUserId.Value != submitterId)
                targets.Add(match.ChallengerUserId.Value);
            return targets;
        }

        var submitterSide = match.Participants
            .FirstOrDefault(p => p.UserId == submitterId && p.Status is "JOINED" or "CHECKED_IN")?.TeamSide ?? "A";
        foreach (var p in match.Participants.Where(p => p.Status is "JOINED" or "CHECKED_IN" && p.UserId != submitterId))
        {
            if (p.TeamSide != submitterSide || targets.Count == 0)
            {
                targets.Add(p.UserId);
            }
        }
        if (targets.Count == 0 && match.HostUserId != submitterId) targets.Add(match.HostUserId);
        return targets;
    }
}
