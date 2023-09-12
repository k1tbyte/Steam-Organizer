using SteamOrganizer.Helpers;
using SteamOrganizer.Infrastructure;
using SteamOrganizer.MVVM.Models;
using SteamOrganizer.MVVM.ViewModels;
using System;
using System.Threading;
using System.Threading.Tasks;
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

        private readonly SemaphoreSlim ClipboardLocker = new SemaphoreSlim(1);

        public AccountsView()
        {
            InitializeComponent();
            this.DataContext = new AccountsViewModel(this);
            Loaded += (sender,e) => AccountsScrollViewer = Utils.FindVisualChild<ScrollViewer>(AccountsBox);
        }

        #region Drag-drop events

        private void OnDragItemInitilize(object sender, MouseButtonEventArgs e)
        {
            var dragSource = sender as FrameworkElement;
            var listboxItem = (((dragSource.Parent as FrameworkElement).Parent as FrameworkElement).Parent as FrameworkElement).Parent as Border;

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

        private void Border_DragEnter(object sender, DragEventArgs e)
        {
            if (!IsInitialDragFeedback)
            {
                return;
            }
                
            var border = sender as Border;
            var acc = border.DataContext as Account;

            if (DragAccount.Equals(acc) || (acc.Pinned && !DragAccount.Pinned) || (DragAccount.Pinned && !acc.Pinned))
            {
                return;
            }

            DropToItem = border;
            border.Background = DragOverBackground;

            if (!(border.DataContext as Account).Pinned)
            {
                border.BorderThickness = ThicknessOne;
            }
        }

        private void Border_DragLeave(object sender, DragEventArgs e)
        {
            if (!IsInitialDragFeedback)
            {
                return;
            }
                
            DropToItem = null;

            var border = sender as Border;
            border.Background = OriginalBackground;

            if (!(border.DataContext as Account).Pinned)
            {
                border.BorderThickness = ThicknessZero;
            }
            
        }

        private void AccountsBox_DragOver(object sender, DragEventArgs e)
        {
            if (_dragAdorner != null)
            {
                _dragAdorner.PointOffset = e.GetPosition(AccountsBox);
            }

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
            {
                return;
            }
                
            if (DropToItem != null)
            {
                App.Config.Database.Move(App.Config.Database.IndexOf(DragAccount), App.Config.Database.IndexOf(DropToItem.DataContext as Account));
                App.Config.SaveDatabase();

                if (!(DropToItem.DataContext as Account).Pinned)
                {
                    (DropToItem as Border).BorderThickness = ThicknessZero;
                }

                (DropToItem as Border).Background = OriginalBackground;

                if(SortComboBox.SelectedIndex != -1)
                {
                    _ = Utils.OpenAutoClosableToolTip(DropToItem, App.FindString("acv_editWithSort"), 2000);
                }
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


        private async void CopyID_MouseLeftButtonDown(object sender, MouseButtonEventArgs e)
        {
            var o = sender as FrameworkElement;
            await ClipboardLocker.WaitAsync(1000);
            Clipboard.SetDataObject((o.DataContext as Account).AccountID.ToString());
            await Utils.OpenAutoClosableToolTip(o, App.FindString("copied_info"));
            ClipboardLocker.Release();
        }

        private async void CopyAuthCode_MouseLeftButtonDown(object sender, MouseButtonEventArgs e)
        {
            var o = sender as FrameworkElement;
            await ClipboardLocker.WaitAsync(1000);

            var code = await (o.DataContext as Account).Authenticator.GenerateCode();

            if(code == null)
            {
                if(!Infrastructure.WebBrowser.IsNetworkAvailable)
                {
                    App.WebBrowser.OpenNeedConnectionPopup();
                }
                return;
            }

            Clipboard.SetDataObject(code);
            await Utils.OpenAutoClosableToolTip(o, App.FindString("copied_info"));
            ClipboardLocker.Release();

        }

        private void YearsOfServiceMouseOver(object sender, MouseEventArgs e)
        {
            var element = sender as FrameworkElement;
            var acc = element.DataContext as Account;
            element.ToolTip =
                acc.YearsOfService != null ? $"{App.FindString("acv_regDate")} {acc.CreatedDate:f}" : App.FindString("acv_regDateUnknown");
        }

        private void NicknameMouseOver(object sender, MouseEventArgs e)
        {
            var element     = sender as FrameworkElement;
            var acc         = element.DataContext as Account;

            if (string.IsNullOrEmpty(acc.Note))
                return;

            element.ToolTip = acc.Note.Length > 150 ? $"{acc.Note.Remove(150).Trim()}  . . ." : acc.Note;
        }

        private void BansMouseOver(object sender , MouseEventArgs e)
        {
            var element = sender as FrameworkElement;
            var acc = element.DataContext as Account;

            element.ToolTip = (acc.VacBansCount > 0 && acc.GameBansCount > 0) ? "The last ban was received " : $"Account was banned "  
                + $"{(int)(DateTime.Now - ((acc.LastUpdateDate ?? acc.AddedDate) - TimeSpan.FromDays(acc.DaysSinceLastBan))).TotalDays} day(s) ago";
        }

        private void AvatarMouseOver(object sender, MouseEventArgs e)
        {
            var element = sender as FrameworkElement;
            var acc = element.DataContext as Account;
            element.ToolTip =
                $"{App.FindString("acv_addDate")} {acc.AddedDate:f}{(acc.LastUpdateDate != null ? $"\n{App.FindString("acv_updDate")} {acc.LastUpdateDate:f}" : null)}";
        }
    }
}
