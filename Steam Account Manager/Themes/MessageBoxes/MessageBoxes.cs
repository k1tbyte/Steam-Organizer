using System;
using System.Windows;
using System.Windows.Threading;

namespace Steam_Account_Manager.Themes.MessageBoxes
{
    internal static class MessageBoxes
    {
        internal static bool? InfoMessageBox(string Text)
        {
            var mbox = new FlatMessageBoxView(Text)
            {
                Owner = App.MainWindow,
                WindowStartupLocation = WindowStartupLocation.CenterOwner,
            };
            mbox.Title.Text = Text;
            return mbox.ShowDialog();
        }

        internal static bool? QueryMessageBox(string Text)
        {
            var qmbox = new FlatQueryMessageBoxView(Text)
            {
                Owner = App.MainWindow,
                WindowStartupLocation = WindowStartupLocation.CenterOwner,
            };
            return qmbox.ShowDialog();

        }

        internal static void PopupMessageBox(string Text, bool isError = false)
        {
            App.Current.Dispatcher.Invoke(DispatcherPriority.Normal, new Action(
            () =>
            {
                var popupBox = new PopupMessageBoxView(Text, isError);
                popupBox.Show();
            }));
        }
    }
}
