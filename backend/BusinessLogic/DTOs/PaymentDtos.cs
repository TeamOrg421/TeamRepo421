namespace BusinessLogic.DTOs
{
    public class PaymentRequestDto
    {
        public Guid CardId { get; set; }
        public decimal Amount { get; set; }
    }

    public class PaymentResponseDto
    {
        public bool Success { get; set; }
        public string Message { get; set; } = string.Empty;
        public Guid? TransactionId { get; set; }
        public decimal? Balance { get; set; }
        public DateTime? CreatedAt { get; set; }
    }
}
