using Steam_Account_Manager.Infrastructure;
using Steam_Account_Manager.Infrastructure.SteamRemoteClient;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace Steam_Account_Manager.ViewModels.RemoteControl
{
    internal class SteamWebViewModel : ObservableObject
    {
        public AsyncRelayCommand GetWebApiKeyCommand { get; set; }
        public RelayCommand GetCsgoMatchKeyCommand { get; set; }

        public string WebApiKey
        {
            get => SteamRemoteClient.CurrentUser.WebApiKey;
            set
            {
                SteamRemoteClient.CurrentUser.WebApiKey = value;
            }
        }


        public SteamWebViewModel()
        {
            GetWebApiKeyCommand = new AsyncRelayCommand(async (o) =>
            {
                await SteamRemoteClient.GetWebApiKey();
                if (!String.IsNullOrEmpty(SteamRemoteClient.CurrentUser.WebApiKey))
                {
                    Themes.Animations.ShakingAnimation(o as System.Windows.FrameworkElement,true);
                    OnPropertyChanged(nameof(WebApiKey));
                }
            });

            GetCsgoMatchKeyCommand = new RelayCommand(o =>
            {
                SteamRemoteClient.RevokeWebApiKey();
            }); 

        }
    }
}
