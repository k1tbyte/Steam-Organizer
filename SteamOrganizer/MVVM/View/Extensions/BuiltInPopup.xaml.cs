using SteamOrganizer.Infrastructure;
using System;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media;
using System.Windows.Media.Animation;

namespace SteamOrganizer.MVVM.View.Extensions
{
    public sealed partial class BuiltInPopup : Grid
    {
        internal Action Closed;

        public static readonly DependencyProperty PopupContentProperty =
          DependencyProperty.Register("PopupContent", typeof(object), typeof(BuiltInPopup), new PropertyMetadata(null));

        public static readonly DependencyProperty CornerRadiusProperty =
          DependencyProperty.Register("CornerRadius", typeof(CornerRadius), typeof(BuiltInPopup));

        private DoubleAnimation OpeningAnimation;
        private DoubleAnimation ClosingAnimation;
        private bool locked = false;

        public bool IsOpen
        {
            get => this.Visibility == Visibility.Visible;
            set
            {
                if (value)
                {
                    Visibility            = Visibility.Visible;
                    cancel.Focus();
                    PopupPresenter.RenderTransform.BeginAnimation(ScaleTransform.ScaleYProperty, OpeningAnimation);
                    this.BeginAnimation(OpacityProperty, OpeningAnimation);
                }
                else
                {
                    PopupPresenter.RenderTransform.BeginAnimation(ScaleTransform.ScaleYProperty, ClosingAnimation);
                    this.BeginAnimation(OpacityProperty, ClosingAnimation);
                }

            }
        }

        public object PopupContent
        {
            get => GetValue(PopupContentProperty);
            set => SetValue(PopupContentProperty, value);
        }

        public CornerRadius CornerRadius
        {
            get => (CornerRadius)GetValue(CornerRadiusProperty);
            set => SetValue(CornerRadiusProperty, value);
        }

        private void OnClosing(object sender, EventArgs e)
        {
            if (PopupContent == null)
                return;

            Visibility   = Visibility.Collapsed;
            Closed?.Invoke();
            PopupContent = null;
            Closed       = null;
            locked       = false;
        }

        public BuiltInPopup()
        {
            InitializeComponent();

            PreviewKeyDown += (sender, e) =>
            {
                if (e.Key == Key.Escape)
                {
                    HidePopup(null, null);
                    e.Handled = true;
                }
            };


            Utils.InBackground(() =>
            {
                var func = App.Current.FindResource("BaseAnimationFunction") as IEasingFunction;
                var timeline = new Duration(TimeSpan.FromSeconds(0.3));

                OpeningAnimation = new DoubleAnimation(0, 1, timeline) { EasingFunction = func };
                OpeningAnimation.Freeze();

                ClosingAnimation = new DoubleAnimation(1, 0, timeline) { EasingFunction = func };
                ClosingAnimation.Completed += OnClosing;
                ClosingAnimation.Freeze();
            });


            this.Splash.DataContext         = this;
            this.PopupPresenter.DataContext = this;
        }

        private void HidePopup(object sender, MouseButtonEventArgs e)
        {
            if (locked) return;

            IsOpen = false;
            locked = true;
        }
    }
}
