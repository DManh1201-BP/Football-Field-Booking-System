using System.ComponentModel.DataAnnotations.Schema;

namespace SportHub.API.Models;

[Table("conversations")]
public class Conversation
{
    [Column("id")]
    public long Id { get; set; }

    [Column("participant_one_id")]
    public long ParticipantOneId { get; set; }

    [Column("participant_two_id")]
    public long ParticipantTwoId { get; set; }

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    public ICollection<ChatMessage> Messages { get; set; } = new List<ChatMessage>();
}
