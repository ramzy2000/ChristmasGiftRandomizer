using System.ComponentModel.DataAnnotations;
using ChristmasGiftRandomizer.Models;

namespace ChristmasGiftRandomizer.ViewModels;

public class CreateExchangeViewModel
{
    [Required]
    [Display(Name = "Group")]
    public Guid GroupId { get; set; }

    [Required]
    [Display(Name = "Year")]
    [Range(2020, 2100)]
    public int Year { get; set; } = DateTime.Now.Year;

    [Required]
    [StringLength(200)]
    [Display(Name = "Exchange Name")]
    public string Name { get; set; } = string.Empty;

    [Display(Name = "Event Date")]
    [DataType(DataType.Date)]
    public DateTime? EventDate { get; set; }

    public List<GroupOption> AvailableGroups { get; set; } = new();
}

public class GroupOption
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public int ParticipantCount { get; set; }
}

