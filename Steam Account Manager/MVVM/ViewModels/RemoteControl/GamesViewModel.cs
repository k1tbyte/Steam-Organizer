using Steam_Account_Manager.Infrastructure.Models.JsonModels;
using Steam_Account_Manager.Infrastructure.SteamRemoteClient;
using Steam_Account_Manager.MVVM.Core;
using Steam_Account_Manager.MVVM.View.RemoteControl.Controls;
using System;
using System.Collections.ObjectModel;
using System.Diagnostics;
using System.Linq;
using System.Windows.Controls;

namespace Steam_Account_Manager.MVVM.ViewModels.RemoteControl
{
    internal class GamesViewModel : ObservableObject
    {
        public AsyncRelayCommand ParseGamesComamnd { get; set; }
        public RelayCommand OpenGameAchievementCommand { get; set; }
        public RelayCommand OpenSteamStoreCommand { get; set; }

        private ObservableCollection<PlayerGame> _games;
        public  ObservableCollection<PlayerGame> Games
        {
            get => _games;
            set => SetProperty(ref _games, value);
        }

        private int _selectedGamesCount;
        public int SelectedGamesCount { get => _selectedGamesCount; set => SetProperty(ref _selectedGamesCount, value); }

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

            var gamesPath = $"{App.WorkingDirectory}\\Cache\\Games\\{76561199051937995}.dat";
            if(System.IO.File.Exists(gamesPath))
                Games = new ObservableCollection<PlayerGame>(Utils.Common.BinaryDeserialize<PlayerGame[]>(gamesPath));
            SelectedGamesCount = Games.Where(o => o.IsSelected).Count();

            ParseGamesComamnd = new AsyncRelayCommand(async (o) =>
            {
                await SteamRemoteClient.GetOwnedGames();
                IsLibraryEmpty = Games.Count == 0;
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
