using SteamOrganizer.Helpers;
using SteamOrganizer.Infrastructure;
using SteamOrganizer.MVVM.Models;
using SteamOrganizer.MVVM.ViewModels;
using System;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Documents;
using System.Windows.Input;
using System.Windows.Media;

namespace SteamOrganizer.MVVM.View.Controls
{
    public sealed partial class AccountsView : UserControl
    {
        #region Drag-drop stuff

        private const double HeightOfAutoScrollZone = 30;
        private static readonly Thickness ThicknessOne = new Thickness(1.5);
        private static readonly Thickness ThicknessZero = new Thickness(0);
        private ScrollViewer AccountsScrollViewer;

        private AdornerLayer _adornerLayer;
        private DragAdorner _dragAdorner;

        private Brush DragOverBackground;
        private Brush OriginalBackground;

        private bool IsInitialDragFeedback;

        private Account DragAccount;
        private FrameworkElement DropToItem; 

        #endregion

        public AccountsView()
        {
            InitializeComponent();
            this.DataContext = new AccountsViewModel();
            Loaded += (sender,e) => AccountsScrollViewer = Utils.FindVisualChild<ScrollViewer>(AccountsBox);
        }

        #region Drag-drop events

        private void OnDragItemInitilize(object sender, MouseButtonEventArgs e)
        {
            var dragSource = sender as FrameworkElement;
            var listboxItem = ((dragSource.Parent as FrameworkElement).Parent as FrameworkElement).Parent as Border;

            #region Getting colors to set and reset the background

            DragOverBackground = App.Current.FindResource("TertiaryBackgroundBrush") as Brush;
            OriginalBackground = listboxItem.Background;

            #endregion

            #region Hook drag over to track mouse position

            AccountsBox.DragOver += AccountsBox_DragOver;
            AccountsBox.AllowDrop = true;

            #endregion

            #region Overlay adorner

            _adornerLayer = AdornerLayer.GetAdornerLayer(AccountsBox);
            _dragAdorner = new DragAdorner(AccountsBox, listboxItem, 0.4, e.GetPosition(listboxItem)) { PointOffset = e.GetPosition(AccountsBox) };
            _adornerLayer.Add(_dragAdorner);

            #endregion

            DragAccount = dragSource.DataContext as Account;

            DragDrop.DoDragDrop((DependencyObject)e.Source, DragAccount, DragDropEffects.Move);
        }

        private void DragItemGiveFeedback(object sender, GiveFeedbackEventArgs e)
        {
            if (!IsInitialDragFeedback)
            {
                e.UseDefaultCursors = false;
                Mouse.SetCursor(GrabbingCur.Cursor);
                IsInitialDragFeedback = true;
            }

            e.Handled = true;
        }

        private void Border_PreviewDragEnter(object sender, DragEventArgs e)
        {
            var border = sender as Border;

            if (DragAccount.Equals(border.DataContext as Account))
                return;

            DropToItem = border;
            Console.WriteLine("Drag item: " + DragAccount.AccountID + "\n To item: " + (DropToItem.DataContext as Account).AccountID);
            border.BorderThickness = ThicknessOne;
            border.Background = DragOverBackground;
        }

        private void Border_PreviewDragLeave(object sender, DragEventArgs e)
        {
            DropToItem = null;
            var border = sender as Border;
            border.BorderThickness = ThicknessZero;
            border.Background = OriginalBackground;
        }

        private void AccountsBox_DragOver(object sender, DragEventArgs e)
        {
            if (_dragAdorner != null)
                _dragAdorner.PointOffset = e.GetPosition(AccountsBox);

            double mouseYRelativeToContainer = e.GetPosition(AccountsBox).Y;

            if (mouseYRelativeToContainer < HeightOfAutoScrollZone)
            {
                double offsetChange = HeightOfAutoScrollZone - mouseYRelativeToContainer;
                AccountsScrollViewer.ScrollToVerticalOffset(AccountsScrollViewer.VerticalOffset - offsetChange);
            }
            else if (mouseYRelativeToContainer > AccountsBox.ActualHeight - HeightOfAutoScrollZone)
            {
                double offsetChange = mouseYRelativeToContainer - (AccountsBox.ActualHeight - HeightOfAutoScrollZone);
                AccountsScrollViewer.ScrollToVerticalOffset(AccountsScrollViewer.VerticalOffset + offsetChange);
            }
        }

        private void Border_QueryContinueDrag(object sender, QueryContinueDragEventArgs e)
        {
            if (e.KeyStates.HasFlag(DragDropKeyStates.LeftMouseButton))
                return;

            if (DropToItem != null)
            {
                App.Config.Database.Move(App.Config.Database.IndexOf(DragAccount), App.Config.Database.IndexOf(DropToItem.DataContext as Account));
                App.Config.SaveDatabase();

                (DropToItem as Border).BorderThickness = ThicknessZero;
                (DropToItem as Border).Background = OriginalBackground;
            }

            #region Dispose all stuff

            _adornerLayer.Remove(_dragAdorner);
            _adornerLayer         = null;
            DragOverBackground    = OriginalBackground = null;
            DragAccount           = null;
            DropToItem            = null;
            AccountsBox.AllowDrop = IsInitialDragFeedback = false;
            AccountsBox.DragOver -= AccountsBox_DragOver; 

            #endregion
        } 

#endregion
    }
}
