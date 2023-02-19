using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading.Tasks;

namespace Steam_Account_Manager.Infrastructure.Converters
{
    internal class SteamIDConverter
    { 
        private const ulong SteamID64Ident            = 76561197960265728; 

        /// <summary>
        /// The sequence equals is ESteamIDType
        /// </summary>
        private static readonly Regex[] IDRegexes = new Regex[]
        {
            new Regex("^[0-9]{17}$"),                                    
            new Regex("^[0-9]{1,10}$"),                                  
            new Regex("STEAM_[0-5]:[01]:\\d+$"),                         
            new Regex("\\[U:1:[0-9]+\\]$"),                              
            new Regex("^(?=^.{10}$)([A-Za-z\\d]+)\\-([A-Za-z\\d]{4})$"), 
            new Regex("steam:([0-9A-Fa-f]{15})+$")                        
       };

        public enum ESteamIDType : byte
        {
            SteamID64,
            SteamID32,
            SteamID,
            SteamID3,
            CSGOFriendID,
            FiveM,
            Unknown     //Should always be the last
        }

        public static string ToSteamID64(string steamID, ESteamIDType from)
        {

        }

        public static string ToSteamID64(string steamID)
        {

        }

        public static ESteamIDType GetSteamIDType(string steamID)
        {
            for (int i = 0; i < IDRegexes.Length; i++)
            {
                if (IDRegexes[i].IsMatch(steamID))
                    return (ESteamIDType)i;
            }
            return ESteamIDType.Unknown;
        }

    }
}
