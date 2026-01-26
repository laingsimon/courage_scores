namespace CourageScores.Models.Dtos.RemoteControl;

public class RemoteControlDto
{
    public Guid Id { get; set; }
    public DateTime Created { get; set; }
    public DateTime? UrlUpdated { get; set; }
    public string? Url { get; set; }
}
