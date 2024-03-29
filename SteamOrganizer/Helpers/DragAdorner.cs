﻿using System.Windows;
using System.Windows.Documents;
using System.Windows.Media;
using System.Windows.Shapes;

namespace SteamOrganizer.Helpers
{
    internal class DragAdorner : Adorner
    {
        protected readonly UIElement _child;
        protected readonly double XCenter;
        protected readonly double YCenter;

        public DragAdorner(UIElement owner) : base(owner) { }

        public DragAdorner(UIElement owner, UIElement adornElement, double opacity, Point dragPos)
            : base(owner)
        {
            var _brush = new VisualBrush(adornElement) { Opacity = opacity };
            var b = VisualTreeHelper.GetDescendantBounds(adornElement);
            var r = new Rectangle() { Width = b.Width, Height = b.Height };

            XCenter = dragPos.X;
            YCenter = dragPos.Y;

            r.Fill = _brush;
            _child = r;
        }

        private Point _pointOffset;
        public Point PointOffset
        {
            get => _pointOffset; 
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
            get => _leftOffset; 
            set => _leftOffset = value - XCenter;
        }

        private double _topOffset;
        public double TopOffset
        {
            get => _topOffset;
            set => _topOffset = value - YCenter;
        }

        private void UpdatePosition()
        {
            if (this.Parent is AdornerLayer adorner)
            {
                adorner.Update(this.AdornedElement);
            }
        }

        protected override Visual GetVisualChild(int index)
            =>  _child;
        

        protected override int VisualChildrenCount
        {
            get =>  1;
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
}
