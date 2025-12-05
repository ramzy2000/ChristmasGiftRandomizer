using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ChristmasGiftRandomizer.Models;

public class Participant
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    public Guid GroupId { get; set; }
    
    public string? UserId { get; set; }
    
    [Required]
    [EmailAddress]
    [StringLength(256)]
    public string Email { get; set; } = string.Empty;
    
    [Required]
    [StringLength(200)]
    public string Name { get; set; } = string.Empty;
    
    [Column(TypeName = "nvarchar(max)")]
    public string? RestrictionsJson { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public Group? Group { get; set; }
    public ApplicationUser? User { get; set; }
    public ICollection<ExchangeParticipant> ExchangeParticipants { get; set; } = new List<ExchangeParticipant>();
}

