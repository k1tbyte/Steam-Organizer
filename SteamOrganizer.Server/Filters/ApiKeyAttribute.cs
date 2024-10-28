using System.Collections.Concurrent;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;

namespace SteamOrganizer.Server.Filters;

[AttributeUsage(AttributeTargets.Class | AttributeTargets.Method)]
public sealed class ApiKeyAttribute : Attribute, IActionFilter
{
    private static readonly ConcurrentDictionary<string, (DateTime, int)> Requests = new();
    private const int MaxRequests = 10; 
    private readonly TimeSpan _timeFrame = TimeSpan.FromMinutes(1);
    
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
            return;
        }
        
        
        var (timestamp, count) = Requests.GetOrAdd(key, (DateTime.UtcNow, 0));

        if (DateTime.UtcNow - timestamp > _timeFrame)
        {
            Requests[key] = (DateTime.UtcNow, 1);
        }
        else if (count >= MaxRequests)
        {
            context.Result =  new StatusCodeResult(StatusCodes.Status429TooManyRequests);
            return;
        }

        Requests[key] = (timestamp, count + 1);
    }

    public void OnActionExecuted(ActionExecutedContext context)
    {
    }
}