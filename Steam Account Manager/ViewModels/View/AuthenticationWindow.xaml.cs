using System.Windows;
using Steam_Account_Manager.Infrastructure;

namespace Steam_Account_Manager.ViewModels.View
{
    /// <summary>
    /// Логика взаимодействия для AuthenticationWindow.xaml
    /// </summary>
    public partial class AuthenticationWindow : Window
    {
        private int errorCounter = 3;
        private bool mainWindow;
        public AuthenticationWindow(bool mainWindow)
        {
            InitializeComponent();
            this.mainWindow = mainWindow;
        }

        private void Login_Click(object sender, RoutedEventArgs e)
        {
            if(Password.Password.Length > 30)
            {
                ErrorBlock.Text = "Password cannot be that long";
                return;
            }

            if (Utilities.Sha256(Password.Password + Config.GetDefaultCryptoKey) == Config._config.Password)
            {
                if (!mainWindow) DialogResult = true;
                else
                {
                    try
                    {
                        Infrastructure.CryptoBase.GetInstance();
                        MainWindow mainWindow = new MainWindow();
                        mainWindow.Show();
                        this.Hide();
                        
                    }
                    catch
                    {
                        var cryptoKeyWindow = new CryptoKeyWindow(true)
                        {
                            WindowStartupLocation = WindowStartupLocation.CenterScreen
                        };
                        this.Close();
                        cryptoKeyWindow.Show();
                        
                    }
                }
            }
                
            else
            {
                if (errorCounter > 1)
                {
                    ErrorBlock.Text = "Error! Invalid password";
                    errorCounter--;
                }
                else if (errorCounter == 1)
                {
                    ErrorBlock.Text = "Too many attempts...";
                    errorCounter--;
                }
                else
                {
                    if (mainWindow) App.Current.Shutdown();
                    else DialogResult = false;
                }
            }
        }

        private void Cancel_Click(object sender, RoutedEventArgs e)
        {
            if (mainWindow) App.Current.Shutdown();
            else DialogResult = false;
        }
    }
}
