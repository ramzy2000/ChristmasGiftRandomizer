using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MimeKit;
using MailKit.Net.Smtp;
using MailKit.Security;
using ChristmasGiftRandomizer.Data;
using ChristmasGiftRandomizer.Models;

namespace ChristmasGiftRandomizer.Services;

public class EmailService : IEmailService
{
    private readonly ApplicationDbContext _context;
    private readonly IConfiguration _configuration;
    private readonly ILogger<EmailService> _logger;
    private readonly string _smtpServer;
    private readonly int _smtpPort;
    private readonly string _fromAddress;
    private readonly string _fromName;
    private readonly string _username;
    private readonly string _password;
    private readonly bool _enableSsl;
    private readonly string _siteUrl;

    public EmailService(
        ApplicationDbContext context,
        IConfiguration configuration,
        ILogger<EmailService> logger)
    {
        _context = context;
        _configuration = configuration;
        _logger = logger;

        var emailSettings = _configuration.GetSection("EmailSettings");
        _smtpServer = emailSettings["SmtpServer"] ?? "smtp.sendgrid.net";
        _smtpPort = int.Parse(emailSettings["SmtpPort"] ?? "587");
        _fromAddress = emailSettings["FromAddress"] ?? "noreply@christmasgiftexchange.com";
        _fromName = emailSettings["FromName"] ?? "Christmas Gift Exchange";
        _username = emailSettings["Username"] ?? "apikey";
        _password = emailSettings["Password"] ?? "";
        _enableSsl = bool.Parse(emailSettings["EnableSsl"] ?? "true");
        _siteUrl = _configuration["AppSettings:SiteUrl"] ?? "https://localhost:5001";
    }

    public async Task SendAssignmentEmailAsync(Assignment assignment, CancellationToken cancellationToken)
    {
        try
        {
            var assignmentData = await _context.Assignments
                .Include(a => a.Exchange)
                    .ThenInclude(e => e.Group)
                .Include(a => a.Giver)
                    .ThenInclude(ep => ep.Participant)
                .Include(a => a.Receiver)
                    .ThenInclude(ep => ep.Participant)
                .FirstOrDefaultAsync(a => a.Id == assignment.Id, cancellationToken);

            if (assignmentData == null)
            {
                _logger.LogError("Assignment {AssignmentId} not found", assignment.Id);
                return;
            }

            var giverEmail = assignmentData.Giver?.Participant?.Email;
            var giverName = assignmentData.Giver?.Participant?.Name ?? "Participant";
            var receiverName = assignmentData.Receiver?.Participant?.Name ?? "Someone";
            var exchangeName = assignmentData.Exchange?.Name ?? "Gift Exchange";
            var year = assignmentData.Exchange?.Year ?? DateTime.Now.Year;
            var eventDate = assignmentData.Exchange?.EventDate;

            if (string.IsNullOrEmpty(giverEmail))
            {
                _logger.LogWarning("No email address for assignment {AssignmentId}", assignment.Id);
                return;
            }

            var subject = $"🎁 Your Secret Santa Assignment for {year}";
            var body = GenerateAssignmentEmailBody(
                giverName,
                receiverName,
                exchangeName,
                year,
                eventDate,
                assignmentData.Exchange?.Id ?? Guid.Empty);

            await SendEmailAsync(giverEmail, subject, body, cancellationToken);

            // Update assignment notification timestamp
            assignmentData.NotifiedAt = DateTime.UtcNow;
            await _context.SaveChangesAsync(cancellationToken);

            _logger.LogInformation("Assignment email sent to {Email} for exchange {ExchangeId}", 
                giverEmail, assignmentData.ExchangeId);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending assignment email for assignment {AssignmentId}", assignment.Id);
            throw;
        }
    }

    public async Task SendInvitationEmailAsync(string email, string groupName, string organizerName, CancellationToken cancellationToken)
    {
        try
        {
            var subject = $"🎄 Invitation to {groupName} Gift Exchange";
            var body = GenerateInvitationEmailBody(email, groupName, organizerName);

            await SendEmailAsync(email, subject, body, cancellationToken);

            _logger.LogInformation("Invitation email sent to {Email} for group {GroupName}", email, groupName);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending invitation email to {Email}", email);
            throw;
        }
    }

