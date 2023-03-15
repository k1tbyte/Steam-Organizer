using Steam_Account_Manager.Infrastructure.Models.JsonModels;
using Steam_Account_Manager.Infrastructure.SteamRemoteClient;
using Steam_Account_Manager.MVVM.Core;
using Steam_Account_Manager.MVVM.View.RemoteControl.Controls;
using System;
using System.Collections.ObjectModel;
using System.Diagnostics;
using System.Windows.Controls;

namespace Steam_Account_Manager.MVVM.ViewModels.RemoteControl
{
    internal class GamesViewModel : ObservableObject
    {
        public RelayCommand AddOtherIdCommand { get; set; }
        public AsyncRelayCommand ParseGamesComamnd { get; set; }
        public RelayCommand OpenGameAchievementCommand { get; set; }
        public RelayCommand OpenSteamStoreCommand { get; set; }


        public static event EventHandler GamesChanged;
        public static ObservableCollection<PlayerGame> Games
        {
            get => SteamRemoteClient.CurrentUser?.Games;
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
            //IsLibraryEmpty = Games.Count == 0;

            SteamRemoteClient.CurrentUser = new User();
            var usrid = 76561199051937995;
            var gamesPath = $"{App.WorkingDirectory}\\Cache\\Games\\{usrid}.dat";
            if(System.IO.File.Exists(gamesPath))
                Games = new ObservableCollection<PlayerGame>(Utils.Common.BinaryDeserialize<PlayerGame[]>(gamesPath));

            ParseGamesComamnd = new AsyncRelayCommand(async (o) =>
            {
                await SteamRemoteClient.GetOwnedGames();
                IsLibraryEmpty = Games.Count == 0;
            });

            AddOtherIdCommand = new RelayCommand(o =>
            {
                var txtBox = o as TextBox;

                if (int.TryParse(txtBox.Text, out int id) && id != 0)
                {
                    for (int i = 0; i < Games.Count; i++)
                        if (Games[i].AppID == id) return;

                    var ManualGame = new PlayerGame()
                    {
                        AppID = id,
                        Name = "Manually added",
                        PlayTime_Forever = 0,
                        ImageURL = $"https://cdn.akamai.steamstatic.com/steam/apps/{id}/header.jpg"
                    };

                    SteamRemoteClient.CurrentUser.Games.Add(ManualGame);
                    Games.Add(ManualGame);
                    IsLibraryEmpty = false;
                }
                txtBox.Text = "";
            });

            OpenGameAchievementCommand = new RelayCommand(o =>
            {
                AchievementsView achievementsWindow = new AchievementsView(Convert.ToUInt64(((PlayerGame)o).AppID));
                Utils.Presentation.OpenDialogWindow(achievementsWindow);
            });

            OpenSteamStoreCommand = new RelayCommand(o =>
            {
                using (Process.Start(new ProcessStartInfo("https://store.steampowered.com/app/" + ((PlayerGame)o).AppID) { UseShellExecute = true })) ;
            });
        }
    }
}
