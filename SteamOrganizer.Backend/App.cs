
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using SteamOrganizer.Backend.Parsers.SteamAPI;
using System.Text.Json;

namespace SteamOrganizer.Backend;

public static class App
{
    public static readonly JsonSerializerOptions DefaultJsonOptions = new() { PropertyNameCaseInsensitive = true };
    private static readonly WebApplication Current;
    internal static IConfiguration Config => Current.Configuration;

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
    }

    public static void Main(string[] args)
    {
        Current.Run();
    }
}
