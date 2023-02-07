namespace DataImport.Importers;

public class ImportRecordResult
{
    public bool Success { get; }
    public string? Message { get; }

    public ImportRecordResult(bool success, string? message = null)
    {
        Success = success;
        Message = message;
    }
}