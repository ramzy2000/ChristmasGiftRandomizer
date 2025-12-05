using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using ChristmasGiftRandomizer.Data;
using ChristmasGiftRandomizer.Services;

namespace ChristmasGiftRandomizer.Jobs;

public class EmailJobs
{
    private readonly IServiceProvider _serviceProvider;

    public EmailJobs(IServiceProvider serviceProvider)
    {
        _serviceProvider = serviceProvider;
    }

    public async Task SendAssignmentEmailsAsync(Guid exchangeId)
    {
        using var scope = _serviceProvider.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        var emailService = scope.ServiceProvider.GetRequiredService<IEmailService>();

        var assignments = await context.Assignments
            .Where(a => a.ExchangeId == exchangeId && a.NotifiedAt == null)
            .ToListAsync();

        foreach (var assignment in assignments)
        {
            try
            {
                await emailService.SendAssignmentEmailAsync(assignment, CancellationToken.None);
            }
            catch (Exception)
            {
                // Log error but continue with other emails
                // Hangfire will retry failed jobs
                throw;
            }
        }
    }
}

