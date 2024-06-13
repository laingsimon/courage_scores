using System.Collections;
using CourageScores.Binders;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.ModelBinding;
using Microsoft.AspNetCore.Mvc.ModelBinding.Validation;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Binders;

[TestFixture]
public class CommaDelimitedModelBinderTest
{
    private CommaDelimitedModelBinder _binder = null!;

    [SetUp]
    public void SetupEachTest()
    {
        _binder = new CommaDelimitedModelBinder();
    }

    [Test]
    public async Task BindModelAsync_GivenStringProperty_DoesNotBindProperty()
    {
        var bindingContext = BindingContext<string>();

        await _binder.BindModelAsync(bindingContext);

        Assert.That(bindingContext.Result.IsModelSet, Is.False);
        Assert.That(bindingContext.Result.Model, Is.Null);
    }

    [Test]
    public async Task BindModelAsync_GivenNonGenericIEnumerableProperty_DoesNotBindProperty()
    {
        var bindingContext = BindingContext<IEnumerable>();

        await _binder.BindModelAsync(bindingContext);

        Assert.That(bindingContext.Result.IsModelSet, Is.False);
        Assert.That(bindingContext.Result.Model, Is.Null);
    }

    [Test]
    public async Task BindModelAsync_WhenUnableToGetValue_DoesNotBindProperty()
    {
        var bindingContext = BindingContext<IEnumerable<string>>();

        await _binder.BindModelAsync(bindingContext);

        Assert.That(bindingContext.Result.IsModelSet, Is.False);
        Assert.That(bindingContext.Result.Model, Is.Null);
    }

    [Test]
    public async Task BindModelAsync_GivenIEnumerableProperty_BindsProperty()
    {
        var bindingContext = BindingContext<IEnumerable<string>>("abc");

        await _binder.BindModelAsync(bindingContext);

        Assert.That(bindingContext.Result.IsModelSet, Is.True);
        Assert.That(bindingContext.Result.Model, Is.EqualTo(new[] { "abc" }));
    }

    [Test]
    public async Task BindModelAsync_GivenListProperty_BindsProperty()
    {
        var bindingContext = BindingContext<List<string>>("abc");

        await _binder.BindModelAsync(bindingContext);

        Assert.That(bindingContext.Result.IsModelSet, Is.True);
        Assert.That(bindingContext.Result.Model, Is.TypeOf<List<string>>());
        Assert.That(bindingContext.Result.Model, Is.EqualTo(new[] { "abc" }));
    }

    [Test]
    public async Task BindModelAsync_GivenIReadOnlyCollectionProperty_BindsProperty()
    {
        var bindingContext = BindingContext<IReadOnlyCollection<string>>("abc");

        await _binder.BindModelAsync(bindingContext);

        Assert.That(bindingContext.Result.IsModelSet, Is.True);
        Assert.That(bindingContext.Result.Model, Is.TypeOf<string[]>());
        Assert.That(bindingContext.Result.Model, Is.EqualTo(new[] { "abc" }));
    }

    [Test]
    public async Task BindModelAsync_GivenArrayProperty_BindsProperty()
    {
        var bindingContext = BindingContext<string[]>("abc");

        await _binder.BindModelAsync(bindingContext);

        Assert.That(bindingContext.Result.IsModelSet, Is.True);
        Assert.That(bindingContext.Result.Model, Is.TypeOf<string[]>());
        Assert.That(bindingContext.Result.Model, Is.EqualTo(new[] { "abc" }));
    }

    [Test]
    public async Task BindModelAsync_GivenHashSetProperty_BindsProperty()
    {
        var bindingContext = BindingContext<HashSet<string>>("abc");

        await _binder.BindModelAsync(bindingContext);

        Assert.That(bindingContext.Result.IsModelSet, Is.True);
        Assert.That(bindingContext.Result.Model, Is.TypeOf<HashSet<string>>());
        Assert.That(bindingContext.Result.Model, Is.EqualTo(new[] { "abc" }));
    }

