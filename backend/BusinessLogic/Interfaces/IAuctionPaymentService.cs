namespace BusinessLogic.Interfaces
{
    /// <summary>
    /// Сервіс для обробки платежів за аукціони
    /// Абстрагує від конкретної реалізації платіжної системи
    /// </summary>
    public interface IAuctionPaymentService
    {
        /// <summary>
        /// Обробити платіж переможця аукціону
        /// </summary>
        /// <param name="userId">ID користувача, який виграв</param>
        /// <param name="amount">Сума платежу</param>
        /// <returns>True якщо платіж успішний, False інакше</returns>
        Task<bool> ProcessAuctionPaymentAsync(Guid winnerId, Guid sellerId, decimal amount);
    }
}
