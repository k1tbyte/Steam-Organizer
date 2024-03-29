﻿using SteamOrganizer.Helpers;
using SteamOrganizer.Infrastructure;
using SteamOrganizer.MVVM.ViewModels;
using SteamOrganizer.Storages;
using System;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;

namespace SteamOrganizer.MVVM.View.Windows
{
    public sealed partial class MainWindow : Window
    {
        private bool IsMenuExpanderWaiting = false;
        internal bool IsShown => WindowState != WindowState.Minimized && IsVisible;

        public MainWindow()
        {
            SourceInitialized += new EventHandler(OnWindowSourceInitialize);
            InitializeComponent();
            SetMenuState(((double)App.Config.SideBarState) - 1d);
            RoundOffBorders();

            if(!App.Config.IsMaximixed && App.Config.Width != 0)
            {
                Width  = App.Config.Width;
                Height = App.Config.Height;

                Left = Width >= SystemParameters.PrimaryScreenWidth - 3 ? 0 : App.Config.Left;
                Top = Height >= SystemParameters.PrimaryScreenHeight -3 ? 0 :  App.Config.Top;
            }
            else
            {
                WindowStartupLocation = WindowStartupLocation.CenterScreen;
            }


            this.DataContext = new MainWindowViewModel(this);
            Splash.Visibility = Visibility.Collapsed;
            App.OnShuttingDown += SaveMetaInfo;


        }

        private void SaveMetaInfo()
        {
            App.Config.Left   = Left;
            App.Config.Top    = Top;
            App.Config.Width  = ActualWidth;
            App.Config.Height = ActualHeight;
        }

        #region View events

        #region Global window events
        private void Window_Closing(object sender, System.ComponentModel.CancelEventArgs e)
        {
            if(!App.Config.MinimizeOnClose)
            {
                App.Shutdown();
                return;
            }

            e.Cancel = true;
            Hide();
        }

        internal void OnWindowSourceInitialize(object sender, EventArgs e)
        {
            WindowMessageHandler.AddHook(this);
            WindowMessageHandler.ArgumentsHandler += (param) => ArgumentsParser.HandleStartArguments(param);
        }

        private void OnCloseWindow(object sender, MouseButtonEventArgs e)
        {
            if(!App.Config.MinimizeOnClose)
            {
                App.Shutdown();
            }
            Hide();
        }

        public new void Hide()
        {
            if (!IsShown)
                return;

            base.Hide();
            WindowState = WindowState.Minimized;
        }

        public new void Show()
        {
            if (IsShown)
                return;

            base.Show();

            if(App.Config.IsMaximixed)
            {
                OnMaximizeWindow(null,null);
                return;
            }
            WindowState = WindowState.Normal;
        }


        private void OnMaximizeWindow(object sender, MouseButtonEventArgs e)
        {
            if (WindowState == WindowState.Normal)
            {
                // We need to remove roundness in full screen mode
                RoundOffBorders(true);

                App.Config.IsMaximixed = true;
                WindowState = WindowState.Maximized;
                return;
            }


            App.Config.IsMaximixed = false;
            WindowState = WindowState.Normal;

            // Bringing back rounded edges
            RoundOffBorders();

        }

        private void OnMinimizeWindow(object sender, MouseButtonEventArgs e)
            => WindowState = WindowState.Minimized;

        private void OnDragMove(object sender, MouseButtonEventArgs e)
        {
            if(e.MiddleButton == MouseButtonState.Pressed)
            {
                if(WindowState == WindowState.Maximized)
                    OnMaximizeWindow(null, null);

                Width  = 0;
                Height = 0;
                Left   = (SystemParameters.PrimaryScreenWidth / 2) - ActualWidth / 2;
                Top    = (SystemParameters.PrimaryScreenHeight / 2) - ActualHeight / 2;
                return;
            }

            if (e.LeftButton != MouseButtonState.Pressed ||  (WindowState == WindowState.Maximized && e.ClickCount != 2))
                return;

            if (WindowState == WindowState.Maximized)
            {
                OnMaximizeWindow(null, null);
                var position = Win32.GetMousePosition();
                Left = position.X / 2;
                Top = position.Y - 30;
            }

            DragMove();
        } 
        #endregion

        #region Menu expander events
        private void MenuExpanderOnGiveFeedback(object sender, GiveFeedbackEventArgs e)
        {
            if (e.Effects == DragDropEffects.None)
            {
                e.UseDefaultCursors = false;
                Mouse.SetCursor((sender as Border).Cursor);
            }

            var offsetY = Win32.GetMousePosition().X - (this.WindowState == WindowState.Maximized ? 0 : this.Left);

            SetMenuState(offsetY);
            MenuExpanderOnMouseLeave(sender, null);
            e.Handled = true;
        }

        private void SetMenuState(double offsetY)
        {
            if (offsetY < 30 && Sidebar.Width != 0)
            {
                Sidebar.Width = (double)(App.Config.SideBarState = ESideBarState.Hidden);
                this.MinWidth = 850d;
            }
            else if (offsetY > 60 && offsetY < 100 && Sidebar.Width != 70)
            {
                Sidebar.Width = (double)(App.Config.SideBarState = ESideBarState.Open);
                this.MinWidth = 920;
            }
            else if (offsetY > 180 && Sidebar.Width != 200)
            {
                Sidebar.Width = (double)(App.Config.SideBarState = ESideBarState.Expanded);
                this.MinWidth = 1050d;
            }
        }

        private void MenuExpanderOnLeftMouseDown(object sender, MouseButtonEventArgs e)
        {
            DataObject data = new DataObject(DataFormats.Text, (Border)sender);

            DragDrop.DoDragDrop((DependencyObject)e.Source, data, DragDropEffects.None);
        }

        private void MenuExpanderOnMouseEnter(object sender, MouseEventArgs e)
            => (sender as Border).Child.Visibility = Visibility.Visible;

        private async void MenuExpanderOnMouseLeave(object sender, MouseEventArgs e)
        {
            if (IsMenuExpanderWaiting)
                return;

            IsMenuExpanderWaiting = true;

            //This is needed if the method is called from MenuExpanderOnGiveFeedback()
            (sender as Border).Child.Visibility = Visibility.Visible;

            await System.Threading.Tasks.Task.Delay(3000);

            (sender as Border).Child.Visibility = Visibility.Collapsed;
            IsMenuExpanderWaiting = false;
        }
        #endregion

        #endregion

        /// <summary>
        /// Sets rounded edges for the main window borders
        /// </summary>
        /// <param name="unset">Set corner radius to 0</param>
        internal void RoundOffBorders(bool unset = false)
        {
            if (App.Config.MainWindowCornerRadius == 0d || WindowState == WindowState.Maximized)
                return;

            if(unset)
            {
                TopPanel.CornerRadius = Sidebar.CornerRadius = MainBorder.CornerRadius = new CornerRadius(0d);
                return;
            }

            TopPanel.CornerRadius    = new CornerRadius(App.Config.MainWindowCornerRadius, App.Config.MainWindowCornerRadius, 0d, 0d); ;
            Sidebar.CornerRadius     = new CornerRadius(0d, 0d, 0d, App.Config.MainWindowCornerRadius);
            MainBorder.CornerRadius  = new CornerRadius(App.Config.MainWindowCornerRadius);
        }

        private void OpacityAnimationCompleted(object sender, EventArgs e)
        {
            (sender as FrameworkElement).Visibility = Visibility.Collapsed;
            (sender as FrameworkElement).Opacity = 1d;
        }
    }
}