using System;
using System.Windows.Controls;
using System.Windows;
using System.Windows.Controls.Primitives;

namespace Steam_Account_Manager.ViewModels.View
{

    public partial class AccountDataView : UserControl
    {

        private AccountDataViewModel currentViewModel;

        public AccountDataView(int id)
        {
            InitializeComponent();
            currentViewModel = new AccountDataViewModel(id);
            this.DataContext = currentViewModel;
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
            Header.PopupText.Text = "Date of registration: " + currentViewModel.CreatedDate;
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
            Header.PopupText.Text = "Games on account: " + currentViewModel.GamesTotal;
            Header.PopupText.Text += "\nGames played: " + currentViewModel.GamesPlayed + currentViewModel.PlayedPercent;
            Header.PopupText.Text += "\nPlaytime: " + currentViewModel.HoursOnPlayed.ToString() + "h";


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


        /*        private void steamImage_ImageFailed(object sender, System.Windows.ExceptionRoutedEventArgs e)
                {
                    var uriSource = new Uri("/Images/default_steam_profile.png", UriKind.Relative);
                    steamImage.Source = new BitmapImage(uriSource);
                }

                private void copy_Click(object sender, System.Windows.RoutedEventArgs e)
                {
                    URL.SelectAll();
                    URL.Copy();
                }*/
    }
}
