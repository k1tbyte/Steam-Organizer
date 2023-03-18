using Steam_Account_Manager.Infrastructure.Models;
using Steam_Account_Manager.Infrastructure.SteamRemoteClient;
using System.Collections.ObjectModel;
using System.ComponentModel;
using System.Linq;
using System.Runtime.InteropServices.ComTypes;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;

namespace Steam_Account_Manager.MVVM.View.Windows
{
    public partial class AchievementsWindow : Window
    {
        int appId;
        private ObservableCollection<StatData> achievementsList;
        private ICollectionView AchievementShowFilter;
        public AchievementsWindow(int appID)
        {
            InitializeComponent();
            this.appId = appID;
            this.Header.Text = $"Achievements AppID: {appID}";
            RetrieveAppAchievements();
        }

        private async void RetrieveAppAchievements()
        {
            achievementsList = await SteamRemoteClient.GetAppAchievements((ulong)appId);
            achievements.ItemsSource = achievementsList;
            AchievementShowFilter = CollectionViewSource.GetDefaultView(achievementsList);
            UnlockedCount.Text = $"{achievementsList.Count(o => o.IsSet)}/{achievementsList.Count}";
        }

        private void Close_Click(object sender, RoutedEventArgs e) => this.Close();

        private void BorderDragMove(object sender, System.Windows.Input.MouseButtonEventArgs e) => this.DragMove();
        

        private void ComboBox_SelectionChanged(object sender, System.Windows.Controls.SelectionChangedEventArgs e)
        {
            if (achievementsList == null) return;

            switch (filter.SelectedIndex)
            {
                case 0:
                    AchievementShowFilter.Filter = o => ((StatData)o) != null && (string.IsNullOrWhiteSpace(search.Text) || ((StatData)o).Name.ToLower().Contains(search.Text.ToLower()));
                    break;
                case 1:
                    AchievementShowFilter.Filter = o => !((StatData)o).IsSet && (string.IsNullOrWhiteSpace(search.Text) || ((StatData)o).Name.ToLower().Contains(search.Text.ToLower()));
                    break;
                case 2:
                    AchievementShowFilter.Filter = o => ((StatData)o).IsSet && (string.IsNullOrWhiteSpace(search.Text) || ((StatData)o).Name.ToLower().Contains(search.Text.ToLower()));
                    break;
            }
        }

        private void SelectAll_Click(object sender, RoutedEventArgs e)    => achievements.SelectAll();
        private void UnselectAll_Click(object sender, RoutedEventArgs e)  => achievements.UnselectAll();
        private void TextBox_TextChanged(object sender, TextChangedEventArgs e) => ComboBox_SelectionChanged(null, null);
        
    }
}
