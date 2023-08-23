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

    public static unsafe string? InjectionReplace(this string? str, int fromIndex, char replaceTo, char terminateChar)
    {
        if (str == null || str.Length < fromIndex)
            return str;

        fixed (char* lpstr = str)
        {
            for (char* i = (lpstr + fromIndex); *i != '\0' && *i != terminateChar; i++)
            {
                *i = replaceTo;
            }
        }
        return str;
    }

}
