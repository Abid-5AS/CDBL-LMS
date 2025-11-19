"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/user-context";

const ExperimentalFeaturesRoute = () => {
  const router = useRouter();
  const { user } = useUser();

  useEffect(() => {
    if (user) {
      // Redirect to the appropriate experimental features page based on user role
      if (user.role === 'EMPLOYEE' || user.role === 'DEPT_HEAD') {
        router.push('/dashboard/employee/experimental-features');
      } else {
        // For other roles, we could redirect to a different experimental page or show a message
        router.push('/dashboard/hr-admin');
      }
    }
  }, [user, router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <p>Redirecting to experimental features...</p>
    </div>
  );
};

export default ExperimentalFeaturesRoute;