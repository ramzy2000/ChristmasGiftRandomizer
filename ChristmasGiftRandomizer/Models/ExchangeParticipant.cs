using System.ComponentModel.DataAnnotations;

namespace ChristmasGiftRandomizer.Models;

public class ExchangeParticipant
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    public Guid ExchangeId { get; set; }
    
    [Required]
    public Guid ParticipantId { get; set; }
    
    // Navigation properties
    public Exchange? Exchange { get; set; }
    public Participant? Participant { get; set; }
    public ICollection<Restriction> RestrictionsAsGiver { get; set; } = new List<Restriction>();
    public ICollection<Assignment> AssignmentsAsGiver { get; set; } = new List<Assignment>();
    public ICollection<Assignment> AssignmentsAsReceiver { get; set; } = new List<Assignment>();
}

