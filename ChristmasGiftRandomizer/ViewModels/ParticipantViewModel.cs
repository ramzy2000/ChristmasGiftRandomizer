using System.ComponentModel.DataAnnotations;

namespace ChristmasGiftRandomizer.ViewModels;

public class ParticipantViewModel
{
    public Guid? Id { get; set; }

    [Required]
    [StringLength(200)]
    [Display(Name = "Name")]
    public string Name { get; set; } = string.Empty;

    [Required]
    [EmailAddress]
    [StringLength(256)]
    [Display(Name = "Email")]
    public string Email { get; set; } = string.Empty;

    public string? UserId { get; set; }
    public List<Guid> RestrictedParticipantIds { get; set; } = new();
    public List<ParticipantOption> AvailableParticipants { get; set; } = new();
}

public class ParticipantOption
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
}

