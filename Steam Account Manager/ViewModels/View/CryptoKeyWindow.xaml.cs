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
using System.Windows.Shapes;

namespace Steam_Account_Manager.ViewModels.View
{
    /// <summary>
    /// Логика взаимодействия для CryptoKeyWindow.xaml
    /// </summary>
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
            if (mainWindow) Application.Current.Shutdown();
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
                        Infrastructure.Config._config.UserCryptoKey = key.Text;
                        Infrastructure.CryptoBase.GetInstance();
                        Infrastructure.Config._config.SaveChanges();
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
                    if (errorCounter != 1)
                    {
                        ErrorBlock.Text = "Error! Invalid key";
                        errorCounter--;
                    }
                    else if (errorCounter == 1)
                        ErrorBlock.Text = "Too many attempts...";
                    else
                    {
                        if (mainWindow) Application.Current.Shutdown();
                        else DialogResult = false;
                    }
                        

                }
            }
            else
            {
                ErrorBlock.Text = "Key length can only be 44 characters";
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
            Infrastructure.CryptoBase.GetInstance();
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
