"use client";

import { useState, useActionState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { addEmergencyContact, updateEmergencyContact, deleteEmergencyContact } from "@/app/actions/profile-actions";

export function EmergencyContactList({ contacts, onUpdate }: any) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingContact, setEditingContact] = useState<any>(null);
    const formRef = useRef<HTMLFormElement>(null);

    const [state, formAction, isPending] = useActionState(
        async (prevState: any, formData: FormData) => {
            const name = formData.get("name") as string;
            const relationship = formData.get("relationship") as string;
            const phone = formData.get("phone") as string;
            const alternatePhone = formData.get("alternatePhone") as string;

            // Client-side validation
            if (!name || name.length < 1) {
                return { success: false, error: "Name is required" };
            }
            if (!relationship || relationship.length < 1) {
                return { success: false, error: "Relationship is required" };
            }
            if (!phone || phone.length < 1) {
                return { success: false, error: "Phone number is required" };
            }

            // Update or add contact
            const result = editingContact
                ? await updateEmergencyContact(editingContact.id, formData)
                : await addEmergencyContact(formData);

            if (result.success) {
                onUpdate?.();
            }

            return result;
        },
        { success: false, error: null }
    );

    useEffect(() => {
        if (state.success) {
            toast.success(editingContact ? "Contact updated" : "Contact added");
            setIsDialogOpen(false);
            setEditingContact(null);
            formRef.current?.reset();
        } else if (state.error) {
            toast.error(state.error);
        }
    }, [state, editingContact]);

    const handleEdit = (contact: any) => {
        setEditingContact(contact);
        setIsDialogOpen(true);
    };

    const handleAdd = () => {
        setEditingContact(null);
        setIsDialogOpen(false);
        // Small delay to ensure state is cleared
        setTimeout(() => setIsDialogOpen(true), 0);
    };

    const handleDelete = async (contactId: number) => {
        if (!confirm("Are you sure you want to delete this contact?")) return;

        const result = await deleteEmergencyContact(contactId);
        if (result.success) {
            toast.success("Contact deleted");
            onUpdate?.();
        } else {
            toast.error(result.error || "Failed to delete contact");
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Emergency Contacts</CardTitle>
                    <CardDescription>
                        Manage your emergency contact information
                    </CardDescription>
                </div>
                <Button onClick={handleAdd} size="sm">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Contact
                </Button>
            </CardHeader>
            <CardContent>
                {contacts.length === 0 ? (
                    <div className="text-center py-6 text-muted-foreground">
                        No emergency contacts added yet.
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Name</TableHead>
                                <TableHead>Relationship</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Alternate Phone</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {contacts.map((contact: any) => (
                                <TableRow key={contact.id}>
                                    <TableCell className="font-medium">{contact.name}</TableCell>
                                    <TableCell>{contact.relationship}</TableCell>
                                    <TableCell>{contact.phone}</TableCell>
                                    <TableCell className="text-muted-foreground">
                                        {contact.alternatePhone || "—"}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-1">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleEdit(contact)}
                                            >
                                                <Pencil className="h-4 w-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleDelete(contact.id)}
                                            >
                                                <Trash2 className="h-4 w-4 text-destructive" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}

                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {editingContact ? "Edit Contact" : "Add Emergency Contact"}
                            </DialogTitle>
                            <DialogDescription>
                                Add details for someone we can contact in case of emergency.
                            </DialogDescription>
                        </DialogHeader>
                        <form ref={formRef} action={formAction} className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">Name</Label>
                                <Input
                                    id="name"
                                    name="name"
                                    placeholder="Contact Name"
                                    defaultValue={editingContact?.name || ""}
                                    required
                                    disabled={isPending}
                                />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="relationship">Relationship</Label>
                                    <Input
                                        id="relationship"
                                        name="relationship"
                                        placeholder="e.g. Spouse, Parent"
                                        defaultValue={editingContact?.relationship || ""}
                                        required
                                        disabled={isPending}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Phone</Label>
                                    <Input
                                        id="phone"
                                        name="phone"
                                        placeholder="Phone Number"
                                        defaultValue={editingContact?.phone || ""}
                                        required
                                        disabled={isPending}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="alternatePhone">Alternate Phone (Optional)</Label>
                                <Input
                                    id="alternatePhone"
                                    name="alternatePhone"
                                    placeholder="Alternate Phone"
                                    defaultValue={editingContact?.alternatePhone || ""}
                                    disabled={isPending}
                                />
                            </div>
                            <DialogFooter>
                                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isPending}>
                                    Cancel
                                </Button>
                                <Button type="submit" disabled={isPending}>
                                    {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isPending ? "Saving..." : "Save Contact"}
                                </Button>
                            </DialogFooter>
                        </form>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}
