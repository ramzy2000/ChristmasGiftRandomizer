using System.ComponentModel.DataAnnotations;

namespace ChristmasGiftRandomizer.Models;

public class Group
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    [StringLength(200)]
    public string Name { get; set; } = string.Empty;
    
    [StringLength(1000)]
    public string? Description { get; set; }
    
    [Required]
    public string OrganizerId { get; set; } = string.Empty;
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public ApplicationUser? Organizer { get; set; }
    public ICollection<Participant> Participants { get; set; } = new List<Participant>();
    public ICollection<Exchange> Exchanges { get; set; } = new List<Exchange>();
}

