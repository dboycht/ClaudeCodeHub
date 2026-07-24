import React from 'react';

interface Win11ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'danger' | 'ghost' | 'icon';
  size?: 'sm' | 'md';
  icon?: React.ReactNode;
  children?: React.ReactNode;
}

export function Win11Button({
  variant = 'ghost',
  size = 'md',
  icon,
  children,
  className = '',
  ...props
}: Win11ButtonProps) {
  const variantClass = {
    primary: 'btn--primary',
    danger: 'btn--danger',
    ghost: 'btn--ghost',
    icon: 'btn--icon',
  }[variant];

  const sizeClass = size === 'sm' ? 'btn--sm' : '';

  return (
    <button className={`btn ${variantClass} ${sizeClass} ${className}`} {...props}>
      {icon}
      {children}
    </button>
  );
}
