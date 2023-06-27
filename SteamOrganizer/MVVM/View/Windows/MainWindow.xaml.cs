using SteamOrganizer.Helpers;
using SteamOrganizer.Infrastructure;
using System;
using System.Windows;
using System.Windows.Input;

namespace SteamOrganizer.MVVM.View.Windows
{
    public sealed partial class MainWindow : Window
    {
        private readonly CornerRadius TopPanelCornerRadius   = new CornerRadius(0d, 0d, 0d, 9d);
        private readonly CornerRadius LeftBorderCornerRadius = new CornerRadius(9d, 9d, 0d, 0d);
        private readonly CornerRadius MainBorderCornerRadius = new CornerRadius(9d);

        public MainWindow()
        {
            SourceInitialized += new EventHandler(OnWindowSourceInitialize);
            InitializeComponent();
            RoundOffBorders();
        }

        #region View events
        internal void OnWindowSourceInitialize(object sender, EventArgs e)
        {
            WindowMessageHandler.AddHook(this);
        }

        private void OnCloseWindow(object sender, MouseButtonEventArgs e)
            => App.Shutdown();


        private void OnMaximizeWindow(object sender, MouseButtonEventArgs e)
        {
            if (WindowState == WindowState.Normal)
            {
                // We need to remove roundness in full screen mode
                RoundOffBorders(true);

                WindowState = WindowState.Maximized;
                return;
            }

            // Bringing back rounded edges
            RoundOffBorders();

            WindowState = WindowState.Normal;
        }

        private void OnMinimizeWindow(object sender, MouseButtonEventArgs e)
            => WindowState = WindowState.Minimized;

        private void OnDragMove(object sender, MouseButtonEventArgs e)
        {
            if (WindowState == WindowState.Maximized && e.ClickCount != 2)
                return;

            if (WindowState == WindowState.Maximized)
            {
                WindowState = WindowState.Normal;
                var position = Win32.GetMousePosition();
                Left = position.X / 2;
                Top = position.Y - 30;

            }

            DragMove();
        } 
        #endregion


        /// <summary>
        /// Sets rounded edges for the main window borders
        /// </summary>
        /// <param name="unset">Set corner radius to 0</param>
        private void RoundOffBorders(bool unset = false)
        {
            if(unset)
            {
                TopPanel.CornerRadius = LeftPanel.CornerRadius = MainBorder.CornerRadius = new CornerRadius(0d);
                return;
            }

            TopPanel.CornerRadius    = TopPanelCornerRadius;
            LeftPanel.CornerRadius   = LeftBorderCornerRadius;
            MainBorder.CornerRadius  = MainBorderCornerRadius;
        }
    }
}