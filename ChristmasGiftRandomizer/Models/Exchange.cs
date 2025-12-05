using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace ChristmasGiftRandomizer.Models;

public enum ExchangeStatus
{
    Draft,
    Active,
    Completed
}

public class Exchange
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    public Guid GroupId { get; set; }
    
    [Required]
    public int Year { get; set; }
    
    [Required]
    [StringLength(200)]
    public string Name { get; set; } = string.Empty;
    
    [Required]
    public ExchangeStatus Status { get; set; } = ExchangeStatus.Draft;
    
    public DateTime? EventDate { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    public DateTime? MatchedAt { get; set; }
    
    // Navigation properties
    public Group? Group { get; set; }
    public ICollection<ExchangeParticipant> ExchangeParticipants { get; set; } = new List<ExchangeParticipant>();
    public ICollection<Restriction> Restrictions { get; set; } = new List<Restriction>();
    public ICollection<Assignment> Assignments { get; set; } = new List<Assignment>();
}

