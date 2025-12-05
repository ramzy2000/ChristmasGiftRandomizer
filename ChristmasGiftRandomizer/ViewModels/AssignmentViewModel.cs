using ChristmasGiftRandomizer.Models;

namespace ChristmasGiftRandomizer.ViewModels;

public class AssignmentViewModel
{
    public Assignment Assignment { get; set; } = null!;
    public Exchange Exchange { get; set; } = null!;
    public string ReceiverName { get; set; } = string.Empty;
    public string ReceiverEmail { get; set; } = string.Empty;
    public string GiverName { get; set; } = string.Empty;
    public bool IsOrganizer { get; set; }
}

public class AllAssignmentsViewModel
{
    public Exchange Exchange { get; set; } = null!;
    public List<AssignmentDetailViewModel> Assignments { get; set; } = new();
}

public class AssignmentDetailViewModel
{
    public string GiverName { get; set; } = string.Empty;
    public string GiverEmail { get; set; } = string.Empty;
    public string ReceiverName { get; set; } = string.Empty;
    public string ReceiverEmail { get; set; } = string.Empty;
    public DateTime? NotifiedAt { get; set; }
}

