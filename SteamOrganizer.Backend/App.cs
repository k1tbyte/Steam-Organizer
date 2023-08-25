
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using SteamOrganizer.Backend.Parsers.SteamAPI;
using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed;
using SteamOrganizer.Backend.Core;

namespace SteamOrganizer.Backend;

public static class App
{
    public static readonly JsonSerializerOptions DefaultJsonOptions = new() { PropertyNameCaseInsensitive = true };
    private static readonly WebApplication Current;
    internal static IConfiguration Config => Current.Configuration;
    internal static readonly MemoryCachingService Cache;

    static App()
    {
        var builder = WebApplication.CreateBuilder();

        // Add services to the container.
        builder.Services.AddControllers().AddJsonOptions(options =>
        {
            options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
            options.JsonSerializerOptions.DefaultIgnoreCondition = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
        });

        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddSwaggerGen();
        builder.Services.Configure<KestrelServerOptions>(options =>
        {
            options.AllowSynchronousIO = true;
        });

        Current = builder.Build();

#if DEBUG
        Current.UseSwagger();
        Current.UseSwaggerUI();

#endif

        Current.MapControllers();
        Current.UseForwardedHeaders(new ForwardedHeadersOptions
        {
            ForwardedHeaders = ForwardedHeaders.XForwardedFor |
            ForwardedHeaders.XForwardedProto
        });

        Cache = new("SteamOrganizer");
    }

    public static void Main(string[] args)
    {
        AppDomain.CurrentDomain.ProcessExit += OnApplicationShuttingDown;
        Current.Run();
    }

    private static void OnApplicationShuttingDown(object? sender, EventArgs e)
    {
        Cache.Dispose();
    }
}
