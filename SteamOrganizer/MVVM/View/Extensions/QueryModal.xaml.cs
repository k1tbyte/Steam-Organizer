using System;
using System.Windows.Controls;

namespace SteamOrganizer.MVVM.View.Extensions
{
    public sealed partial class QueryModal : StackPanel
    {
        private readonly Action SuccessAction;

        public QueryModal(string message,Action succesAction)
        {
            InitializeComponent();
            ContentText.Text = message;
            SuccessAction = succesAction;

        }
        
        private void No_Click(object sender, System.Windows.RoutedEventArgs e) => App.MainWindowVM.ClosePopupWindow();
        private void Yes_Click(object sender, System.Windows.RoutedEventArgs e)
        {
            SuccessAction?.Invoke();
            No_Click(null, null);
        }
    }
}
