using AutoMapper;
using BusinessLogic.DTOs;
using DataAccess.Entities;
using DataAccess.Entities.Enums;

namespace Api.Mappings
{
    public class MappingProfile : Profile
    {
        public MappingProfile()
        {
            CreateMap<Car, CarDto>()
                .ForMember(
                    d => d.ListingId,
                    o => o.MapFrom(s =>
                        s.Listings == null
                            ? (Guid?)null
                            : s.Listings
                                .Where(x => x.Status == ListingStatus.Active)
                                .Select(x => (Guid?)x.Id)
                                .FirstOrDefault()))
                .ForMember(
                    d => d.CurrentBid,
                    o => o.MapFrom(s =>
                        s.Listings == null
                            ? 0
                            : s.Listings
                                .Where(x => x.Status == ListingStatus.Active)
                                .Select(x => x.CurrentPrice)
                                .FirstOrDefault()))
                .ForMember(dest => dest.ModelName, opt => opt.MapFrom(src => src.Model != null ? src.Model.Name : string.Empty))
                .ForMember(dest => dest.BrandName, opt => opt.MapFrom(src => src.Model != null && src.Model.Brand != null ? src.Model.Brand.Name : string.Empty));
            CreateMap<CreateCarDto, Car>();
            CreateMap<UpdateCarDto, Car>();
            CreateMap<Car, CarListItemDto>();
            CreateMap<Car, CarDetailDto>();

            CreateMap<CarBrand, CarBrandDto>();
            CreateMap<CreateCarBrandDto, CarBrand>();
            CreateMap<UpdateCarBrandDto, CarBrand>();
            CreateMap<CarBrand, BrandWithModelsDto>();

            CreateMap<CarModel, CarModelDto>()
                .ForMember(dest => dest.BrandName, opt => opt.MapFrom(src => src.Brand != null ? src.Brand.Name : string.Empty));
            CreateMap<CreateCarModelDto, CarModel>();
            CreateMap<UpdateCarModelDto, CarModel>();

            CreateMap<CarSpecification, CarSpecificationDto>();
            CreateMap<CreateCarSpecificationDto, CarSpecification>();
            CreateMap<UpdateCarSpecificationDto, CarSpecification>();

            CreateMap<CarImage, CarImageDto>();
            CreateMap<CreateCarImageDto, CarImage>();
            CreateMap<UpdateCarImageDto, CarImage>();

            CreateMap<AuctionLot, AuctionLotDto>();
            CreateMap<CreateAuctionLotDto, AuctionLot>();
            CreateMap<UpdateAuctionLotDto, AuctionLot>();
            CreateMap<UpdateAuctionLotStatusDto, AuctionLot>();
            CreateMap<AuctionLot, AuctionLotDetailsDto>();

            CreateMap<AuctionWinner, AuctionWinnerDto>();
            CreateMap<CreateAuctionWinnerDto, AuctionWinner>();

            CreateMap<Bid, BidDto>();
            CreateMap<CreateBidDto, Bid>();
            CreateMap<Bid, CarBidDto>();

            CreateMap<Comment, CommentDto>();
            CreateMap<CreateCommentDto, Comment>();
            CreateMap<UpdateCommentDto, Comment>();
            CreateMap<Comment, CarCommentDto>();

            CreateMap<Favorite, FavoriteDto>();
            CreateMap<CreateFavoriteDto, Favorite>();

            CreateMap<Notification, NotificationDto>();
            CreateMap<CreateNotificationDto, Notification>();
            CreateMap<UpdateNotificationDto, Notification>();

            CreateMap<ModerationLog, ModerationLogDto>();
            CreateMap<CreateModerationLogDto, ModerationLog>();

            CreateMap<BankCard, BankCardDto>();
            CreateMap<CreateBankCardDto, BankCard>();
            CreateMap<UpdateBankCardDto, BankCard>();

            CreateMap<VehicleHistory, VehicleHistoryDto>();
            CreateMap<CreateVehicleHistoryDto, VehicleHistory>();
            CreateMap<UpdateVehicleHistoryDto, VehicleHistory>();
        }
    }
}
