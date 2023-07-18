using SteamOrganizer.Helpers;
using SteamOrganizer.Infrastructure;
using System;
using System.ComponentModel;
using System.Diagnostics;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Media.Imaging;
using static SteamOrganizer.Helpers.SteamParser;

namespace SteamOrganizer.MVVM.Models
{
    [Serializable]
    internal sealed class Account : INotifyPropertyChanged
    {
        public int? SteamLevel { get; set; }
        public uint? AccountID { get; set; }
        public byte VisibilityState { get; set; }
        public ulong? SteamID64 => AccountID.HasValue ? AccountID + SteamIdConverter.SteamID64Indent : null;
        public string VanityURL { get; set; }

        public DateTime? LastUpdateDate { get; set; }
        public DateTime? CreatedDate { get; set; }
        public DateTime AddedDate { get; }
        public float? YearsOfService => CreatedDate == null ? null : (float?)((DateTime.Now - CreatedDate.Value).TotalDays / 365.25);

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

        public string AvatarHash { get; set; }

        /// <summary>
        /// Required
        /// </summary>
        public string Nickname { get; set; }

        /// <summary>
        /// Required
        /// </summary>
        public string Username { get; set; }

        /// <summary>
        /// Required
        /// </summary>
        public string Password { get; set; }

        public bool HaveCommunityBan { get; set; }
        public int VacBansCount { get; set; }
        public int GameBansCount { get; set; }
        public int DaysSinceLastBan { get; set; }
        public int EconomyBan { get; set; }

        public int GamesCount { get; set; }
        public int PlayedGamesCount { get; set; }
        public float HoursOnPlayed { get; set; }


        [field: NonSerialized]
        public BitmapImage AvatarBitmap { get; set; }

        [field: NonSerialized]
        public event PropertyChangedEventHandler PropertyChanged;

        public bool IsFullyParsed => AccountID != null;
        

        public void LoadImage()
            => AvatarBitmap = CachingManager.GetCachedAvatar(AvatarHash, 0, 0,size : EAvatarSize.medium);

        public string GetProfileUrl() 
            => SteamID64 == null ? WebBrowser.SteamHost : WebBrowser.SteamProfilesHost + SteamID64.ToString();

        public void OpenInBrowser(string hostPath = null)
            => Process.Start(GetProfileUrl() + hostPath).Dispose();

        public async Task<bool> RetrieveInfo()
        {
            var prevHash = this.AvatarHash;
            if(!await ParseInfo(this))
                return false;

            if (prevHash != this.AvatarHash)
                LoadImage();

            return true;
        }

        #region Constructors

        private Account() { }

        public Account(string login, string password)
        {
            LoadImage();
            this.AddedDate = DateTime.Now;
            this.Nickname  = this.Username = login;
            this.Password  = password;
        }

        public Account(string login, string password, uint accountId)
        {
            this.AddedDate = DateTime.Now;
            this.Nickname  = this.Username = login;
            this.Password  = password;
            this.AccountID = accountId;
        }

        public Account(string login, string password, ulong steamId64) :
            this(login, password, (uint)(steamId64 - SteamIdConverter.SteamID64Indent))
        { }

        #endregion
    }
}
