using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace SteamOrganizer.Server.Filters;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public sealed class ApiKeyAttribute : Attribute, IActionFilter
{
    public void OnActionExecuting(ActionExecutingContext context)
    {
        if (!context.HttpContext.Request.Query.TryGetValue(Defines.ApiKeyParamName, out var extractedApiKey))
        {
            context.Result = new BadRequestObjectResult(new { Message = "Api key was not provided" });
            return;
        }
        
        var key = extractedApiKey.ToString();
        if(key.Length != Defines.SteamApiKeyLength)
        {
            context.Result = new BadRequestObjectResult(new { Message = "Invalid api key" });
        }
    }

    public void OnActionExecuted(ActionExecutedContext context)
    {
    }
}