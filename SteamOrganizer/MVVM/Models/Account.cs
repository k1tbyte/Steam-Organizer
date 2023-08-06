using SteamOrganizer.Helpers;
using SteamOrganizer.Infrastructure;
using System;
using System.ComponentModel;
using System.Diagnostics;
using System.Threading.Tasks;
using System.Windows.Media.Imaging;
using Newtonsoft.Json;
using static SteamOrganizer.Helpers.SteamParser;
using SteamKit2;
using System.Text;
using System.Runtime.Serialization;
using SteamOrganizer.Helpers.Encryption;

namespace SteamOrganizer.MVVM.Models
{
    [Serializable]
    internal sealed class Account : INotifyPropertyChanged
    {
        private static readonly PropertyChangedEventArgs AvatarChangedEventArgs = new PropertyChangedEventArgs(nameof(AvatarBitmap));

        [JsonProperty(Required = Required.Always)]
        public string Nickname { get; set; }

        [JsonProperty(Required = Required.Always)]
        public string Login { get; set; }

        [StringEncryption.Encryptable]
        public string Password { get; set; }


        #region Summaries
        [JsonIgnore]
        public uint? AccountID => SteamID64.HasValue ? (uint?)(SteamID64 - SteamIdConverter.SteamID64Indent) : null;
        public ulong? SteamID64 { get; set; }
        [JsonIgnore]
        public bool IsFullyParsed => SteamID64 != null;
        public string AvatarHash { get; set; }
        public byte VisibilityState { get; set; }
        public string VanityURL { get; set; }
        public int? SteamLevel { get; set; }
        public DateTime? LastUpdateDate { get; set; }
        public DateTime? CreatedDate { get; set; }

        public DateTime AddedDate { get; set; }

        [JsonIgnore]
        public float? YearsOfService => CreatedDate == null ? null : (float?)Math.Floor((DateTime.Now - CreatedDate.Value).TotalDays / 365.25 * 10) / 10;
        #endregion

        #region Bans
        public bool HaveCommunityBan { get; set; }
        public int VacBansCount { get; set; }
        public int GameBansCount { get; set; }
        public int DaysSinceLastBan { get; set; }
        public int EconomyBan { get; set; }
        #endregion

        #region Games
        public int GamesCount { get; set; }
        public int PlayedGamesCount { get; set; }
        public ushort GamesBadgeBoundary { get; set; }
        public float HoursOnPlayed { get; set; }
        public ulong TotalGamesPrice { get; set; }
        public int PaidGames { get; set; }
        public ECurrencyCode GamesCurrency { get; set; }
        #endregion

        public string Note { get; set; }

        private SteamAuth _authenticator;
        [JsonIgnore]
        public SteamAuth Authenticator 
        {
            get => _authenticator;
            set
            {
                _authenticator = value;
                PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(nameof(Authenticator)));
            }
        }

        public int UnpinIndex;
        private bool _pinned;
        public bool Pinned 
        {
            get => _pinned;
            set
            {
                _pinned = value;
                PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(nameof(Pinned)));
            }
        }

        [JsonIgnore]
        [field: NonSerialized]
        public BitmapImage AvatarBitmap { get; private set; }

        [field: NonSerialized]
        public event PropertyChangedEventHandler PropertyChanged;

        [JsonIgnore]
        [field: NonSerialized]
        public bool IsCurrentlyUpdating { get; set; }

        public void LoadImage(bool propertyChanged = true)
        {
            AvatarBitmap = CachingManager.GetCachedAvatar(AvatarHash, 0, 0, size: EAvatarSize.medium);

            if(propertyChanged)
            {
                InvokePropertyChanged(AvatarChangedEventArgs);
            }
        }

        public string GetProfileUrl() 
            => SteamID64 == null ? WebBrowser.SteamHost : WebBrowser.SteamProfilesHost + SteamID64.ToString();

        public void OpenInBrowser(string hostPath = null)
            => Process.Start(GetProfileUrl() + hostPath).Dispose();

        public void InvokePropertyChanged(string property)
            => PropertyChanged?.Invoke(this, new PropertyChangedEventArgs(property));

        public void InvokePropertyChanged(PropertyChangedEventArgs args)
            => PropertyChanged?.Invoke(this, args);

        public void InvokeBannerPropertiesChanged()
        {
            InvokePropertyChanged(nameof(Nickname));
            InvokePropertyChanged(nameof(AccountID));
            InvokePropertyChanged(nameof(CreatedDate));
            InvokePropertyChanged(nameof(SteamLevel));
            InvokePropertyChanged(nameof(YearsOfService));
            InvokePropertyChanged(nameof(HaveCommunityBan));
            InvokePropertyChanged(nameof(VacBansCount));
            InvokePropertyChanged(nameof(GameBansCount));
            InvokePropertyChanged(nameof(EconomyBan));
        }

        public async Task<bool> RetrieveInfo(bool markUpdate = false)
        {
            try
            {
                IsCurrentlyUpdating = true;

                if (await ParseInfo(this) != EParseResult.OK)
                    return false;

                if (markUpdate)
                    LastUpdateDate = DateTime.Now;

                return true;
            }
            finally
            {
                IsCurrentlyUpdating = false;
            }
        }
        #region Constructors

        [JsonConstructor]
        private Account() { }

        public Account(string login, string password)
        {
            LoadImage(propertyChanged: false);
            this.AddedDate = DateTime.Now;
            this.Nickname  = this.Login = login;
            this.Password  = password;
        }

        public Account(string login, string password, ulong steamID64)
        {
            this.AddedDate = DateTime.Now;
            this.Nickname  = this.Login = login;
            this.Password  = EncryptionTools.ReplacementXorString(App.EncryptionKey,password);
            this.SteamID64 = steamID64;
        }

        public Account(string login, string password, uint accountId) :
            this(login, password, accountId + SteamIdConverter.SteamID64Indent)
        { }

        #endregion
    }
}
