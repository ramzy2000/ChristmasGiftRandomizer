using System.ComponentModel.DataAnnotations;

namespace ChristmasGiftRandomizer.Models;

public class PreviousMatch
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    public Guid ExchangeId { get; set; }
    
    [Required]
    public Guid GiverId { get; set; }
    
    [Required]
    public Guid ReceiverId { get; set; }
    
    [Required]
    public int Year { get; set; }
    
    // Navigation properties
    public Exchange? Exchange { get; set; }
    // Note: Removed ExchangeParticipant navigation properties to avoid cascade conflicts
    // Use GiverId and ReceiverId as simple foreign keys instead
}

