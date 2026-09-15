using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace DataAccess.Migrations
{
    public partial class AddConversationMessages : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ConversationMessages",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    ListingId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    SenderId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    RecipientId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Text = table.Column<string>(type: "nvarchar(2000)", maxLength: 2000, nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ReadAt = table.Column<DateTime>(type: "datetime2", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ConversationMessages", x => x.Id);
                    table.ForeignKey("FK_ConversationMessages_AspNetUsers_RecipientId", x => x.RecipientId, "AspNetUsers", "Id", onDelete: ReferentialAction.Restrict);
                    table.ForeignKey("FK_ConversationMessages_AspNetUsers_SenderId", x => x.SenderId, "AspNetUsers", "Id", onDelete: ReferentialAction.Restrict);
                    table.ForeignKey("FK_ConversationMessages_CarListings_ListingId", x => x.ListingId, "CarListings", "Id", onDelete: ReferentialAction.Cascade);
                });
            migrationBuilder.CreateIndex(name: "IX_ConversationMessages_ListingId_CreatedAt", table: "ConversationMessages", columns: new[] { "ListingId", "CreatedAt" });
            migrationBuilder.CreateIndex(name: "IX_ConversationMessages_RecipientId", table: "ConversationMessages", column: "RecipientId");
            migrationBuilder.CreateIndex(name: "IX_ConversationMessages_SenderId", table: "ConversationMessages", column: "SenderId");
        }

        protected override void Down(MigrationBuilder migrationBuilder) => migrationBuilder.DropTable(name: "ConversationMessages");
    }
}
