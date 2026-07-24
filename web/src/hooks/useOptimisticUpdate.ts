'use client';

import { useCallback, useRef } from 'react';
import {
  useQueryClient,
  useMutation,
  UseMutationOptions,
  QueryKey,
  InfiniteData,
} from '@tanstack/react-query';

interface OptimisticUpdateOptions<TData, TVariables, TContext> {
  /** Query key to update */
  queryKey: QueryKey;
  /** Mutation function */
  mutationFn: (variables: TVariables) => Promise<TData>;
  /** Function to optimistically update the cache */
  updateFn: (oldData: TData | undefined, variables: TVariables) => TData;
  /** Called on successful mutation */
  onSuccess?: (data: TData, variables: TVariables, context: TContext | undefined) => void;
  /** Called on error */
  onError?: (error: Error, variables: TVariables, context: TContext | undefined) => void;
  /** Called after mutation settles (success or error) */
  onSettled?: (
    data: TData | undefined,
    error: Error | null,
    variables: TVariables,
    context: TContext | undefined
  ) => void;
  /** Whether to invalidate query on success */
  invalidateOnSuccess?: boolean;
  /** Custom rollback function */
  rollbackFn?: (context: TContext, error: Error) => void;
}

/**
 * useOptimisticUpdate - Hook for optimistic updates with React Query
 *
 * Provides optimistic UI updates that immediately reflect changes
 * while the mutation is in progress, with automatic rollback on error.
 *
 * @example
 * ```tsx
 * const { mutate, isLoading } = useOptimisticUpdate({
 *   queryKey: ['todos'],
 *   mutationFn: updateTodo,
 *   updateFn: (oldData, { id, completed }) =>
 *     oldData?.map(todo =>
 *       todo.id === id ? { ...todo, completed } : todo
 *     ),
 * });
 *
 * // Instantly updates UI, rolls back if server fails
 * mutate({ id: '123', completed: true });
 * ```
 */
export function useOptimisticUpdate<
  TData = unknown,
  TVariables = unknown,
  TContext = { previousData: TData | undefined }
>({
  queryKey,
  mutationFn,
  updateFn,
  onSuccess,
  onError,
  onSettled,
  invalidateOnSuccess = true,
  rollbackFn,
}: OptimisticUpdateOptions<TData, TVariables, TContext>) {
  const queryClient = useQueryClient();

  return useMutation<TData, Error, TVariables, TContext>({
    mutationFn,
    onMutate: async (variables) => {
      // Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey });

      // Snapshot current value
      const previousData = queryClient.getQueryData<TData>(queryKey);

      // Optimistically update
      queryClient.setQueryData<TData>(queryKey, (oldData) =>
        updateFn(oldData, variables)
      );

      return { previousData } as TContext;
    },
    onError: (error, variables, context) => {
      // Rollback on error
      if (context && typeof context === 'object' && 'previousData' in context) {
        queryClient.setQueryData(queryKey, (context as { previousData: TData | undefined }).previousData);
      }

      if (rollbackFn && context) {
        rollbackFn(context, error);
      }

      onError?.(error, variables, context);
    },
    onSuccess: (data, variables, context) => {
      onSuccess?.(data, variables, context);
    },
    onSettled: (data, error, variables, context) => {
      // Invalidate to refetch and ensure server state
      if (invalidateOnSuccess) {
        queryClient.invalidateQueries({ queryKey });
      }

      onSettled?.(data, error, variables, context);
    },
  });
}

/**
 * useOptimisticListUpdate - Specialized hook for list operations
 *
 * Handles common list operations (add, update, remove) with optimistic updates.
 *
 * @example
 * ```tsx
 * const { addItem, updateItem, removeItem } = useOptimisticListUpdate<Todo>({
 *   queryKey: ['todos'],
 *   addMutation: createTodo,
 *   updateMutation: updateTodo,
 *   removeMutation: deleteTodo,
 *   getId: (todo) => todo.id,
 * });
 *
 * // Add new item optimistically
 * addItem({ title: 'New Todo' });
 *
 * // Update existing item optimistically
 * updateItem({ id: '123', completed: true });
 *
 * // Remove item optimistically
 * removeItem('123');
 * ```
 */
export function useOptimisticListUpdate<
  TItem extends { id: string | number },
  TAddVariables = Partial<TItem>,
  TUpdateVariables = Partial<TItem> & { id: string | number },
  TRemoveVariables = string | number
