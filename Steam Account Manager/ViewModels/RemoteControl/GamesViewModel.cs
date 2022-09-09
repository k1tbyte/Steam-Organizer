using Steam_Account_Manager.Infrastructure;
using Steam_Account_Manager.Infrastructure.Base;
using System;
using System.Collections.ObjectModel;
using System.Windows.Controls;

namespace Steam_Account_Manager.ViewModels.RemoteControl
{
    internal class GamesViewModel : ObservableObject
    {
        public RelayCommand AddOtherIdCommand { get; set; }
        public AsyncRelayCommand ParseGamesComamnd { get; set; }

        private static ObservableCollection<Games> _games;
        public static event EventHandler GamesChanged;
        public  static ObservableCollection<Games> Games
        {
            get => _games;
            set
            {
                _games = value;
                GamesChanged?.Invoke(null, EventArgs.Empty);
            }
        }

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
            IsLibraryEmpty = Games.Count == 0;
            ParseGamesComamnd = new AsyncRelayCommand(async (o) =>
            {
                await SteamRemoteClient.ParseOwnedGamesAsync();
                Games = new ObservableCollection<Games>(SteamRemoteClient.CurrentUser.Games);
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

                    SteamRemoteClient.CurrentUser.Games.Add(ManualGame);
                    Games.Add(ManualGame);
                    IsLibraryEmpty = false;
                    OnPropertyChanged(nameof(Games));
                }
                txtBox.Text = "";
            });
        }
    }
}
