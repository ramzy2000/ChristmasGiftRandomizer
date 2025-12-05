using System.ComponentModel.DataAnnotations;

namespace ChristmasGiftRandomizer.ViewModels;

public class GroupViewModel
{
    public Guid? Id { get; set; }

    [Required]
    [StringLength(200)]
    [Display(Name = "Group Name")]
    public string Name { get; set; } = string.Empty;

    [StringLength(1000)]
    [Display(Name = "Description")]
    public string? Description { get; set; }
}

