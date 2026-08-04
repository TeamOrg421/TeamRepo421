using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FakeBank.DataAccess.Migrations
{
    /// <inheritdoc />
    public partial class UpdateCard3 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Name",
                table: "BankCards",
                type: "nvarchar(100)",
                maxLength: 100,
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Name",
                table: "BankCards");
        }
    }
}
