import React from 'react';
import { TitleBar } from './TitleBar';
import { Sidebar } from './Sidebar';
import { StatusBar } from './StatusBar';

interface LayoutProps {
  children: React.ReactNode;
  onRefresh: () => void;
}

export function Layout({ children, onRefresh }: LayoutProps) {
  return (
    <div className="app-root">
      <TitleBar onRefresh={onRefresh} />
      <div className="app-body">
        <Sidebar onRefresh={onRefresh} />
        {children}
      </div>
      <StatusBar />
    </div>
  );
}
