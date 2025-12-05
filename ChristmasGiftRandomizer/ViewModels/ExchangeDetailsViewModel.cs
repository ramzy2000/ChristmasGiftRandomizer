using ChristmasGiftRandomizer.Models;

namespace ChristmasGiftRandomizer.ViewModels;

public class ExchangeDetailsViewModel
{
    public Exchange Exchange { get; set; } = null!;
    public Group Group { get; set; } = null!;
    public List<ExchangeParticipantViewModel> Participants { get; set; } = new();
    public bool IsOrganizer { get; set; }
    public bool CanGenerateMatches { get; set; }
    public bool HasAssignments { get; set; }
}

public class ExchangeParticipantViewModel
{
    public Guid Id { get; set; }
    public Guid ParticipantId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public List<Guid> RestrictedParticipantIds { get; set; } = new();
    public List<ParticipantOption> AvailableParticipants { get; set; } = new();
}

