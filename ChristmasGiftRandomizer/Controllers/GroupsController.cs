using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ChristmasGiftRandomizer.Data;
using ChristmasGiftRandomizer.Models;
using ChristmasGiftRandomizer.ViewModels;
using System.Text.Json;

namespace ChristmasGiftRandomizer.Controllers;

[Authorize]
public class GroupsController : Controller
{
    private readonly ApplicationDbContext _context;
    private readonly UserManager<ApplicationUser> _userManager;
    private readonly ILogger<GroupsController> _logger;

    public GroupsController(
        ApplicationDbContext context,
        UserManager<ApplicationUser> userManager,
        ILogger<GroupsController> logger)
    {
        _context = context;
        _userManager = userManager;
        _logger = logger;
    }

    // GET: Groups
    public async Task<IActionResult> Index()
    {
        var userId = _userManager.GetUserId(User);
        if (userId == null)
        {
            return Unauthorized();
        }

        var groups = await _context.Groups
            .Where(g => g.OrganizerId == userId)
            // .Include(g => g.Participants) // Include participants here if needed
            .OrderByDescending(g => g.CreatedAt)
            .ToListAsync();

        return View(groups);
    }

    // GET: Groups/Details/5
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

        var group = await _context.Groups
            .Include(g => g.Participants)
            .FirstOrDefaultAsync(m => m.Id == id);

        if (group == null)
        {
            return NotFound();
        }

        if (group.OrganizerId != userId)
        {
            return Forbid();
        }

        var viewModel = new GroupDetailsViewModel
        {
            Group = group,
            Participants = group.Participants.Select(p => new ParticipantViewModel
            {
                Id = p.Id,
                Name = p.Name,
                Email = p.Email,
                UserId = p.UserId,
                RestrictedParticipantIds = ParseRestrictions(p.RestrictionsJson)
            }).ToList(),
            IsOrganizer = true
        };

        // Populate available participants for restriction selection
        foreach (var participant in viewModel.Participants)
        {
            participant.AvailableParticipants = viewModel.Participants
                .Where(p => p.Id != participant.Id)
                .Select(p => new ParticipantOption
                {
                    Id = p.Id ?? Guid.Empty,
                    Name = p.Name
                })
                .ToList();
        }

