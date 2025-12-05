using System.ComponentModel.DataAnnotations;

namespace ChristmasGiftRandomizer.Models;

public class Assignment
{
    public Guid Id { get; set; } = Guid.NewGuid();
    
    [Required]
    public Guid ExchangeId { get; set; }
    
    [Required]
    public Guid GiverId { get; set; }
    
    [Required]
    public Guid ReceiverId { get; set; }
    
    public DateTime? NotifiedAt { get; set; }
    
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    
    // Navigation properties
    public Exchange? Exchange { get; set; }
    public ExchangeParticipant? Giver { get; set; }
    public ExchangeParticipant? Receiver { get; set; }
}

