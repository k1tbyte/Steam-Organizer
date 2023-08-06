using Newtonsoft.Json.Serialization;
using Newtonsoft.Json;
using SteamOrganizer.Infrastructure;
using System.Reflection;
using System;
using Newtonsoft.Json.Linq;

namespace SteamOrganizer.Helpers.Encryption
{
    internal static class StringEncryption
    {
        [AttributeUsage(AttributeTargets.Property)]
        public class Encryptable : Attribute { }

        public class EncryptionContractResolver : DefaultContractResolver
        {
            private readonly EncryptionJsonConverter Converter = new EncryptionJsonConverter();
            private class EncryptionJsonConverter : JsonConverter
            {
                public override bool CanConvert(Type objectType) => true;

                public override object ReadJson(JsonReader reader, Type objectType, object existingValue, JsonSerializer serializer)
                    => throw new NotSupportedException();

                public override void WriteJson(JsonWriter writer, object value, JsonSerializer serializer)
                    => JToken.FromObject(EncryptionTools.XorString(value as string)).WriteTo(writer);
                
            }
            protected override JsonProperty CreateProperty(MemberInfo member, MemberSerialization memberSerialization)
            {
                var jProperty = base.CreateProperty(member, memberSerialization);

                if (member.MemberType == MemberTypes.Property && jProperty.PropertyType == typeof(string) && member.GetCustomAttribute(typeof(Encryptable)) != null)
                {
                    jProperty.Converter = Converter;
                }

                return jProperty;
            }
        }

        public static T EncryptAllStrings<T>(T obj) where T : class
        {
            var properties = obj.GetType().GetProperties();

            if (properties.Length == 0)
                return obj;

            foreach (var property in properties)
            {
                var value = property.GetValue(obj);
                if (!(value is string strField))
                    continue;

                EncryptionTools.ReplacementXorString(App.EncryptionKey, strField);
            }

            return obj;
        }
    }
}
