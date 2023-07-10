using System;
using System.Windows;
using System.Windows.Controls.Primitives;

namespace SteamOrganizer.MVVM.View.Extensions
{
    public partial class QueryPopup : Popup
    {
        private static QueryPopup GlobalPopup;
        public static QueryPopup GetPopup(string message, Action yesAction, Action noAction = null)
        {
            GlobalPopup              = GlobalPopup ?? new QueryPopup();
            GlobalPopup.Message.Text = message;
            GlobalPopup.NoAction     = noAction;
            GlobalPopup.YesAction    = yesAction;
            return GlobalPopup;
        }

        private Action YesAction, NoAction;
        private QueryPopup()
        {
            InitializeComponent();
        }

        private void YesButtonClick(object sender, RoutedEventArgs e)
        {
            this.IsOpen = false;
            YesAction?.Invoke();
        }

        private void NoButtonClick(object sender, RoutedEventArgs e)
        {
            this.IsOpen = false;
            NoAction?.Invoke();
        }
    }
}
