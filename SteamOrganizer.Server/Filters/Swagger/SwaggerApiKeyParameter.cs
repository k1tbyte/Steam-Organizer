using Microsoft.OpenApi.Models;
using Swashbuckle.AspNetCore.SwaggerGen;

namespace SteamOrganizer.Server.Filters.Swagger;

public class SwaggerApiKeyParameter : IOperationFilter
{
    public void Apply(OpenApiOperation operation, OperationFilterContext context)
    {
        var hasApiKeyAttribute = context.MethodInfo.DeclaringType?.GetCustomAttributes(true)
            .Union(context.MethodInfo.GetCustomAttributes(true))
            .OfType<ApiKeyAttribute>().Any();

        if (hasApiKeyAttribute != true)
        {
            return;
        }
        
        operation.Parameters ??= new List<OpenApiParameter>();
        operation.Parameters.Insert(0,new OpenApiParameter
        {
            Name = "key",
            In = ParameterLocation.Query,
            Required = true,
            Schema = new OpenApiSchema
            {
                Type = "string"
            }
        });
    }
}