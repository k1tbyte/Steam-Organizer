using System.Linq;
using System.Text.RegularExpressions;
using System.Windows.Controls;
using System.Windows.Controls.Primitives;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows;
using Game = Steam_Account_Manager.Infrastructure.Models.JsonModels.Game;
using SteamRemoteClient = Steam_Account_Manager.Infrastructure.SteamRemoteClient.SteamRemoteClient;
using Steam_Account_Manager.MVVM.ViewModels.RemoteControl;

namespace Steam_Account_Manager.MVVM.View.RemoteControl.Controls
{
    public partial class GamesView : UserControl
    {

        private static readonly Regex _regex = new Regex("[^0-9.-]+");
        bool Error = false;
        public GamesView()
        {
            InitializeComponent();
            add_idBox.CommandBindings.Add(new CommandBinding(ApplicationCommands.Paste, PasteBlocked));
            this.DataContext = new GamesViewModel();

            SelectsText.Text = (string)App.Current.FindResource("rc_gv_selected") + "0";
            
        }

        private void PasteBlocked(object sender, ExecutedRoutedEventArgs e)
        {
            e.Handled = true;
        }

        private void games_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            if (Error)
            {
                SelectsText.Foreground = Utils.Presentation.StringToBrush("#b0b9c6");
                Error = false;
            }

            if (games.SelectedItems.Count == 0)
            {
                SelectsText.Text = (string)App.Current.FindResource("rc_gv_selected") + "0";
            }
            else if (games.SelectedItems.Count == 1)
            {
                SelectsText.Text = (string)App.Current.FindResource("rc_gv_selected") + "\nAppID: " + GamesViewModel.Games[games.SelectedIndex].AppID +
                    "\nPlaytime: " + GamesViewModel.Games[games.SelectedIndex].PlayTime_Forever / 60 + "h";
            }
            else
                SelectsText.Text = (string)App.Current.FindResource("rc_gv_selected") + games.SelectedItems.Count;
        }

        private void add_idBox_PreviewTextInput(object sender, TextCompositionEventArgs e)
        {
            e.Handled = _regex.IsMatch(e.Text);
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
                    SelectsText.Foreground = Brushes.PaleVioletRed;

                    if (games.SelectedItems.Count > 32)
                        SelectsText.Text = (string)App.Current.FindResource("rc_gv_maximumGames");
                    else if (games.SelectedItems.Count == 0)
                        SelectsText.Text = (string)App.Current.FindResource("rc_gv_selectGames");

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
    }
}
