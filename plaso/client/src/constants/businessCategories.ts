export const BUSINESS_CATEGORIES = [
  { id: 'RESTAURANT', label: 'Restaurant', icon: 'restaurant' },
  { id: 'CAFE', label: 'Cafe', icon: 'cafe' },
  { id: 'GROCERY', label: 'Grocery', icon: 'local-grocery-store' },
  { id: 'FASHION', label: 'Fashion', icon: 'checkroom' },
  { id: 'ELECTRONICS', label: 'Electronics', icon: 'devices' },
  { id: 'BEAUTY', label: 'Beauty', icon: 'spa' },
  { id: 'HEALTH', label: 'Health', icon: 'health-and-safety' },
  { id: 'FITNESS', label: 'Fitness', icon: 'fitness-center' },
  { id: 'EDUCATION', label: 'Education', icon: 'school' },
  { id: 'AUTOMOTIVE', label: 'Automotive', icon: 'directions-car' },
  { id: 'HOME_SERVICES', label: 'Home Services', icon: 'home-repair-service' },
  { id: 'RETAIL', label: 'Retail', icon: 'storefront' },
  { id: 'OTHER', label: 'Other', icon: 'category' }
];

export const getCategoryLabel = (id: string) => {
  const category = BUSINESS_CATEGORIES.find(c => c.id === id);
  return category ? category.label : id;
};

export const getCategoryIcon = (id: string) => {
  const category = BUSINESS_CATEGORIES.find(c => c.id === id);
  return category ? category.icon : 'category';
};