    public async Task SendReminderEmailAsync(Exchange exchange, CancellationToken cancellationToken)
    {
        try
        {
            var exchangeData = await _context.Exchanges
                .Include(e => e.Assignments)
                    .ThenInclude(a => a.Giver)
                        .ThenInclude(ep => ep.Participant)
                .Include(e => e.Assignments)
                    .ThenInclude(a => a.Receiver)
                        .ThenInclude(ep => ep.Participant)
                .FirstOrDefaultAsync(e => e.Id == exchange.Id, cancellationToken);

            if (exchangeData == null || !exchangeData.Assignments.Any())
            {
                _logger.LogWarning("Exchange {ExchangeId} not found or has no assignments", exchange.Id);
                return;
            }

            foreach (var assignment in exchangeData.Assignments)
            {
                var giverEmail = assignment.Giver?.Participant?.Email;
                if (string.IsNullOrEmpty(giverEmail))
                {
                    continue;
                }

                var giverName = assignment.Giver?.Participant?.Name ?? "Participant";
                var receiverName = assignment.Receiver?.Participant?.Name ?? "Someone";
                var subject = $"🎁 Reminder: Your Secret Santa Assignment for {exchangeData.Year}";
                var body = GenerateReminderEmailBody(
                    giverName,
                    receiverName,
                    exchangeData.Name,
                    exchangeData.Year,
                    exchangeData.EventDate);

                await SendEmailAsync(giverEmail, subject, body, cancellationToken);
            }

            _logger.LogInformation("Reminder emails sent for exchange {ExchangeId}", exchange.Id);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending reminder emails for exchange {ExchangeId}", exchange.Id);
            throw;
        }
    }

    private async Task SendEmailAsync(string toEmail, string subject, string body, CancellationToken cancellationToken)
    {
        if (string.IsNullOrEmpty(_password))
        {
            _logger.LogWarning("Email password not configured. Skipping email to {Email}", toEmail);
            return;
        }

        var message = new MimeMessage();
        message.From.Add(new MailboxAddress(_fromName, _fromAddress));
        message.To.Add(new MailboxAddress("", toEmail));
        message.Subject = subject;

        var bodyBuilder = new BodyBuilder
        {
            HtmlBody = body,
            TextBody = ConvertHtmlToPlainText(body)
        };

        message.Body = bodyBuilder.ToMessageBody();

        using var client = new SmtpClient();
        try
        {
            await client.ConnectAsync(_smtpServer, _smtpPort, _enableSsl ? SecureSocketOptions.StartTls : SecureSocketOptions.None, cancellationToken);
            await client.AuthenticateAsync(_username, _password, cancellationToken);
            await client.SendAsync(message, cancellationToken);
            await client.DisconnectAsync(true, cancellationToken);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Error sending email to {Email}", toEmail);
            throw;
        }
    }

