import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const tableApi = createApi({
  reducerPath: "tableApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_URL || "http://localhost:5001"}/api/tables`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Table"],
  endpoints: (builder) => ({
    getTables: builder.query<any, void>({
      query: () => "/",
      providesTags: ["Table"],
    }),
    getAssignedTables: builder.query<any, void>({
      query: () => "/assigned",
      providesTags: ["Table"],
    }),
    createTable: builder.mutation<any, Partial<any>>({
      query: (body) => ({
        url: "/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Table"],
    }),
    updateTableStatus: builder.mutation<any, { id: string; status: string }>({
      query: ({ id, status }) => ({
        url: `/${id}`,
        method: "PATCH",
        body: { status },
      }),
      invalidatesTags: ["Table"],
    }),
    updateTable: builder.mutation<any, { id: string; body: Partial<any> }>({
      query: ({ id, body }) => ({
        url: `/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Table"],
    }),
    deleteTable: builder.mutation<any, string>({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
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
} = tableApi;
