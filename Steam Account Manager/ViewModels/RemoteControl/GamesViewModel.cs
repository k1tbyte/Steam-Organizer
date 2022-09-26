using Steam_Account_Manager.Infrastructure;
using Steam_Account_Manager.Infrastructure.SteamRemoteClient;
using Steam_Account_Manager.Infrastructure.Models.JsonModels;
using System;
using System.Collections.ObjectModel;
using System.Windows.Controls;
using Steam_Account_Manager.ViewModels.RemoteControl.View;
using System.Diagnostics;

namespace Steam_Account_Manager.ViewModels.RemoteControl
{
    internal class GamesViewModel : ObservableObject
    {
        public RelayCommand AddOtherIdCommand { get; set; }
        public AsyncRelayCommand ParseGamesComamnd { get; set; }
        public RelayCommand OpenGameAchievementCommand { get; set; }
        public RelayCommand OpenSteamStoreCommand { get; set; }


        public static event EventHandler GamesChanged;
        public  static ObservableCollection<Game> Games
        {
            get => SteamRemoteClient.CurrentUser.Games;
            set
            {
                SteamRemoteClient.CurrentUser.Games = value;
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
                await SteamRemoteClient.GetOwnedGames();
                IsLibraryEmpty = Games.Count == 0;
                OnPropertyChanged(nameof(Games));
            });

            AddOtherIdCommand = new RelayCommand(o =>
            {
                var txtBox = o as TextBox;

                if (int.TryParse(txtBox.Text, out int id) && id != 0)
                {
                    for (int i = 0; i < Games.Count; i++)
                        if (Games[i].AppID == id) return;

                    var ManualGame = new Game()
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

            OpenGameAchievementCommand = new RelayCommand(o =>
            {
                AchievementsView achievementsWindow = new AchievementsView(Convert.ToUInt64(((Game)o).AppID));
                ShowDialogWindow(achievementsWindow);
            });

            OpenSteamStoreCommand = new RelayCommand(o =>
            {
                using (Process.Start(new ProcessStartInfo("https://store.steampowered.com/app/" + ((Game)o).AppID) { UseShellExecute = true })) ;
            });
        }
    }
}
