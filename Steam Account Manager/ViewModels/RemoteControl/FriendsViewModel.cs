using Steam_Account_Manager.Infrastructure;
using Steam_Account_Manager.Infrastructure.Base;
using System;
using System.Collections.ObjectModel;
using System.Diagnostics;
using Friend = Steam_Account_Manager.Infrastructure.JsonModels.Friend;

namespace Steam_Account_Manager.ViewModels.RemoteControl
{
    internal class FriendsViewModel : ObservableObject
    {
        public AsyncRelayCommand GetFriendsInfoCommand { get; set; }
        public RelayCommand OpenFriendProfileCommand { get; set; }
        public RelayCommand OpenFriendChatCommand { get; set; }
        public RelayCommand RemoveFriendCommand { get; set; }

        private static ObservableCollection<Friend> _friends;
        public static event EventHandler FriendsChanged;
        public static ObservableCollection<Friend> Friends
        {
            get => _friends;
            set
            {
                _friends = value;
                FriendsChanged?.Invoke(null, EventArgs.Empty);
            }
        }

        public FriendsViewModel()
        {
            GetFriendsInfoCommand = new AsyncRelayCommand(async (o) =>
            {
                await SteamRemoteClient.ParseUserFriends();
                Friends = new ObservableCollection<Friend>(SteamRemoteClient.CurrentUser.Friends);
            });

            OpenFriendProfileCommand = new RelayCommand(o =>
            {
#pragma warning disable CS0642 
                using (Process.Start(new ProcessStartInfo($"https://steamcommunity.com/profiles/{(ulong)o}")
                { UseShellExecute = true })) ;
#pragma warning restore CS0642 
            });

            OpenFriendChatCommand = new RelayCommand(o =>
            {                    
                if (MessagesViewModel.Messages.Count != 0)
                    MessagesViewModel.Messages.Clear();

                SteamRemoteClient.InterlocutorID = MessagesViewModel.SelectedChatId = (ulong)o;
                MainRemoteControlViewModel.RemoteControlCurrentView = MainRemoteControlViewModel.MessagesV;
            });

            RemoveFriendCommand = new RelayCommand(o =>
            {
                var id = (ulong)o;
                SteamRemoteClient.RemoveFriend(id);
                for (int i = 0; i < Friends.Count; i++)
                {
                    if (Friends[i].SteamID64 == id)
                    {
                        Friends.RemoveAt(i);
                        SteamRemoteClient.CurrentUser.Friends.RemoveAt(i);
                        break;
                    }

                }
            });
        }
    }
}
