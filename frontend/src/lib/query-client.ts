type QueryKey = readonly unknown[];

class TinyQueryClient {
  invalidateQueries(_queryKey?: QueryKey) {
    return;
  }
}

export const queryClient = new TinyQueryClient();
