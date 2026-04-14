import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Users, UserPlus, Shield, Mail, Building2, 
  Search, MoreVertical, Edit, Trash2, Key,
  ChevronLeft, ChevronRight, Plus, LayoutGrid
} from "lucide-react";
import { api } from "@/lib/api-client";
import { authClient } from "@/lib/auth-client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Table, TableBody, TableCell, TableHead, 
  TableHeader, TableRow 
} from "@/components/ui/table";
import { 
  Dialog, DialogContent, DialogDescription, 
  DialogFooter, DialogHeader, DialogTitle, 
  DialogTrigger 
} from "@/components/ui/dialog";
import { 
  Select, SelectContent, SelectItem, 
  SelectTrigger, SelectValue 
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Tabs, TabsContent, List, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { UserRole, UserLevel } from "@shared/types";

interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  level: UserLevel;
  departmentId: string | null;
}

interface Department {
  id: string;
  name: string;
  organizationId: string;
  userCount: number;
}

export function UserManagementPage() {
  const queryClient = useQueryClient();
  
  // State for Users
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [page, setPage] = useState(1);
  const limit = 10;
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deletingUser, setDeletingUser] = useState<User | null>(null);

  // State for Departments
  const [isAddDeptOpen, setIsAddDeptOpen] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [deletingDept, setDeletingDept] = useState<Department | null>(null);

  // Debounce search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchTerm);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // --- QUERIES ---
  
  const { data: usersData, isLoading: isUsersLoading } = useQuery({
    queryKey: ["users", debouncedSearch, page],
    queryFn: () => api<{ items: User[], total: number, page: number, limit: number }>(
      `/api/users?search=${debouncedSearch}&page=${page}&limit=${limit}`
    ),
  });

  const { data: deptsData, isLoading: isDeptsLoading } = useQuery({
    queryKey: ["departments"],
    queryFn: () => api<{ items: Department[] }>("/api/departments"),
  });

  const users = usersData?.items || [];
  const departments = deptsData?.items || [];
  const total = usersData?.total || 0;
  const totalPages = Math.ceil(total / limit);

  // --- MUTATIONS: USERS ---

  const addUserMutation = useMutation({
    mutationFn: (newUser: any) => api("/api/users", { method: "POST", body: JSON.stringify(newUser) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("New user successfully added");
      setIsAddUserOpen(false);
    },
    onError: (err: any) => toast.error(`Failed: ${err.message}`)
  });

  const updateUserMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => api(`/api/users/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User updated");
      setEditingUser(null);
    },
    onError: (err: any) => toast.error(`Failed: ${err.message}`)
  });

  const deleteUserMutation = useMutation({
    mutationFn: (id: string) => api(`/api/users/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
      toast.success("User deleted");
      setDeletingUser(null);
    },
    onError: (err: any) => toast.error(`Failed: ${err.message}`)
  });

  // --- MUTATIONS: DEPARTMENTS ---

  const addDeptMutation = useMutation({
    mutationFn: (newDept: any) => api("/api/departments", { method: "POST", body: JSON.stringify(newDept) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department added");
      setIsAddDeptOpen(false);
    },
    onError: (err: any) => toast.error(`Failed: ${err.message}`)
  });

  const updateDeptMutation = useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => api(`/api/departments/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department updated");
      setEditingDept(null);
    },
    onError: (err: any) => toast.error(`Failed: ${err.message}`)
  });

  const deleteDeptMutation = useMutation({
    mutationFn: (id: string) => api(`/api/departments/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["departments"] });
      toast.success("Department deleted");
      setDeletingDept(null);
    },
    onError: (err: any) => toast.error(`Failed: ${err.message}`)
  });

  // --- HANDLERS ---

  const handleAddUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    addUserMutation.mutate(Object.fromEntries(formData.entries()));
  };

  const handleUpdateUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingUser) return;
    const formData = new FormData(e.currentTarget);
    updateUserMutation.mutate({ id: editingUser.id, data: Object.fromEntries(formData.entries()) });
  };

  const handleAddDept = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    addDeptMutation.mutate(Object.fromEntries(formData.entries()));
  };

  const handleUpdateDept = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingDept) return;
    const formData = new FormData(e.currentTarget);
    updateDeptMutation.mutate({ id: editingDept.id, data: Object.fromEntries(formData.entries()) });
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Organization Admin</h1>
          <p className="text-muted-foreground">Manage personnel and BUMN department structures.</p>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" /> User Management
          </TabsTrigger>
          <TabsTrigger value="departments" className="gap-2">
            <LayoutGrid className="h-4 w-4" /> Departments
          </TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          <div className="flex justify-between items-center">
            <div className="relative w-full max-w-sm">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search user name..."
                className="pl-8"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><UserPlus className="h-4 w-4" /> Add User</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleAddUser}>
                  <DialogHeader>
                    <DialogTitle>Add New User</DialogTitle>
                    <DialogDescription>Enter new personnel account and select department.</DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2"><Label>Full Name</Label><Input name="name" required /></div>
                    <div className="grid gap-2"><Label>BUMN Email</Label><Input name="email" type="email" required /></div>
                    <div className="grid gap-2"><Label>Password</Label><Input name="password" type="password" defaultValue="password123" required /></div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2"><Label>Role</Label>
                        <Select name="role" defaultValue="Line 1">
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Line 1">Line 1</SelectItem>
                            <SelectItem value="Line 2">Line 2</SelectItem>
                            <SelectItem value="Line 3">Line 3</SelectItem>
                            <SelectItem value="CFO">CFO</SelectItem>
                            <SelectItem value="Komisaris">Commissioner</SelectItem>
                            <SelectItem value="Admin">Admin</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2"><Label>Level</Label>
                        <Select name="level" defaultValue="Staff">
                          <SelectTrigger><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Staff">Staff</SelectItem>
                            <SelectItem value="Manager">Manager</SelectItem>
                            <SelectItem value="Head">Head</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label>Department</Label>
                      <Select name="departmentId">
                        <SelectTrigger><SelectValue placeholder="Select Department" /></SelectTrigger>
                        <SelectContent>
                          {departments.map(d => (
                            <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter><Button type="submit">Save</Button></DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <Card>
            <CardContent className="pt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role & Level</TableHead>
                    <TableHead>Department</TableHead>
                    <TableHead className="text-right">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isUsersLoading ? <TableRow><TableCell colSpan={4} className="text-center py-10">Loading...</TableCell></TableRow> :
                    users.map((u) => (
                      <TableRow key={u.id}>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="font-medium">{u.name}</span>
                            <span className="text-xs text-muted-foreground">{u.email}</span>
                          </div>
                        </TableCell>
                        <TableCell>{u.role} ({u.level || "Staff"})</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="font-normal">
                            {departments.find(d => d.id === u.departmentId)?.name || "-"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon"><MoreVertical className="h-4 w-4" /></Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => setEditingUser(u)}><Edit className="h-4 w-4 mr-2" /> Edit</DropdownMenuItem>
                              <DropdownMenuItem onClick={() => setDeletingUser(u)} className="text-red-600"><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  }
                </TableBody>
              </Table>
              {totalPages > 1 && (
                <div className="flex items-center justify-end space-x-2 py-4">
                  <Button variant="outline" size="sm" onClick={() => setPage(p => p - 1)} disabled={page === 1}>Previous</Button>
                  <span className="text-sm">Page {page} of {totalPages}</span>
                  <Button variant="outline" size="sm" onClick={() => setPage(p => p + 1)} disabled={page === totalPages}>Next</Button>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="departments" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isAddDeptOpen} onOpenChange={setIsAddDeptOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2"><Plus className="h-4 w-4" /> Add Department</Button>
              </DialogTrigger>
              <DialogContent>
                <form onSubmit={handleAddDept}>
                  <DialogHeader>
                    <DialogTitle>Add Department</DialogTitle>
                    <DialogDescription>Example: Finance, Mining Operations, HR, etc.</DialogDescription>
                  </DialogHeader>
                  <div className="py-4"><Label>Department Name</Label><Input name="name" required /></div>
                  <DialogFooter><Button type="submit">Save</Button></DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {isDeptsLoading ? <div className="col-span-3 text-center py-10">Loading...</div> :
              departments.map(d => (
                <Card key={d.id}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{d.name}</CardTitle>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8"><MoreVertical className="h-4 w-4" /></Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => setEditingDept(d)}><Edit className="h-4 w-4 mr-2" /> Rename</DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setDeletingDept(d)} className="text-red-600"><Trash2 className="h-4 w-4 mr-2" /> Delete</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{d.userCount || 0}</div>
                    <p className="text-xs text-muted-foreground">Total Personnel</p>
                  </CardContent>
                </Card>
              ))
            }
          </div>
        </TabsContent>
      </Tabs>

      {/* --- MODALS FOR EDIT/DELETE (EXISTING LOGIC) --- */}
      {/* ... keeping editUser, deleteUser modals ... */}
      <Dialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <DialogContent className="sm:max-w-[425px]">
          {editingUser && (
            <form onSubmit={handleUpdateUser}>
              <DialogHeader><DialogTitle>Edit User: {editingUser.name}</DialogTitle></DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2"><Label>Full Name</Label><Input name="name" defaultValue={editingUser.name} required /></div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2"><Label>Role</Label>
                    <Select name="role" defaultValue={editingUser.role}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Line 1">Line 1</SelectItem>
                        <SelectItem value="Line 2">Line 2</SelectItem>
                        <SelectItem value="Line 3">Line 3</SelectItem>
                        <SelectItem value="CFO">CFO</SelectItem>
                        <SelectItem value="Komisaris">Commissioner</SelectItem>
                        <SelectItem value="Admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-2"><Label>Level</Label>
                    <Select name="level" defaultValue={editingUser.level}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Staff">Staff</SelectItem>
                        <SelectItem value="Manager">Manager</SelectItem>
                        <SelectItem value="Head">Head</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Department</Label>
                  <Select name="departmentId" defaultValue={editingUser.departmentId}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {departments.map(d => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter><Button type="submit">Update</Button></DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingDept} onOpenChange={(open) => !open && setEditingDept(null)}>
        <DialogContent>
          <form onSubmit={handleUpdateDept}>
            <DialogHeader><DialogTitle>Rename Department</DialogTitle></DialogHeader>
            <div className="py-4"><Label>New Name</Label><Input name="name" defaultValue={editingDept?.name} required /></div>
            <DialogFooter><Button type="submit">Update</Button></DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog open={!!deletingUser} onOpenChange={(open) => !open && setDeletingUser(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete User?</AlertDialogTitle><AlertDialogDescription>This action cannot be undone.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingUser && deleteUserMutation.mutate(deletingUser.id)} className="bg-red-600">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={!!deletingDept} onOpenChange={(open) => !open && setDeletingDept(null)}>
        <AlertDialogContent>
          <AlertDialogHeader><AlertDialogTitle>Delete Department?</AlertDialogTitle><AlertDialogDescription>Delete <b>{deletingDept?.name}</b>? Ensure there are no users in it.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={() => deletingDept && deleteDeptMutation.mutate(deletingDept.id)} className="bg-red-600">Delete</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
