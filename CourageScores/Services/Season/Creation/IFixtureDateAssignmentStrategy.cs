namespace CourageScores.Services.Season.Creation;

public interface IFixtureDateAssignmentStrategy
{
    Task<bool> AssignDates(ProposalContext context, CancellationToken token);
}