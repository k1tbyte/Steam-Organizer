using System;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Input;
using System.Windows.Media.Animation;

namespace SteamOrganizer.MVVM.View.Extensions
{
    public sealed partial class BuiltInPopup : Grid
    {
        internal Action Closed;

        public static readonly DependencyProperty IsOpenProperty =
           DependencyProperty.Register("IsOpen", typeof(bool), typeof(BuiltInPopup), new FrameworkPropertyMetadata(false, FrameworkPropertyMetadataOptions.BindsTwoWayByDefault, new PropertyChangedCallback(OnPropertyChanged)));

        public static readonly DependencyProperty PopupContentProperty =
          DependencyProperty.Register("PopupContent", typeof(object), typeof(BuiltInPopup), new PropertyMetadata(null));

        public static readonly DependencyProperty CornerRadiusProperty =
          DependencyProperty.Register("CornerRadius", typeof(CornerRadius), typeof(BuiltInPopup));

        private readonly DoubleAnimation OpacityAnimation;
        private readonly ThicknessAnimation MarginOpenAnimation;
        private readonly ThicknessAnimation MarginCloseAnimation;
        private readonly Duration AnimationsDuration = new Duration(TimeSpan.FromSeconds(0.4));
        private bool locked = false;

        public bool IsOpen
        {
            get => (bool)GetValue(IsOpenProperty);
            set
            {
                SetValue(IsOpenProperty, value);
                if (value)
                {
                    Visibility            = Visibility.Visible;
                    OpacityAnimation.From = 0;
                    OpacityAnimation.To   = 1;
                    cancel.Focus();
                    PopupPresenter.BeginAnimation(MarginProperty, MarginOpenAnimation);
                    this.BeginAnimation(OpacityProperty, OpacityAnimation);
                }
                else
                {
                    OpacityAnimation.From = 1;
                    OpacityAnimation.To   = 0;
                    PopupPresenter.BeginAnimation(MarginProperty, MarginCloseAnimation);
                    this.BeginAnimation(OpacityProperty, OpacityAnimation);
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

        private static void OnPropertyChanged(DependencyObject sender, DependencyPropertyChangedEventArgs e)
        {
            var popup = sender as BuiltInPopup;

            if (e.NewValue != null)
            {
                popup.IsOpen = (bool)e.NewValue;
            }
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

            var func = App.Current.FindResource("BaseAnimationFunction") as IEasingFunction;
            OpacityAnimation     = new DoubleAnimation(1, 0, new Duration(TimeSpan.FromSeconds(0.4)));
            MarginOpenAnimation  = new ThicknessAnimation(new Thickness(0), AnimationsDuration) { EasingFunction = func };
            MarginCloseAnimation = new ThicknessAnimation(new Thickness(0, -300, 0, 0), AnimationsDuration) { EasingFunction = func };

            OpacityAnimation.Completed += (sender, e) =>
            {
                if (IsOpen)
                    return;


                Visibility   = Visibility.Collapsed;
                Closed?.Invoke();
                PopupContent = null;
                Closed       = null;

                locked = false;
            };


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
