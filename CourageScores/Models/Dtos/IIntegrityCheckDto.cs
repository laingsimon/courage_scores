namespace CourageScores.Models.Dtos;

public interface IIntegrityCheckDto
{
    /// <summary>
    /// Token to ensure this update doesn't overwrite any previous updates since the last reload
    /// </summary>
    DateTime? LastUpdated { get; set; }
}