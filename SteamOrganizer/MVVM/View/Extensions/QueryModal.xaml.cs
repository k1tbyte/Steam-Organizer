using System;
using System.Windows;
using System.Windows.Controls;

namespace SteamOrganizer.MVVM.View.Extensions
{
    public sealed partial class QueryModal : Grid
    {
        private readonly Action SuccessAction;

        public QueryModal(string message,Action succesAction,bool boldText = false)
        {
            InitializeComponent();
            ContentText.Text = message;
            SuccessAction = succesAction;
            if(boldText)
            {
                ContentText.FontWeight = FontWeights.Medium;
                ContentText.FontSize   = 14;
            }
        }
        
        private void No_Click(object sender, System.Windows.RoutedEventArgs e) => App.MainWindowVM.ClosePopupWindow();
        private void Yes_Click(object sender, System.Windows.RoutedEventArgs e)
        {
            SuccessAction?.Invoke();
            No_Click(null, null);
        }
    }
}
