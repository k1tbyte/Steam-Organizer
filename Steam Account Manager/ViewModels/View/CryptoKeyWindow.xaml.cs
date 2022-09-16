using System.Windows;

namespace Steam_Account_Manager.ViewModels.View
{
    public partial class CryptoKeyWindow : Window
    {
        private bool mainWindow;
        private int errorCounter=3;
        private string path;
        public CryptoKeyWindow(bool mainWindow,string path="")
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
            if(key.Text.Length == 44)
            {
                try
                {
                    if (mainWindow)
                    {
                        Infrastructure.Config.Properties.UserCryptoKey = key.Text;
                        Infrastructure.Config.GetAccountsInstance();
                        Infrastructure.Config.SaveProperties();
                        MainWindow mainWindow = new MainWindow();
                        mainWindow.Show();
                        this.Close();
                    }
                    else
                    {
                        Infrastructure.Config.Deserialize(path, key.Text);
                        Infrastructure.Config.TempUserKey = key.Text;
                        DialogResult = true;
                    }

                }
                catch
                {
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
            }
            else
            {
                ErrorBlock.Text = (string)FindResource("aw_keyOnlyLength");
            }

        }

        private void noConfirmButton_Click(object sender, RoutedEventArgs e)
        {
            ResetBorder.Visibility = Visibility.Hidden;
        }

        private void yesConfirmButton_Click(object sender, RoutedEventArgs e)
        {
            ResetBorder.Visibility = Visibility.Hidden;
            System.IO.File.Delete("database.dat");
            Infrastructure.Config.GetAccountsInstance();
            MainWindow mainWindow = new MainWindow();
            this.Close();
            mainWindow.Show();
        }

        private void Reset_Click(object sender, RoutedEventArgs e)
        {
            ResetBorder.Visibility = Visibility.Visible;
        }
    }
}
