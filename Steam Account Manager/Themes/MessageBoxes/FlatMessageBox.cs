using System.Windows;

namespace Steam_Account_Manager.Themes.MessageBoxes
{
    public class FlatMessageBox
    {
        public FlatMessageBox(string Text)
        {
            var mbox = new FlatMessageBoxView
            {
                Owner = Application.Current.MainWindow,
                WindowStartupLocation = WindowStartupLocation.CenterOwner,
            };
            mbox.Title.Text = Text;
            mbox.ShowDialog();
        }
    }
}
