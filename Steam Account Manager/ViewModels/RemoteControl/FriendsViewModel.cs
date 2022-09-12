using Steam_Account_Manager.Infrastructure;
using Steam_Account_Manager.Infrastructure.Base;
using Friend = Steam_Account_Manager.Infrastructure.JsonModels.Friend;
using System;
using System.Collections.ObjectModel;
using System.Diagnostics;
using Steam_Account_Manager.ViewModels.RemoteControl.View;

namespace Steam_Account_Manager.ViewModels.RemoteControl
{
    internal class FriendsViewModel : ObservableObject
    {
        public AsyncRelayCommand GetFriendsInfoCommand { get; set; }
        public RelayCommand OpenFriendProfileCommand { get; set; }
        public RelayCommand OpenFriendChatCommand { get; set; }

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
            Friends = new ObservableCollection<Friend>(SteamRemoteClient.CurrentUser.Friends);
            GetFriendsInfoCommand = new AsyncRelayCommand(async (o) =>
            {
                await SteamRemoteClient.ParseUserFriends();
                Friends = new ObservableCollection<Friend>(SteamRemoteClient.CurrentUser.Friends);
            });

            OpenFriendProfileCommand = new RelayCommand(o =>
            {
                using (Process.Start(new ProcessStartInfo($"https://steamcommunity.com/profiles/{(ulong)o}")
                { UseShellExecute = true })) ;
            });

            OpenFriendChatCommand = new RelayCommand(o =>
            {                    
                if (MessagesViewModel.Messages.Count != 0)
                    MessagesViewModel.Messages.Clear();

                SteamRemoteClient.InterlocutorID = MessagesViewModel.SelectedChatId = (ulong)o;
                MainRemoteControlViewModel.RemoteControlCurrentView = MainRemoteControlViewModel.MessagesV;
            });
        }
    }
}
