using Steam_Account_Manager.Infrastructure;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Threading;
using Steam_Account_Manager.Infrastructure.SteamRemoteClient;
using System.Collections.ObjectModel;
using Steam_Account_Manager.Infrastructure.Models;

namespace Steam_Account_Manager.ViewModels.RemoteControl
{
    internal class AchievementsViewModel : ObservableObject
    {
        private ulong AppID;
        private ObservableCollection<StatData> _achievemets;
        public ObservableCollection<StatData> Achievements
        {
            get => _achievemets;
            set
            {
                _achievemets = value;
                OnPropertyChanged(nameof(Achievements));
            }
        }

        private async Task GetGameAchievements()
        {
            Achievements = await SteamRemoteClient.GetAppAchievements(AppID);
        }

        public AchievementsViewModel(ulong appID)
        {
            AppID = appID;
            _ = GetGameAchievements();
        }
    }
}