>({
  queryKey,
  addMutation,
  updateMutation,
  removeMutation,
  getId = (item) => item.id,
  generateTempId = () => `temp-${Date.now()}`,
}: {
  queryKey: QueryKey;
  addMutation?: (variables: TAddVariables) => Promise<TItem>;
  updateMutation?: (variables: TUpdateVariables) => Promise<TItem>;
  removeMutation?: (id: TRemoveVariables) => Promise<void>;
  getId?: (item: TItem) => string | number;
  generateTempId?: () => string;
}) {
  const queryClient = useQueryClient();
  const tempIdsRef = useRef<Set<string>>(new Set());

  // Add item mutation
  const addMutationResult = useMutation<
    TItem,
    Error,
    TAddVariables,
    { previousData: TItem[] | undefined; tempId: string }
  >({
    mutationFn: addMutation || (async () => {
      throw new Error('addMutation not provided');
    }),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData<TItem[]>(queryKey);
      const tempId = generateTempId();
      tempIdsRef.current.add(tempId);

      // Create optimistic item
      const optimisticItem = {
        id: tempId,
        ...variables,
        _isOptimistic: true,
      } as unknown as TItem;

      queryClient.setQueryData<TItem[]>(queryKey, (old = []) => [
        optimisticItem,
        ...old,
      ]);

      return { previousData, tempId };
    },
    onError: (error, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      if (context?.tempId) {
        tempIdsRef.current.delete(context.tempId);
      }
    },
    onSuccess: (data, variables, context) => {
      // Replace temp item with real item
      if (context?.tempId) {
        queryClient.setQueryData<TItem[]>(queryKey, (old = []) =>
          old.map((item) => (getId(item) === context.tempId ? data : item))
        );
        tempIdsRef.current.delete(context.tempId);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Update item mutation
  const updateMutationResult = useMutation<
    TItem,
    Error,
    TUpdateVariables,
    { previousData: TItem[] | undefined }
  >({
    mutationFn: updateMutation || (async () => {
      throw new Error('updateMutation not provided');
    }),
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData<TItem[]>(queryKey);

      queryClient.setQueryData<TItem[]>(queryKey, (old = []) =>
        old.map((item) =>
          getId(item) === (variables as any).id
            ? { ...item, ...variables }
            : item
        )
      );

      return { previousData };
    },
    onError: (error, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // Remove item mutation
  const removeMutationResult = useMutation<
    void,
    Error,
    TRemoveVariables,
    { previousData: TItem[] | undefined; removedItem: TItem | undefined }
  >({
    mutationFn: removeMutation || (async () => {
      throw new Error('removeMutation not provided');
    }),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData<TItem[]>(queryKey);
      const removedItem = previousData?.find((item) => getId(item) === id);

      queryClient.setQueryData<TItem[]>(queryKey, (old = []) =>
        old.filter((item) => getId(item) !== id)
      );

      return { previousData, removedItem };
    },
    onError: (error, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });

  return {
    addItem: addMutation ? addMutationResult.mutate : undefined,
    addItemAsync: addMutation ? addMutationResult.mutateAsync : undefined,
    isAddingItem: addMutationResult.isPending,
    addError: addMutationResult.error,

    updateItem: updateMutation ? updateMutationResult.mutate : undefined,
    updateItemAsync: updateMutation ? updateMutationResult.mutateAsync : undefined,
    isUpdatingItem: updateMutationResult.isPending,
    updateError: updateMutationResult.error,

    removeItem: removeMutation ? removeMutationResult.mutate : undefined,
    removeItemAsync: removeMutation ? removeMutationResult.mutateAsync : undefined,
    isRemovingItem: removeMutationResult.isPending,
    removeError: removeMutationResult.error,

    isLoading:
      addMutationResult.isPending ||
      updateMutationResult.isPending ||
      removeMutationResult.isPending,
  };
}

/**
 * useOptimisticInfiniteUpdate - Optimistic updates for infinite queries
 *
 * @example
 * ```tsx
 * const { mutate } = useOptimisticInfiniteUpdate({
 *   queryKey: ['events'],
 *   mutationFn: updateEvent,
 *   updateFn: (pages, variables) =>
 *     pages.map(page => ({
 *       ...page,
 *       items: page.items.map(item =>
 *         item.id === variables.id ? { ...item, ...variables } : item
 *       ),
 *     })),
 * });
 * ```
 */
export function useOptimisticInfiniteUpdate<
  TData,
  TPageData extends { items: TData[] },
  TVariables
>({
  queryKey,
  mutationFn,
  updateFn,
  onSuccess,
  onError,
}: {
  queryKey: QueryKey;
  mutationFn: (variables: TVariables) => Promise<TData>;
  updateFn: (pages: TPageData[], variables: TVariables) => TPageData[];
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: Error, variables: TVariables) => void;
}) {
  const queryClient = useQueryClient();

  return useMutation<
    TData,
    Error,
    TVariables,
    { previousData: InfiniteData<TPageData> | undefined }
  >({
    mutationFn,
    onMutate: async (variables) => {
      await queryClient.cancelQueries({ queryKey });

      const previousData = queryClient.getQueryData<InfiniteData<TPageData>>(queryKey);

      if (previousData) {
        queryClient.setQueryData<InfiniteData<TPageData>>(queryKey, {
          ...previousData,
          pages: updateFn(previousData.pages, variables),
        });
      }

      return { previousData };
    },
    onError: (error, variables, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(queryKey, context.previousData);
      }
      onError?.(error, variables);
    },
    onSuccess: (data, variables) => {
      onSuccess?.(data, variables);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export default useOptimisticUpdate;
