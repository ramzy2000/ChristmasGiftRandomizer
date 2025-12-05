using ChristmasGiftRandomizer.Models;

namespace ChristmasGiftRandomizer.Services;

public interface IEmailService
{
    Task SendAssignmentEmailAsync(Assignment assignment, CancellationToken cancellationToken);
    Task SendInvitationEmailAsync(string email, string groupName, string organizerName, CancellationToken cancellationToken);
    Task SendReminderEmailAsync(Exchange exchange, CancellationToken cancellationToken);
}

