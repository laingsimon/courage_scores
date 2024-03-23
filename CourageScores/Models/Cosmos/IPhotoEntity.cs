namespace CourageScores.Models.Cosmos;

public interface IPhotoEntity
{
    Guid Id { get; } // the entity will likely extend CosmosEntity which will provide the id
    List<PhotoReference> Photos { get; set; }
}