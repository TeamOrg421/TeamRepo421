using System.Net;
using System.Net.Mail;
using System.Text;
using BusinessLogic.Interfaces;
using Microsoft.Extensions.Configuration;

namespace BusinessLogic.Services;

public sealed class SmtpEmailSender : IEmailSender
{
    private readonly IConfiguration _configuration;

    public SmtpEmailSender(IConfiguration configuration)
    {
        _configuration = configuration;
    }

    public async Task SendAsync(string recipientEmail, string subject, string plainTextBody, string htmlBody)
    {
        var host = _configuration["Smtp:Host"];
        var fromEmail = _configuration["Smtp:FromEmail"];

        if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(fromEmail))
            throw new SmtpNotConfiguredException();

        var port = _configuration.GetValue<int?>("Smtp:Port") ?? 587;
        if (port is < 1 or > 65535)
            throw new SmtpNotConfiguredException("SMTP port must be between 1 and 65535.");

        var fromName = _configuration["Smtp:FromName"];
        var userName = _configuration["Smtp:UserName"];
        var password = _configuration["Smtp:Password"];
        var enableSsl = _configuration.GetValue("Smtp:EnableSsl", true);

        using var message = new MailMessage
        {
            From = new MailAddress(fromEmail, fromName ?? string.Empty),
            Subject = subject,
            SubjectEncoding = Encoding.UTF8,
            BodyEncoding = Encoding.UTF8,
            Body = plainTextBody,
            IsBodyHtml = false
        };
        message.To.Add(new MailAddress(recipientEmail));
        message.AlternateViews.Add(AlternateView.CreateAlternateViewFromString(htmlBody, Encoding.UTF8, "text/html"));

        using var client = new SmtpClient(host, port)
        {
            DeliveryMethod = SmtpDeliveryMethod.Network,
            UseDefaultCredentials = false,
            EnableSsl = enableSsl
        };

        if (!string.IsNullOrWhiteSpace(userName))
            client.Credentials = new NetworkCredential(userName, password);

        await client.SendMailAsync(message);
    }
}

public sealed class SmtpNotConfiguredException : InvalidOperationException
{
    public SmtpNotConfiguredException(string? message = null)
        : base(message ?? "SMTP is not configured. Set Smtp:Host and Smtp:FromEmail.")
    {
    }
}
