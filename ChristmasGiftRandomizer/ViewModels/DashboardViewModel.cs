using ChristmasGiftRandomizer.Models;

namespace ChristmasGiftRandomizer.ViewModels;

public class DashboardViewModel
{
    public int GroupsCount { get; set; }
    public int ExchangesCount { get; set; }
    public int ActiveExchangesCount { get; set; }
    public bool HasPendingAssignment { get; set; }
    public List<Exchange> RecentExchanges { get; set; } = new();
    public Assignment? CurrentAssignment { get; set; }
}

