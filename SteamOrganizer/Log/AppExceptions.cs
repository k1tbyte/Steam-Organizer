using System;
using System.Collections.Generic;
using System.Linq;
using System.Runtime.CompilerServices;
using System.Text;
using System.Threading.Tasks;

namespace SteamOrganizer.Log
{
    internal class WarnException : Exception
    {
        public WarnException(string exception) : base(exception) { }
    }

    internal class DebugException : Exception
    {
        public DebugException(string exception) : base(exception) { }
    }

    internal class FatalException : Exception
    {
        public FatalException(string exception) : base(exception) { }
    }
}