    private string GenerateAssignmentEmailBody(
        string giverName,
        string receiverName,
        string exchangeName,
        int year,
        DateTime? eventDate,
        Guid exchangeId)
    {
        var eventDateText = eventDate.HasValue
            ? $"<p><strong>Event Date:</strong> {eventDate.Value:MMMM dd, yyyy}</p>"
            : "";

        var viewAssignmentUrl = $"{_siteUrl}/Assignments/MyAssignment?exchangeId={exchangeId}";

        return $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #DF7861; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }}
        .content {{ background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }}
        .button {{ display: inline-block; padding: 12px 24px; background-color: #DF7861; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <h1>🎁 Your Secret Santa Assignment</h1>
        </div>
        <div class=""content"">
            <p>Hello {giverName},</p>
            <p>Your secret Santa assignment has been generated for <strong>{exchangeName} {year}</strong>!</p>
            <div style=""background-color: white; padding: 20px; border-left: 4px solid #DF7861; margin: 20px 0;"">
                <h2 style=""margin-top: 0; color: #DF7861;"">You are buying for:</h2>
                <p style=""font-size: 24px; font-weight: bold; color: #333;"">{receiverName}</p>
            </div>
            {eventDateText}
            <p>You can view your assignment details and exchange information by clicking the button below:</p>
            <a href=""{viewAssignmentUrl}"" class=""button"">View My Assignment</a>
            <p style=""margin-top: 30px; font-size: 12px; color: #666;"">
                If you have any questions, please contact the exchange organizer.
            </p>
        </div>
    </div>
</body>
</html>";
    }

    private string GenerateInvitationEmailBody(string email, string groupName, string organizerName)
    {
        var registerUrl = $"{_siteUrl}/Account/Register";

        return $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #DF7861; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }}
        .content {{ background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }}
        .button {{ display: inline-block; padding: 12px 24px; background-color: #DF7861; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px; }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <h1>🎄 You're Invited!</h1>
        </div>
        <div class=""content"">
            <p>Hello,</p>
            <p><strong>{organizerName}</strong> has invited you to participate in the <strong>{groupName}</strong> gift exchange!</p>
            <p>Create an account to view exchange details and receive your secret Santa assignment:</p>
            <a href=""{registerUrl}"" class=""button"">Create Account</a>
            <p style=""margin-top: 30px; font-size: 12px; color: #666;"">
                If you did not expect this invitation, you can safely ignore this email.
            </p>
        </div>
    </div>
</body>
</html>";
    }

    private string GenerateReminderEmailBody(
        string giverName,
        string receiverName,
        string exchangeName,
        int year,
        DateTime? eventDate)
    {
        var eventDateText = eventDate.HasValue
            ? $"<p><strong>Event Date:</strong> {eventDate.Value:MMMM dd, yyyy}</p>"
            : "";

        return $@"
<!DOCTYPE html>
<html>
<head>
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background-color: #DF7861; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }}
        .content {{ background-color: #f9f9f9; padding: 20px; border-radius: 0 0 5px 5px; }}
    </style>
</head>
<body>
    <div class=""container"">
        <div class=""header"">
            <h1>🎁 Reminder: Your Secret Santa Assignment</h1>
        </div>
        <div class=""content"">
            <p>Hello {giverName},</p>
            <p>This is a friendly reminder about your secret Santa assignment for <strong>{exchangeName} {year}</strong>.</p>
            <div style=""background-color: white; padding: 20px; border-left: 4px solid #DF7861; margin: 20px 0;"">
                <h2 style=""margin-top: 0; color: #DF7861;"">You are buying for:</h2>
                <p style=""font-size: 24px; font-weight: bold; color: #333;"">{receiverName}</p>
            </div>
            {eventDateText}
            <p style=""margin-top: 30px; font-size: 12px; color: #666;"">
                Don't forget to get your gift ready!
            </p>
        </div>
    </div>
</body>
</html>";
    }

    private string ConvertHtmlToPlainText(string html)
    {
        // Simple HTML to plain text conversion
        return html
            .Replace("<br>", "\n")
            .Replace("<br/>", "\n")
            .Replace("<br />", "\n")
            .Replace("<p>", "\n")
            .Replace("</p>", "\n")
            .Replace("<h1>", "\n")
            .Replace("</h1>", "\n")
            .Replace("<h2>", "\n")
            .Replace("</h2>", "\n")
            .Replace("<strong>", "")
            .Replace("</strong>", "")
            .Replace("<div class=\"container\">", "")
            .Replace("</div>", "")
            .Replace("<div class=\"header\">", "")
            .Replace("<div class=\"content\">", "")
            .Replace("<div style=\"", "")
            .Replace("</div>", "")
            .Replace("<a href=\"", "")
            .Replace("\" class=\"button\">", " - ")
            .Replace("</a>", "")
            .Replace("<!DOCTYPE html>", "")
            .Replace("<html>", "")
            .Replace("</html>", "")
            .Replace("<head>", "")
            .Replace("</head>", "")
            .Replace("<style>", "")
            .Replace("</style>", "")
            .Replace("<body>", "")
            .Replace("</body>", "")
            .Replace("🎁", "")
            .Replace("🎄", "")
            .Replace("&nbsp;", " ")
            .Replace("&amp;", "&")
            .Replace("&lt;", "<")
            .Replace("&gt;", ">");
    }
}

