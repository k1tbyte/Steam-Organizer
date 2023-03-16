using System.Linq;
using System.Text.RegularExpressions;
using System.Windows.Controls;
using System.Windows.Controls.Primitives;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows;
using Game = Steam_Account_Manager.Infrastructure.Models.JsonModels.PlayerGame;
using SteamRemoteClient = Steam_Account_Manager.Infrastructure.SteamRemoteClient.SteamRemoteClient;
using Steam_Account_Manager.MVVM.ViewModels.RemoteControl;
using Steam_Account_Manager.Infrastructure.Models.JsonModels;
using System.Collections.ObjectModel;
using System;

namespace Steam_Account_Manager.MVVM.View.RemoteControl.Controls
{
    public partial class GamesView : UserControl
    {

        private static readonly Regex _regex = new Regex("[^0-9.-]+");
        bool Error = false;
        public GamesView()
        {
            InitializeComponent();
            this.DataContext = new GamesViewModel();
        }

        private async void Idle_Click(object sender, System.Windows.RoutedEventArgs e)
        {

            if (Idle.IsChecked == true)
            {
                var selectedCount = games.SelectedItems.Count;
                bool ContainCustom = false;
                if (!string.IsNullOrEmpty(Custom_gameTitle.Text))
                {
                    ContainCustom = true;
                    selectedCount++;
                }


                if (selectedCount > 32 || selectedCount == 0)
                {
                    Error = true;
                   
                    e.Handled = true;
                    Idle.IsChecked = false;
                }
                else if (selectedCount == 1)
                {
                    if (ContainCustom)
                        await SteamRemoteClient.IdleGame(null, Custom_gameTitle.Text);
                    else
                        await SteamRemoteClient.IdleGame(((Game)games.SelectedItem).AppID, Custom_gameTitle.Text);
                }
                else
                {
                    await SteamRemoteClient.IdleGames(games.SelectedItems.Cast<Game>().Select(game => game.AppID).ToHashSet(), Custom_gameTitle.Text);
                }
            }
            else
            {
                await SteamRemoteClient.StopIdle();
            }


        }


        private void rememberButton_Click(object sender, System.Windows.RoutedEventArgs e)
        {
            if(rememberButton.IsChecked == true)
            {
                SteamRemoteClient.CurrentUser.RememberGamesIds = games.SelectedItems.Cast<Game>().Select(game => game.AppID).ToHashSet();
                return;
            }

            SteamRemoteClient.CurrentUser.RememberGamesIds = null;
        }

        private void popup_MouseLeave(object sender, MouseEventArgs e)
        {
            Popup.Visibility = Visibility.Collapsed;
            Popup.IsOpen = false;
        }


        private void ToggleButton_PreviewMouseLeftButtonDown(object sender, MouseButtonEventArgs e)
        {
            var button = sender as ToggleButton;
            var selectedCount = (this.DataContext as GamesViewModel).SelectedGamesCount;

            if (button.IsChecked == true)
                (this.DataContext as GamesViewModel).SelectedGamesCount--;
            else if (button.IsChecked == false && selectedCount < 32)
                (this.DataContext as GamesViewModel).SelectedGamesCount++;
            else
            {
                e.Handled = true;
                return;
            }

            Utils.Common.BinarySerialize((this.DataContext as GamesViewModel).Games.ToArray(), $"{App.WorkingDirectory}\\Cache\\Games\\{76561199051937995}.dat");
        }
    }
}
