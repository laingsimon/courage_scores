namespace CourageScores.StubCosmos.Tests.Api;

internal record TestRecord
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public string? Name { get; set; }
    public string? Email { get; set; }

    public int? Age { get; set; }
    public int? ShoeSize { get; set; }

    public double? Weight { get; set; }
    public double? Height { get; set; }

    public bool? Married { get; set; }
    public bool? Retired { get; set; }

    public Guid? PatientId { get; set; }
    public Guid? UserId { get; set; }

    public string? AlwaysNull { get; set; }

    public object? NonParseableType { get; set; }
}
