using Newtonsoft.Json;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Steam_Account_Manager.Infrastructure.JsonModels
{
    public class User
    {
        [JsonProperty("Username")]
        public string Username { get; set; }

        [JsonProperty("Loginkey")]
        public string LoginKey { get; set; }

        [JsonProperty("SteamID64")]
        public string SteamID64 { get; set; }

        [JsonProperty("MessengerProperties")]
        public Messenger Messenger { get; set; }

        [JsonProperty("Friends")]
        public List<Friend> Friends { get; set; }

        [JsonProperty("Games")]
        public List<Games> Games { get; set; }

    }

    public class Games
    {
        [JsonProperty("Name")]
        public string Name { get; set; }

        [JsonProperty("ImageURL")]
        public string ImageURL { get; set; }

        [JsonProperty("AppID")]
        public uint AppID { get; set; }

        [JsonProperty("Playtime_Forever")]
        public uint PlayTime_Forever { get; set; }
    }

    public class Friend
    {
        [JsonProperty("Name")]
        public string Name { get; set; }

        [JsonProperty("SteamID64")]
        public ulong SteamID64 { get; set; }

        [JsonProperty("ImageURL")]
        public string ImageURL { get; set; }

        [JsonProperty("FriendSince")]
        public string FriendSince { get; set; }

    }

    public class Messenger
    {
        [JsonProperty("AdminID")]
        public uint AdminID { get; set; }

        [JsonProperty("ChatLogging")]
        public bool SaveChatLog { get; set; }

        [JsonProperty("EnableCommands")]
        public bool EnableCommands { get; set; }

        [JsonProperty("Commands")]
        public List<Command> Commands { get; set; }

    }

    public class Command
    {
        [JsonProperty("Keyword")]
        public string Keyword { get; set; }

        [JsonProperty("CommandExecution")]
        public string CommandExecution { get; set; }

        [JsonProperty("MessageAfterExecute")]
        public string MessageAfterExecute { get; set; }
    }

    public class RecentlyLoggedAccount
    {
        [JsonProperty("Username")]
        public string Username { get; set; }

        [JsonProperty("Loginkey")]
        public string Loginkey { get; set; }

        [JsonProperty("ImageUrl")]
        public string ImageUrl { get; set; }
    }

}
