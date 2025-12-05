using System.ComponentModel.DataAnnotations;

namespace ChristmasGiftRandomizer.Models;

public class Restriction
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    public Guid ExchangeId { get; set; }
    
    [Required]
    public Guid GiverId { get; set; }
    
    [Required]
    public Guid CannotGiveToId { get; set; }
    
    [StringLength(500)]
    public string? Reason { get; set; }
    
    // Navigation properties
    public Exchange? Exchange { get; set; }
    public ExchangeParticipant? Giver { get; set; }
    public ExchangeParticipant? CannotGiveTo { get; set; }
}

