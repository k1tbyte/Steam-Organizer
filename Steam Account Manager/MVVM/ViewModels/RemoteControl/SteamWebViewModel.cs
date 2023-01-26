using Steam_Account_Manager.Infrastructure.SteamRemoteClient;
using Steam_Account_Manager.MVVM.Core;
using System;

namespace Steam_Account_Manager.MVVM.ViewModels.RemoteControl
{
    internal class SteamWebViewModel : ObservableObject
    {
        public AsyncRelayCommand GetWebApiKeyCommand { get; set; }
        public AsyncRelayCommand RevokeWebApiKeyCommand { get; set; }
        public AsyncRelayCommand GetTradeTokenCommmand { get; set; }
        public AsyncRelayCommand RefreshTradeTokenCommmand { get; set; }

        public string WebApiKey
        {
            get => SteamRemoteClient.CurrentUser.WebApiKey;
            set => SteamRemoteClient.CurrentUser.WebApiKey = value;
        }

        public string FriendsInviteLink
        {
            get => SteamRemoteClient.CurrentUser.FriendsInvite;
            set
            {
                SteamRemoteClient.CurrentUser.FriendsInvite = value;
                OnPropertyChanged(nameof(FriendsInviteLink));
            }
        }

        public string TradeToken
        {
            get => SteamRemoteClient.CurrentUser.TradeToken;
            set
            {
                SteamRemoteClient.CurrentUser.TradeToken = value;
                OnPropertyChanged(nameof(TradeToken));
            }
        }


        public SteamWebViewModel()
        {
            GetWebApiKeyCommand = new AsyncRelayCommand(async (o) =>
            {
                await SteamRemoteClient.GetWebApiKey();
                if (!String.IsNullOrEmpty(SteamRemoteClient.CurrentUser.WebApiKey))
                {
                    Utils.Presentation.ShakingAnimation(o as System.Windows.FrameworkElement, true);
                    OnPropertyChanged(nameof(WebApiKey));
                }
            });

            RevokeWebApiKeyCommand = new AsyncRelayCommand(async (o) =>
            {
                if (await SteamRemoteClient.RevokeWebApiKey())
                {
                    Utils.Presentation.ShakingAnimation(o as System.Windows.FrameworkElement, true);
                }
                OnPropertyChanged(nameof(WebApiKey));
            });

            GetTradeTokenCommmand = new AsyncRelayCommand(async (o) =>
            {
                if (!String.IsNullOrEmpty(TradeToken = await SteamRemoteClient.GetTradeToken()))
                {
                    Utils.Presentation.ShakingAnimation(o as System.Windows.FrameworkElement, true);
                }
            });
            RefreshTradeTokenCommmand = new AsyncRelayCommand(async (o) =>
            {
                if (!String.IsNullOrEmpty(TradeToken = await SteamRemoteClient.GetTradeToken(true)))
                {
                    Utils.Presentation.ShakingAnimation(o as System.Windows.FrameworkElement, true);
                }
            });


        }
    }
}
