using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Hangfire;
using Microsoft.Extensions.DependencyInjection;
using ChristmasGiftRandomizer.Data;
using ChristmasGiftRandomizer.Models;
using ChristmasGiftRandomizer.ViewModels;
using ChristmasGiftRandomizer.Services;
using ChristmasGiftRandomizer.Jobs;
using System.Text.Json;

namespace ChristmasGiftRandomizer.Controllers;

[Authorize]
public class ExchangesController : Controller
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly IMatchingService _matchingService;
    private readonly IEmailService _emailService;
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<ExchangesController> _logger;

    public ExchangesController(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        IMatchingService matchingService,
        IEmailService emailService,
        IServiceProvider serviceProvider,
        ILogger<ExchangesController> logger)
    {
        _context = context;
        _userManager = userManager;
        _matchingService = matchingService;
        _emailService = emailService;
        _serviceProvider = serviceProvider;
        _logger = logger;
    }

    // GET: Exchanges
    public async Task<IActionResult> Index()
    {
        var userId = _userManager.GetUserId(User);
        if (userId == null)
        {
            return Unauthorized();
        }

        var exchanges = await _context.Exchanges
            .Include(e => e.Group)
            .Where(e => e.Group.OrganizerId == userId)
            .OrderByDescending(e => e.Year)
            .ThenByDescending(e => e.CreatedAt)
            .ToListAsync();

        return View(exchanges);
    }

    // GET: Exchanges/Details/5
    public async Task<IActionResult> Details(Guid? id)
    {
        if (id == null)
        {
            return NotFound();
        }

        var userId = _userManager.GetUserId(User);
        if (userId == null)
        {
            return Unauthorized();
        }

        var exchange = await _context.Exchanges
            .Include(e => e.Group)
            .Include(e => e.ExchangeParticipants)
                .ThenInclude(ep => ep.Participant)
            .Include(e => e.Restrictions)
            .Include(e => e.Assignments)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (exchange == null)
        {
            return NotFound();
        }

        var isOrganizer = exchange.Group.OrganizerId == userId;
        if (!isOrganizer)
        {
            // Check if user is a participant
            var userEmail = User.Identity?.Name;
            var isParticipant = exchange.ExchangeParticipants
                .Any(ep => ep.Participant.Email == userEmail);
            
            if (!isParticipant)
            {
                return Forbid();
            }
        }

        var participants = exchange.ExchangeParticipants.Select(ep => new ExchangeParticipantViewModel
        {
            Id = ep.Id,
            ParticipantId = ep.ParticipantId,
            Name = ep.Participant.Name,
            Email = ep.Participant.Email,
            RestrictedParticipantIds = exchange.Restrictions
                .Where(r => r.GiverId == ep.Id)
                .Select(r => r.CannotGiveToId)
                .ToList(),
            AvailableParticipants = exchange.ExchangeParticipants
                .Where(p => p.Id != ep.Id)
                .Select(p => new ParticipantOption
                {
                    Id = p.Id,
                    Name = p.Participant.Name
                })
                .ToList()
        }).ToList();

        var viewModel = new ExchangeDetailsViewModel
        {
            Exchange = exchange,
            Group = exchange.Group,
            Participants = participants,
            IsOrganizer = isOrganizer,
            CanGenerateMatches = exchange.Status == ExchangeStatus.Draft && 
                                 exchange.ExchangeParticipants.Count >= 2,
            HasAssignments = exchange.Assignments.Any()
        };

        return View(viewModel);
    }

    // GET: Exchanges/Create
    public async Task<IActionResult> Create()
    {
        var userId = _userManager.GetUserId(User);
        if (userId == null)
        {
            return Unauthorized();
        }

        var groups = await _context.Groups
            .Include(g => g.Participants)
            .Where(g => g.OrganizerId == userId)
            .ToListAsync();

        var viewModel = new CreateExchangeViewModel
        {
            Year = DateTime.Now.Year,
            AvailableGroups = groups.Select(g => new GroupOption
            {
                Id = g.Id,
                Name = g.Name,
                ParticipantCount = g.Participants.Count
            }).ToList()
        };

        return View(viewModel);
    }

    // POST: Exchanges/Create
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(CreateExchangeViewModel viewModel)
    {
        var userId = _userManager.GetUserId(User);
        if (userId == null)
        {
            return Unauthorized();
        }

        var group = await _context.Groups
            .Include(g => g.Participants)
            .FirstOrDefaultAsync(g => g.Id == viewModel.GroupId);

        if (group == null || group.OrganizerId != userId)
        {
            return Forbid();
        }

        if (ModelState.IsValid)
        {
            var exchange = new Exchange
            {
                GroupId = viewModel.GroupId,
                Year = viewModel.Year,
                Name = viewModel.Name,
                EventDate = viewModel.EventDate,
                Status = ExchangeStatus.Draft,
                CreatedAt = DateTime.UtcNow
            };

            _context.Add(exchange);

            // Load participants from group
            foreach (var participant in group.Participants)
            {
                var exchangeParticipant = new ExchangeParticipant
                {
                    ExchangeId = exchange.Id,
                    ParticipantId = participant.Id
                };
                _context.Add(exchangeParticipant);

                // Load restrictions from participant's RestrictionsJson
                if (!string.IsNullOrEmpty(participant.RestrictionsJson))
                {
                    var restrictedIds = JsonSerializer.Deserialize<List<Guid>>(participant.RestrictionsJson);
                    if (restrictedIds != null)
                    {
                        // Note: We'll need to map participant IDs to exchange participant IDs after all are created
                        // For now, we'll handle this in a second pass
                    }
                }
            }

            await _context.SaveChangesAsync();

            // Second pass: Create restrictions after all exchange participants exist
            var exchangeParticipants = await _context.ExchangeParticipants
                .Where(ep => ep.ExchangeId == exchange.Id)
                .Include(ep => ep.Participant)
                .ToListAsync();

            foreach (var ep in exchangeParticipants)
            {
                var participant = group.Participants.FirstOrDefault(p => p.Id == ep.ParticipantId);
                if (participant != null && !string.IsNullOrEmpty(participant.RestrictionsJson))
                {
                    var restrictedParticipantIds = JsonSerializer.Deserialize<List<Guid>>(participant.RestrictionsJson);
                    if (restrictedParticipantIds != null)
                    {
                        foreach (var restrictedParticipantId in restrictedParticipantIds)
                        {
                            var restrictedEp = exchangeParticipants.FirstOrDefault(
                                e => e.ParticipantId == restrictedParticipantId);
                            if (restrictedEp != null)
                            {
                                var restriction = new Restriction
                                {
                                    ExchangeId = exchange.Id,
                                    GiverId = ep.Id,
                                    CannotGiveToId = restrictedEp.Id
                                };
                                _context.Add(restriction);
                            }
                        }
                    }
                }
            }

            await _context.SaveChangesAsync();
            return RedirectToAction(nameof(Details), new { id = exchange.Id });
        }

        // Reload groups for dropdown
        var groups = await _context.Groups
            .Include(g => g.Participants)
            .Where(g => g.OrganizerId == userId)
            .ToListAsync();
        viewModel.AvailableGroups = groups.Select(g => new GroupOption
        {
            Id = g.Id,
            Name = g.Name,
            ParticipantCount = g.Participants.Count
        }).ToList();

        return View(viewModel);
    }

    // POST: Exchanges/GenerateMatches/5
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> GenerateMatches(Guid id)
    {
        var userId = _userManager.GetUserId(User);
        if (userId == null)
        {
            return Unauthorized();
        }

        var exchange = await _context.Exchanges
            .Include(e => e.Group)
            .Include(e => e.ExchangeParticipants)
            .Include(e => e.Restrictions)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (exchange == null)
        {
            return NotFound();
        }

        if (exchange.Group.OrganizerId != userId)
        {
            return Forbid();
        }

        if (exchange.Status != ExchangeStatus.Draft)
        {
            TempData["Error"] = "Matches can only be generated for exchanges in Draft status.";
            return RedirectToAction(nameof(Details), new { id });
        }

        if (exchange.ExchangeParticipants.Count < 2)
        {
            TempData["Error"] = "At least 2 participants are required to generate matches.";
            return RedirectToAction(nameof(Details), new { id });
        }

        try
        {
            var result = await _matchingService.GenerateMatchesAsync(exchange, CancellationToken.None);

            if (result.Success)
            {
                exchange.Status = ExchangeStatus.Active;
                exchange.MatchedAt = DateTime.UtcNow;
                await _context.SaveChangesAsync();

                // Queue email sending via Hangfire
                BackgroundJob.Enqueue<EmailJobs>(x => x.SendAssignmentEmailsAsync(exchange.Id));

                TempData["Success"] = "Matches generated successfully! Emails are being sent to all participants.";
            }
            else
            {
                TempData["Error"] = result.ErrorMessage ?? "Failed to generate matches. Please check restrictions and try again.";
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error generating matches for exchange {ExchangeId}", id);
            TempData["Error"] = "An error occurred while generating matches. Please try again.";
        }

        return RedirectToAction(nameof(Details), new { id });
    }

    // GET: Exchanges/Delete/5
    public async Task<IActionResult> Delete(Guid? id)
    {
        if (id == null)
        {
            return NotFound();
        }

        var userId = _userManager.GetUserId(User);
        if (userId == null)
        {
            return Unauthorized();
        }

        var exchange = await _context.Exchanges
            .Include(e => e.Group)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (exchange == null)
        {
            return NotFound();
        }

        if (exchange.Group.OrganizerId != userId)
        {
            return Forbid();
        }

        return View(exchange);
    }

    // POST: Exchanges/Delete/5
    [HttpPost, ActionName("Delete")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> DeleteConfirmed(Guid id)
    {
        var userId = _userManager.GetUserId(User);
        if (userId == null)
        {
            return Unauthorized();
        }

        var exchange = await _context.Exchanges
            .Include(e => e.Group)
            .FirstOrDefaultAsync(e => e.Id == id);

        if (exchange == null)
        {
            return NotFound();
        }

        if (exchange.Group.OrganizerId != userId)
        {
            return Forbid();
        }

        _context.Exchanges.Remove(exchange);
        await _context.SaveChangesAsync();
        return RedirectToAction(nameof(Index));
    }
}

