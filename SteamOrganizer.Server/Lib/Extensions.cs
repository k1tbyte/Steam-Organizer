namespace SteamOrganizer.Server.Lib;

public static class Extensions
{
    public static async Task<string?> TryGetString(this HttpClient client, string url)
    {
        try
        {
            using var response = await client.GetAsync(url).ConfigureAwait(false);
            if (response.IsSuccessStatusCode)
            {
                return await response.Content.ReadAsStringAsync();
            }
        }
        catch
        {
            // TODO: Handle status code
        }

        return null;
    }
    
    public static unsafe string MutableReplace(this string str, char from, char to)
    {
        fixed (char* lpstr = str)
        {
            for (char* i = lpstr; *i != '\0'; i++)
            {
                if (*i == from)
                {
                    *i = to;
                }
            }
        }
        return str;
    }
}