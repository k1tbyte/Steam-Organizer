using System.Text.Json;
using System.Text.Json.Serialization;

namespace SteamOrganizer.Server.Services;

public sealed class CacheManager : IDisposable
{
    private readonly object _locker = new();
    private readonly string _cacheName;
    private bool _disposedValue;
    private Dictionary<string, CacheObject> _memoryCache = new();

    public CacheManager(string cacheName)
    {
        _cacheName = cacheName;

        var path = Path.Combine(Directory.GetCurrentDirectory(), cacheName + ".cache");
        
        try
        {
            if (!File.Exists(path))
                return;

            var obj = JsonSerializer.Deserialize<Dictionary<string, CacheObject>>(File.ReadAllText(path));
            if (obj == null || obj.Count == 0)
                return;

            _memoryCache = obj;
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

    public bool GetCachedData<T>(string key,out T? value)
    {
        value = default;

        lock(_locker)
        {
            if (!_memoryCache.TryGetValue(key, out var cache))
                return false;

            if (cache.IsExpired)
            {
                _memoryCache.Remove(key);
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

    public bool SetCachedData<T>(string key, T data, TimeSpan cacheDuration,bool overwriteIfExists = false)
    {
        try
        {
            lock(_locker)
            {
                if(_memoryCache.TryGetValue(key,out var cache))
                {
                    if(cache.IsExpired || overwriteIfExists)
                    {
                        _memoryCache.Remove(key);
                    }
                    else
                    {
                        return false;
                    }
                }

                _memoryCache.Add(key, new CacheObject(data, cacheDuration));
                return true;
            }
        }
        catch {
            return false;
        }

    }

    private void Dispose(bool disposing)
    {
        if (_disposedValue)
            return;

        lock (_locker)
        {
            if(_memoryCache.Count != 0)
            {
                foreach (var item in _memoryCache
                             .Where(item => item.Value.IsExpired))
                {
                    _memoryCache.Remove(item.Key);
                }

/*#if !DEBUG
            File.WriteAllText(Path.Combine(
                Directory.GetCurrentDirectory(), ServiceName + ".cache"),
                JsonSerializer.Serialize(MemoryCache)
            );
#endif*/
            }
            _memoryCache = null;
            _disposedValue = true;
        }
    }

     ~CacheManager()
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
        public CacheObject(object data, DateTime expiredTime)
        {
            this.ExpiredTime = expiredTime;
            this.Data        = data;
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