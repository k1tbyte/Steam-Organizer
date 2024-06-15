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

        // Add services to the container.

        builder.Services.AddControllers(config =>
        {
            config.Filters.Add<ModelValidationAttribute>();
        }).AddJsonOptions(o =>
        {
            o.JsonSerializerOptions.PropertyNameCaseInsensitive = Defines.JsonOptions.PropertyNameCaseInsensitive;
            o.JsonSerializerOptions.DefaultIgnoreCondition = Defines.JsonOptions.DefaultIgnoreCondition;
        });

        /*builder.Services.AddCors(o =>
        {
            o.AddPolicy("AllowSpecificOrigin",
                policy => policy
                    .WithOrigins("https://your-website.com")
                    .AllowAnyHeader()
                    .AllowAnyMethod());
        });*/
        
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
            var apiKey = o.GetService<IHttpContextAccessor>()!
                .HttpContext!.Request.Query[Defines.ApiKeyParamName].ToString();
            var client = o.GetService<HttpClient>()!;
            client.BaseAddress = new Uri(Defines.SteamApiBaseUrl);
            return new SteamParser(client, o.GetService<CacheManager>()!, apiKey);
        });
        builder.Services.AddSingleton<CacheManager>(o => new CacheManager("global"));

        var app = builder.Build();

        // Configure the HTTP request pipeline.
        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI();
        }

        app.UseHttpsRedirection();

        app.UseAuthorization();
      //  app.UseCors("AllowSpecificOrigin");


        app.MapControllers();

        app.Run();
    }
}