using System.Text;
using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace SteamOrganizer.Server.Filters.Swagger;

public sealed class SwaggerUrlFilter : IDocumentFilter
{
    public void Apply(OpenApiDocument swaggerDoc, DocumentFilterContext context)
    {
        var keyValuePairs = new OpenApiPaths();
        foreach(var (key, value) in swaggerDoc.Paths)
        {
            var camelCaseSpans = key.Split('/')
                .Where(o => !string.IsNullOrEmpty(o))
                .Select(o => char.ToLower(o[0]) + o[1..]);
            var builder = new StringBuilder();
            foreach (var span in camelCaseSpans)
            {
                builder.Append('/').Append(span);
            }
            keyValuePairs.Add(builder.ToString(), value);
        }
        swaggerDoc.Paths = keyValuePairs;
    }
}