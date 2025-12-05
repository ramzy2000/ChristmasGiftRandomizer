using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Xunit;
using ChristmasGiftRandomizer.Data;
using ChristmasGiftRandomizer.Models;
using ChristmasGiftRandomizer.Services;

namespace ChristmasGiftRandomizer.Tests.Services;

public class MatchingServiceTests
{
    private ApplicationDbContext GetInMemoryDbContext()
    {
        var options = new DbContextOptionsBuilder<ApplicationDbContext>()
            .UseInMemoryDatabase(databaseName: Guid.NewGuid().ToString())
            .Options;

        return new ApplicationDbContext(options);
    }

    private ILogger<MatchingService> GetLogger()
    {
        return new LoggerFactory().CreateLogger<MatchingService>();
    }

    [Fact]
    public async Task GenerateMatches_WithEvenNumberOfParticipants_ShouldSucceed()
    {
        // Arrange
        using var context = GetInMemoryDbContext();
        var logger = GetLogger();
        var service = new MatchingService(context, logger);

        var group = new Group
        {
            Id = Guid.NewGuid(),
            Name = "Test Group",
            OrganizerId = "user1",
            CreatedAt = DateTime.UtcNow
        };
        context.Groups.Add(group);

        var participants = new List<Participant>
        {
            new() { Id = Guid.NewGuid(), GroupId = group.Id, Name = "Alice", Email = "alice@test.com" },
            new() { Id = Guid.NewGuid(), GroupId = group.Id, Name = "Bob", Email = "bob@test.com" },
            new() { Id = Guid.NewGuid(), GroupId = group.Id, Name = "Charlie", Email = "charlie@test.com" },
            new() { Id = Guid.NewGuid(), GroupId = group.Id, Name = "Diana", Email = "diana@test.com" }
        };
        context.Participants.AddRange(participants);
        await context.SaveChangesAsync();

        var exchange = new Exchange
        {
            Id = Guid.NewGuid(),
            GroupId = group.Id,
            Year = 2025,
            Name = "Test Exchange",
            Status = ExchangeStatus.Draft,
            CreatedAt = DateTime.UtcNow
        };
        context.Exchanges.Add(exchange);

        var exchangeParticipants = participants.Select(p => new ExchangeParticipant
        {
            Id = Guid.NewGuid(),
            ExchangeId = exchange.Id,
            ParticipantId = p.Id
        }).ToList();
        context.ExchangeParticipants.AddRange(exchangeParticipants);
        await context.SaveChangesAsync();

        // Act
        var result = await service.GenerateMatchesAsync(exchange, CancellationToken.None);

        // Assert
        Assert.True(result.Success);
        Assert.NotNull(result.Assignments);
        Assert.Equal(4, result.Assignments.Count);
        Assert.All(result.Assignments, a => Assert.NotEqual(a.GiverId, a.ReceiverId)); // No self-assignments
    }

    [Fact]
    public async Task GenerateMatches_WithOddNumberOfParticipants_ShouldHandleGracefully()
    {
        // Arrange
        using var context = GetInMemoryDbContext();
        var logger = GetLogger();
        var service = new MatchingService(context, logger);

        var group = new Group
        {
            Id = Guid.NewGuid(),
            Name = "Test Group",
            OrganizerId = "user1",
            CreatedAt = DateTime.UtcNow
        };
        context.Groups.Add(group);

        var participants = new List<Participant>
        {
            new() { Id = Guid.NewGuid(), GroupId = group.Id, Name = "Alice", Email = "alice@test.com" },
            new() { Id = Guid.NewGuid(), GroupId = group.Id, Name = "Bob", Email = "bob@test.com" },
            new() { Id = Guid.NewGuid(), GroupId = group.Id, Name = "Charlie", Email = "charlie@test.com" }
        };
        context.Participants.AddRange(participants);
        await context.SaveChangesAsync();

        var exchange = new Exchange
        {
            Id = Guid.NewGuid(),
            GroupId = group.Id,
            Year = 2025,
            Name = "Test Exchange",
            Status = ExchangeStatus.Draft,
            CreatedAt = DateTime.UtcNow
        };
        context.Exchanges.Add(exchange);

        var exchangeParticipants = participants.Select(p => new ExchangeParticipant
        {
            Id = Guid.NewGuid(),
            ExchangeId = exchange.Id,
            ParticipantId = p.Id
        }).ToList();
        context.ExchangeParticipants.AddRange(exchangeParticipants);
        await context.SaveChangesAsync();

        // Act
        var result = await service.GenerateMatchesAsync(exchange, CancellationToken.None);

        // Assert
        Assert.True(result.Success);
        Assert.NotNull(result.Assignments);
        Assert.Equal(3, result.Assignments.Count);
    }

