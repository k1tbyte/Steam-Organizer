using Newtonsoft.Json;
using SteamKit2;
using SteamOrganizer.Helpers;
using SteamOrganizer.Helpers.Encryption;
using SteamOrganizer.Infrastructure;
using System;
using System.ComponentModel;
using System.Diagnostics;
using System.Threading.Tasks;
using System.Windows.Media.Imaging;
using static SteamOrganizer.Infrastructure.Steam.API;

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

        [StringEncryption.Encryptable]
        public string SteamEmail { get; set; }

        [StringEncryption.Encryptable]
        public string SteamEmailPassword { get; set; }

        [StringEncryption.Encryptable]
        public string RockstarEmail { get; set; }

        [StringEncryption.Encryptable]
        public string RockstarPassword { get; set; }

        [StringEncryption.Encryptable]
        public string UbisoftEmail { get; set; }

        [StringEncryption.Encryptable]
        public string UbisoftPassword { get; set; }

        [StringEncryption.Encryptable]
        public string EpicGamesEmail { get; set; }

        [StringEncryption.Encryptable]
        public string EpicGamesPassword { get; set; }

        [StringEncryption.Encryptable]
        public string EAEmail { get; set; }

        [StringEncryption.Encryptable]
        public string EAPassword { get; set; }

        public ulong? Phone { get; set; }


        #region Summaries
        [JsonIgnore]
        public uint? AccountID => SteamID64.HasValue ? (uint?)(SteamID64 - SteamIdConverter.SteamID64Indent) : null;
        public ulong? SteamID64 { get; set; }
        [JsonIgnore]
        public bool IsFullyParsed => SteamID64 != null;
        public byte VisibilityState { get; set; }
        public string VanityURL { get; set; }
        public int? SteamLevel { get; set; }
        public DateTime? LastUpdateDate { get; set; }
        public DateTime? CreatedDate { get; set; }
        public DateTime AddedDate { get; set; }

        private string _avatarHash;
        public string AvatarHash
        {
            get => _avatarHash;
            set
            {
                if (_avatarHash == value)
                    return;

                _avatarHash = value;
                InvokePropertyChanged(AvatarChangedEventArgs);
            }
        }

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
        public string TotalGamesPrice { get; set; }
        public int PaidGames { get; set; }
        #endregion

        public string Note { get; set; }

        private SteamAuth _authenticator;
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
        public BitmapImage AvatarBitmap => CachingManager.GetCachedAvatar(AvatarHash, 0, 0, size: EAvatarSize.medium);

        [field: NonSerialized]
        public event PropertyChangedEventHandler PropertyChanged;

        [JsonIgnore]
        [field: NonSerialized]
        public bool IsCurrentlyUpdating { get; set; }

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

        public async Task<bool> RetrieveInfo()
        {
            try
            {
                IsCurrentlyUpdating = true;

                if (await GetInfo(this) != EAPIResult.OK)
                    return false;

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

        internal Account(string login, string password)
        {
            this.AddedDate = DateTime.Now;
            this.Nickname  = this.Login = login;
            this.Password  = password;
        }

        internal Account(string login, string password, ulong steamID64)
        {
            this.AddedDate = DateTime.Now;
            this.Nickname  = this.Login = login;
            this.Password  = EncryptionTools.ReplacementXorString(App.Config.DatabaseKey,password);
            this.SteamID64 = steamID64;
        }

        internal Account(string login, string password, uint accountId) :
            this(login, password, accountId + SteamIdConverter.SteamID64Indent)
        { }

        #endregion
    }
}
