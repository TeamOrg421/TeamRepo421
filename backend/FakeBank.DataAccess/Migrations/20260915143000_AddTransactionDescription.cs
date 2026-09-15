using Microsoft.EntityFrameworkCore.Migrations;
using FakeBank.DataAccess;
using Microsoft.EntityFrameworkCore.Infrastructure;

#nullable disable

namespace FakeBank.DataAccess.Migrations
{

    [DbContext(typeof(FakeBankDb))]
    [Migration("20260915143000_AddTransactionDescription")]
    public partial class AddTransactionDescription : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "BankTransactions",
                type: "nvarchar(max)",
                nullable: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Description",
                table: "BankTransactions");
        }
    }
}
