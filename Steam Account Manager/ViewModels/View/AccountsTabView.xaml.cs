using System;
using System.Linq;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Controls.Primitives;
using System.Windows.Media.Imaging;

namespace Steam_Account_Manager.ViewModels.View
{
    public partial class AccountTabView : UserControl
    {
        private AccountTabViewModel _currentViewModel;
        public AccountTabView(int id)
        {
            InitializeComponent();
            _currentViewModel = new AccountTabViewModel(id);
            this.DataContext = _currentViewModel;
        }

        private void VacIndicator_MouseEnter(object sender, System.Windows.Input.MouseEventArgs e)
        {
            Popup.PlacementTarget = VacIndicator;
            Popup.Placement = PlacementMode.Top;
            Popup.IsOpen = true;
            if (_currentViewModel.VacCount != -1)
                Header.PopupText.Text = (string)FindResource("atv_vacCount") + ' ' + _currentViewModel.VacCount.ToString();
            else
                Header.PopupText.Text = (string)FindResource("atv_vacInfoAbsent");
        }

        private void VacIndicator_MouseLeave(object sender, System.Windows.Input.MouseEventArgs e)
        {
            Popup.Visibility = Visibility.Collapsed;
            Popup.IsOpen = false;
        }

        private void SteamProfileImage_ImageFailed(object sender, ExceptionRoutedEventArgs e)
        {
            var uriSource = new Uri("/Images/default_steam_profile.png", UriKind.Relative);
            SteamProfileImage.Source = new BitmapImage(uriSource);
        }

        private void LastUpdateTime_MouseEnter(object sender, System.Windows.Input.MouseEventArgs e)
        {
            Popup.PlacementTarget = AvatarBorder;
            Popup.Placement = PlacementMode.Top;
            Popup.IsOpen = true;
            Header.PopupText.Text = $"Last update: {_currentViewModel.LastUpdateTime}";
        }

        private void NoteButton_MouseEnter(object sender, System.Windows.Input.MouseEventArgs e)
        {
            if (String.IsNullOrEmpty(_currentViewModel.Note))
                return;

            var length = _currentViewModel.Note.Length;
            Popup.PlacementTarget = NoteButton;
            Popup.Placement = PlacementMode.Top;
            Popup.IsOpen = true;
            Header.PopupText.Text = length > 645 ? _currentViewModel.Note.Remove(645, length - 645) + " ..." : _currentViewModel.Note;
        }
    }
}
