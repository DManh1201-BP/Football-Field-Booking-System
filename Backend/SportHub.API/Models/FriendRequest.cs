using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SportHub.API.Models;

[Table("friend_requests")]
public class FriendRequest
{
    [Key, Column("id")]
    public long Id { get; set; }

    [Column("from_user_id")]
    public long FromUserId { get; set; }

    [Column("to_user_id")]
    public long ToUserId { get; set; }

    [Required, MaxLength(20), Column("status")]
    public string Status { get; set; } = "PENDING";

    [Column("created_at")]
    public DateTime CreatedAt { get; set; } = DateTime.Now;

    [Column("updated_at")]
    public DateTime UpdatedAt { get; set; } = DateTime.Now;
}
