namespace SteamOrganizer.Backend.Core;

public static class Utils
{
    public static unsafe string InjectionReplace(this string str, char from, char to)
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
