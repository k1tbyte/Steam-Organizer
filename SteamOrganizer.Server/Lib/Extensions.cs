namespace SteamOrganizer.Server.Lib;

public static class Extensions
{
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