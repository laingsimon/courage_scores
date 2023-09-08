using CourageScores.Models.Adapters;
using CourageScores.Models.Cosmos;
using CourageScores.Models.Dtos;
using NUnit.Framework;

namespace CourageScores.Tests.Models.Adapters;

[TestFixture]
public class AuditExtensionsTests
{
    [Test]
    public void AddAuditProperties_GivenANewDto_AcceptsNoProperties()
    {
        var dto = new Dto();
        var model = new Model();

        model.AddAuditProperties(dto);

        Assert.That(model.Author, Is.Null);
        Assert.That(model.Created, Is.EqualTo(default(DateTime)));
        Assert.That(model.Editor, Is.Null);
        Assert.That(model.Updated, Is.EqualTo(default(DateTime)));
        Assert.That(model.Remover, Is.Null);
        Assert.That(model.Deleted, Is.Null);
    }

    [Test]
    public void AddAuditProperties_GivenAnExistingDto_SetsAuthorProperties()
    {
        var dto = new Dto
        {
            Created = new DateTime(2001, 02, 03),
            Author = "Simon",
        };
        var model = new Model();

        model.AddAuditProperties(dto);

        Assert.That(model.Author, Is.EqualTo("Simon"));
        Assert.That(model.Created, Is.EqualTo(new DateTime(2001, 02, 03)));
        Assert.That(model.Editor, Is.Null);
        Assert.That(model.Updated, Is.EqualTo(default(DateTime)));
        Assert.That(model.Remover, Is.Null);
        Assert.That(model.Deleted, Is.Null);
    }

    [Test]
    public void AddAuditProperties_GivenAnEditedDto_SetsEditorProperties()
    {
        var dto = new Dto
        {
            Created = new DateTime(2001, 02, 03),
            Author = "Simon",
            Updated = new DateTime(2002, 03, 04),
            Editor = "James",
        };
        var model = new Model();

        model.AddAuditProperties(dto);

        Assert.That(model.Author, Is.EqualTo("Simon"));
        Assert.That(model.Created, Is.EqualTo(new DateTime(2001, 02, 03)));
        Assert.That(model.Editor, Is.EqualTo("James"));
        Assert.That(model.Updated, Is.EqualTo(new DateTime(2002, 03, 04)));
        Assert.That(model.Remover, Is.Null);
        Assert.That(model.Deleted, Is.Null);
    }

    [Test]
    public void AddAuditProperties_GivenADeletedDto_SetsDeletedProperties()
    {
        var dto = new Dto
        {
            Created = new DateTime(2001, 02, 03),
            Author = "Simon",
            Updated = new DateTime(2002, 03, 04),
            Editor = "James",
            Deleted = new DateTime(2003, 04, 05),
            Remover = "Janet",
        };
        var model = new Model();

        model.AddAuditProperties(dto);

        Assert.That(model.Author, Is.EqualTo("Simon"));
        Assert.That(model.Created, Is.EqualTo(new DateTime(2001, 02, 03)));
        Assert.That(model.Editor, Is.EqualTo("James"));
        Assert.That(model.Updated, Is.EqualTo(new DateTime(2002, 03, 04)));
        Assert.That(model.Remover, Is.EqualTo("Janet"));
        Assert.That(model.Deleted, Is.EqualTo(new DateTime(2003, 04, 05)));
    }

    [Test]
    public void AddAuditProperties_GivenAModel_CopiesAllProperties()
    {
        var model = new Model
        {
            Created = new DateTime(2001, 02, 03),
            Author = "Simon",
            Updated = new DateTime(2002, 03, 04),
            Editor = "James",
            Deleted = new DateTime(2003, 04, 05),
            Remover = "Janet",
        };
        var dto = new Dto();

        dto.AddAuditProperties(model);

        Assert.That(model.Author, Is.EqualTo("Simon"));
        Assert.That(model.Created, Is.EqualTo(new DateTime(2001, 02, 03)));
        Assert.That(model.Editor, Is.EqualTo("James"));
        Assert.That(model.Updated, Is.EqualTo(new DateTime(2002, 03, 04)));
        Assert.That(model.Remover, Is.EqualTo("Janet"));
        Assert.That(model.Deleted, Is.EqualTo(new DateTime(2003, 04, 05)));
    }

    private class Model : AuditedEntity
    {
    }

    private class Dto : AuditedDto
    {
    }
}