    [Test]
    public async Task BindModelAsync_GivenTrailingComma_BindsOnlyFirstValue()
    {
        var bindingContext = BindingContext<List<string>>("abc,");

        await _binder.BindModelAsync(bindingContext);

        Assert.That(bindingContext.Result.IsModelSet, Is.True);
        Assert.That(bindingContext.Result.Model, Is.EqualTo(new[] { "abc" }));
    }

    [Test]
    public async Task BindModelAsync_GivenOnlyComma_BindsNoValues()
    {
        var bindingContext = BindingContext<List<string>>(",");

        await _binder.BindModelAsync(bindingContext);

        Assert.That(bindingContext.Result.IsModelSet, Is.True);
        Assert.That(bindingContext.Result.Model, Is.Empty);
    }

    [Test]
    public async Task BindModelAsync_GivenEmptyString_BindsNoValues()
    {
        var bindingContext = BindingContext<List<string>>("");

        await _binder.BindModelAsync(bindingContext);

        Assert.That(bindingContext.Result.IsModelSet, Is.True);
        Assert.That(bindingContext.Result.Model, Is.Empty);
    }

    [Test]
    public async Task BindModelAsync_GivenWhiteSpaceOnly_BindsNoValues()
    {
        var bindingContext = BindingContext<List<string>>("  ");

        await _binder.BindModelAsync(bindingContext);

        Assert.That(bindingContext.Result.IsModelSet, Is.True);
        Assert.That(bindingContext.Result.Model, Is.Empty);
    }

    [Test]
    public async Task BindModelAsync_GivenMultipleValues_BindsMultipleValues()
    {
        var bindingContext = BindingContext<List<string>>("abc,def");

        await _binder.BindModelAsync(bindingContext);

        Assert.That(bindingContext.Result.IsModelSet, Is.True);
        Assert.That(bindingContext.Result.Model, Is.EqualTo(new[] { "abc", "def" }));
    }

    [Test]
    public async Task BindModelAsync_GivenEmptyValueBetweenCommas_ExcludesEmptyValue()
    {
        var bindingContext = BindingContext<List<string>>("abc,,def");

        await _binder.BindModelAsync(bindingContext);

        Assert.That(bindingContext.Result.IsModelSet, Is.True);
        Assert.That(bindingContext.Result.Model, Is.EqualTo(new[] { "abc", "def" }));
    }

    [TestCase(typeof(int), "1,2", new[] { 1, 2 })]
    [TestCase(typeof(long), "3,4", new long[] { 3, 4 })]
    [TestCase(typeof(short), "5,6", new short[] { 5, 6 })]
    [TestCase(typeof(byte), "7,8", new byte[] { 7, 8 })]
    [TestCase(typeof(uint), "9,10", new uint[] { 9, 10 })]
    [TestCase(typeof(ulong), "11,12", new ulong[] { 11, 12 })]
    [TestCase(typeof(ushort), "13,14", new ushort[] { 13, 14 })]
    public async Task BindModelAsync_GivenSupportedPrimitiveType_BindsValues(Type elementType, string value, IEnumerable expected)
    {
        var tester = CreateTypedTester(elementType);

        await tester.RunTest(value, expected);
    }

    [Test]
    public async Task BindModelAsync_GivenGuidElementType_BindsValues()
    {
        var tester = new TypedTester<Guid>(_binder);

        await tester.RunTest(
            "cdc7f4f5-79b3-4ff4-be09-07b6a2ecf444,1915e870-6337-427d-9fcb-17eeff44038c",
            new[]
            {
                Guid.Parse("cdc7f4f5-79b3-4ff4-be09-07b6a2ecf444"),
                Guid.Parse("1915e870-6337-427d-9fcb-17eeff44038c"),
            });
    }

