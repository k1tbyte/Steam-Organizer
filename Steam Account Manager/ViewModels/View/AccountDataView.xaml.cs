using System;
using System.Windows.Controls;
using System.Windows;
using System.Windows.Controls.Primitives;
using System.Windows.Media.Imaging;

namespace Steam_Account_Manager.ViewModels.View
{

    public partial class AccountDataView : UserControl
    {

        private AccountDataViewModel currentViewModel;

        public AccountDataView(int id)
        {
            bool scrollToEnd = false;
            InitializeComponent();

            //Если id с минусом - прокрутка вниз
            if (id < 0)
            {
                scrollToEnd = true;
                id *= -1;
            }
            currentViewModel = new AccountDataViewModel(id-1);
            this.DataContext = currentViewModel;
            if (scrollToEnd) scrollViewer.ScrollToEnd();
        }

        private void VacBorder_MouseEnter(object sender, System.Windows.Input.MouseEventArgs e)
        {
            Popup.PlacementTarget = VacBorder;
            Popup.Placement = PlacementMode.Top;
            Popup.IsOpen = true;
            Header.PopupText.Text = "Vac count: " + currentViewModel.VacCount.ToString();
            if (currentViewModel.DaysSinceLastBan != 0) Header.PopupText.Text += "\nDays since first ban: " + currentViewModel.DaysSinceLastBan.ToString();
        }

        private void YearsLabel_MouseEnter(object sender, System.Windows.Input.MouseEventArgs e)
        {
            Popup.PlacementTarget = YearsLabel;
            Popup.Placement = PlacementMode.Top;
            Popup.IsOpen = true;
            if (currentViewModel.CreatedDate != DateTime.MinValue)
                Header.PopupText.Text = "Date of registration: " + currentViewModel.CreatedDate;
            else
                Header.PopupText.Text = "Registration date unknown";


        }

        private void Popup_MouseLeave(object sender, System.Windows.Input.MouseEventArgs e)
        {
            Popup.Visibility = Visibility.Collapsed;
            Popup.IsOpen = false;
        }

        private void GamesCountLabel_MouseEnter(object sender, System.Windows.Input.MouseEventArgs e)
        {
           Popup.PlacementTarget = GamesCountLabel;
            Popup.Placement = PlacementMode.Top;
            Popup.IsOpen = true;
            if(currentViewModel.GamesTotal == "-" || currentViewModel.ProfileVisiblity == "Private")
            {
                Header.PopupText.Text = "Games missing or profile is private";
            }
            else
            {
                Header.PopupText.Text = "Games on account: " + currentViewModel.GamesTotal;
                Header.PopupText.Text += "\nGames played: " + currentViewModel.GamesPlayed + currentViewModel.PlayedPercent;
                Header.PopupText.Text += "\nPlaytime: " + currentViewModel.HoursOnPlayed;
                if (currentViewModel.HoursOnPlayed != "Private") Header.PopupText.Text += "h";
            }


        }

        private void SaveButton_MouseEnter(object sender, System.Windows.Input.MouseEventArgs e)
        {
            Popup.PlacementTarget = SaveButton;
            Popup.Placement = PlacementMode.Top;
            Popup.IsOpen = true;
            Header.PopupText.Text = "Save account changes";
        }

        private void ExportButton_MouseEnter(object sender, System.Windows.Input.MouseEventArgs e)
        {
            Popup.PlacementTarget = ExportButton;
            Popup.Placement = PlacementMode.Top;
            Popup.IsOpen = true;
            Header.PopupText.Text = "Export account to hard drive";
        }

        private void RefreshButton_MouseEnter(object sender, System.Windows.Input.MouseEventArgs e)
        {
            Popup.PlacementTarget = RefreshButton;
            Popup.Placement = PlacementMode.Top;
            Popup.IsOpen = true;
            Header.PopupText.Text = "Update account information";
        }

        private void CurrentRank_MouseEnter(object sender, System.Windows.Input.MouseEventArgs e)
        {
            Popup.PlacementTarget = CurrentRank;
            Popup.Placement = PlacementMode.Top;
            Popup.IsOpen = true;
            Header.PopupText.Text = "Current rank 5x5";
        }

        private void BestRank_MouseEnter(object sender, System.Windows.Input.MouseEventArgs e)
        {
            Popup.PlacementTarget = BestRank;
            Popup.Placement = PlacementMode.Top;
            Popup.IsOpen = true;
            Header.PopupText.Text = "Best rank 5x5";
        }

        private void steamImage_ImageFailed(object sender, ExceptionRoutedEventArgs e)
        {
            var uriSource = new Uri("/Images/default_steam_profile.png", UriKind.Relative);
            steamImage.Source = new BitmapImage(uriSource);
        }

        //Confirmation to adding 2fa
        private void TwoFaActivate_Click(object sender, RoutedEventArgs e)
        {
            TwoFaAuthAddConfirm.Visibility = Visibility.Visible;
        }

        private void CloseConfirm_Click(object sender, RoutedEventArgs e)
        {
            TwoFaAuthAddConfirm.Visibility = Visibility.Hidden;
        }
    }
}
