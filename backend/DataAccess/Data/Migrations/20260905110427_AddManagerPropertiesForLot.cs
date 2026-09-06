using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DataAccess.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddManagerPropertiesForLot : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "InteriorColor",
                table: "CarSpecifications",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Location",
                table: "CarListings",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "RejectionReason",
                table: "CarListings",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "ReviewedAt",
                table: "CarListings",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "ReviewedById",
                table: "CarListings",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "ProfileImageUrl",
                table: "AspNetUsers",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_CarListings_ReviewedById",
                table: "CarListings",
                column: "ReviewedById");

            migrationBuilder.AddForeignKey(
                name: "FK_CarListings_AspNetUsers_ReviewedById",
                table: "CarListings",
                column: "ReviewedById",
                principalTable: "AspNetUsers",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_CarListings_AspNetUsers_ReviewedById",
                table: "CarListings");

            migrationBuilder.DropIndex(
                name: "IX_CarListings_ReviewedById",
                table: "CarListings");

            migrationBuilder.DropColumn(
                name: "InteriorColor",
                table: "CarSpecifications");

            migrationBuilder.DropColumn(
                name: "Location",
                table: "CarListings");

            migrationBuilder.DropColumn(
                name: "RejectionReason",
                table: "CarListings");

            migrationBuilder.DropColumn(
                name: "ReviewedAt",
                table: "CarListings");

            migrationBuilder.DropColumn(
                name: "ReviewedById",
                table: "CarListings");

            migrationBuilder.DropColumn(
                name: "ProfileImageUrl",
                table: "AspNetUsers");
        }
    }
}
