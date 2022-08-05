using System;
using System.Collections.Generic;
using System.Configuration;
using System.Data;
using Steam_Account_Manager.Infrastructure;
using System.Windows;

namespace Steam_Account_Manager
{
    /// <summary>
    /// Interaction logic for App.xaml
    /// </summary>
    public partial class App : Application
    {
        Config config = Config.GetInstance();
    }
}
