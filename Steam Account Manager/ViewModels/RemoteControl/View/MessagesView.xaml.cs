using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Data;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Imaging;
using System.Windows.Navigation;
using System.Windows.Shapes;

namespace Steam_Account_Manager.ViewModels.RemoteControl.View
{
    /// <summary>
    /// Логика взаимодействия для MessagesView.xaml
    /// </summary>
    public partial class MessagesView : UserControl
    {
        MessagesViewModel currentContext;
        int CurrentCollectionCount;
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
    }
}
