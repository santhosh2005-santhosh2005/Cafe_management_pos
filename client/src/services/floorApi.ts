import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";

export const floorApi = createApi({
  reducerPath: "floorApi",
  baseQuery: fetchBaseQuery({
    baseUrl: `${import.meta.env.VITE_API_URL || "http://localhost:5001"}/api/floors`,
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ["Floor"],
  endpoints: (builder) => ({
    getFloors: builder.query<any, void>({
      query: () => "/",
      providesTags: ["Floor"],
    }),
    createFloor: builder.mutation<any, Partial<any>>({
      query: (body) => ({
        url: "/",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Floor"],
    }),
    updateFloor: builder.mutation<any, { id: string; body: Partial<any> }>({
      query: ({ id, body }) => ({
        url: `/${id}`,
        method: "PATCH",
        body,
      }),
      invalidatesTags: ["Floor"],
    }),
    deleteFloor: builder.mutation<any, string>({
      query: (id) => ({
        url: `/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Floor"],
    }),
  }),
});

export const {
  useGetFloorsQuery,
  useCreateFloorMutation,
  useUpdateFloorMutation,
  useDeleteFloorMutation,
} = floorApi;
