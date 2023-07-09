using System;

namespace SteamOrganizer.Log
{
    internal sealed class WarnException : Exception
    {
        public WarnException(string exception) : base(exception) { }
    }

    internal sealed class FatalException : Exception
    {
        public FatalException(string exception) : base(exception) { }
    }
}
