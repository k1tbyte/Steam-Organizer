using Steam_Account_Manager.UIExtensions;
using System;
using System.Windows;
using System.Windows.Documents;
using System.Windows.Media;
using System.Windows.Media.Animation;
using System.Windows.Media.Media3D;
using System.Windows.Shapes;
using System.Windows.Threading;

namespace Steam_Account_Manager.Utils
{
    internal static class Presentation
    {
        private static BrushConverter BrushConverter = new BrushConverter();

        internal class DragAdorner : Adorner
        {
            protected UIElement _child;
            protected double XCenter;
            protected double YCenter;

            public DragAdorner(UIElement owner) : base(owner) { }

            public DragAdorner(UIElement owner, UIElement adornElement, double opacity, Point dragPos)
                : base(owner)
            {
                var _brush = new VisualBrush(adornElement) { Opacity = opacity };
                var b = VisualTreeHelper.GetDescendantBounds(adornElement);
                var r = new Rectangle() { Width = b.Width, Height = b.Height };

                XCenter = dragPos.X;// r.Width / 2;
                YCenter = dragPos.Y;// r.Height / 2;

                r.Fill = _brush;
                _child = r;
            }

            private Point _pointOffset;
            public Point PointOffset
            {
                get { return _pointOffset; }
                set
                {
                    _leftOffset = value.X - XCenter;
                    _topOffset = value.Y - YCenter;
                    UpdatePosition();
                }
            }

            private double _leftOffset;
            public double LeftOffset
            {
                get { return _leftOffset; }
                set
                {
                    _leftOffset = value - XCenter;
                }
            }

            private double _topOffset;
            public double TopOffset
            {
                get { return _topOffset; }
                set
                {
                    _topOffset = value - YCenter;
                }
            }

            private void UpdatePosition()
            {
                var adorner = this.Parent as AdornerLayer;
                if (adorner != null)
                {
                    adorner.Update(this.AdornedElement);
                }
            }

            protected override Visual GetVisualChild(int index)
            {
                return _child;
            }

            protected override int VisualChildrenCount
            {
                get { return 1; }
            }

            protected override Size MeasureOverride(Size finalSize)
            {
                _child.Measure(finalSize);
                return _child.DesiredSize;
            }
            protected override Size ArrangeOverride(Size finalSize)
            {

                _child.Arrange(new Rect(_child.DesiredSize));
                return finalSize;
            }

            public override GeneralTransform GetDesiredTransform(GeneralTransform transform)
            {
                var result = new GeneralTransformGroup();
                result.Children.Add(base.GetDesiredTransform(transform));
                result.Children.Add(new TranslateTransform(_leftOffset, _topOffset));
                return result;
            }
        }

        public static Brush StringToBrush(string Color)
        {
            var Brush = (Brush)BrushConverter.ConvertFromString(Color);
            Brush.Freeze();
            return Brush;
        }

        #region Windows
        public static bool? OpenDialogWindow(Window window)
        {
            if (Application.Current.MainWindow != null)
                window.Owner = Application.Current.MainWindow;

            window.WindowStartupLocation = WindowStartupLocation.CenterOwner;
            return window.ShowDialog();
        }

        public static bool OpenQueryMessageBox(object content, string title, MboxStyle style = MboxStyle.YesNo, double maxWidth = 335d, double maxHeight = 0)
        {
            return new MessageWindow()
            {
                WindowBoxContent = content,
                WindowBoxTitle = title,
                WindowBoxStyle = style,
                WindowBoxType = MboxType.Query,
                MaxWindowBoxWidth = maxWidth,
                MaxWindowBoxHeight = maxHeight,
            }.ShowDialog() == true;
        }

        public static bool OpenMessageBox(object content, string title, MboxStyle style = MboxStyle.Ok, double maxWidth = 335d, double maxHeight = 0)
        {
            return new MessageWindow()
            {
                WindowBoxContent = content,
                WindowBoxTitle = title,
                WindowBoxStyle = style,
                WindowBoxType = MboxType.Default,
                MaxWindowBoxWidth = maxWidth,
                MaxWindowBoxHeight = maxHeight,
            }.ShowDialog() == true;
        }

        public static bool OpenErrorMessageBox(object content, string title, MboxStyle style = MboxStyle.Ok, double maxWidth = 335d, double maxHeight = 0)
        {

            return new MessageWindow()
            {
                WindowBoxContent = content,
                WindowBoxTitle = title,
                WindowBoxStyle = style,
                WindowBoxType = MboxType.Error,
                MaxWindowBoxWidth = maxWidth,
                MaxWindowBoxHeight = maxHeight,
            }.ShowDialog() == true;
        }

        public static void OpenPopupMessageBox(string Text, bool isError = false)
        {
            App.Current.Dispatcher.Invoke(DispatcherPriority.Normal, new System.Action(() =>
            {
                var popupBox = new PopupMessageWindow(Text, isError);
                popupBox.Show();
            }));
        }
        #endregion

        #region Animations
        internal static void ShakingAnimation(FrameworkElement element, bool opacity = false)
        {
            var marginAnim = new ThicknessAnimation(element.Margin,
                new Thickness(element.Margin.Left + 5d, element.Margin.Top, element.Margin.Right, element.Margin.Bottom), System.TimeSpan.FromSeconds(0.2d))
            {
                RepeatBehavior = new RepeatBehavior(3d),
                AutoReverse = true
            };

            marginAnim.Freeze();
            element.BeginAnimation(FrameworkElement.MarginProperty, marginAnim);

            if (!opacity) return;

            var opacityAnim = new DoubleAnimation(0, 1d, System.TimeSpan.FromSeconds(1.2d))
            {
                AutoReverse = true
            };
            opacityAnim.Freeze();

            element.BeginAnimation(FrameworkElement.OpacityProperty, opacityAnim);
        } 

        internal static void SpinAnimation(FrameworkElement element,double from = 0, double to = 180)
        {
            var doubleAnimation = new DoubleAnimation(from, to, new Duration(TimeSpan.FromSeconds(0.8)))
            {
                EasingFunction = new CircleEase() { EasingMode = EasingMode.EaseInOut }
            };

            var rotateTransform = new RotateTransform();

            element.RenderTransform = rotateTransform;
            element.RenderTransformOrigin = new Point(0.5, 0.5);

            rotateTransform.BeginAnimation(RotateTransform.AngleProperty, doubleAnimation);
        }

        #endregion
    }
}
