import { useGetPendingUsersQuery, useApproveUserMutation } from "@/services/userApi";
import { UserCheck, UserX, Clock } from "lucide-react";
import { toast } from "react-hot-toast";

export const UserApproval = () => {
  const { data, refetch } = useGetPendingUsersQuery(undefined, { refetchOnMountOrArgChange: true });
  const [approveUser, { isLoading: isApproving }] = useApproveUserMutation();

  const handleApprove = async (id: string) => {
    try {
      await approveUser(id).unwrap();
      toast.success("APPROVAL GRANTED");
      refetch();
    } catch (err) {
      toast.error("APPROVAL FAILED");
    }
  };

  const users = data?.users || [];

  if (users.length === 0) {
    return (
      <div className="p-10 text-center brutalist-card bg-warm-white border-dashed text-deep-black">
        <UserCheck className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <p className="font-mono text-xs font-black uppercase tracking-widest text-gray-500">No_Pending_Authorizations</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {users.map((user: any) => (
        <div key={user._id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-6 bg-white brutalist-card">
          <div className="flex items-center gap-6 mb-4 md:mb-0">
            <div className="w-14 h-14 bg-golden-yellow flex items-center justify-center text-deep-black font-black text-2xl border-2 border-deep-black">
              {user.name[0]}
            </div>
            <div>
              <p className="text-2xl font-black italic text-deep-black uppercase tracking-tighter leading-none">{user.name}</p>
              <div className="flex items-center gap-3 mt-2">
                <span className="bg-deep-black text-warm-white px-2 py-0.5 text-[10px] font-mono uppercase font-black tracking-widest">{user.role}</span>
                <p className="text-xs text-gray-500 font-mono font-bold tracking-tight">{user.email}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-4 w-full md:w-auto">
             <div className="flex flex-col items-start md:items-end flex-1 md:flex-none">
                <p className="text-[8px] font-mono font-black text-gray-400 uppercase tracking-widest flex items-center gap-1 mb-1">
                   <Clock size={10} /> CREATED_AT
                </p>
                <p className="text-xs font-bold text-deep-black">{new Date(user.createdAt).toLocaleDateString()}</p>
             </div>
            <button
              onClick={() => handleApprove(user._id)}
              disabled={isApproving}
              className="brutalist-button h-12 px-6 flex items-center gap-2 bg-blue-500 text-white hover:bg-blue-600 w-full md:w-auto"
            >
              <UserCheck size={16} /> AUTHORIZE
            </button>
            <button className="brutalist-button h-12 px-6 flex items-center gap-2 bg-red-500 text-white hover:bg-red-600 w-full md:w-auto">
              <UserX size={16} /> DENY
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
