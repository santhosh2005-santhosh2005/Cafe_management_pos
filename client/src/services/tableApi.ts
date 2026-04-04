import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const apiRoot = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:5001";

export const tableApi = createApi({
  reducerPath: "tableApi",
  baseQuery: fetchBaseQuery({
    baseUrl: apiRoot,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Table"],
  endpoints: (builder) => ({
    getTables: builder.query<any, void>({
      query: () => "/api/tables/",
      providesTags: ["Table"],
    }),
    getAssignedTables: builder.query<any, void>({
      query: () => "/api/tables/assigned",
      providesTags: ["Table"],
    }),
    createTable: builder.mutation<any, Partial<any>>({
      query: (body) => ({
        url: "/api/tables/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Table"],
    }),
    updateTableStatus: builder.mutation<any, { id: string; status: string }>({
      query: ({ id, status }) => ({
        url: `/api/tables/${id}`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["Table"],
    }),
    updateTable: builder.mutation<any, { id: string; body: Partial<any> }>({
      query: ({ id, body }) => ({
        url: `/api/tables/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Table"],
    }),
    deleteTable: builder.mutation<any, string>({
      query: (id) => ({
        url: `/api/tables/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Table"],
    }),
    assignTableWaiter: builder.mutation<any, { tableId: string; waiterId: string | null }>({
      query: (body) => ({
        url: "/api/staff/assign-table",
        method: "PUT",
        body,
      }),
      invalidatesTags: ["Table"],
    }),
  }),
});

export const {
  useGetTablesQuery,
  useGetAssignedTablesQuery,
  useCreateTableMutation,
  useUpdateTableStatusMutation,
  useUpdateTableMutation,
  useDeleteTableMutation,
  useAssignTableWaiterMutation,
} = tableApi;