    [Fact]
    public async Task GenerateMatches_WithRestrictions_ShouldRespectRestrictions()
    {
        // Arrange
        using var context = GetInMemoryDbContext();
        var logger = GetLogger();
        var service = new MatchingService(context, logger);

        var group = new Group
        {
            Id = Guid.NewGuid(),
            Name = "Test Group",
            OrganizerId = "user1",
            CreatedAt = DateTime.UtcNow
        };
        context.Groups.Add(group);

        var participants = new List<Participant>
        {
            new() { Id = Guid.NewGuid(), GroupId = group.Id, Name = "Alice", Email = "alice@test.com" },
            new() { Id = Guid.NewGuid(), GroupId = group.Id, Name = "Bob", Email = "bob@test.com" },
            new() { Id = Guid.NewGuid(), GroupId = group.Id, Name = "Charlie", Email = "charlie@test.com" },
            new() { Id = Guid.NewGuid(), GroupId = group.Id, Name = "Diana", Email = "diana@test.com" }
        };
        context.Participants.AddRange(participants);
        await context.SaveChangesAsync();

        var exchange = new Exchange
        {
            Id = Guid.NewGuid(),
            GroupId = group.Id,
            Year = 2025,
            Name = "Test Exchange",
            Status = ExchangeStatus.Draft,
            CreatedAt = DateTime.UtcNow
        };
        context.Exchanges.Add(exchange);

        var exchangeParticipants = participants.Select(p => new ExchangeParticipant
        {
            Id = Guid.NewGuid(),
            ExchangeId = exchange.Id,
            ParticipantId = p.Id
        }).ToList();
        context.ExchangeParticipants.AddRange(exchangeParticipants);
        await context.SaveChangesAsync();

        // Add restriction: Alice cannot gift Bob
        var aliceEp = exchangeParticipants.First(ep => ep.ParticipantId == participants[0].Id);
        var bobEp = exchangeParticipants.First(ep => ep.ParticipantId == participants[1].Id);
        context.Restrictions.Add(new Restriction
        {
            ExchangeId = exchange.Id,
            GiverId = aliceEp.Id,
            CannotGiveToId = bobEp.Id,
            Reason = "Spouse restriction"
        });
        await context.SaveChangesAsync();

        // Act
        var result = await service.GenerateMatchesAsync(exchange, CancellationToken.None);

        // Assert
        Assert.True(result.Success);
        var aliceAssignment = result.Assignments.First(a => a.GiverId == aliceEp.Id);
        Assert.NotEqual(bobEp.Id, aliceAssignment.ReceiverId); // Alice should not gift Bob
    }

    [Fact]
    public async Task GenerateMatches_WithTooFewParticipants_ShouldFail()
    {
        // Arrange
        using var context = GetInMemoryDbContext();
        var logger = GetLogger();
        var service = new MatchingService(context, logger);

        var group = new Group
        {
            Id = Guid.NewGuid(),
            Name = "Test Group",
            OrganizerId = "user1",
            CreatedAt = DateTime.UtcNow
        };
        context.Groups.Add(group);

        var participant = new Participant
        {
            Id = Guid.NewGuid(),
            GroupId = group.Id,
            Name = "Alice",
            Email = "alice@test.com"
        };
        context.Participants.Add(participant);
        await context.SaveChangesAsync();

        var exchange = new Exchange
        {
            Id = Guid.NewGuid(),
            GroupId = group.Id,
            Year = 2025,
            Name = "Test Exchange",
            Status = ExchangeStatus.Draft,
            CreatedAt = DateTime.UtcNow
        };
        context.Exchanges.Add(exchange);

        var exchangeParticipant = new ExchangeParticipant
        {
            Id = Guid.NewGuid(),
            ExchangeId = exchange.Id,
            ParticipantId = participant.Id
        };
        context.ExchangeParticipants.Add(exchangeParticipant);
        await context.SaveChangesAsync();

        // Act
        var result = await service.GenerateMatchesAsync(exchange, CancellationToken.None);

        // Assert
        Assert.False(result.Success);
        Assert.Contains("2 participants", result.ErrorMessage ?? "");
    }
}

