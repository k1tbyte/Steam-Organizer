using Steam_Account_Manager.Infrastructure.Base;
using System;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using Command = Steam_Account_Manager.Infrastructure.JsonModels.Command;

namespace Steam_Account_Manager.ViewModels.RemoteControl.View
{
    public partial class MessagesView : UserControl
    {
        MessagesViewModel currentContext;
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
            if(e.Key == Key.Enter && Keyboard.Modifiers != ModifierKeys.Shift)
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
            MessagesViewModel.MsgCommands.RemoveAt(commandListBox.SelectedIndex);

            if(SteamRemoteClient.CurrentUser != null)
                SteamRemoteClient.CurrentUser.Messenger.Commands.RemoveAt(commandListBox.SelectedIndex);
        }

        private void commandListBox_SelectionChanged(object sender, SelectionChangedEventArgs e)
        {
            if (commandListBox.SelectedIndex < 9)
            {
                commandListBox.UnselectAll();
            }
        }

        private void AddCommand_Click(object sender, RoutedEventArgs e)
        {
            
            if(!commandEmpty || !keywordEmpty)
            {
                commandEmpty = keywordEmpty = false;
                CommandTitle.Foreground = KeywordTitle.Foreground = Utilities.StringToBrush("#b0b9c6");
            }
            
            if ((commandEmpty = String.IsNullOrEmpty(CommandBox.Text)) || (keywordEmpty = String.IsNullOrEmpty(KeywordBox.Text)))
            {
                if(commandEmpty)
                    CommandTitle.Foreground = Brushes.PaleVioletRed;
                if(keywordEmpty)
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
                    MessageAfterExecute = String.IsNullOrEmpty(CommandMsgBox.Text) ?  "-" : CommandMsgBox.Text
                });

                if (SteamRemoteClient.CurrentUser != null)
                      SteamRemoteClient.CurrentUser.Messenger.Commands.Add(MessagesViewModel.MsgCommands[MessagesViewModel.MsgCommands.Count - 1]);
               KeywordBox.Text = CommandMsgBox.Text = CommandBox.Text = "";
            }
        }
    }
}
