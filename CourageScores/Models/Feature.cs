namespace CourageScores.Models;

public class Feature
{
    public Guid Id { get; }
    public string Name { get; }
    public string Description { get; }
    public string? DefaultValue { get; }
    public FeatureValueType ValueType { get; }

    public Feature(Guid id, string name, string description, FeatureValueType valueType, string? defaultValue, IDictionary<Guid, Feature> features)
    {
        Id = id;
        Name = name;
        Description = description;
        ValueType = valueType;
        DefaultValue = defaultValue;

        features.Add(id, this);
    }

    public enum FeatureValueType
    {
        Unknown,
        Boolean,
        Integer,
        Decimal,
        String,
        TimeSpan,
    }
}