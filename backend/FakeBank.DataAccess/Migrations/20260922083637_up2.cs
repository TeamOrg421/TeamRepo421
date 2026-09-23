using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FakeBank.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class up2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "IdempotencyKey",
                table: "BankTransactions",
                type: "nvarchar(128)",
                maxLength: 128,
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_BankTransactions_IdempotencyKey",
                table: "BankTransactions",
                column: "IdempotencyKey",
                unique: true,
                filter: "[IdempotencyKey] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_BankTransactions_IdempotencyKey",
                table: "BankTransactions");

            migrationBuilder.DropColumn(
                name: "IdempotencyKey",
                table: "BankTransactions");
        }
    }
}
