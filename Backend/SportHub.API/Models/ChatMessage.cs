using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SportHub.API.Models;

[Table("chat_messages")]
public class ChatMessage
{
    [Key, Column("id")]
    public long Id { get; set; }

    [Column("conversation_id")]
    public long ConversationId { get; set; }

    [Column("sender_user_id")]
    public long SenderUserId { get; set; }

    [Required, MaxLength(2000), Column("content")]
    public string Content { get; set; } = string.Empty;

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.Now;
}
