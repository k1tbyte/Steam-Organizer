using Steam_Account_Manager.Infrastructure;
using Steam_Account_Manager.Infrastructure.SteamRemoteClient;
using Steam_Account_Manager.MVVM.Core;
using System;
using System.Collections.ObjectModel;
using System.Diagnostics;
using Friend = Steam_Account_Manager.Infrastructure.Models.JsonModels.Friend;

namespace Steam_Account_Manager.MVVM.ViewModels.RemoteControl
{
    internal class FriendsViewModel : ObservableObject
    {
        public AsyncRelayCommand GetFriendsInfoCommand { get; set; }
        public RelayCommand OpenFriendProfileCommand { get; set; }
        public RelayCommand OpenFriendChatCommand { get; set; }
        public RelayCommand RemoveFriendCommand { get; set; }


        public static event EventHandler FriendsChanged;
        public static ObservableCollection<Friend> Friends
        {
            get => SteamRemoteClient.CurrentUser.Friends;
            set
            {
                SteamRemoteClient.CurrentUser.Friends = value;
                FriendsChanged?.Invoke(null, EventArgs.Empty);
            }
        }

        public FriendsViewModel()
        {
            GetFriendsInfoCommand = new AsyncRelayCommand(async (o) =>
            {
                await SteamRemoteClient.ParseUserFriends();
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
                        SteamRemoteClient.CurrentUser.Friends.RemoveAt(i);
                        break;
                    }

                }
            });
        }
    }
}
