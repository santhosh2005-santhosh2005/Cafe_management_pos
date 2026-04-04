import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const sessionApi = createApi({
  reducerPath: "sessionApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_URL || "http://localhost:5001"}/api/sessions`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Session"],
  endpoints: (builder) => ({
    getSessions: builder.query<any, void>({
      query: () => "/",
      providesTags: ["Session"],
    }),
    getActiveSession: builder.query<any, void>({
      query: () => "/active",
      providesTags: ["Session"],
    }),
    openSession: builder.mutation<any, { startingBalance: number }>({
      query: (body) => ({
        url: "/open",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Session"],
    }),
    closeSession: builder.mutation<any, { id: string; endingBalance: number }>({
      query: ({ id, endingBalance }) => ({
        url: `/close/${id}`,
        method: "POST",
        body: { endingBalance },
      }),
      invalidatesTags: ["Session"],
    }),
  }),
});

export const {
  useGetSessionsQuery,
  useGetActiveSessionQuery,
  useOpenSessionMutation,
  useCloseSessionMutation,
} = sessionApi;
