namespace CourageScores.Services.Season.Creation;

public interface IAddressAssignmentStrategy
{
    Task<bool> AssignAddresses(ProposalContext context, CancellationToken token);
}