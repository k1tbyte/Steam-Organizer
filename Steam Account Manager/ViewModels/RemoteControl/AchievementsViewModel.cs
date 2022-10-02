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
using System.ComponentModel;
using System.Windows.Data;
using System.Windows.Controls;
using Steam_Account_Manager.Themes.MessageBoxes;

namespace Steam_Account_Manager.ViewModels.RemoteControl
{
    internal class AchievementsViewModel : ObservableObject
    {
        private ulong AppID;
        private int _totalUnlocked;
        public ICollectionView AchievementShowFilter { get; set; }
        public AsyncRelayCommand SetAchievementCommand { get; set; }

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
            AchievementShowFilter = CollectionViewSource.GetDefaultView(Achievements);
            TotalUnlocked = Achievements.Where(o => o.IsSet).Count();
        }

        public int TotalUnlocked
        {
            get => _totalUnlocked;
            set
            {
                _totalUnlocked = value;
                OnPropertyChanged(nameof(TotalUnlocked));
            }
        }

       
        public AchievementsViewModel(ulong appID)
        {
            AppID = appID;
            _ = GetGameAchievements();
            SetAchievementCommand = new AsyncRelayCommand(async(o) =>
            {
                var SelectedItems = ((ListBox)o).SelectedItems.Cast<StatData>();
                if(await SteamRemoteClient.SetAppAchievements(AppID, SelectedItems))
                {
                    foreach (var item in SelectedItems)
                    {
                        if(item.IsSet)
                        {
                            item.IsSet = false;
                            item.CurrentIconView = item.IconHashGray;
                        }
                        else
                        {
                            item.IsSet = true;
                            item.CurrentIconView = item.IconHash;
                        }
                    }
                    AchievementShowFilter.Refresh();

                    ((ListBox)o).UnselectAll();
                    MessageBoxes.PopupMessageBox($"{SelectedItems.Count()} achievements have been changed.") ;
                }
            });
        }
    }
}
