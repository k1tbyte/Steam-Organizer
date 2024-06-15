using System.Text.Json;
using System.Text.Json.Serialization;

namespace SteamOrganizer.Server;

public static class Defines
{
    public static readonly JsonSerializerOptions JsonOptions = new()
    {
        PropertyNameCaseInsensitive = true,
        DefaultIgnoreCondition = JsonIgnoreCondition.WhenWritingNull
        
    };
    
    public const string ApiVersion = "api/v1";
    public const string RoutePattern = $"{ApiVersion}/[controller]/[action]";
    public const string ApiKeyParamName = "key";

    public const ulong SteamId64Indent = 76561197960265728U;
    public const byte SteamApiKeyLength = 32;
    public const string SteamApiBaseUrl = "https://api.steampowered.com/";
}