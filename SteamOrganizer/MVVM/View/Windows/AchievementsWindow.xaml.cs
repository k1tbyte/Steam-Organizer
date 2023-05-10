using SteamOrganizer.Infrastructure.Models;
using SteamOrganizer.Infrastructure.SteamRemoteClient;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;

namespace SteamOrganizer.MVVM.View.Windows
{
    public partial class AchievementsWindow : Window
    {
        private readonly int appId;
        private readonly List<StatData> achievementsList;
        private readonly ICollectionView AchievementShowFilter;
        internal AchievementsWindow(int appID,ref List<StatData> dataContent)
        {
            InitializeComponent();
            this.appId               = appID;
            this.Header.Text         = $"Achievements: {appID}";
            achievements.ItemsSource = achievementsList = dataContent;
            AchievementShowFilter    = CollectionViewSource.GetDefaultView(achievementsList);
            UnlockedCount.Text       = $"{achievementsList.Count(o => o.IsSet)}/{achievementsList.Count}";
        }

        private async void SetAchievements(object sender, RoutedEventArgs e)
        {
           /* if (achievements.SelectedItems.Count <= 0) return;

            var SelectedItems = achievements.SelectedItems.Cast<StatData>();
            if (await SteamRemoteClient.SetAppAchievements(appId, SelectedItems))
            {
                foreach (var item in SelectedItems)
                {
                    if (item.IsSet)
                    {
                        item.IsSet = false;
                    }
                    else
                    {
                        item.IsSet = true;
                    }
                }
                AchievementShowFilter.Refresh();

                Utils.Presentation.OpenPopupMessageBox($"{achievements.SelectedItems.Count} achievements have been changed.");
                UnlockedCount.Text = $"{achievementsList.Count(o => o.IsSet)}/{achievementsList.Count}";
                achievements.UnselectAll();
            }*/
        }

        private void Close_Click(object sender, RoutedEventArgs e) => this.Close();
        private void BorderDragMove(object sender, System.Windows.Input.MouseButtonEventArgs e) => this.DragMove();
        private void ComboBox_SelectionChanged(object sender, SelectionChangedEventArgs e)
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
        private void SelectInvariant_Click(object sender, RoutedEventArgs e)
        {
            if (achievements.SelectedItems.Count != 0)
                achievements.UnselectAll();

            for ( int i = 0; i < achievementsList.Count; i++)
            {
                if ((sender == locked && !achievementsList[i].IsSet) || (sender == unlocked && achievementsList[i].IsSet))
                {
                    achievements.SelectedItems.Add(achievementsList[i]);
                }
            }

        }
        private void TextBox_TextChanged(object sender, TextChangedEventArgs e) => ComboBox_SelectionChanged(null, null);
    }
}
