namespace SteamOrganizer.Backend;

public static class WebUtils
{
    public static async Task<string?> TryGetStringAsync(this HttpClient client, string url)
    {
        try
        {
            using var response = await client.GetAsync(url).ConfigureAwait(false);
            return await response?.Content?.ReadAsStringAsync()!;

        }
        catch { Console.WriteLine("error"); }
        return null;
    }
}
