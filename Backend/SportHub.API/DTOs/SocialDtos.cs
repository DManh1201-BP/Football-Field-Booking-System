namespace SportHub.API.DTOs;

public class PublicUserProfileDto
{
    public long Id { get; set; }
    public string FullName { get; set; } = string.Empty;
    public string Role { get; set; } = string.Empty;
    public string? Bio { get; set; }
    public string? AvatarUrl { get; set; }
    public int EloRating { get; set; }
    public string RelationshipStatus { get; set; } = "NONE";
}

public class FriendRequestDto
{
    public long Id { get; set; }
    public string Direction { get; set; } = string.Empty;
    public string Status { get; set; } = string.Empty;
    public PublicUserProfileDto User { get; set; } = null!;
    public DateTime CreatedAt { get; set; }
}

public class SocialFriendDto
{
    public PublicUserProfileDto User { get; set; } = null!;
    public string? LastMessage { get; set; }
    public DateTime? LastMessageAt { get; set; }
}

public class ChatMessageDto
{
    public long Id { get; set; }
    public long SenderUserId { get; set; }
    public string Content { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}

public class SendChatMessageDto
{
    [System.ComponentModel.DataAnnotations.Required]
    [System.ComponentModel.DataAnnotations.MaxLength(2000)]
    public string Content { get; set; } = string.Empty;
}

public class NotificationMessageRequestDto
{
    [System.ComponentModel.DataAnnotations.Required]
    [System.ComponentModel.DataAnnotations.MaxLength(500)]
    public string Message { get; set; } = string.Empty;
}
