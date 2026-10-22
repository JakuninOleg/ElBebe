interface NavigationLink { label: string; href: string; }
type NavigationItem = (NavigationLink & { id: string }) | { id: string; label: string; children: NavigationLink[] };

export const primaryNavigation: NavigationItem[] = [
  { id: 'about', label: 'О саде', children: [
    { href: '/#o-sade', label: 'Знакомство с садом' },
    { href: '/komanda/', label: 'Воспитатели' },
    { href: '/dokumenty/', label: 'Документы сада' },
  ] },
  { id: 'groups', label: 'Группы', children: [
    { href: '/gruppy/', label: 'Все группы' },
    { href: '/gruppy/mladshaya/', label: 'Младшая группа' },
    { href: '/gruppy/srednyaya/', label: 'Средняя группа' },
    { href: '/gruppy/starshaya/', label: 'Старшая группа' },
  ] },
  { id: 'price', href: '/stoimost/', label: 'Стоимость' },
  { id: 'gallery', href: '/prostranstvo/', label: 'Галерея' },
  { id: 'parents', label: 'Родителям', children: [
    { href: '/den-v-sadu/', label: 'День в саду' },
    { href: '/roditelyam/', label: 'Вопросы родителей' },
  ] },
  { id: 'contacts', href: '/kontakty/', label: 'Контакты' },
];
