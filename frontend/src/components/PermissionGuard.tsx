import React from 'react';
import { usePermissions } from './ProtectedRoute';

type UserRole = 'customer' | 'admin' | 'supplier';

interface PermissionGuardProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireAdmin?: boolean;
  requireApproved?: boolean;
  requireRole?: UserRole;
  fallback?: React.ComponentType | React.ReactElement | null;
  showFallback?: boolean;
}

const PermissionGuard: React.FC<PermissionGuardProps> = ({
  children,
  allowedRoles,
  requireAdmin = false,
  requireApproved = false,
  requireRole,
  fallback = null,
  showFallback = false,
}) => {
  const permissions = usePermissions();

  // Check admin requirement
  if (requireAdmin && !permissions.isAdmin()) {
    return showFallback && fallback
      ? React.isValidElement(fallback)
        ? fallback
        : React.createElement(fallback)
      : null;
  }

  // Check specific role requirement
  if (requireRole && !permissions.hasRole(requireRole)) {
    return showFallback && fallback
      ? React.isValidElement(fallback)
        ? fallback
        : React.createElement(fallback)
      : null;
  }

  // Check allowed roles
  if (allowedRoles && !permissions.hasAnyRole(allowedRoles)) {
    return showFallback && fallback
      ? React.isValidElement(fallback)
        ? fallback
        : React.createElement(fallback)
      : null;
  }

  // Check approved status for suppliers
  if (requireApproved && permissions.isSupplier() && !permissions.isApprovedSupplier()) {
    return showFallback && fallback
      ? React.isValidElement(fallback)
        ? fallback
        : React.createElement(fallback)
      : null;
  }

  return <>{children}</>;
};

export default PermissionGuard;

// Convenience components for common permission checks
export const AdminOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback,
}) => (
  <PermissionGuard requireAdmin fallback={fallback}>
    {children}
  </PermissionGuard>
);

export const SupplierOnly: React.FC<{
  children: React.ReactNode;
  requireApproved?: boolean;
  fallback?: React.ReactNode;
}> = ({ children, requireApproved = false, fallback }) => (
  <PermissionGuard requireRole='supplier' requireApproved={requireApproved} fallback={fallback}>
    {children}
  </PermissionGuard>
);

export const CustomerOnly: React.FC<{ children: React.ReactNode; fallback?: React.ReactNode }> = ({
  children,
  fallback,
}) => (
  <PermissionGuard requireRole='customer' fallback={fallback}>
    {children}
  </PermissionGuard>
);

export const ApprovedSupplierOnly: React.FC<{
  children: React.ReactNode;
  fallback?: React.ReactNode;
}> = ({ children, fallback }) => (
  <PermissionGuard requireRole='supplier' requireApproved fallback={fallback}>
    {children}
  </PermissionGuard>
);

// Hook for permission-based styles or classes
export const usePermissionStyles = () => {
  const permissions = usePermissions();

  const getVisibilityStyle = (allowedRoles: UserRole[]): React.CSSProperties => {
    return {
      display: permissions.hasAnyRole(allowedRoles) ? 'block' : 'none',
    };
  };

  const getDisabledState = (allowedRoles: UserRole[]): boolean => {
    return !permissions.hasAnyRole(allowedRoles);
  };

  return {
    getVisibilityStyle,
    getDisabledState,
    permissions,
  };
};
