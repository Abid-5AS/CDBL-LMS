"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, User, Phone, CreditCard, FileText } from "lucide-react";
import { PersonalDetailsForm } from "./PersonalDetailsForm";
import { EmergencyContactList } from "./EmergencyContactList";
import { BankDetailsForm } from "./BankDetailsForm";
import { toast } from "sonner";

export default function ProfilePage() {
    const [isLoading, setIsLoading] = useState(true);
    const [profileData, setProfileData] = useState<any>(null);
    const [activeTab, setActiveTab] = useState("personal");

    const fetchProfile = async () => {
        try {
            const response = await fetch("/api/user/profile");
            if (response.ok) {
                const data = await response.json();
                setProfileData(data);
            } else {
                toast.error("Failed to load profile data");
            }
        } catch (error) {
            toast.error("Error loading profile");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        fetchProfile();
    }, []);

    if (isLoading) {
        return (
            <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="container mx-auto py-6 space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">My Profile</h1>
                    <p className="text-muted-foreground">
                        Manage your personal information and preferences
                    </p>
                </div>
            </div>

            <div className="w-full">
                <div className="grid w-full grid-cols-4 lg:w-[400px] bg-muted/80 p-1 rounded-2xl mb-6">
                    <Button
                        variant={activeTab === "personal" ? "secondary" : "ghost"}
                        onClick={() => setActiveTab("personal")}
                        className="rounded-xl"
                    >
                        <User className="mr-2 h-4 w-4" />
                        Personal
                    </Button>
                    <Button
                        variant={activeTab === "emergency" ? "secondary" : "ghost"}
                        onClick={() => setActiveTab("emergency")}
                        className="rounded-xl"
                    >
                        <Phone className="mr-2 h-4 w-4" />
                        Emergency
                    </Button>
                    <Button
                        variant={activeTab === "banking" ? "secondary" : "ghost"}
                        onClick={() => setActiveTab("banking")}
                        className="rounded-xl"
                    >
                        <CreditCard className="mr-2 h-4 w-4" />
                        Banking
                    </Button>
                    <Button
                        variant={activeTab === "documents" ? "secondary" : "ghost"}
                        onClick={() => setActiveTab("documents")}
                        className="rounded-xl"
                    >
                        <FileText className="mr-2 h-4 w-4" />
                        Documents
                    </Button>
                </div>

                {activeTab === "personal" && (
                    <div className="mt-6">
                        <PersonalDetailsForm
                            user={profileData}
                            profile={profileData?.profile}
                            onUpdate={fetchProfile}
                        />
                    </div>
                )}

                {activeTab === "emergency" && (
                    <div className="mt-6">
                        <EmergencyContactList
                            contacts={profileData?.emergencyContacts || []}
                            onUpdate={fetchProfile}
                        />
                    </div>
                )}

                {activeTab === "banking" && (
                    <div className="mt-6">
                        <BankDetailsForm
                            details={profileData?.bankDetails}
                            onUpdate={fetchProfile}
                        />
                    </div>
                )}

                {activeTab === "documents" && (
                    <div className="mt-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Documents</CardTitle>
                                <CardDescription>
                                    Manage your official documents (NID, Passport, etc.)
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex flex-col items-center justify-center py-10 text-center text-muted-foreground">
                                    <FileText className="h-10 w-10 mb-4 opacity-20" />
                                    <p>Document management coming soon</p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
}
