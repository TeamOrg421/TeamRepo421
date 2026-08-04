using AutoMapper;
using BusinessLogic.DTOs;
using DataAccess.Entities;

namespace Api.Mappings
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            // ==================== CAR MAPPINGS ====================
            CreateMap<Car, CarDto>()
                .ForMember(dest => dest.ModelName, opt => opt.MapFrom(src => src.Model != null ? src.Model.Name : string.Empty))
                .ForMember(dest => dest.BrandName, opt => opt.MapFrom(src => src.Model != null && src.Model.Brand != null ? src.Model.Brand.Name : string.Empty));
            CreateMap<CreateCarDto, Car>();
            CreateMap<UpdateCarDto, Car>();
            CreateMap<Car, CarListItemDto>();
            CreateMap<Car, CarDetailDto>();

            // ==================== CAR BRAND MAPPINGS ====================
            CreateMap<CarBrand, CarBrandDto>();
            CreateMap<CreateCarBrandDto, CarBrand>();
            CreateMap<UpdateCarBrandDto, CarBrand>();
            CreateMap<CarBrand, BrandWithModelsDto>();

            // ==================== CAR MODEL MAPPINGS ====================
            CreateMap<CarModel, CarModelDto>();
            CreateMap<CreateCarModelDto, CarModel>();
            CreateMap<UpdateCarModelDto, CarModel>();

            // ==================== CAR SPECIFICATION MAPPINGS ====================
            CreateMap<CarSpecification, CarSpecificationDto>();
            CreateMap<CreateCarSpecificationDto, CarSpecification>();
            CreateMap<UpdateCarSpecificationDto, CarSpecification>();

            // ==================== CAR IMAGE MAPPINGS ====================
            CreateMap<CarImage, CarImageDto>();
            CreateMap<CreateCarImageDto, CarImage>();
            CreateMap<UpdateCarImageDto, CarImage>();

            // ==================== AUCTION LOT MAPPINGS ====================
            CreateMap<AuctionLot, AuctionLotDto>();
            CreateMap<CreateAuctionLotDto, AuctionLot>();
            CreateMap<UpdateAuctionLotDto, AuctionLot>();
            CreateMap<UpdateAuctionLotStatusDto, AuctionLot>();
            CreateMap<AuctionLot, AuctionLotDetailsDto>();

            // ==================== AUCTION WINNER MAPPINGS ====================
            CreateMap<AuctionWinner, AuctionWinnerDto>();
            CreateMap<CreateAuctionWinnerDto, AuctionWinner>();

            // ==================== BID MAPPINGS ====================
            CreateMap<Bid, BidDto>();
            CreateMap<CreateBidDto, Bid>();
            CreateMap<Bid, CarBidDto>();

            // ==================== COMMENT MAPPINGS ====================
            CreateMap<Comment, CommentDto>();
            CreateMap<CreateCommentDto, Comment>();
            CreateMap<UpdateCommentDto, Comment>();
            CreateMap<Comment, CarCommentDto>();

            // ==================== FAVORITE MAPPINGS ====================
            CreateMap<Favorite, FavoriteDto>();
            CreateMap<CreateFavoriteDto, Favorite>();

            // ==================== NOTIFICATION MAPPINGS ====================
            CreateMap<Notification, NotificationDto>();
            CreateMap<CreateNotificationDto, Notification>();
            CreateMap<UpdateNotificationDto, Notification>();

            // ==================== MODERATION LOG MAPPINGS ====================
            CreateMap<ModerationLog, ModerationLogDto>();
            CreateMap<CreateModerationLogDto, ModerationLog>();

            // ==================== BANK CARD MAPPINGS ====================
            CreateMap<BankCard, BankCardDto>();
            CreateMap<CreateBankCardDto, BankCard>();
            CreateMap<UpdateBankCardDto, BankCard>();

            // ==================== VEHICLE HISTORY MAPPINGS ====================
            CreateMap<VehicleHistory, VehicleHistoryDto>();
            CreateMap<CreateVehicleHistoryDto, VehicleHistory>();
            CreateMap<UpdateVehicleHistoryDto, VehicleHistory>();
        }
    }
}
