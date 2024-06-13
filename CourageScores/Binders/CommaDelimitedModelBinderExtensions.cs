using System.Diagnostics.CodeAnalysis;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding.Binders;

namespace CourageScores.Binders;

/// <summary>
/// Copied from https://gist.github.com/copernicus365/74aff0b560b985f7d2b9c61a608c0a64
/// </summary>
[ExcludeFromCodeCoverage]
public static class CommaDelimitedModelBinderExtensions
{
	public static void AddCommaSeparatedArrayModelBinderProvider(this MvcOptions options)
	{
		var providerToInsert = new CommaDelimitedModelBinderProvider();

		// Find the location of SimpleTypeModelBinder, the CommaDelimitedModelBinder must be inserted before it.
		var index = options.ModelBinderProviders.FirstIndexOfOrDefault(i => i is SimpleTypeModelBinderProvider);

		if (index != null)
		{
			options.ModelBinderProviders.Insert(index.Value, providerToInsert);
		}
		else
		{
			options.ModelBinderProviders.Add(providerToInsert);
		}
	}

	private static int? FirstIndexOfOrDefault<T>(this IEnumerable<T> source, Func<T, bool> predicate)
	{
		var result = 0;

		foreach (var item in source)
		{
			if (predicate(item))
			{
				return result;
			}

			result++;
		}

		return null;
	}
}
