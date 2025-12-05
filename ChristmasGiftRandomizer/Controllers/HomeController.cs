using System.Diagnostics;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using ChristmasGiftRandomizer.Data;
using ChristmasGiftRandomizer.Models;
using ChristmasGiftRandomizer.ViewModels;
using Microsoft.AspNetCore.Mvc;

namespace ChristmasGiftRandomizer.Controllers
{
    public class HomeController : Controller
    {
        private readonly ApplicationDbContext _context;
        private readonly UserManager<ApplicationUser> _userManager;

        public HomeController(ApplicationDbContext context, UserManager<ApplicationUser> userManager)
        {
            _context = context;
            _userManager = userManager;
        }

        public async Task<IActionResult> Index()
        {
            if (User.Identity?.IsAuthenticated == true)
            {
                var userId = _userManager.GetUserId(User);
                var userEmail = User.Identity.Name;

                if (userId == null)
                {
                    return View();
                }

                var groupsCount = await _context.Groups
                    .Where(g => g.OrganizerId == userId)
                    .CountAsync();

                var exchanges = await _context.Exchanges
                    .Include(e => e.Group)
                    .Where(e => e.Group.OrganizerId == userId)
                    .OrderByDescending(e => e.Year)
                    .ThenByDescending(e => e.CreatedAt)
                    .Take(5)
                    .ToListAsync();

                var activeExchangesCount = exchanges.Count(e => e.Status == ExchangeStatus.Active);

                // Find current assignment
                var assignment = await _context.Assignments
                    .Include(a => a.Exchange)
                        .ThenInclude(e => e.Group)
                    .Include(a => a.Giver)
                        .ThenInclude(ep => ep.Participant)
                    .Include(a => a.Receiver)
                        .ThenInclude(ep => ep.Participant)
                    .Where(a => a.Giver.Participant.Email == userEmail || 
                               (a.Giver.Participant.UserId != null && a.Giver.Participant.UserId == userId))
                    .Where(a => a.Exchange.Status == ExchangeStatus.Active)
                    .OrderByDescending(a => a.Exchange.Year)
                    .FirstOrDefaultAsync();

                var viewModel = new DashboardViewModel
                {
                    GroupsCount = groupsCount,
                    ExchangesCount = await _context.Exchanges
                        .Where(e => e.Group.OrganizerId == userId)
                        .CountAsync(),
                    ActiveExchangesCount = activeExchangesCount,
                    HasPendingAssignment = assignment != null,
                    RecentExchanges = exchanges,
                    CurrentAssignment = assignment
                };

                return View("Dashboard", viewModel);
            }

            return View();
        }

        public IActionResult Privacy()
        {
            return View();
        }

        [ResponseCache(Duration = 0, Location = ResponseCacheLocation.None, NoStore = true)]
        public IActionResult Error()
        {
            return View(new ErrorViewModel { RequestId = Activity.Current?.Id ?? HttpContext.TraceIdentifier });
        }
    }
}
