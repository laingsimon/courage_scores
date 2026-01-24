namespace CourageScores.Models.Cosmos.RemoteControl;

public class RemoteControl : CosmosEntity
{
    public DateTime Created { get; set; }
    public DateTime? UrlUpdated { get; set; }
    public string? Url { get; set; }
    public bool Deleted { get; set; }
    public string Pin { get; set; } = "";
}
