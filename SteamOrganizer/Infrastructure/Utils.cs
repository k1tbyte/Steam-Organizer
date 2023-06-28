using System;

namespace SteamOrganizer.Infrastructure
{
    internal static class Utils
    {
        internal static void ThrowIfNull(this object obj)
        {
            if(obj == null) 
            {
                throw new ArgumentNullException(nameof(obj));
            }
        }

        internal static void ThrowIfNullOrEmpty(this string str)
        {
            if (string.IsNullOrEmpty(str))
            {
                throw new ArgumentNullException(nameof(str));
            }
        }
    }
}
