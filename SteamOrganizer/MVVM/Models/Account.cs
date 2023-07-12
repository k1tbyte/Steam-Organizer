using SteamOrganizer.Helpers;
using System;
using System.ComponentModel;
using System.Threading.Tasks;
using System.Windows.Media.Imaging;

namespace SteamOrganizer.MVVM.Models
{
    [Serializable]
    internal sealed class Account : INotifyPropertyChanged
    {
        public int? SteamLevel { get; set; }
        public uint? AccountID { get; set; }
        public ulong? SteamID64 => AccountID.HasValue ? AccountID + SteamIdConverter.SteamID64Indent : null;

        public DateTime? LastUpdateDate { get; set; }
        public DateTime AddedDate { get; set; }

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
        public bool HaveTradeBan { get; set; }
        public int VacBansCount { get; set; }
        public int GameBansCount { get; set; }


        [field: NonSerialized]
        public BitmapImage AvatarBitmap { get; set; }

        [field: NonSerialized]
        public event PropertyChangedEventHandler PropertyChanged;

        public bool IsFullyParsed => AccountID != null;

        public void LoadImage()
            => AvatarBitmap = CachingManager.GetCachedAvatar(AvatarHash, 80, 80,size : EAvatarSize.full);

        public async Task<bool> RetrieveInfo()
        {
            return true;
        }

        #region Constructors

        private Account() { }

        public Account(string login, string password)
        {
            LoadImage();
            this.Nickname = this.Username = login;
            this.Password = password;
        }

        public Account(string login, string password, uint accountId)
        {
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
