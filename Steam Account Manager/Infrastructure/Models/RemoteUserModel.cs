using Newtonsoft.Json;
using Steam_Account_Manager.Infrastructure.SteamRemoteClient;
using SteamKit2;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;

namespace Steam_Account_Manager.Infrastructure.Models.JsonModels
{
    enum ESteamApiKeyState : byte
    {
        Error,
        Timeout,
        Registered,
        NotRegisteredYet,
        AccessDenied
    }

    [Serializable]
    public class User
    {
        public User()
        {
            Messenger = new Messenger() { Commands = new List<Command>() };
            Friends   = new ObservableCollection<Friend>();
        }
        public string Username { get; set; }
        public ulong SteamID64 { get; set; }
        public string WebApiKey { get; set; }
        public string TradeToken { get; set; }
        public string FriendsInvite { get; set; }
        public bool AutoIdlingGames { get; set; }
        public string CustomGameTitle { get; set; }
        public Messenger Messenger { get; set; }

        [field: NonSerialized]
        public ObservableCollection<Friend> Friends { get; set; }

        [field: NonSerialized]
        public string AvatarHash { get; set; }
        public string AvatarUrl => $"https://avatars.cloudflare.steamstatic.com/{AvatarHash}_full.jpg";

        [field: NonSerialized]
        public string IPCountryCode { get; set; }

        [field: NonSerialized]
        public string IPCountryImage { get; set; }

        [field: NonSerialized]
        public string Nickname { get; set; }

        [field: NonSerialized]
        public int AuthedComputers { get; set; }

        [field: NonSerialized]
        public string EmailAddress { get; set; }

        [field: NonSerialized]
        public bool IsEmailVerified { get; set; }

        [field: NonSerialized]
        public string Wallet { get; set; }

        [field: NonSerialized]
        public int _personaState;
        public int PersonaState 
        {
            get => _personaState;
            set
            {
                if(_personaState == value ) return;   // Установка значения происходит при калбэке в SteamRemoteClient - иначе рекурсия
                SteamRemoteClient.SteamRemoteClient.ChangePersonaState((EPersonaState)value);
            }
        }

        [field: NonSerialized]
        public System.Windows.Media.Brush PersonaStateBrush { get; set; }

    }

    [Serializable]
    public class PlayerGame
    {
        public string Name { get; set; }
        public string ImageURL { get; set; }
        public int AppID { get; set; }
        public int PlayTime_Forever { get; set; }
        public bool IsSelected { get; set; }
    }

    [Serializable]
    public class Friend
    {
        public string Name { get; set; }
        public ulong SteamID64 { get; set; }
        public string ImageURL { get; set; }
        public string FriendSince { get; set; }
    }

    [Serializable]
    public class Messenger
    {
        public uint? AdminID { get; set; }
        public bool SaveChatLog { get; set; }
        public bool EnableCommands { get; set; }
        public List<Command> Commands { get; set; }
    }

    [Serializable]
    public class Command
    {
        public string Keyword { get; set; }
        public string CommandExecution { get; set; }
        public string MessageAfterExecute { get; set; }
    }

    [Serializable]
    public class RecentlyLoggedAccount
    {
        public string Username { get; set; }
        public string Loginkey { get; set; }
        public string ImageUrl { get; set; }
    }

}