    [TestCase(typeof(List<string>), false)]
    [TestCase(typeof(List<Guid>), true)]
    [TestCase(typeof(List<int>), true)]
    [TestCase(typeof(IReadOnlyCollection<string>), false)]
    [TestCase(typeof(IReadOnlyCollection<object>), false)]
    [TestCase(typeof(IReadOnlyCollection<Guid>), true)]
    [TestCase(typeof(IReadOnlyCollection<int>), true)]
    [TestCase(typeof(IEnumerable<string>), false)]
    [TestCase(typeof(IEnumerable<object>), false)]
    [TestCase(typeof(IEnumerable<Guid>), true)]
    [TestCase(typeof(IEnumerable<int>), true)]
    [TestCase(typeof(string[]), false)]
    [TestCase(typeof(object[]), false)]
    [TestCase(typeof(Guid[]), true)]
    [TestCase(typeof(int[]), true)]
    [TestCase(typeof(string), false)]
    [TestCase(typeof(int), false)]
    [TestCase(typeof(Guid), false)]
    public void IsSupportedModelType_GivenModelTypes_ReturnsCorrectly(Type modelType, bool expected)
    {
        var isSupported = CommaDelimitedModelBinder.IsSupportedModelType(modelType);

        Assert.That(isSupported, Is.EqualTo(expected));
    }

    private interface ITypedTester
    {
        Task RunTest(string value, IEnumerable expected);
    }

    private class TypedTester<T> : ITypedTester
    {
        private readonly CommaDelimitedModelBinder _modelBinder;

        public TypedTester(CommaDelimitedModelBinder modelBinder)
        {
            _modelBinder = modelBinder;
        }

        public async Task RunTest(string value, IEnumerable expected)
        {
            var bindingContext = BindingContext<List<T>>(value);

            await _modelBinder.BindModelAsync(bindingContext);

            Assert.That(bindingContext.Result.IsModelSet, Is.True);
            Assert.That(bindingContext.Result.Model, Is.EqualTo(expected));
        }
    }

    private class MockModelBindingContext<T> : ModelBindingContext
    {
        public override string ModelName { get; set; } = null!;
        public override ModelBindingResult Result { get; set; }
        public override IValueProvider ValueProvider { get; set; } = null!;

        public override Type ModelType => typeof(T);

        #region unused members
#pragma warning disable CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.
        public override ActionContext ActionContext { get; set; }
        public override string? BinderModelName { get; set; }
        public override BindingSource? BindingSource { get; set; }
        public override string FieldName { get; set; }
        public override bool IsTopLevelObject { get; set; }
        public override object? Model { get; set; }
        public override ModelMetadata ModelMetadata { get; set; }
        public override ModelStateDictionary ModelState { get; set; }
        public override Func<ModelMetadata, bool>? PropertyFilter { get; set; }
        public override ValidationStateDictionary ValidationState { get; set; }
#pragma warning restore CS8618 // Non-nullable field must contain a non-null value when exiting constructor. Consider declaring as nullable.

        public override NestedScope EnterNestedScope(ModelMetadata modelMetadata, string fieldName, string modelName, object? model)
        {
            throw new NotSupportedException();
        }
        public override NestedScope EnterNestedScope()
        {
            throw new NotSupportedException();
        }
        protected override void ExitNestedScope()
        {
            throw new NotSupportedException();
        }
        #endregion
    }

    private static ModelBindingContext BindingContext<T>(string? value = null)
    {
        const string modelName = "MODEL NAME";
        var valueProvider = new Mock<IValueProvider>();
        valueProvider
            .Setup(p => p.GetValue(modelName))
            .Returns(value != null
                ? new ValueProviderResult(value)
                : ValueProviderResult.None);

        return new MockModelBindingContext<T>
        {
            ModelName = modelName,
            ValueProvider = valueProvider.Object,
            Result = ModelBindingResult.Failed(),
        };
    }

    private ITypedTester CreateTypedTester(Type elementType)
    {
        var typedTesterType = typeof(TypedTester<>).MakeGenericType(elementType);
        return (ITypedTester)Activator.CreateInstance(typedTesterType, _binder)!;
    }

}