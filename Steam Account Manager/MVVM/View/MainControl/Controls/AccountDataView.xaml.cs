using Steam_Account_Manager.MVVM.ViewModels.MainControl;
using System;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Controls.Primitives;
using System.Windows.Media.Imaging;

namespace Steam_Account_Manager.MVVM.View.MainControl.Controls
{

    public partial class AccountDataView : UserControl
    {

        public AccountDataView() => InitializeComponent();
        

        public void SetAsDefault(bool scroll = false)
        {
            if (scroll)
                scrollViewer.ScrollToEnd();
            else
                scrollViewer.ScrollToTop();

            expandCsgoButton.IsChecked = expandCommunityButton.IsChecked = expandCommunityButton.IsChecked = true;
            expandButtonUplay.IsChecked = expandButtonRockstarGames.IsChecked = expandButtonOrigin.IsChecked = expandButtonMail.IsChecked = false;
        }


        private void VacBorder_MouseEnter(object sender, System.Windows.Input.MouseEventArgs e)
        {
            Popup.PlacementTarget = VacBorder;
            Popup.Placement = PlacementMode.Top;
            Popup.IsOpen = true;
            Header.PopupText.Text = App.FindString("adat_popup_vacCount") + " " + ((AccountDataViewModel)this.DataContext).VacCount.ToString();
            if (((AccountDataViewModel)this.DataContext).DaysSinceLastBan != 0) Header.PopupText.Text += '\n' +
                    App.FindString("adat_popup_daysFirstBan") + " " +
                    ((AccountDataViewModel)this.DataContext).DaysSinceLastBan.ToString();
        }

        private void YearsLabel_MouseEnter(object sender, System.Windows.Input.MouseEventArgs e)
        {
            Popup.PlacementTarget = YearsLabel;
            Popup.Placement = PlacementMode.Top;
            Popup.IsOpen = true;
            if (((AccountDataViewModel)this.DataContext).CreatedDate != DateTime.MinValue)
                Header.PopupText.Text = App.FindString("adat_popup_regDate") + " " + ((AccountDataViewModel)this.DataContext).CreatedDate;
            else
                Header.PopupText.Text = App.FindString("adat_popup_regDateUnknown");
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
            if (((AccountDataViewModel)this.DataContext).GamesTotal == "-" || ((AccountDataViewModel)this.DataContext).ProfileVisiblity == "Private")
            {
                Header.PopupText.Text = App.FindString("adat_popup_nullGames");
            }
            else
            {
                Header.PopupText.Text = App.FindString("adat_popup_countGames") + " " + ((AccountDataViewModel)this.DataContext).GamesTotal + '\n';
                Header.PopupText.Text += App.FindString("adat_popup_playedGames") + " " + ((AccountDataViewModel)this.DataContext).GamesPlayed + ((AccountDataViewModel)this.DataContext).PlayedPercent + '\n';
                Header.PopupText.Text += App.FindString("adat_popup_playtime") + " " + ((AccountDataViewModel)this.DataContext).HoursOnPlayed;
                if (((AccountDataViewModel)this.DataContext).HoursOnPlayed != "Private") Header.PopupText.Text += "h";
            }
        }


        private void steamImage_ImageFailed(object sender, ExceptionRoutedEventArgs e)
        {
            var uriSource = new Uri("/Images/default_steam_profile.png", UriKind.Relative);
            steamImage.Source = new BitmapImage(uriSource);
        }


        private void CloseConfirm_Click(object sender, RoutedEventArgs e)
        {
            TwoFaAuthAddConfirm.Visibility = Visibility.Hidden;
        }
    }
}
