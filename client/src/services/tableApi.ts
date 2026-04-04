import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

const baseUrl = import.meta.env.VITE_API_URL || "http://localhost:5000";

export const tableApi = createApi({
  reducerPath: "tableApi",
  baseQuery: fetchBaseQuery({ baseUrl: baseUrl + "/api" }),
  tagTypes: ["Table"],
  endpoints: (builder) => ({
    getTables: builder.query<any, void>({
      query: () => "/tables",
      providesTags: ["Table"],
    }),
    updateTableStatus: builder.mutation<any, { id: string; status: string }>({
      query: ({ id, status }) => ({
        url: `/tables/${id}/status`,
        method: "POST",
        body: { status },
      }),
      invalidatesTags: ["Table"],
    }),
  }),
});

export const { useGetTablesQuery, useUpdateTableStatusMutation } = tableApi;
