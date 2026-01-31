import { Metadata } from "next";
import ProfilePage from "@/components/profile/ProfilePage";

export const metadata: Metadata = {
    title: "My Profile | CDBL LMS",
    description: "Manage your personal information",
};

export default function Page() {
    return <ProfilePage />;
}
