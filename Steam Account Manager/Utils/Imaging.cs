using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Linq;
using System.Text;
using System.Threading.Tasks;
using System.Windows.Media.Imaging;

namespace Steam_Account_Manager.Utils
{
    internal static class Imaging
    {
        public static Icon IconFromImage(Image img)
        {
            using (var ms = new MemoryStream())
            {
                using(var bw = new BinaryWriter(ms)) 
                {
                    // Header
                    bw.Write((short)0);   // 0 : reserved
                    bw.Write((short)1);   // 2 : 1=ico, 2=cur
                    bw.Write((short)1);   // 4 : number of images

                    var w = img.Width;
                    if (w >= 256) w = 0;
                    bw.Write((byte)w);    // 0 : width of image
                    var h = img.Height;
                    if (h >= 256) h = 0;
                    bw.Write((byte)h);    // 1 : height of image
                    bw.Write((byte)0);    // 2 : number of colors in palette
                    bw.Write((byte)0);    // 3 : reserved
                    bw.Write((short)0);   // 4 : number of color planes
                    bw.Write((short)0);   // 6 : bits per pixel
                    var sizeHere = ms.Position;
                    bw.Write((int)0);     // 8 : image size
                    var start = (int)ms.Position + 4;
                    bw.Write(start);      // 12: offset of image data

                    img.Save(ms, ImageFormat.Png);
                    var imageSize = (int)ms.Position - start;
                    ms.Seek(sizeHere, System.IO.SeekOrigin.Begin);
                    bw.Write(imageSize);
                    ms.Seek(0, System.IO.SeekOrigin.Begin);

                    return new Icon(ms);
                }
            }
        }

        private static Bitmap BitmapFromImageSource(System.Windows.Media.ImageSource image,Size size)
        {
            using (var stream = new MemoryStream())
            {
                var encoder = new BmpBitmapEncoder();
                encoder.Frames.Add(BitmapFrame.Create(new Uri(image.ToString(), UriKind.RelativeOrAbsolute)));
                encoder.Save(stream);
                return new Bitmap(Image.FromStream(stream), size);
            }

        }

        public static void SaveIcon(System.Windows.Media.ImageSource image, string path, Size? size = null)
        {
            using (var stream = File.Create(path))
            {
                using (var bitmap = BitmapFromImageSource(image, size ?? new Size((int)image.Width, (int)image.Height)))
                {
                    var icon = IconFromImage(bitmap);
                    icon.Save(stream);
                    icon.Dispose();
                }
            }
        }
    }
}
