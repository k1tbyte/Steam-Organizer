using Steam_Account_Manager.Infrastructure.SteamRemoteClient;
using Steam_Account_Manager.MVVM.ViewModels.RemoteControl;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Media.Animation;

namespace Steam_Account_Manager.MVVM.View.RemoteControl.Controls
{
    public partial class SteamWebView : UserControl
    {
        bool IsCommentPrivacyValid;
        public SteamWebView()
        {
            InitializeComponent();
            this.DataContext = new SteamWebViewModel();
            GettingPrivacySettings();
        }

        private async void GettingPrivacySettings()
        {
            var privacy = await SteamRemoteClient.GetProfilePrivacy();

            App.Current.Dispatcher.Invoke(new System.Action(() =>
            {
                ProfileBox.SelectedIndex = privacy.privacy_state;
                FriendsBox.SelectedIndex = privacy.privacy_state_friendslist;
                GiftsBox.SelectedIndex = privacy.privacy_state_gifts;
                InventoryBox.SelectedIndex = privacy.privacy_state_inventory;
                GameDetailsBox.SelectedIndex = privacy.privacy_state_ownedgames;
                GamePlaytimeBox.SelectedIndex = privacy.privacy_state_playtime;
            }));

        }

        private async void ApplyPrivacyChanges_Click(object sender, RoutedEventArgs e)
        {
            if (await SteamRemoteClient.SetProfilePrivacy(
                ProfileBox.SelectedIndex, InventoryBox.SelectedIndex,
                GiftsBox.SelectedIndex, GameDetailsBox.SelectedIndex,
                GamePlaytimeBox.SelectedIndex, FriendsBox.SelectedIndex,
                IsCommentPrivacyValid ? CommentsBox.SelectedIndex : 0))
            {
                Themes.Animations.ShakingAnimation(succesPrivacyApply, true);
            }
        }

        private void CommentsBox_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            IsCommentPrivacyValid = true;
        }

        private void Button_Click(object sender, RoutedEventArgs e)
        {
            var angleAnim = new DoubleAnimation(360, System.TimeSpan.FromSeconds(1d));
            refreshTrade.BeginAnimation(MahApps.Metro.IconPacks.PackIconControlBase.RotationAngleProperty, angleAnim);
        }
    }
}
