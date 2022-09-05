using Steam_Account_Manager.Infrastructure;
using Steam_Account_Manager.Infrastructure.Base;
using System.Collections.ObjectModel;
using System.Windows.Controls;

namespace Steam_Account_Manager.ViewModels.RemoteControl
{
    internal class GamesViewModel : ObservableObject
    {
        public RelayCommand AddOtherIdCommand { get; set; }
        public AsyncRelayCommand ParseGamesComamnd { get; set; }
        public ObservableCollection<Games> Games { get; private set; }
        private bool _isLibraryEmpty;
        public bool IsLibraryEmpty
        {
            get => _isLibraryEmpty;
            set
            {
                _isLibraryEmpty = value;
                OnPropertyChanged(nameof(IsLibraryEmpty));
            }
        }
        
        public GamesViewModel()
        {
           // SteamRemoteClient.CurrentUser = JsonConvert.DeserializeObject<RootObject>(File.ReadAllText($@".\RemoteUsers\D1lettantZz.json"));
            Games = new ObservableCollection<Games>(SteamRemoteClient.CurrentUser.RemoteUser.Games);
            IsLibraryEmpty = Games.Count == 0;
            ParseGamesComamnd = new AsyncRelayCommand(async (o) =>
            {
                await SteamRemoteClient.ParseOwnedGamesAsync();
                Games = new ObservableCollection<Games>(SteamRemoteClient.CurrentUser.RemoteUser.Games);
                IsLibraryEmpty = Games.Count == 0;
                OnPropertyChanged(nameof(Games));
            });

            AddOtherIdCommand = new RelayCommand(o =>
            {
                var txtBox = o as TextBox;

                if (uint.TryParse(txtBox.Text, out uint id) && id != 0)
                {
                    for (int i = 0; i < Games.Count; i++)
                        if (Games[i].AppID == id) return;

                    var ManualGame = new Games()
                    {
                        AppID = id,
                        Name = "Manually added",
                        PlayTime_Forever = 0,
                        ImageURL = $"https://cdn.akamai.steamstatic.com/steam/apps/{id}/header.jpg"
                    };

                    SteamRemoteClient.CurrentUser.RemoteUser.Games.Add(ManualGame);
                    Games.Add(ManualGame);
                    IsLibraryEmpty = false;
                    OnPropertyChanged(nameof(Games));
                }
                txtBox.Text = "";
            });
        }
    }
}
