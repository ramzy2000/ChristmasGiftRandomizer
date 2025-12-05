using ChristmasGiftRandomizer.Models;

namespace ChristmasGiftRandomizer.ViewModels;

public class GroupDetailsViewModel
{
    public Group Group { get; set; } = null!;
    public List<ParticipantViewModel> Participants { get; set; } = new();
    public bool IsOrganizer { get; set; }
}

