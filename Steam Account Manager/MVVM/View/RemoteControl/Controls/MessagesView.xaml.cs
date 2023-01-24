using Steam_Account_Manager.Infrastructure.SteamRemoteClient;
using Steam_Account_Manager.MVVM.ViewModels.RemoteControl;
using System;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using Command = Steam_Account_Manager.Infrastructure.Models.JsonModels.Command;

namespace Steam_Account_Manager.MVVM.View.RemoteControl.Controls
{
    public partial class MessagesView : UserControl
    {
        readonly MessagesViewModel currentContext;
        int CurrentCollectionCount;
        bool commandEmpty, keywordEmpty;
        public MessagesView()
        {
            InitializeComponent();
            currentContext = new MessagesViewModel();
            this.DataContext = currentContext;

        }


        private void MessageBox_KeyUp(object sender, KeyEventArgs e)
        {
            if (e.Key == Key.Enter && Keyboard.Modifiers != ModifierKeys.Shift)
            {
                currentContext.SendMessageCommand.Execute(null);
            }
            e.Handled = true;

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

        private void Button_Click(object sender, RoutedEventArgs e)
        {
            CurrentCollectionCount = 0;
        }

        private void DeleteCommand_Click(object sender, RoutedEventArgs e)
        {
            DeleteCommand.Visibility = Visibility.Collapsed;
        }

        private void commandListBox_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            if (commandListBox.SelectedIndex < 9)
            {
                commandListBox.UnselectAll();
            }
            else
            {
                DeleteCommand.Visibility = Visibility.Visible;
            }
        }

        private void leaveChatBtn_MouseEnter(object sender, MouseEventArgs e)
        {
            Popup.PlacementTarget = leaveChatBtn;
            Popup.Placement = System.Windows.Controls.Primitives.PlacementMode.Top;
            Popup.IsOpen = true;
            Header.PopupText.Text = (string)App.Current.FindResource("rc_mv_chatLeave");
        }

        private void Popup_MouseLeave(object sender, System.Windows.Input.MouseEventArgs e)
        {
            Popup.Visibility = System.Windows.Visibility.Collapsed;
            Popup.IsOpen = false;
        }

        private void addAdmin_MouseEnter(object sender, MouseEventArgs e)
        {
            Popup.PlacementTarget = addAdmin;
            Popup.Placement = System.Windows.Controls.Primitives.PlacementMode.Top;
            Popup.IsOpen = true;
            Header.PopupText.Text = (string)App.Current.FindResource("rc_mv_addAdmin");
        }

        private void AddCommand_Click(object sender, RoutedEventArgs e)
        {

            if (!commandEmpty || !keywordEmpty)
            {
                commandEmpty = keywordEmpty = false;
                CommandTitle.Foreground = KeywordTitle.Foreground = Utils.Common.StringToBrush("#b0b9c6");
            }

            if ((commandEmpty = String.IsNullOrEmpty(CommandBox.Text)) || (keywordEmpty = String.IsNullOrEmpty(KeywordBox.Text)))
            {
                if (commandEmpty)
                    CommandTitle.Foreground = Brushes.PaleVioletRed;
                if (keywordEmpty)
                    KeywordTitle.Foreground = Brushes.PaleVioletRed;
                e.Handled = true;
            }
            else
            {
                var finalKeyword = "/" + KeywordBox.Text;
                foreach (var item in MessagesViewModel.MsgCommands)
                {
                    if (finalKeyword == item.Keyword)
                        return;
                }
                MessagesViewModel.MsgCommands.Add(new Command
                {
                    Keyword = finalKeyword,
                    CommandExecution = CommandBox.Text,
                    MessageAfterExecute = String.IsNullOrEmpty(CommandMsgBox.Text) ? "-" : CommandMsgBox.Text
                });

                if (SteamRemoteClient.CurrentUser != null)
                    SteamRemoteClient.CurrentUser.Messenger.Commands.Add(MessagesViewModel.MsgCommands[MessagesViewModel.MsgCommands.Count - 1]);
                KeywordBox.Text = CommandMsgBox.Text = CommandBox.Text = "";
            }
        }
    }
}
