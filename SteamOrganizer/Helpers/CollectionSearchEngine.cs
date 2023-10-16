using SteamOrganizer.Infrastructure;
using System;
using System.Collections.Generic;
using System.ComponentModel;
using System.Linq;
using System.Reflection;
using System.Text;
using System.Threading.Tasks;
using System.Web.UI.WebControls;
using System.Windows.Data;

namespace SteamOrganizer.Helpers
{
    internal sealed class CollectionSearchEngine<T> where T : class
    {
        private readonly Dictionary<PropertyInfo, Func<T, bool>> CollectionFilters = new Dictionary<PropertyInfo, Func<T, bool>>();
        public readonly ICollectionView Collection;

        private Predicate<T> SearchingPredicate;
        private string SearchingKeyword;
        private PropertyInfo SearchingProperty;

        public CollectionSearchEngine(ICollectionView collectionView)
        {
            Collection = collectionView;
        }

        public CollectionSearchEngine(object source)
        {
            Collection = CollectionViewSource.GetDefaultView(source);
        }

        private void BindFilterOrRefresh()
        {
            if (Collection.Filter == null)
            {
                Collection.Filter = OnCollectionFiltering;
                return;
            }

            Collection.Refresh();
        }

        public CollectionSearchEngine<T> AddFilter(PropertyInfo property, Func<T,bool> predicate)
        {
            property.ThrowIfNull();
            predicate.ThrowIfNull();

            //If the condition already exists, we replace it
            CollectionFilters.Remove(property);
            CollectionFilters.Add(property, predicate);

            BindFilterOrRefresh();
            return this;
        }

        public CollectionSearchEngine<T> RemoveFilter(PropertyInfo property)
        {
            property.ThrowIfNull();

            if (CollectionFilters.Remove(property))
                Collection.Refresh();

            return this;
        }

        public void ApplySearch(PropertyInfo property, string keyword, StringComparison comparison = StringComparison.InvariantCultureIgnoreCase)
        { 
            SearchingKeyword  = keyword;
            SearchingProperty = property;

            if (keyword == null || keyword.Length == 0)
            {
                if(SearchingPredicate != null)
                {
                    SearchingPredicate = null;
                    Collection.Refresh();
                }

                return;
            }

            if (SearchingPredicate == null)
            {
                SearchingPredicate = (value) 
                    => SearchingProperty.GetValue(value)?.ToString().IndexOf(SearchingKeyword, comparison) >= 0;
            }

            BindFilterOrRefresh();
        }

        public void ApplySort(string propertyName, ListSortDirection direction)
        {
            if (Collection.SortDescriptions.Count != 0)
            {
                Collection.SortDescriptions.Clear();
            }

            if (propertyName == null)
                return;

            Collection.SortDescriptions.Add(new SortDescription(propertyName, direction));
        }

        public void Reset()
        {
            if(CollectionFilters.Count == 0)
                return;
            
            CollectionFilters.Clear();
            Collection.Filter = null;
            Collection.Refresh();
        }

        private bool OnCollectionFiltering(object value)
        {
            if (!(value is T type))
                return false;

            var searchResult = SearchingPredicate == null || SearchingPredicate(type);

            if (CollectionFilters.Count > 0)
            {
                foreach (var filter in CollectionFilters)
                {
                    if (!filter.Value.Invoke(type))
                        return false;
                }
            }

            return searchResult;
        }

    }
}
