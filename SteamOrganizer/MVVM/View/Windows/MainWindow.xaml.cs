using SteamOrganizer.Helpers;
using SteamOrganizer.Infrastructure;
using System;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Shapes;

namespace SteamOrganizer.MVVM.View.Windows
{
    public sealed partial class MainWindow : Window
    {
        private readonly CornerRadius TopPanelCornerRadius   = new CornerRadius(9d, 9d, 0d, 0d);
        private readonly CornerRadius LeftBorderCornerRadius = new CornerRadius(0d, 0d, 0d, 9d);
        private readonly CornerRadius MainBorderCornerRadius = new CornerRadius(9d);

        private bool IsMenuExpanderWaiting = false;


        public MainWindow()
        {
            SourceInitialized += new EventHandler(OnWindowSourceInitialize);
            InitializeComponent();
            RoundOffBorders();
        }

        #region View events

        #region Global window events
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

            //TODO: Enum of panel positions and save to config
            if (offsetY < 30 && LeftPanel.Width != 0)
            {
                LeftPanel.Width = 0;
            }
            else if (offsetY > 60 && offsetY < 100 && LeftPanel.Width != 70)
            {
                LeftPanel.Width = 70;
            }
            else if (offsetY > 180 && LeftPanel.Width != 200)
            {
                LeftPanel.Width = 200;
            }

            MenuExpanderOnMouseLeave(sender, null);
            e.Handled = true;
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