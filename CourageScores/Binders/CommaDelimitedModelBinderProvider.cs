using System.Diagnostics.CodeAnalysis;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace CourageScores.Binders;

/// <summary>
/// Copied from https://gist.github.com/copernicus365/74aff0b560b985f7d2b9c61a608c0a64
/// </summary>
[ExcludeFromCodeCoverage]
public class CommaDelimitedModelBinderProvider : IModelBinderProvider
{
    private static readonly CommaDelimitedModelBinder Binder = new CommaDelimitedModelBinder();

    public IModelBinder? GetBinder(ModelBinderProviderContext context)
    {
        return CommaDelimitedModelBinder.IsSupportedModelType(context.Metadata.ModelType)
            ? Binder
            : null;
    }
}