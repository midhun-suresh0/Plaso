export const MARKETPLACE_CATEGORIES = [
  { id: 'FOOD', label: 'Food & Dining', icon: 'restaurant' },
  { id: 'GROCERY', label: 'Grocery', icon: 'local-grocery-store' },
  { id: 'FASHION', label: 'Fashion & Apparel', icon: 'checkroom' },
  { id: 'ELECTRONICS', label: 'Electronics', icon: 'devices' },
  { id: 'BEAUTY', label: 'Beauty & Personal Care', icon: 'spa' },
  { id: 'HEALTH', label: 'Health & Wellness', icon: 'health-and-safety' },
  { id: 'FITNESS', label: 'Fitness & Sports', icon: 'fitness-center' },
  { id: 'HOME', label: 'Home & Garden', icon: 'chair' },
  { id: 'AUTOMOTIVE', label: 'Automotive', icon: 'directions-car' },
  { id: 'EDUCATION', label: 'Education & Tutors', icon: 'school' },
  { id: 'SERVICES', label: 'Home Services', icon: 'home-repair-service' },
  { id: 'OTHER', label: 'Other', icon: 'category' },
];

export const getMarketplaceCategoryLabel = (id: string) => {
  const category = MARKETPLACE_CATEGORIES.find((c) => c.id === id);
  return category ? category.label : id;
};

export const getMarketplaceCategoryIcon = (id: string) => {
  const category = MARKETPLACE_CATEGORIES.find((c) => c.id === id);
  return category ? category.icon : 'category';
};
