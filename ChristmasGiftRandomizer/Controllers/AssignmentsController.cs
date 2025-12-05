using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ChristmasGiftRandomizer.Data;
using ChristmasGiftRandomizer.Models;
using ChristmasGiftRandomizer.ViewModels;

namespace ChristmasGiftRandomizer.Controllers;

[Authorize]
public class AssignmentsController : Controller
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ILogger<AssignmentsController> _logger;

    public AssignmentsController(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        ILogger<AssignmentsController> logger)
    {
        _context = context;
        _userManager = userManager;
        _logger = logger;
    }

    // GET: Assignments/MyAssignment
    public async Task<IActionResult> MyAssignment(Guid? exchangeId)
    {
        var userId = _userManager.GetUserId(User);
        var userEmail = User.Identity?.Name;

        if (userId == null || string.IsNullOrEmpty(userEmail))
        {
            return Unauthorized();
        }

        // Find assignment for current user
        var assignment = await _context.Assignments
            .Include(a => a.Exchange)
                .ThenInclude(e => e.Group)
            .Include(a => a.Giver)
                .ThenInclude(ep => ep.Participant)
            .Include(a => a.Receiver)
                .ThenInclude(ep => ep.Participant)
            .Where(a => exchangeId == null || a.ExchangeId == exchangeId)
            .Where(a => a.Giver.Participant.Email == userEmail || 
                       (a.Giver.Participant.UserId != null && a.Giver.Participant.UserId == userId))
            .OrderByDescending(a => a.Exchange.Year)
            .ThenByDescending(a => a.CreatedAt)
            .FirstOrDefaultAsync();

        if (assignment == null)
        {
            return View("NoAssignment");
        }

        var viewModel = new AssignmentViewModel
        {
            Assignment = assignment,
            Exchange = assignment.Exchange!,
            ReceiverName = assignment.Receiver?.Participant?.Name ?? "Unknown",
            ReceiverEmail = assignment.Receiver?.Participant?.Email ?? "",
            GiverName = assignment.Giver?.Participant?.Name ?? "You",
            IsOrganizer = assignment.Exchange?.Group?.OrganizerId == userId
        };

        return View(viewModel);
    }

    // GET: Assignments/ViewAll
    [Authorize]
    public async Task<IActionResult> ViewAll(Guid exchangeId)
    {
        var userId = _userManager.GetUserId(User);
        if (userId == null)
        {
            return Unauthorized();
        }

        var exchange = await _context.Exchanges
            .Include(e => e.Group)
            .Include(e => e.Assignments)
                .ThenInclude(a => a.Giver)
                    .ThenInclude(ep => ep.Participant)
            .Include(e => e.Assignments)
                .ThenInclude(a => a.Receiver)
                    .ThenInclude(ep => ep.Participant)
            .FirstOrDefaultAsync(e => e.Id == exchangeId);

        if (exchange == null)
        {
            return NotFound();
        }

        // Only organizer can view all assignments
        if (exchange.Group?.OrganizerId != userId)
        {
            return Forbid();
        }

        var assignments = exchange.Assignments.Select(a => new AssignmentDetailViewModel
        {
            GiverName = a.Giver?.Participant?.Name ?? "Unknown",
            GiverEmail = a.Giver?.Participant?.Email ?? "",
            ReceiverName = a.Receiver?.Participant?.Name ?? "Unknown",
            ReceiverEmail = a.Receiver?.Participant?.Email ?? "",
            NotifiedAt = a.NotifiedAt
        }).ToList();

        var viewModel = new AllAssignmentsViewModel
        {
            Exchange = exchange,
            Assignments = assignments
        };

        return View(viewModel);
    }

    // GET: Assignments/NoAssignment
    public IActionResult NoAssignment()
    {
        return View();
    }
}

