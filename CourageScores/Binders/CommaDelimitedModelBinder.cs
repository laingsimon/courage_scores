using System.Collections;
using System.ComponentModel;
using Microsoft.AspNetCore.Mvc.ModelBinding;

namespace CourageScores.Binders;

/// <summary>
/// Adapted from https://gist.github.com/copernicus365/74aff0b560b985f7d2b9c61a608c0a64
/// </summary>
public class CommaDelimitedModelBinder : IModelBinder
{
    private static readonly Dictionary<Type, IModelBinder> TypedModelBinderCache = new Dictionary<Type, IModelBinder>();

    private static readonly Type[] SupportedElementTypes = {
        typeof(int), typeof(long), typeof(short), typeof(byte),
        typeof(uint), typeof(ulong), typeof(ushort), typeof(Guid),
    };

    public async Task BindModelAsync(ModelBindingContext bindingContext)
    {
        var elementType = GetElementType(bindingContext.ModelType);
        if (elementType == null)
        {
            return;
        }

        if (!TypedModelBinderCache.TryGetValue(elementType, out var typedModelBinder))
        {
            var typedModelBinderType = typeof(TypedModelBinder<>).MakeGenericType(elementType);
            typedModelBinder = (IModelBinder)Activator.CreateInstance(typedModelBinderType)!;
            TypedModelBinderCache.Add(elementType, typedModelBinder);
        }

        await typedModelBinder.BindModelAsync(bindingContext);
    }

    public static bool IsSupportedModelType(Type modelType)
    {
        var elementType = GetElementType(modelType);
        return elementType != null && SupportedElementTypes.Contains(elementType);
    }

    private static Type? GetElementType(Type modelType)
    {
        if (modelType != typeof(string) && modelType.IsAssignableTo(typeof(IEnumerable)))
        {
            if (modelType.GetGenericArguments().Length == 1)
            {
                return modelType.GetGenericArguments()[0];
            }

            var elementType = modelType.GetElementType();
            if (elementType != null)
            {
                return elementType;
            }
        }

        return null;
    }

    private class TypedModelBinder<T> : IModelBinder
    {
        private readonly TypeConverter _converter = TypeDescriptor.GetConverter(typeof(T));

        public Task BindModelAsync(ModelBindingContext bindingContext)
        {
            var providerValue = bindingContext.ValueProvider.GetValue(bindingContext.ModelName);

            if (providerValue == ValueProviderResult.None)
            {
                return Task.CompletedTask;
            }

            var values = providerValue.Values.SelectMany(s => s.Trim().Split(',', StringSplitOptions.RemoveEmptyEntries)).ToList();

            if (bindingContext.ModelType == typeof(List<T>))
            {
                bindingContext.Result = ModelBindingResult.Success(ParseValues(values).ToList());
            }
            else if (bindingContext.ModelType == typeof(T[]) || bindingContext.ModelType == typeof(IEnumerable<T>) || bindingContext.ModelType == typeof(IReadOnlyCollection<T>))
            {
                bindingContext.Result = ModelBindingResult.Success(ParseValues(values).ToArray());
            }

            return Task.CompletedTask;
        }

        private IEnumerable<T?> ParseValues(IReadOnlyCollection<string> sourceArray)
        {
            foreach (var str in sourceArray)
            {
                yield return (T?)_converter.ConvertFromString(str);
            }
        }
    }
}