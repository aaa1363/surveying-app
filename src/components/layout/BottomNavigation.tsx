import React from 'react';
import { LayoutDashboard, FolderKanban, Coins, Calculator, FileText, UserCheck, ShieldAlert, FlaskConical, Users, Send, Settings, SlidersHorizontal } from 'lucide-react';
import { UserRole } from '../../models/User';

export type NavigationTab =
  | 'home'
  | 'projects'
  | 'rates'
  | 'pricing'
  | 'documents'
  | 'profile'
  | 'moderation'
  | 'client_explore'
  | 'validation_lab'
  | 'client_surveyors'
  | 'client_prices'
  | 'client_requests'
  | 'admin_management'
  | 'admin_tariffs'
  | 'admin_settings';

export interface BottomNavigationProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
  userRole?: UserRole;
}

export const BottomNavigation: React.FC<BottomNavigationProps> = ({
  activeTab,
  onTabChange,
  userRole = 'surveyor',
}) => {
  let tabs = [
    { id: 'home' as NavigationTab, label: 'داشبورد', icon: LayoutDashboard },
    { id: 'projects' as NavigationTab, label: 'پروژه‌ها', icon: FolderKanban },
    { id: 'pricing' as NavigationTab, label: 'قیمت‌گذاری', icon: Calculator },
    { id: 'documents' as NavigationTab, label: 'اسناد', icon: FileText },
    { id: 'profile' as NavigationTab, label: 'پروفایل', icon: UserCheck },
  ];

  if (userRole === 'admin') {
    tabs = [
      { id: 'home' as NavigationTab, label: 'داشبورد', icon: LayoutDashboard },
      { id: 'admin_management' as NavigationTab, label: 'مدیریت', icon: ShieldAlert },
      { id: 'admin_tariffs' as NavigationTab, label: 'تعرفه‌ها', icon: SlidersHorizontal },
      { id: 'validation_lab' as NavigationTab, label: 'آزمایشگاه', icon: FlaskConical },
      { id: 'admin_settings' as NavigationTab, label: 'تنظیمات', icon: Settings },
    ];
  } else if (userRole === 'client') {
    tabs = [
      { id:'home' as NavigationTab,label:'داشبورد',icon:LayoutDashboard },
      { id:'client_surveyors' as NavigationTab,label:'نقشه‌برداران',icon:Users },
      { id:'client_prices' as NavigationTab,label:'قیمت‌ها',icon:Coins },
      { id:'client_requests' as NavigationTab,label:'درخواست‌ها',icon:Send },
      { id:'profile' as NavigationTab,label:'پروفایل',icon:UserCheck },
    ];
  }

  return (
    <nav
      className="bottom-navigation"
      dir="rtl"
    >
      <div className="max-w-xl mx-auto grid items-center" style={{ gridTemplateColumns: `repeat(${tabs.length}, minmax(0, 1fr))` }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              aria-label={tab.label}
              className={`bottom-navigation-item ${isActive ? 'is-active' : ''}`}
            >
              <div
                className={`p-1 rounded-lg transition-colors ${
                  isActive ? 'bg-[color-mix(in_srgb,var(--accent)_14%,transparent)] text-[var(--accent)]' : 'text-[var(--muted)]'
                }`}
              >
                <Icon className="w-5 h-5" />
              </div>
              <span className="bottom-navigation-label">
                {tab.label}
              </span>
              {isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-teal-600 mt-0.5 animate-pulse" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
