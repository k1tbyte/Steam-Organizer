using Newtonsoft.Json;
using Steam_Account_Manager.Infrastructure;
using Steam_Account_Manager.Infrastructure.Base;
using Steam_Account_Manager.Infrastructure.Parsers;
using System;
using System.Collections.Generic;
using System.Collections.ObjectModel;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Data;

namespace Steam_Account_Manager.ViewModels.RemoteControl
{
    internal class GamesViewModel : ObservableObject
    {
        public AsyncRelayCommand ParseGamesComamnd { get; set; }
        public ObservableCollection<Games> Games { get; private set; }
        
        public GamesViewModel()
        {
            SteamRemoteClient.CurrentUser = JsonConvert.DeserializeObject<RootObject>(File.ReadAllText($@".\RemoteUsers\D1lettantZz.json"));
            Games = new ObservableCollection<Games>(SteamRemoteClient.CurrentUser.RemoteUser.Games);
            ParseGamesComamnd = new AsyncRelayCommand(async (o) =>
            {
                await SteamRemoteClient.ParseOwnedGamesAsync();
                Games = new ObservableCollection<Games>(SteamRemoteClient.CurrentUser.RemoteUser.Games);
                OnPropertyChanged(nameof(Games));
            });
        }
    }
}
