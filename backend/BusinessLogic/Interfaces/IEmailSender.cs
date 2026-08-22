namespace BusinessLogic.Interfaces;

public interface IEmailSender
{
    Task SendAsync(string recipientEmail, string subject, string plainTextBody, string htmlBody);
}
