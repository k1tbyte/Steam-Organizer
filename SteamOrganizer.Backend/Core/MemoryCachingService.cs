using SteamOrganizer.Backend.Parsers.SteamAPI.Responses;
using System.IO;
using System.Text.Json;
using System.Text.Json.Nodes;
using System.Text.Json.Serialization;

namespace SteamOrganizer.Backend.Core;

public sealed class MemoryCachingService : IDisposable
{
    private readonly object Locker = new();
    private readonly string ServiceName;
    private bool disposedValue;
    private Dictionary<string, CacheObject> MemoryCache = new();

    public MemoryCachingService(string serviceName)
    {
        ArgumentException.ThrowIfNullOrEmpty(serviceName);
        ServiceName = serviceName;

        var path = Path.Combine(Directory.GetCurrentDirectory(), serviceName + ".cache");
        
        try
        {
            if (!File.Exists(path))
                return;

            var obj = JsonSerializer.Deserialize<Dictionary<string, CacheObject>>(File.ReadAllText(path));
            if (obj == null || obj.Count == 0)
                return;

            MemoryCache = obj;
        } 
        catch(UnauthorizedAccessException)
        {
            // LOG
        }
        catch
        {
            File.Delete(path);
        }
    }

    public bool GetCachedData<T>(string key,out T? value) where T : notnull
    {
        value = default;

        lock(Locker)
        {
            if (!MemoryCache.TryGetValue(key, out var cache))
                return false;

            if (cache.IsExpired)
            {
                MemoryCache.Remove(key);
                return false;
            }

            if(cache.Data is JsonElement json)
            {
                try
                {
                    var jValue = json.Deserialize<T>();
                    if (jValue != null)
                    {
                        cache.Data = jValue;
                    }
                }
                catch { }

            }

            if (cache.Data is T data)
            {
                value = data;
            }

            return true;
        }
    }

    public bool SetCachedData<T>(string key, T data, TimeSpan cacheDuration,bool overwriteIfExists = false) where T : notnull
    {
        if (data == null)
            return false;

        try
        {
            lock(Locker)
            {
                if(MemoryCache.TryGetValue(key,out var cache))
                {
                    if(cache.IsExpired || overwriteIfExists)
                    {
                        MemoryCache.Remove(key);
                    }
                    else
                    {
                        return false;
                    }
                }

                MemoryCache.Add(key, new CacheObject(data, cacheDuration));
                return true;
            }
        }
        catch {
            return false;
        }

    }

    private void Dispose(bool disposing)
    {
        if (disposedValue)
            return;

        if(MemoryCache.Any())
        {
            foreach (var item in MemoryCache)
            {
                if(item.Value.IsExpired)
                {
                    MemoryCache.Remove(item.Key);
                }
            }

#if !DEBUG
            File.WriteAllText(Path.Combine(
                Directory.GetCurrentDirectory(), ServiceName + ".cache"),
                JsonSerializer.Serialize(MemoryCache)
            );
#endif
        }


        MemoryCache = null;
        disposedValue = true;
    }

     ~MemoryCachingService()
     {
         Dispose(disposing: false);
     }

    public void Dispose()
    {
        Dispose(disposing: true);
        GC.SuppressFinalize(this);
    }


    private sealed class CacheObject
    {
        [JsonConstructor]
        public CacheObject(object Data, DateTime ExpiredTime)
        {
            this.ExpiredTime = ExpiredTime;
            this.Data        = Data;
        }

        public CacheObject(object data, TimeSpan cacheDuration)
        {
            ArgumentNullException.ThrowIfNull(data, nameof(data));

            this.Data   = data;
            ExpiredTime = DateTime.Now + cacheDuration;
        }

        public object Data { get; set; }
        public DateTime ExpiredTime { get; }

        [JsonIgnore]
        public bool IsExpired => DateTime.Now > ExpiredTime;
    }
}