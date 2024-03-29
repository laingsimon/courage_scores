﻿using CourageScores.Models.Cosmos.Identity;

namespace CourageScores.Repository.Identity;

public interface IUserRepository
{
    Task<User?> GetUser(string emailAddress);
    Task<User> UpsertUser(User user);
    IAsyncEnumerable<User> GetAll();
}