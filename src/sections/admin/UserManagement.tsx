import { useState, useEffect, useMemo, useCallback } from 'react';
import { motion } from 'framer-motion';
import { useSettingsStore } from '@/store';
import { User, UserRole } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import {
  Users,
  Search,
  Plus,
  MoreHorizontal,
  Edit2,
  Trash2,
  UserCheck,
  UserX,
  Mail,
  Building2,
  HardHat,
  Shield,
  Filter,
  Download,
} from 'lucide-react';

// User Form Component
function UserForm({
  user,
  defaultRole,
  onSubmit,
  onCancel
}: {
  user?: User;
  defaultRole?: UserRole;
  onSubmit: (data: Partial<User> & { password?: string }) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState<Partial<User> & { password?: string }>({
    name: user?.name || '',
    email: user?.email || '',
    role: user?.role || defaultRole || 'client',
    phone: user?.phone || '',
    company: user?.company || '',
    isActive: user?.isActive ?? true,
    password: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="name">Full Name</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          placeholder="Enter full name"
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          placeholder="Enter email address"
          required
        />
      </div>

      {!user && (
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            type="password"
            value={formData.password || ''}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            placeholder="Enter password"
            required
          />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="role">Role</Label>
        <Select
          value={formData.role}
          onValueChange={(value: UserRole) => setFormData({ ...formData, role: value })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select role" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="client">Client</SelectItem>
            <SelectItem value="freelancer">Freelancer</SelectItem>
            <SelectItem value="admin">Administrator</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="phone">Phone</Label>
        <Input
          id="phone"
          value={formData.phone}
          onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          placeholder="Enter phone number"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="company">Company</Label>
        <Input
          id="company"
          value={formData.company}
          onChange={(e) => setFormData({ ...formData, company: e.target.value })}
          placeholder="Enter company name"
        />
      </div>

      <DialogFooter>
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit">
          {user ? 'Update User' : 'Create User'}
        </Button>
      </DialogFooter>
    </form>
  );
}

// User Table Component
function UserTable({
  users,
  onEdit,
  onDelete,
  onActivate,
  onDeactivate
}: {
  users: User[];
  onEdit: (user: User) => void;
  onDelete: (user: User) => void;
  onActivate: (user: User) => void;
  onDeactivate: (user: User) => void;
}) {
  const getRoleIcon = (role: UserRole) => {
    switch (role) {
      case 'admin': return Shield;
      case 'client': return Building2;
      case 'freelancer': return HardHat;
      default: return Users;
    }
  };

  const getRoleBadgeColor = (role: UserRole) => {
    switch (role) {
      case 'admin': return 'bg-red-500';
      case 'client': return 'bg-blue-500';
      case 'freelancer': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>User</TableHead>
          <TableHead>Role</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Company</TableHead>
          <TableHead>Created</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {users.map((user, index) => {
          const RoleIcon = getRoleIcon(user.role);
          return (
            <motion.tr
              key={user.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="border-b hover:bg-muted/50 transition-colors"
            >
              <TableCell>
                <div className="flex items-center gap-3">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback>{(user.name || '?').charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium">{user.name || '-'}</p>
                    <p className="text-sm text-muted-foreground">{user.email || '-'}</p>
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge className={`${getRoleBadgeColor(user.role)} text-white`}>
                  <RoleIcon className="w-3 h-3 mr-1" />
                  {user.role}
                </Badge>
              </TableCell>
              <TableCell>
                <Badge variant={user.isActive ? 'default' : 'secondary'}>
                  {user.isActive ? 'Active' : 'Inactive'}
                </Badge>
              </TableCell>
              <TableCell>{user.company || '-'}</TableCell>
              <TableCell>{user.createdAt ? new Date(user.createdAt).toLocaleDateString() : '-'}</TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal className="w-4 h-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(user)}>
                      <Edit2 className="w-4 h-4 mr-2" />
                      Edit
                    </DropdownMenuItem>
                    {user.isActive ? (
                      <DropdownMenuItem onClick={() => onDeactivate(user)}>
                        <UserX className="w-4 h-4 mr-2" />
                        Deactivate
                      </DropdownMenuItem>
                    ) : (
                      <DropdownMenuItem onClick={() => onActivate(user)}>
                        <UserCheck className="w-4 h-4 mr-2" />
                        Activate
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => onDelete(user)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </motion.tr>
          );
        })}
      </TableBody>
    </Table>
  );
}

export function UserManagement() {
  const users = useSettingsStore(state => state.users);
  const createUser = useSettingsStore(state => state.createUser);
  const updateUser = useSettingsStore(state => state.updateUser);
  const deleteUser = useSettingsStore(state => state.deleteUser);
  const activateUser = useSettingsStore(state => state.activateUser);
  const deactivateUser = useSettingsStore(state => state.deactivateUser);
  const getUserStats = useSettingsStore(state => state.getUserStats);
  const initialize = useSettingsStore(state => state.initialize);
  const cleanup = useSettingsStore(state => state.cleanup);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<UserRole | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive'>('all');
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [defaultRole, setDefaultRole] = useState<UserRole>('client');

  // Memoize stats to prevent infinite re-renders
  const stats = useMemo(() => getUserStats(), [users]);

  // Wrap initialize and cleanup with useCallback to prevent dependency changes
  const handleInitialize = useCallback(() => {
    console.log('[UserManagement] Component mounted, calling initialize()...');
    initialize();
  }, [initialize]);

  const handleCleanup = useCallback(() => {
    console.log('[UserManagement] Component unmounting, calling cleanup()...');
    cleanup();
  }, [cleanup]);

  // Initialize the store on component mount
  useEffect(() => {
    handleInitialize();

    return () => {
      handleCleanup();
    };
  }, [handleInitialize, handleCleanup]);

  // Log users state changes
  useEffect(() => {
    console.log('[UserManagement] Users state updated:', users);
    console.log('[UserManagement] Total users:', users.length);
  }, [users]);

  // Filter users
  const filteredUsers = users.filter(user => {
    const query = (searchQuery || '').toLowerCase();
    const matchesSearch =
      (user.name || '').toLowerCase().includes(query) ||
      (user.email || '').toLowerCase().includes(query) ||
      (user.company || '').toLowerCase().includes(query);

    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' ? user.isActive : !user.isActive);

    return matchesSearch && matchesRole && matchesStatus;
  });

  const handleCreateUser = async (data: Partial<User> & { password?: string }) => {
    try {
      await createUser(data);
      setIsCreateDialogOpen(false);
      toast.success('User created successfully. They can now log in with their credentials.');
    } catch (error) {
      console.error('Error creating user:', error);
      toast.error('Failed to create user. Please try again.');
    }
  };

  const handleEditUser = async (data: Partial<User>) => {
    if (selectedUser) {
      updateUser(selectedUser.id, data);
      setIsEditDialogOpen(false);
      setSelectedUser(null);
      toast.success('User updated successfully');
    }
  };

  const handleDeleteUser = (user: User) => {
    if (confirm(`Are you sure you want to delete ${user.name}?`)) {
      deleteUser(user.id);
      toast.success('User deleted successfully');
    }
  };

  const handleActivate = (user: User) => {
    activateUser(user.id);
    toast.success(`${user.name} has been activated`);
  };

  const handleDeactivate = (user: User) => {
    deactivateUser(user.id);
    toast.success(`${user.name} has been deactivated`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <h1 className="text-3xl font-bold">User Management</h1>
        <p className="text-muted-foreground mt-1">
          Manage users, roles, and permissions across the platform.
        </p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Users</p>
                <p className="text-3xl font-bold">{stats.total}</p>
              </div>
              <div className="p-3 rounded-xl bg-primary">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Clients</p>
                <p className="text-3xl font-bold">{stats.byRole.client}</p>
              </div>
              <div className="p-3 rounded-xl bg-blue-500">
                <Building2 className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Freelancers</p>
                <p className="text-3xl font-bold">{stats.byRole.freelancer}</p>
              </div>
              <div className="p-3 rounded-xl bg-green-500">
                <HardHat className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-3xl font-bold">{stats.active}</p>
              </div>
              <div className="p-3 rounded-xl bg-purple-500">
                <UserCheck className="w-6 h-6 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div>
              <CardTitle>All Users</CardTitle>
              <CardDescription>Manage and monitor user accounts</CardDescription>
            </div>

            <div className="flex flex-wrap gap-2">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search users..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 w-[200px]"
                />
              </div>

              {/* Role Filter */}
              <Select value={roleFilter} onValueChange={(v: UserRole | 'all') => setRoleFilter(v)}>
                <SelectTrigger className="w-[130px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Roles</SelectItem>
                  <SelectItem value="client">Clients</SelectItem>
                  <SelectItem value="freelancer">Freelancers</SelectItem>
                  <SelectItem value="admin">Admins</SelectItem>
                </SelectContent>
              </Select>

              {/* Status Filter */}
              <Select value={statusFilter} onValueChange={(v: 'all' | 'active' | 'inactive') => setStatusFilter(v)}>
                <SelectTrigger className="w-[130px]">
                  <Filter className="w-4 h-4 mr-2" />
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>

              {/* Export */}
              <Button variant="outline" size="icon">
                <Download className="w-4 h-4" />
              </Button>

              {/* Role-specific Add User Buttons */}
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => {
                  setDefaultRole('admin');
                  setIsCreateDialogOpen(true);
                }}
              >
                <Shield className="w-4 h-4" />
                Add Admin
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => {
                  setDefaultRole('client');
                  setIsCreateDialogOpen(true);
                }}
              >
                <Building2 className="w-4 h-4" />
                Add Client
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => {
                  setDefaultRole('freelancer');
                  setIsCreateDialogOpen(true);
                }}
              >
                <HardHat className="w-4 h-4" />
                Add Freelancer
              </Button>

              {/* Add User Dialog */}
              <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
                <DialogContent className="sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Create New User</DialogTitle>
                    <DialogDescription>
                      Add a new user to the platform. They will receive an email invitation.
                    </DialogDescription>
                  </DialogHeader>
                  <UserForm
                    defaultRole={defaultRole}
                    onSubmit={handleCreateUser}
                    onCancel={() => setIsCreateDialogOpen(false)}
                  />
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <ScrollArea className="h-[500px]">
            {filteredUsers.length === 0 ? (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col items-center justify-center h-[400px] text-center"
              >
                <Users className="w-16 h-16 text-muted-foreground mb-4" />
                <h3 className="text-xl font-semibold mb-2">No users found</h3>
                <p className="text-muted-foreground mb-4">
                  Try adjusting your search or filters, or add a new user.
                </p>
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  className="gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Add User
                </Button>
              </motion.div>
            ) : (
              <UserTable
                users={filteredUsers}
                onEdit={(user) => {
                  setSelectedUser(user);
                  setIsEditDialogOpen(true);
                }}
                onDelete={handleDeleteUser}
                onActivate={handleActivate}
                onDeactivate={handleDeactivate}
              />
            )}
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
            <DialogDescription>
              Update user information and permissions.
            </DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <UserForm
              user={selectedUser}
              onSubmit={handleEditUser}
              onCancel={() => {
                setIsEditDialogOpen(false);
                setSelectedUser(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