        return View(viewModel);
    }

    // GET: Groups/Create
    public IActionResult Create()
    {
        return View();
    }

    // POST: Groups/Create
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Create(GroupViewModel viewModel)
    {
        if (ModelState.IsValid)
        {
            var userId = _userManager.GetUserId(User);
            if (userId == null)
            {
                return Unauthorized();
            }

            var group = new Group
            {
                Name = viewModel.Name,
                Description = viewModel.Description,
                OrganizerId = userId,
                CreatedAt = DateTime.UtcNow
            };

            _context.Add(group);
            await _context.SaveChangesAsync();
            return RedirectToAction(nameof(Index));
        }
        return View(viewModel);
    }

    // GET: Groups/Edit/5
    public async Task<IActionResult> Edit(Guid? id)
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

        var group = await _context.Groups.FindAsync(id);
        if (group == null)
        {
            return NotFound();
        }

        if (group.OrganizerId != userId)
        {
            return Forbid();
        }

        var viewModel = new GroupViewModel
        {
            Id = group.Id,
            Name = group.Name,
            Description = group.Description
        };

        return View(viewModel);
    }

    // POST: Groups/Edit/5
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> Edit(Guid id, GroupViewModel viewModel)
    {
        if (id != viewModel.Id)
        {
            return NotFound();
        }

        var userId = _userManager.GetUserId(User);
        if (userId == null)
        {
            return Unauthorized();
        }

        if (ModelState.IsValid)
        {
            var group = await _context.Groups.FindAsync(id);
            if (group == null)
            {
                return NotFound();
            }

            if (group.OrganizerId != userId)
            {
                return Forbid();
            }

            group.Name = viewModel.Name;
            group.Description = viewModel.Description;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!GroupExists(group.Id))
                {
                    return NotFound();
                }
                throw;
            }
            return RedirectToAction(nameof(Index));
        }
        return View(viewModel);
    }

    // GET: Groups/Delete/5
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

        var group = await _context.Groups
            .FirstOrDefaultAsync(m => m.Id == id);

        if (group == null)
        {
            return NotFound();
        }

        if (group.OrganizerId != userId)
        {
            return Forbid();
        }

        return View(group);
    }

    // POST: Groups/Delete/5
    [HttpPost, ActionName("Delete")]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> DeleteConfirmed(Guid id)
    {
        var userId = _userManager.GetUserId(User);
        if (userId == null)
        {
            return Unauthorized();
        }

        var group = await _context.Groups.FindAsync(id);
        if (group == null)
        {
            return NotFound();
        }

        if (group.OrganizerId != userId)
        {
            return Forbid();
        }

        _context.Groups.Remove(group);
        await _context.SaveChangesAsync();
        return RedirectToAction(nameof(Index));
    }

    // GET: Groups/AddParticipant/5
    public async Task<IActionResult> AddParticipant(Guid groupId)
    {
        var userId = _userManager.GetUserId(User);
        if (userId == null)
        {
            return Unauthorized();
        }

        var group = await _context.Groups
            .Include(g => g.Participants)
            .FirstOrDefaultAsync(g => g.Id == groupId);

        if (group == null || group.OrganizerId != userId)
        {
            return Forbid();
        }

        var viewModel = new ParticipantViewModel
        {
            AvailableParticipants = group.Participants.Select(p => new ParticipantOption
            {
                Id = p.Id,
                Name = p.Name
            }).ToList()
        };

        ViewData["GroupId"] = groupId;
        ViewData["GroupName"] = group.Name;
        return View(viewModel);
    }

    // POST: Groups/AddParticipant
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> AddParticipant(Guid groupId, ParticipantViewModel viewModel)
    {
        var userId = _userManager.GetUserId(User);
        if (userId == null)
        {
            return Unauthorized();
        }

        var group = await _context.Groups.FindAsync(groupId);
        if (group == null || group.OrganizerId != userId)
        {
            return Forbid();
        }

        if (ModelState.IsValid)
        {
            var participant = new Participant
            {
                GroupId = groupId,
                Name = viewModel.Name,
                Email = viewModel.Email,
                UserId = viewModel.UserId,
                RestrictionsJson = SerializeRestrictions(viewModel.RestrictedParticipantIds),
                CreatedAt = DateTime.UtcNow
            };

            _context.Add(participant);
            await _context.SaveChangesAsync();
            return RedirectToAction(nameof(Details), new { id = groupId });
        }

        ViewData["GroupId"] = groupId;
        return View(viewModel);
    }

    // GET: Groups/EditParticipant/5
    public async Task<IActionResult> EditParticipant(Guid? id)
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

        var participant = await _context.Participants
            .Include(p => p.Group)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (participant == null || participant.Group?.OrganizerId != userId)
        {
            return Forbid();
        }

        var group = participant.Group;
        var allParticipants = await _context.Participants
            .Where(p => p.GroupId == group.Id && p.Id != id)
            .ToListAsync();

        var viewModel = new ParticipantViewModel
        {
            Id = participant.Id,
            Name = participant.Name,
            Email = participant.Email,
            UserId = participant.UserId,
            RestrictedParticipantIds = ParseRestrictions(participant.RestrictionsJson),
            AvailableParticipants = allParticipants.Select(p => new ParticipantOption
            {
                Id = p.Id,
                Name = p.Name
            }).ToList()
        };

        ViewData["GroupId"] = group.Id;
        ViewData["GroupName"] = group.Name;
        return View(viewModel);
    }

    // POST: Groups/EditParticipant
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> EditParticipant(Guid id, ParticipantViewModel viewModel)
    {
        if (id != viewModel.Id)
        {
            return NotFound();
        }

        var userId = _userManager.GetUserId(User);
        if (userId == null)
        {
            return Unauthorized();
        }

        var participant = await _context.Participants
            .Include(p => p.Group)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (participant == null || participant.Group?.OrganizerId != userId)
        {
            return Forbid();
        }

        if (ModelState.IsValid)
        {
            participant.Name = viewModel.Name;
            participant.Email = viewModel.Email;
            participant.UserId = viewModel.UserId;
            participant.RestrictionsJson = SerializeRestrictions(viewModel.RestrictedParticipantIds);

            await _context.SaveChangesAsync();
            return RedirectToAction(nameof(Details), new { id = participant.GroupId });
        }

        ViewData["GroupId"] = participant.GroupId;
        return View(viewModel);
    }

    // POST: Groups/DeleteParticipant/5
    [HttpPost]
    [ValidateAntiForgeryToken]
    public async Task<IActionResult> DeleteParticipant(Guid id)
    {
        var userId = _userManager.GetUserId(User);
        if (userId == null)
        {
            return Unauthorized();
        }

        var participant = await _context.Participants
            .Include(p => p.Group)
            .Include(p => p.ExchangeParticipants)
                .ThenInclude(ep => ep.AssignmentsAsGiver)
            .Include(p => p.ExchangeParticipants)
                .ThenInclude(ep => ep.AssignmentsAsReceiver)
            .Include(p => p.ExchangeParticipants)
                .ThenInclude(ep => ep.RestrictionsAsGiver)
            .FirstOrDefaultAsync(p => p.Id == id);

        if (participant == null || participant.Group?.OrganizerId != userId)
        {
            return Forbid();
        }

        var groupId = participant.GroupId;

        // Delete all related data first to avoid foreign key constraint violations
        foreach (var exchangeParticipant in participant.ExchangeParticipants)
        {
            // Remove assignments where this participant is giver or receiver
            _context.Assignments.RemoveRange(exchangeParticipant.AssignmentsAsGiver);
            _context.Assignments.RemoveRange(exchangeParticipant.AssignmentsAsReceiver);
            
            // Remove restrictions where this participant is giver
            _context.Restrictions.RemoveRange(exchangeParticipant.RestrictionsAsGiver);
            
            // Remove restrictions where this participant cannot give to others
            var restrictionsAsReceiver = await _context.Restrictions
                .Where(r => r.CannotGiveToId == exchangeParticipant.Id)
                .ToListAsync();
            _context.Restrictions.RemoveRange(restrictionsAsReceiver);
        }

        // Remove exchange participants
        _context.ExchangeParticipants.RemoveRange(participant.ExchangeParticipants);
        
        // Finally remove the participant
        _context.Participants.Remove(participant);
        
        await _context.SaveChangesAsync();
        return RedirectToAction(nameof(Details), new { id = groupId });
    }

    private bool GroupExists(Guid id)
    {
        return _context.Groups.Any(e => e.Id == id);
    }

    private static List<Guid> ParseRestrictions(string? json)
    {
        if (string.IsNullOrWhiteSpace(json))
        {
            return new List<Guid>();
        }

        try
        {
            return JsonSerializer.Deserialize<List<Guid>>(json) ?? new List<Guid>();
        }
        catch
        {
            return new List<Guid>();
        }
    }

    private static string? SerializeRestrictions(List<Guid> restrictions)
    {
        if (restrictions == null || restrictions.Count == 0)
        {
            return null;
        }

        return JsonSerializer.Serialize(restrictions);
    }
}

