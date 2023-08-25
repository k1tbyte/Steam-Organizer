using Microsoft.Extensions.Caching.Distributed;
using System.Text.Json;

namespace SteamOrganizer.Backend.Core;

public sealed class RedisCacheService
{
    private readonly IDistributedCache _cache;

    public RedisCacheService(IDistributedCache cache)
    {
        _cache = cache;
    }

    public bool GetCachedData<T>(string key,out T? value)
    {
#if DEBUG
        value = default;
        return false;
#endif
        value = default;
        var jsonData = _cache.GetString(key);
        if (jsonData == null)
            return false;

        value = JsonSerializer.Deserialize<T>(jsonData);
        return true;
    }

    public void SetCachedData<T>(string key, T data, TimeSpan cacheDuration)
    {
#if DEBUG
        return;
#endif
        try
        {
            var options = new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = cacheDuration
            };
            var jsonData = JsonSerializer.Serialize(data);
            _cache.SetString(key, jsonData, options);
        }
        catch {

        }

    }
}