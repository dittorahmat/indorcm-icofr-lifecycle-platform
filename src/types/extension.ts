import React from 'react';

export interface ExtensionRoute {
  path: string;
  element: React.ComponentType;
  roleRequired?: string[];
}

export interface ExtensionNavItem {
  label: string;
  path: string;
  iconName: string; // Menyimpan nama ikon Lucide (misal: 'Settings', 'Users')
  roleRequired?: string[];
}

export interface ExtensionModule {
  id: string;
  name: string;
  routes: ExtensionRoute[];
  navigation: ExtensionNavItem[];
}
