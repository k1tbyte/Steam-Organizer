using Steam_Account_Manager.Infrastructure.SteamRemoteClient;
using Steam_Account_Manager.MVVM.ViewModels;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Controls.Primitives;
using System.Windows.Input;

namespace Steam_Account_Manager.MVVM.View.Controls
{
    public partial class RemoteControlView : UserControl
    {
        int CurrentCollectionCount;
        public RemoteControlView()
        {
            InitializeComponent();
            this.DataContext = new RemoteControlViewModel();
        }

        private void IdCopyButton_Click(object sender, RoutedEventArgs e) => Utils.Win32.Clipboard.SetText(steamIDbox.Text);
        private void ui_box_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
          /*  switch (ui_box.SelectedIndex)
            {
                case 0:
                    SteamRemoteClient.UIMode(0);
                    SteamRemoteClient.ChangePersonaFlags(0);
                    break;
                case 1:
                    SteamRemoteClient.ChangePersonaFlags(1024); //BP
                    break;
                case 2:
                    SteamRemoteClient.ChangePersonaFlags(2048); //VR
                    break;
                case 3:
                    SteamRemoteClient.ChangePersonaFlags(512); // phone
                    break;
            }*/
        }
        private void SelectedGamesCountValidator(object sender, MouseButtonEventArgs e)
        {
            var button = sender as ToggleButton;
            var selectedCount = (this.DataContext as RemoteControlViewModel).SelectedGamesCount;

            if (button.IsChecked == true)
                (this.DataContext as RemoteControlViewModel).SelectedGamesCount--;
            else if (button.IsChecked == false && selectedCount < 32)
                (this.DataContext as RemoteControlViewModel).SelectedGamesCount++;
            else
            {
                e.Handled = true;
                return;
            }
        }

        private void MessageBox_KeyUp(object sender, KeyEventArgs e)
        {
            if (e.Key == Key.Enter && Keyboard.Modifiers != ModifierKeys.Shift)
            {
               /* SteamRemoteClient.SendInterlocutorMessage(MessageBox.Text);*/
                MessageBox.Text = "";
            }
        }

        private void MessageBox_PreviewKeyDown(object sender, KeyEventArgs e)
        {
            if (e.Key == Key.Enter && Keyboard.Modifiers != ModifierKeys.Shift)
            {
                e.Handled = true;
            }
        }

        private void messanger_ScrollChanged(object sender, ScrollChangedEventArgs e)
        {
            if (messanger.Items != null && messanger.Items.Count != 0 && messanger.Items.Count != CurrentCollectionCount)
            {
                messanger.ScrollIntoView(messanger.Items[messanger.Items.Count - 1]);
                CurrentCollectionCount = messanger.Items.Count;
            }
            else
            {
                e.Handled = true;
            }

        }

        private void Button_Click(object sender, RoutedEventArgs e) => CurrentCollectionCount = 0;
    }
}
