export interface Permission {
  id: string;
  key: string;
  module: string;
  action: string;
  description: string | null;
}

export interface GroupedPermissions {
  module: string;
  permissions: Permission[];
}