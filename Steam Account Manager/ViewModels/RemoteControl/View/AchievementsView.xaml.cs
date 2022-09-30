using Steam_Account_Manager.Infrastructure.Models;
using Steam_Account_Manager.Infrastructure.SteamRemoteClient;
using System.Windows;
using System.Windows.Data;
using System.Linq;
using System.Collections.Generic;
using System.Windows.Forms;
using System.Collections.ObjectModel;

namespace Steam_Account_Manager.ViewModels.RemoteControl.View
{
    public partial class AchievementsView : Window
    {
        ulong appId;
        public AchievementsView(ulong appID)
        {
            InitializeComponent();
            this.appId = appID;
            this.Header.Text = $"Achievements AppID: {appID}";
            this.DataContext = new AchievementsViewModel(appID);
        }

        private void Close_Click(object sender, RoutedEventArgs e)
        {
            this.Close();
        }

        private void Border_MouseLeftButtonDown(object sender, System.Windows.Input.MouseButtonEventArgs e)
        {
            this.DragMove();
        }

        private void ComboBox_SelectionChanged(object sender, System.Windows.Controls.SelectionChangedEventArgs e)
        {
            if(this.DataContext != null && ((AchievementsViewModel)this.DataContext).Achievements != null)
            {
                switch (filter.SelectedIndex)
                {
                    case 0:
                        ((AchievementsViewModel)this.DataContext).AchievementShowFilter.Filter = o => ((StatData)o) != null;
                        break;
                    case 1:
                        ((AchievementsViewModel)this.DataContext).AchievementShowFilter.Filter = o => !((StatData)o).IsSet;
                        break;
                    case 2:
                        ((AchievementsViewModel)this.DataContext).AchievementShowFilter.Filter = o => ((StatData)o).IsSet;
                        break;
                }
                
            }
        }

        private void  SelectAll_Click(object sender, RoutedEventArgs e)
        {
            achievements.SelectAll();
        }

        private void UnselectAll_Click(object sender, RoutedEventArgs e)
        {
            achievements.UnselectAll();
        }

        private async void Button_Click(object sender, RoutedEventArgs e)
        {
            var SelectedItems = achievements.SelectedItems.Cast<StatData>().Select(o => o.BitNum);
            if(await SteamRemoteClient.SetAppAchievements(appId, ((AchievementsViewModel)this.DataContext).Achievements, SelectedItems))
            {
                /*                foreach (var item in SelectedItems)
                                {
                                    if (newCollection[item - 1].IsSet)
                                    {
                                        newCollection[item - 1].IsSet = false;
                                        newCollection[item - 1].Name = "EHFEFEFEFEFEFE";
                                    }
                                    else
                                    {
                                        newCollection[item - 1].IsSet = false;
                                        newCollection[item - 1].Name = "EHFEFEFEFEFEFE";
                                    }
                                }*/

            }
            achievements.UnselectAll();
        }
    }
}
