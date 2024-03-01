using CourageScores.Models.Cosmos;
using CourageScores.Repository;
using Moq;
using NUnit.Framework;

namespace CourageScores.Tests.Repository;

[TestFixture]
public class PhotoRepositoryTests
{
    private readonly CancellationToken _token = new CancellationToken();
    private PhotoRepository _repository = null!;
    private Mock<IGenericRepository<Photo>> _cosmosRepository = null!;
    private Mock<IBlobStorageRepository> _blobStorageRepository = null!;
    private Photo _photo = null!;
    private byte[]? _photoBytes;

    [SetUp]
    public void SetupEachTest()
    {
        _cosmosRepository = new Mock<IGenericRepository<Photo>>();
        _blobStorageRepository = new Mock<IBlobStorageRepository>();
        _repository = new PhotoRepository(_cosmosRepository.Object, _blobStorageRepository.Object);
        _photo = new Photo
        {
            Id = Guid.NewGuid(),
        };
        _photoBytes = new byte[] { 1, 2, 3, 4 };

        _cosmosRepository.Setup(r => r.Get(_photo.Id, _token)).ReturnsAsync(() => _photo);
        _cosmosRepository.Setup(r => r.Upsert(_photo, _token)).ReturnsAsync(() => _photo);
        _blobStorageRepository.Setup(r => r.Read(_photo.Id.ToString(), _token)).ReturnsAsync(() => _photoBytes);
    }

    [Test]
    public async Task Get_WhenPhotoNotFound_ReturnsNull()
    {
        var result = await _repository.Get(Guid.NewGuid(), _token);

        Assert.That(result, Is.Null);
    }

    [Test]
    public async Task Get_WhenPhotoFound_PopulatesPhotoBytes()
    {
        var result = await _repository.Get(_photo.Id, _token);

        Assert.That(result, Is.Not.Null);
        Assert.That(result!.PhotoBytes, Is.EqualTo(_photoBytes));
    }

    [Test]
    public async Task Get_WhenNoBytesFoundForPhoto_ReturnsPhotoWithEmptyBytes()
    {
        _photoBytes = null;

        var result = await _repository.Get(_photo.Id, _token);

        Assert.That(result, Is.Not.Null);
        Assert.That(result!.PhotoBytes, Is.Empty);
    }

    [Test]
    public async Task Upsert_WhenDeletedSet_UpsertsInCosmosAndDeletesFromBlobStorage()
    {
        _photo.Deleted = new DateTime(2001, 02, 03);

        var result = await _repository.Upsert(_photo, _token);

        _cosmosRepository.Verify(r => r.Upsert(_photo, _token));
        _blobStorageRepository.Verify(r => r.Delete(_photo.Id.ToString(), _token));
        Assert.That(result, Is.SameAs(_photo));
    }

    [Test]
    public async Task Upsert_WhenDeletedNotSet_UpsertsInCosmosAndWritesToBlobStorage()
    {
        _photo.Deleted = null;
        _photo.PhotoBytes = new byte[] { 5, 6, 7, 8 };

        var result = await _repository.Upsert(_photo, _token);

        _cosmosRepository.Verify(r => r.Upsert(_photo, _token));
        _blobStorageRepository.Verify(r => r.Write(_photo.Id.ToString(), new byte[] { 5, 6, 7, 8 }, _token));
        Assert.That(result, Is.SameAs(_photo));
    }
}