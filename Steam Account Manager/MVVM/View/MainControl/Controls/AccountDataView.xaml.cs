using Steam_Account_Manager.MVVM.ViewModels.MainControl;
using Steam_Account_Manager.Utils;
using System;
using System.Drawing;
using System.Globalization;
using System.IO;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Controls.Primitives;
using System.Windows.Media.Animation;
using System.Windows.Media.Imaging;
using static Steam_Account_Manager.Infrastructure.Converters.SteamIDConverter;

namespace Steam_Account_Manager.MVVM.View.MainControl.Controls
{

    public partial class AccountDataView : UserControl
    {
        AccountDataViewModel thisVM;
        DateTime timeStamp;
        public AccountDataView()
        {
            InitializeComponent();
            Loaded += (sender, e) => thisVM = this.DataContext as AccountDataViewModel;
        }
        

        public void SetAsDefault(bool scroll = false)
        {
            if (scroll)
                scrollViewer.ScrollToEnd();
            else
                scrollViewer.ScrollToTop();
        }


        private void VacBorder_MouseEnter(object sender, System.Windows.Input.MouseEventArgs e)
        {
            Popup.PlacementTarget = VacBorder;
            Popup.Placement = PlacementMode.Top;
            Popup.IsOpen = true;
            Header.PopupText.Text = $"{App.FindString("adat_popup_vacCount")} {thisVM.CurrentAccount.VacBansCount}";
            if (thisVM.CurrentAccount.DaysSinceLastBan != 0)
                Header.PopupText.Text += $"\n{App.FindString("adat_popup_daysFirstBan")} {thisVM.CurrentAccount.DaysSinceLastBan}";
        }

        private void YearsLabel_MouseEnter(object sender, System.Windows.Input.MouseEventArgs e)
        {
            Popup.PlacementTarget = YearsLabel;
            Popup.Placement = PlacementMode.Top;
            Popup.IsOpen = true;
            if (thisVM.CurrentAccount.AccCreatedDate != DateTime.MinValue)
                Header.PopupText.Text = $"{App.FindString("adat_popup_regDate")} {thisVM.CurrentAccount.AccCreatedDate}";
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
            if (!thisVM.CurrentAccount.TotalGamesCount.HasValue || !thisVM.CurrentAccount.IsProfilePublic)
            {
                Header.PopupText.Text = App.FindString("adat_popup_nullGames");
            }
            else
            {
                var playedPercent = ((float)thisVM.CurrentAccount.GamesPlayedCount.Value / thisVM.CurrentAccount.TotalGamesCount.Value).ToString("P1");
                Header.PopupText.Text = $"{App.FindString("adat_popup_countGames")} {thisVM.CurrentAccount.TotalGamesCount}\n{App.FindString("adat_popup_playedGames")} " +
                    $"{thisVM.CurrentAccount.GamesPlayedCount} ({playedPercent})\n" +
                    $"{App.FindString("adat_popup_playtime")} {thisVM.CurrentAccount.HoursOnPlayed.Value.ToString("#,#",CultureInfo.InvariantCulture)}h";
            }
        }


        private void steamImage_ImageFailed(object sender, ExceptionRoutedEventArgs e)
        {
            var uriSource = new Uri("/Images/default_steam_profile.png", UriKind.Relative);
            steamImage.Source = new BitmapImage(uriSource);
        }


        private void AntiSpamClicks(object sender, System.Windows.Input.MouseButtonEventArgs e)
        {
            if ((DateTime.Now - timeStamp).Ticks < 50000000)
            {
                e.Handled = true;
                return;
            }

            timeStamp = DateTime.Now;
        }
    }
}
