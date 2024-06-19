namespace SteamOrganizer.Server.Lib;

public static class Tools
{
    public static ulong ToSteamId64(ulong id) => id < UInt32.MaxValue ? id + Defines.SteamId64Indent : id;
    public static ulong ToSteamId32(ulong id) => id & 0xFFFFFFFFul;
}