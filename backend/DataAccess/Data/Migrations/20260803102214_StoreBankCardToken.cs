using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DataAccess.Data.Migrations
{
    /// <inheritdoc />
    public partial class StoreBankCardToken : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "CardNumber",
                table: "BankCards");

            migrationBuilder.AddColumn<Guid>(
                name: "BankCardToken",
                table: "BankCards",
                type: "uniqueidentifier",
                nullable: false,
                defaultValueSql: "NEWID()");

            migrationBuilder.AddColumn<string>(
                name: "MaskedCardNumber",
                table: "BankCards",
                type: "nvarchar(19)",
                maxLength: 19,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateIndex(
                name: "IX_BankCards_BankCardToken",
                table: "BankCards",
                column: "BankCardToken",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_BankCards_BankCardToken",
                table: "BankCards");

            migrationBuilder.DropColumn(
                name: "BankCardToken",
                table: "BankCards");

            migrationBuilder.DropColumn(
                name: "MaskedCardNumber",
                table: "BankCards");

            migrationBuilder.AddColumn<string>(
                name: "CardNumber",
                table: "BankCards",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");
        }
    }
}
