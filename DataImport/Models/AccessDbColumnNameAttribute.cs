namespace DataImport.Models;

public class AccessDbColumnNameAttribute : Attribute
{
    public string Name { get; }

    public AccessDbColumnNameAttribute(string name)
    {
        Name = name;
    }
}