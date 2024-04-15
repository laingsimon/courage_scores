using CourageScores.Models;

namespace CourageScores.Repository;

public interface IFeatureLookup
{
    IEnumerable<Feature> GetAll();
    Feature? Get(Guid id);
}