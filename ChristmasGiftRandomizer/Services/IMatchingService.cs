using ChristmasGiftRandomizer.Models;

namespace ChristmasGiftRandomizer.Services;

public interface IMatchingService
{
    Task<MatchingResult> GenerateMatchesAsync(Exchange exchange, CancellationToken cancellationToken);
}

public class MatchingResult
{
    public bool Success { get; set; }
    public string? ErrorMessage { get; set; }
    public List<Assignment> Assignments { get; set; } = new();
}

