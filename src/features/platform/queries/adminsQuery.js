import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminsApi } from '../api/adminEndpoint';
// import { toast } from 'react-hot-toast'; // Example toast library

export const adminKeys = {
  all: ['admins'],
  list: (page) => [...adminKeys.all, 'list', { page }],
  detail: (id) => [...adminKeys.all, 'detail', id],
};

// --- READ HOOKS ---
export const useAdmins = (page) => {
  return useQuery({
    queryKey: adminKeys.list(page),
    queryFn: () => adminsApi.list(page),
    retry: 1, // Only retry once if it fails
    onError: (error) => {
      console.error("Failed to fetch admins:", error.message);
    }
  });
};

// --- WRITE HOOKS (Mutations) ---
export const useCreateAdmin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
      // toast.success("Admin created successfully!");
    },
    onError: (error) => {
      // This 'error' is the clean message we threw in the API file
      console.error("Create failed:", error.message);
      // toast.error(error.message); 
    }
  });
};

export const useUpdateAdmin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminsApi.update,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
      queryClient.setQueryData(adminKeys.detail(data.id), data);
      // toast.success("Admin updated!");
    },
    onError: (error) => {
      console.error("Update failed:", error.message);
    }
  });
};

export const useDeleteAdmin = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: adminsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
      // toast.success("Admin deleted");
    },
    onError: (error) => {
      console.error("Delete failed:", error.message);
    }
  });
};