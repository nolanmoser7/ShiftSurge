import { useState } from 'react';
import { FilterBar } from '../FilterBar';

export default function FilterBarExample() {
  const [categories, setCategories] = useState<string[]>(['All']);
  const [search, setSearch] = useState('');

  const handleCategoryToggle = (category: string) => {
    if (category === 'All') {
      setCategories(['All']);
    } else {
      const newCategories = categories.includes(category)
        ? categories.filter(c => c !== category)
        : [...categories.filter(c => c !== 'All'), category];
      setCategories(newCategories.length === 0 ? ['All'] : newCategories);
    }
  };

  return (
    <div className="max-w-3xl">
      <FilterBar
        selectedCategories={categories}
        onCategoryToggle={handleCategoryToggle}
        searchQuery={search}
        onSearchChange={setSearch}
      />
    </div>
  );
}
