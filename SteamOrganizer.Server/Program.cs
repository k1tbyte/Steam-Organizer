using System.Text.RegularExpressions;
using Microsoft.Extensions.Http;
using Microsoft.OpenApi.Models;
using SteamOrganizer.Server.Filters;
using SteamOrganizer.Server.Filters.Swagger;
using SteamOrganizer.Server.Lib;
using SteamOrganizer.Server.Services;
using SteamOrganizer.Server.Services.SteamParser;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace SteamOrganizer.Server;




public static class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);
        LoadEnv(builder.Configuration);

        builder.Services.AddControllers(config =>
        {
            config.Filters.Add<ModelValidationAttribute>();
        }).AddJsonOptions(o =>
        {
            o.JsonSerializerOptions.PropertyNameCaseInsensitive = Defines.JsonOptions.PropertyNameCaseInsensitive;
            o.JsonSerializerOptions.DefaultIgnoreCondition = Defines.JsonOptions.DefaultIgnoreCondition;
        });
        
        builder.Services.AddCors(o =>
        {
            o.AddPolicy("DefaultCors",
                policy => policy
                    .WithOrigins(builder.Configuration["AllowedOrigin"]!)
                    .AllowAnyHeader()
                    .AllowAnyMethod());
        });
        
        // Learn more about configuring Swagger/OpenAPI at https://aka.ms/aspnetcore/swashbuckle
        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddSwaggerGen(o =>
        {
            o.DocumentFilter<SwaggerUrlFilter>();
            o.OperationFilter<SwaggerApiKeyParameter>();
        });

        builder.Services.AddHttpContextAccessor();
        builder.Services.AddHttpClient();
        builder.Services.AddScoped<SteamParser>(o =>
        {
            var context = o.GetService<IHttpContextAccessor>()!.HttpContext;
            var apiKey = context!.Request.Query[Defines.ApiKeyParamName].ToString();
            var client = o.GetService<HttpClient>()!;
            client.BaseAddress = new Uri(Defines.SteamApiBaseUrl);
            return new SteamParser(client, apiKey, context.RequestAborted);
        });
      //  builder.Services.AddSingleton<CacheManager>(_ => new CacheManager("global"));

        var app = builder.Build();
        
        var lifetime = app.Services.GetRequiredService<IHostApplicationLifetime>();
        lifetime.ApplicationStopping.Register(OnShutdown);

        // Configure the HTTP request pipeline.
        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI();
        }

        app.UseCors("DefaultCors");

        app.UseAuthorization();


        app.MapControllers();

        app.Run();
    }
    
    private static void LoadEnv(ConfigurationManager configuration)
    {
        var path = File.Exists(".env") ? ".env" 
#if DEBUG
            : File.Exists("../../../.env") ? "../../../.env" 
#endif
            : null;

        if (path == null)
        {
            return;
        }
        
        var placeholderPattern = new Regex(@"\$\{(\w+)\}");
        var text = File.ReadAllText(path);
        var dict = text
            .Split('\n')
            .Where(o => !string.IsNullOrEmpty(o))
            .Select(var => var.Split('='))
            .ToDictionary(parts => parts[0].Trim(), parts => parts[1].Trim());

        foreach (var keyValue in configuration.AsEnumerable())
        {
            if(keyValue.Value == null)
                continue;
            
            placeholderPattern.Replace(keyValue.Value, match =>
            {
                if (dict.TryGetValue(match.Groups[1].Value, out var value))
                {
                    configuration[keyValue.Key] = value;
                }
                    
                return value!;
            });
        }
    }

    private static void OnShutdown()
    {
        CacheManager.Dispose();
    }
}