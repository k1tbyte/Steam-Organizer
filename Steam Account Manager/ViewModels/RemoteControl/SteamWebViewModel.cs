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
                await SteamRemoteClient.GetSteamWebApiKey();
                OnPropertyChanged(nameof(WebApiKey));
            });
        }
    }
}
