using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using ChristmasGiftRandomizer.Data;
using ChristmasGiftRandomizer.Models;

namespace ChristmasGiftRandomizer.Services;

public class MatchingService : IMatchingService
{
    private readonly ApplicationDbContext _context;
    private readonly ILogger<MatchingService> _logger;
    private const int MaxRetryAttempts = 1000;

    public MatchingService(ApplicationDbContext context, ILogger<MatchingService> logger)
    {
        _context = context;
        _logger = logger;
    }

    public async Task<MatchingResult> GenerateMatchesAsync(Exchange exchange, CancellationToken cancellationToken)
    {
        // Load exchange with all necessary data
        var exchangeData = await _context.Exchanges
            .Include(e => e.ExchangeParticipants)
                .ThenInclude(ep => ep.Participant)
            .Include(e => e.Restrictions)
            .Include(e => e.Assignments)
            .FirstOrDefaultAsync(e => e.Id == exchange.Id, cancellationToken);

        if (exchangeData == null)
        {
            return new MatchingResult
            {
                Success = false,
                ErrorMessage = "Exchange not found."
            };
        }

        var participants = exchangeData.ExchangeParticipants.ToList();

        // Validate minimum participants
        if (participants.Count < 2)
        {
            return new MatchingResult
            {
                Success = false,
                ErrorMessage = "At least 2 participants are required to generate matches."
            };
        }

        // Handle odd number of participants
        if (participants.Count % 2 != 0)
        {
            _logger.LogWarning("Odd number of participants ({Count}) in exchange {ExchangeId}", 
                participants.Count, exchange.Id);
            // For odd numbers, we'll allow one self-assignment or suggest excluding organizer
            // For now, we'll proceed but log a warning
        }

        // Build constraint graph
        var constraints = BuildConstraintGraph(participants, exchangeData.Restrictions.ToList());

        // Validate that matching is possible
        if (!IsMatchingPossible(participants, constraints))
        {
            return new MatchingResult
            {
                Success = false,
                ErrorMessage = "Matching is not possible with the current restrictions. Please review participant restrictions."
            };
        }

        // Attempt matching with retry logic
        List<Assignment>? assignments = null;
        for (int attempt = 0; attempt < MaxRetryAttempts; attempt++)
        {
            var result = TryGenerateMatches(participants, constraints, exchangeData.Id);
            if (result != null)
            {
                assignments = result;
                break;
            }
        }

        if (assignments == null)
        {
            _logger.LogError("Failed to generate matches after {Attempts} attempts for exchange {ExchangeId}", 
                MaxRetryAttempts, exchange.Id);
            return new MatchingResult
            {
                Success = false,
                ErrorMessage = "Unable to generate valid matches after multiple attempts. Please review restrictions and try again."
            };
        }

        // Save assignments to database
        try
        {
            // Remove existing assignments if any
            var existingAssignments = await _context.Assignments
                .Where(a => a.ExchangeId == exchangeData.Id)
                .ToListAsync(cancellationToken);
            _context.Assignments.RemoveRange(existingAssignments);

            // Add new assignments
            foreach (var assignment in assignments)
            {
                _context.Assignments.Add(assignment);
            }

            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Successfully generated {Count} matches for exchange {ExchangeId}", 
                assignments.Count, exchange.Id);

            return new MatchingResult
            {
                Success = true,
                Assignments = assignments
            };
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error saving assignments for exchange {ExchangeId}", exchange.Id);
            return new MatchingResult
            {
                Success = false,
                ErrorMessage = "An error occurred while saving matches. Please try again."
            };
        }
    }

    private Dictionary<Guid, HashSet<Guid>> BuildConstraintGraph(
        List<ExchangeParticipant> participants,
        List<Restriction> restrictions)
    {
        var constraints = new Dictionary<Guid, HashSet<Guid>>();

        // Initialize constraints - each participant cannot gift themselves
        foreach (var participant in participants)
        {
            constraints[participant.Id] = new HashSet<Guid> { participant.Id };
        }

        // Add restrictions
        foreach (var restriction in restrictions)
        {
            if (!constraints.ContainsKey(restriction.GiverId))
            {
                constraints[restriction.GiverId] = new HashSet<Guid> { restriction.GiverId };
            }
            constraints[restriction.GiverId].Add(restriction.CannotGiveToId);
        }

        return constraints;
    }

    private bool IsMatchingPossible(
        List<ExchangeParticipant> participants,
        Dictionary<Guid, HashSet<Guid>> constraints)
    {
        // For each participant, check if they have at least one valid receiver
        foreach (var participant in participants)
        {
            var validReceivers = participants
                .Where(p => !constraints.GetValueOrDefault(participant.Id, new HashSet<Guid>()).Contains(p.Id))
                .ToList();

            if (validReceivers.Count == 0)
            {
                _logger.LogWarning("Participant {ParticipantId} has no valid receivers", participant.Id);
                return false;
            }
        }

        // Additional check: For odd numbers, ensure at least one participant can be self-assigned
        // or that we have enough flexibility
        if (participants.Count % 2 != 0)
        {
            // Check if we can create a valid matching with one self-assignment
            // This is a simplified check - in practice, we'd need a more sophisticated algorithm
            var totalConstraints = constraints.Values.Sum(c => c.Count);
            var totalPossible = participants.Count * participants.Count;
            var constraintRatio = (double)totalConstraints / totalPossible;

            // If constraints are too restrictive, matching might be impossible
            if (constraintRatio > 0.8)
            {
                _logger.LogWarning("Constraints are too restrictive ({Ratio:P2}) for odd number of participants", 
                    constraintRatio);
                // Still allow attempt, but log warning
            }
        }

        return true;
    }

    private List<Assignment>? TryGenerateMatches(
        List<ExchangeParticipant> participants,
        Dictionary<Guid, HashSet<Guid>> constraints,
        Guid exchangeId)
    {
        var assignments = new List<Assignment>();
        var usedReceivers = new HashSet<Guid>();
        var random = new Random();

        // Separate participants with restrictions and without
        var participantsWithRestrictions = participants
            .Where(p => constraints.GetValueOrDefault(p.Id, new HashSet<Guid>()).Count > 1)
            .OrderByDescending(p => constraints.GetValueOrDefault(p.Id, new HashSet<Guid>()).Count)
            .ToList();

        var participantsWithoutRestrictions = participants
            .Where(p => !participantsWithRestrictions.Contains(p))
            .ToList();

        // Process participants with restrictions first (like old app)
        foreach (var giver in participantsWithRestrictions)
        {
            var giverConstraints = constraints.GetValueOrDefault(giver.Id, new HashSet<Guid>());
            var availableReceivers = participants
                .Where(p => !giverConstraints.Contains(p.Id) && !usedReceivers.Contains(p.Id))
                .ToList();

            if (availableReceivers.Count == 0)
            {
                // No valid receiver available
                return null;
            }

            var receiver = availableReceivers[random.Next(availableReceivers.Count)];
            usedReceivers.Add(receiver.Id);

            assignments.Add(new Assignment
            {
                ExchangeId = exchangeId,
                GiverId = giver.Id,
                ReceiverId = receiver.Id,
                CreatedAt = DateTime.UtcNow
            });
        }

        // Process participants without restrictions
        foreach (var giver in participantsWithoutRestrictions)
        {
            if (usedReceivers.Contains(giver.Id))
            {
                continue; // Already assigned as receiver
            }

            var availableReceivers = participants
                .Where(p => p.Id != giver.Id && !usedReceivers.Contains(p.Id))
                .ToList();

            if (availableReceivers.Count == 0)
            {
                // Handle odd number case - allow self-assignment if necessary
                if (participants.Count % 2 != 0 && !usedReceivers.Contains(giver.Id))
                {
                    // Self-assignment for odd numbers
                    assignments.Add(new Assignment
                    {
                        ExchangeId = exchangeId,
                        GiverId = giver.Id,
                        ReceiverId = giver.Id,
                        CreatedAt = DateTime.UtcNow
                    });
                    usedReceivers.Add(giver.Id);
                    continue;
                }
                return null;
            }

            var receiver = availableReceivers[random.Next(availableReceivers.Count)];
            usedReceivers.Add(receiver.Id);

            assignments.Add(new Assignment
            {
                ExchangeId = exchangeId,
                GiverId = giver.Id,
                ReceiverId = receiver.Id,
                CreatedAt = DateTime.UtcNow
            });
        }

        // Validate all participants are assigned
        if (assignments.Count != participants.Count)
        {
            return null;
        }

        // Validate no self-assignments (except for odd numbers where one is allowed)
        var selfAssignments = assignments.Count(a => a.GiverId == a.ReceiverId);
        if (participants.Count % 2 == 0 && selfAssignments > 0)
        {
            return null;
        }
        if (participants.Count % 2 != 0 && selfAssignments > 1)
        {
            return null;
        }

        // Validate all constraints are respected
        foreach (var assignment in assignments)
        {
            var giverConstraints = constraints.GetValueOrDefault(assignment.GiverId, new HashSet<Guid>());
            if (giverConstraints.Contains(assignment.ReceiverId))
            {
                return null;
            }
        }

        return assignments;
    }
}

