using System.Windows;

namespace Steam_Account_Manager.MVVM.View.MainControl.Windows
{
    public partial class CryptoKeyWindow : Window
    {
        private readonly bool mainWindow;
        private int errorCounter = 3;
        private readonly string path;
        public CryptoKeyWindow(bool mainWindow, string path = "")
        {
            this.mainWindow = mainWindow;
            this.path = path;
            InitializeComponent();
            if (!mainWindow) Reset.IsHitTestVisible = false;
        }

        private void Cancel_Click(object sender, RoutedEventArgs e)
        {
            if (mainWindow) App.Shutdown();
            else DialogResult = false;
        }


        private void TryDecrypt_Click(object sender, RoutedEventArgs e)
        {
            if (key.Text.Length != 44)
            {
                ErrorBlock.Text = (string)FindResource("aw_keyOnlyLength");
                return;
            }

            Infrastructure.Config.Properties.UserCryptoKey = key.Text;

            if (Infrastructure.Config.LoadAccounts())
            {
                if (mainWindow)
                {

                    Infrastructure.Config.SaveProperties();
                    App.MainWindow = new MainWindow();
                    App.MainWindow.Show();
                    this.Close();
                }
                else
                {
                    Infrastructure.Config.Deserialize(path, key.Text);
                    Infrastructure.Config.TempUserKey = key.Text;
                    DialogResult = true;
                }
            }


            if (errorCounter > 1)
            {
                ErrorBlock.Text = (string)FindResource("aw_invalidKey");
                errorCounter--;
            }
            else if (errorCounter == 1)
                ErrorBlock.Text = (string)FindResource("aw_manyAttempts");
            else
            {
                if (mainWindow) App.Shutdown();
                else DialogResult = false;
            }

        }

        private void noConfirmButton_Click(object sender, RoutedEventArgs e) =>  ResetBorder.Visibility = Visibility.Hidden;
        private void Reset_Click(object sender, RoutedEventArgs e) => ResetBorder.Visibility = Visibility.Visible;

        private void yesConfirmButton_Click(object sender, RoutedEventArgs e)
        {
            ResetBorder.Visibility = Visibility.Hidden;
            System.IO.File.Delete(App.WorkingDirectory +  "\\database.dat");
            Infrastructure.Config.LoadAccounts();
            App.MainWindow = new MainWindow();
            this.Close();
            App.MainWindow.Show();
        }
    
    }
}
