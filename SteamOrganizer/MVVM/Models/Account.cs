using SteamOrganizer.Helpers;
using System;
using System.ComponentModel;
using System.Windows.Media.Imaging;

namespace SteamOrganizer.MVVM.Models
{
    internal sealed class Account
    {
        public int? SteamLevel { get; set; }
        public uint? AccountID { get; set; }

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
        public void LoadImage()
            => AvatarBitmap = CachingManager.GetCachedAvatar(AvatarHash, 80, 80,size : EAvatarSize.full);
        
    }
}
