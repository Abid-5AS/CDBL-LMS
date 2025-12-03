"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";

const contactSchema = z.object({
    id: z.number().optional(),
    name: z.string().min(1, "Name is required"),
    relation: z.string().min(1, "Relation is required"),
    phone: z.string().min(1, "Phone number is required"),
    address: z.string().optional(),
});

export function EmergencyContactList({ contacts, onUpdate }: any) {
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingContact, setEditingContact] = useState<any>(null);
    const [isSaving, setIsSaving] = useState(false);

    const form = useForm<z.infer<typeof contactSchema>>({
        resolver: zodResolver(contactSchema),
        defaultValues: {
            name: "",
            relation: "",
            phone: "",
            address: "",
        },
    });

    const handleEdit = (contact: any) => {
        setEditingContact(contact);
        form.reset({
            id: contact.id,
            name: contact.name,
            relation: contact.relation,
            phone: contact.phone,
            address: contact.address || "",
        });
        setIsDialogOpen(true);
    };

    const handleAdd = () => {
        setEditingContact(null);
        form.reset({
            name: "",
            relation: "",
            phone: "",
            address: "",
        });
        setIsDialogOpen(true);
    };

    async function onSubmit(values: z.infer<typeof contactSchema>) {
        setIsSaving(true);
        try {
            const response = await fetch("/api/user/profile", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    section: "emergency",
                    data: values,
                }),
            });

            if (response.ok) {
                toast.success(editingContact ? "Contact updated" : "Contact added");
                setIsDialogOpen(false);
                onUpdate();
            } else {
                toast.error("Failed to save contact");
            }
        } catch (error) {
            toast.error("Error saving contact");
        } finally {
            setIsSaving(false);
        }
    }

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
                                <TableHead>Relation</TableHead>
                                <TableHead>Phone</TableHead>
                                <TableHead>Address</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {contacts.map((contact: any) => (
                                <TableRow key={contact.id}>
                                    <TableCell className="font-medium">{contact.name}</TableCell>
                                    <TableCell>{contact.relation}</TableCell>
                                    <TableCell>{contact.phone}</TableCell>
                                    <TableCell className="max-w-[200px] truncate">
                                        {contact.address}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <Button
                                            variant="ghost"
                                            size="icon"
                                            onClick={() => handleEdit(contact)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
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
                        <Form {...form}>
                            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                                <FormField
                                    control={form.control}
                                    name="name"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Name</FormLabel>
                                            <FormControl>
                                                <Input placeholder="Contact Name" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <div className="grid grid-cols-2 gap-4">
                                    <FormField
                                        control={form.control}
                                        name="relation"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Relation</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="e.g. Spouse, Parent" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                    <FormField
                                        control={form.control}
                                        name="phone"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel>Phone</FormLabel>
                                                <FormControl>
                                                    <Input placeholder="Phone Number" {...field} />
                                                </FormControl>
                                                <FormMessage />
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="address"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>Address (Optional)</FormLabel>
                                            <FormControl>
                                                <Textarea placeholder="Contact Address" {...field} />
                                            </FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )}
                                />
                                <DialogFooter>
                                    <Button type="submit" disabled={isSaving}>
                                        {isSaving ? "Saving..." : "Save Contact"}
                                    </Button>
                                </DialogFooter>
                            </form>
                        </Form>
                    </DialogContent>
                </Dialog>
            </CardContent>
        </Card>
    );
}
