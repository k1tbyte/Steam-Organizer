using System.Windows;

namespace Steam_Account_Manager.Themes.MessageBoxes
{
    internal static class MessageBoxes
    {
        internal static bool? InfoMessageBox(string Text)
        {
            var mbox = new FlatMessageBoxView(Text)
            {
                Owner = Application.Current.MainWindow,
                WindowStartupLocation = WindowStartupLocation.CenterOwner,
            };
            mbox.Title.Text = Text;
            return mbox.ShowDialog();
        }

        internal static bool? QueryMessageBox(string Text)
        {
            var qmbox = new FlatQueryMessageBoxView(Text)
            {
                Owner = Application.Current.MainWindow,
                WindowStartupLocation = WindowStartupLocation.CenterOwner,
            };
            return qmbox.ShowDialog();

        }
    }
}
