using System.Windows.Controls;
using System.Windows.Controls.Primitives;
using System.Windows;
using Steam_Account_Manager.ViewModels;
using System.Windows.Media.Imaging;
using System;

namespace Steam_Account_Manager.ViewModels.View
{
    /// <summary>
    /// Логика взаимодействия для AccountTabView.xaml
    /// </summary>
    public partial class AccountTabView : UserControl
    {
        private AccountTabViewModel currentViewModel;
        public AccountTabView(int id)
        {
            InitializeComponent();
            currentViewModel = new AccountTabViewModel(id);
            this.DataContext = currentViewModel;
        }

        private void VacIndicator_MouseEnter(object sender, System.Windows.Input.MouseEventArgs e)
        {
            Popup.PlacementTarget = VacIndicator;
            Popup.Placement = PlacementMode.Top;
            Popup.IsOpen = true;
            Header.PopupText.Text = "Vac count: " + currentViewModel.VacCount.ToString();
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
    }
}
