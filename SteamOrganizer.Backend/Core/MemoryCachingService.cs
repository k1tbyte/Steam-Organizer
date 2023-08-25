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

        var path = Path.Combine(Environment.CurrentDirectory, serviceName + ".cache");
        
        try
        {

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

            if (cache.Data is T data)
            {
                value = data;
            }

            return true;
        }
    }

    public bool SetCachedData<T>(string key, T data, TimeSpan cacheDuration,bool overwriteIfExists = false) where T : notnull
    {
        try
        {
            lock(Locker)
            {
                var cacheObject = new CacheObject(data, cacheDuration);
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

                MemoryCache.Add(key, cacheObject);
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
            File.WriteAllText(Path.Combine(
                Environment.CurrentDirectory, ServiceName + ".cache"),
                JsonSerializer.Serialize(MemoryCache)
            );
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

#pragma warning disable CS8618
        [JsonConstructor]
        public CacheObject(object Data, DateTime ExpiredTime, string ObjTypeName)
        {
            this.ExpiredTime = ExpiredTime;
            this.ObjTypeName = ObjTypeName;

            try
            {
                var type = Type.GetType(ObjTypeName,true);
                Data = (Data as JsonObject).Deserialize(type!) ?? throw new Exception();
            }
            catch
            {
                this.Data = Data;
            }
        }
#pragma warning restore CS8618

        public CacheObject(object data, TimeSpan cacheDuration)
        {
            ArgumentNullException.ThrowIfNull(data, nameof(data));

            this.Data   = data;
            ObjTypeName = data.GetType().Name;
            ExpiredTime = DateTime.Now + cacheDuration;
        }

        public string ObjTypeName {  get; }
        public object Data { get; }
        public DateTime ExpiredTime { get; }

        [JsonIgnore]
        public bool IsExpired => DateTime.Now > ExpiredTime;
    }
}