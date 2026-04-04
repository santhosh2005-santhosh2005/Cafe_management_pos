import type { IUser } from "@/types/User";
import { createApi, fetchBaseQuery } from "@reduxjs/toolkit/query/react";



export interface StaffInput {
  name: string;
  email: string;
  role: string;
  phone?: string;
  password?: string;
  isActive?: boolean;
}

const baseUrl = import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || "http://localhost:5001";

export const staffApi = createApi({
  reducerPath: "staffApi",
  baseQuery: fetchBaseQuery({
    baseUrl: baseUrl + "/api/users",
    prepareHeaders: (headers) => {
      const token = localStorage.getItem("token");
      if (token) headers.set("Authorization", `Bearer ${token}`);
      return headers;
    },
  }),
  tagTypes: ["Staff"],
  endpoints: (builder) => ({
    getAllStaff: builder.query({
      query: () => "/staff",
      providesTags: ["Staff"],
    }),
    addStaff: builder.mutation({
      query: (staff) => ({
        url: "/staff",
        method: "POST",
        body: staff,
      }),
      invalidatesTags: ["Staff"],
    }),
    updateStaff: builder.mutation<
      IUser,
      { id: string; data: Partial<StaffInput> }
    >({
      query: ({ id, data }) => ({
        url: `/staff/${id}`,
        method: "PUT",
        body: data,
      }),
      invalidatesTags: ["Staff"],
    }),
    deleteStaff: builder.mutation<{ message: string }, string>({
      query: (id) => ({
        url: `/staff/${id}`,
        method: "DELETE",
      }),
      invalidatesTags: ["Staff"],
    }),
    toggleStaffActive: builder.mutation<
      IUser,
      { id: string; isActive: boolean }
    >({
      query: ({ id, isActive }) => ({
        url: `/staff/${id}/active`,
        method: "PATCH",
        body: { isActive },
      }),
      invalidatesTags: ["Staff"],
    }),
    approveStaff: builder.mutation<any, string>({
      query: (id) => ({
        url: `/approve/${id}`,
        method: "PATCH",
      }),
      invalidatesTags: ["Staff"],
    }),
  }),
});

export const {
  useGetAllStaffQuery,
  useAddStaffMutation,
  useUpdateStaffMutation,
  useDeleteStaffMutation,
  useToggleStaffActiveMutation,
  useApproveStaffMutation,
} = staffApi;
