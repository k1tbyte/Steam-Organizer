
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Server.Kestrel.Core;
using Microsoft.Extensions.Configuration;
using SteamOrganizer.Backend.Parsers.SteamAPI;
using SteamOrganizer.Backend.Parsers.SteamAPI.Responses;
using System.Net;
using System.Text.Json;

namespace SteamOrganizer.Backend;

public static class App
{
    public static IConfigurationRoot Configuration { get; private set; }
    public static readonly JsonSerializerOptions DefaultJsonOptions = new() { PropertyNameCaseInsensitive = true };

    public static void Main(string[] args)
    {

        var builder = WebApplication.CreateBuilder(args);

        // Add services to the container.
        builder.Services.AddControllers().AddJsonOptions(options =>
        {
            options.JsonSerializerOptions.PropertyNameCaseInsensitive = true;
            options.JsonSerializerOptions.DefaultIgnoreCondition      = System.Text.Json.Serialization.JsonIgnoreCondition.WhenWritingNull;
        });

        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddSwaggerGen();
        builder.Services.Configure<KestrelServerOptions>(options =>
        {
            options.AllowSynchronousIO = true;
        });

        var app = builder.Build();

#if DEBUG
            app.UseSwagger();
            app.UseSwaggerUI();

#endif

        app.UseHttpsRedirection();
        app.MapControllers();
        app.UseForwardedHeaders(new ForwardedHeadersOptions
        {
            ForwardedHeaders = ForwardedHeaders.XForwardedFor |
            ForwardedHeaders.XForwardedProto
        });

        Configuration = new ConfigurationBuilder().SetBasePath(app.Environment.ContentRootPath)
            .AddJsonFile("appsettings.json", optional: false, reloadOnChange: true)
            .AddEnvironmentVariables().Build();

        SteamParser.ApiKey = App.Configuration.GetValue<string?>("Credentials:SteamApiKey");

        app.Run();
    }
}
