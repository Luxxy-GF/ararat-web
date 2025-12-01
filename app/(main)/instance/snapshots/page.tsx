"use client";

import React from "react";
import { useSearchParams } from "next/navigation";
import { useInstance } from "../_hooks/useInstance";
import { useSnapshots } from "../_hooks/useSnapshots";
import { InstanceSnapshot } from "../../instances/_lib/instances.d";
import { Spinner } from "@/app/_components/ui/spinner";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/app/_components/ui/table";
import { Button } from "@/app/_components/ui/button";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/app/_components/ui/dropdown-menu";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/app/_components/ui/dialog";
import { Input } from "@/app/_components/ui/input";
import { Label } from "@/app/_components/ui/label";
import { Checkbox } from "@/app/_components/ui/checkbox";
import {
    MoreHorizontal,
    PlusIcon,
    RotateCcwIcon,
    TrashIcon,
    PencilIcon,
} from "lucide-react";
import { formatDate, formatBytes } from "../_lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/app/_components/ui/alert";

export default function SnapshotsPage() {
    const searchParams = useSearchParams();
    const name = searchParams.get("name");
    const { instance, isLoading } = useInstance(name);

    if (isLoading) {
        return <Spinner />;
    }

    if (!instance) {
        return null;
    }

    return <Snapshots instance={instance} />;
}

function Snapshots({ instance }: { instance: any }) {
    const [isCreateOpen, setIsCreateOpen] = React.useState(false);
    const [actionError, setActionError] = React.useState<string | null>(null);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <h2 className="text-lg font-medium">Snapshots</h2>
                <CreateSnapshotDialog
                    instanceName={instance.name}
                    open={isCreateOpen}
                    onOpenChange={setIsCreateOpen}
                />
            </div>

            {actionError && (
                <Alert variant="destructive">
                    <AlertTitle>Action Failed</AlertTitle>
                    <AlertDescription>{actionError}</AlertDescription>
                </Alert>
            )}

            <div className="rounded-md border">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Name</TableHead>
                            <TableHead>Created At</TableHead>
                            <TableHead>Stateful</TableHead>
                            <TableHead>Size</TableHead>
                            <TableHead className="w-[70px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {instance.snapshots && instance.snapshots.length > 0 ? (
                            instance.snapshots.map((snapshot: any) => (
                                <SnapshotRow
                                    key={snapshot.name}
                                    snapshot={snapshot}
                                    instanceName={instance.name}
                                    onError={setActionError}
                                />
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">
                                    No snapshots found.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </div>
        </div>
    );
}

function SnapshotRow({
    snapshot,
    instanceName,
    onError,
}: {
    snapshot: InstanceSnapshot;
    instanceName: string;
    onError: (err: string | null) => void;
}) {
    const [isRenameOpen, setIsRenameOpen] = React.useState(false);
    const [isRestoreOpen, setIsRestoreOpen] = React.useState(false);
    const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);

    return (
        <TableRow>
            <TableCell className="font-medium">{snapshot.name.split("/").pop()}</TableCell>
            <TableCell>{formatDate(snapshot.created_at)}</TableCell>
            <TableCell>{snapshot.stateful ? "Yes" : "No"}</TableCell>
            <TableCell>{snapshot.size ? formatBytes(snapshot.size) : "—"}</TableCell>
            <TableCell>
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                            <span className="sr-only">Open menu</span>
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => setIsRestoreOpen(true)}>
                            <RotateCcwIcon className="mr-2 h-4 w-4" />
                            Restore
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setIsRenameOpen(true)}>
                            <PencilIcon className="mr-2 h-4 w-4" />
                            Rename
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={() => setIsDeleteOpen(true)}
                            className="text-destructive focus:text-destructive"
                        >
                            <TrashIcon className="mr-2 h-4 w-4" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>

                <RenameSnapshotDialog
                    instanceName={instanceName}
                    snapshotName={snapshot.name}
                    open={isRenameOpen}
                    onOpenChange={setIsRenameOpen}
                    onError={onError}
                />
                <RestoreSnapshotDialog
                    instanceName={instanceName}
                    snapshotName={snapshot.name}
                    open={isRestoreOpen}
                    onOpenChange={setIsRestoreOpen}
                    onError={onError}
                />
                <DeleteSnapshotDialog
                    instanceName={instanceName}
                    snapshotName={snapshot.name}
                    open={isDeleteOpen}
                    onOpenChange={setIsDeleteOpen}
                    onError={onError}
                />
            </TableCell>
        </TableRow>
    );
}

function CreateSnapshotDialog({
    instanceName,
    open,
    onOpenChange,
}: {
    instanceName: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}) {
    const [name, setName] = React.useState("");
    const [stateful, setStateful] = React.useState(false);
    const [isLoading, setIsLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const { createSnapshot } = useSnapshots(instanceName);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        setError(null);

        try {
            await createSnapshot(name, stateful);
            onOpenChange(false);
            setName("");
            setStateful(false);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button>
                    <PlusIcon className="mr-2 h-4 w-4" />
                    Create Snapshot
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create Snapshot</DialogTitle>
                    <DialogDescription>
                        Create a new snapshot of {instanceName}.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {error && (
                        <Alert variant="destructive">
                            <AlertDescription>{error}</AlertDescription>
                        </Alert>
                    )}
                    <div className="space-y-2">
                        <Label htmlFor="name">Name (Optional)</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="snap0"
                        />
                    </div>
                    <div className="flex items-center space-x-2">
                        <Checkbox
                            id="stateful"
                            checked={stateful}
                            onCheckedChange={(c) => setStateful(!!c)}
                        />
                        <Label htmlFor="stateful">Stateful snapshot</Label>
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Spinner className="mr-2 h-4 w-4" />}
                            Create
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function RenameSnapshotDialog({
    instanceName,
    snapshotName,
    open,
    onOpenChange,
    onError,
}: {
    instanceName: string;
    snapshotName: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onError: (err: string | null) => void;
}) {
    const shortName = snapshotName.split("/").pop() || "";
    const [newName, setNewName] = React.useState(shortName);
    const [isLoading, setIsLoading] = React.useState(false);
    const { renameSnapshot } = useSnapshots(instanceName);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        onError(null);

        try {
            await renameSnapshot(snapshotName, newName);
            onOpenChange(false);
        } catch (err: any) {
            onError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Rename Snapshot</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="newName">New Name</Label>
                        <Input
                            id="newName"
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading}>
                            {isLoading && <Spinner className="mr-2 h-4 w-4" />}
                            Rename
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}

function RestoreSnapshotDialog({
    instanceName,
    snapshotName,
    open,
    onOpenChange,
    onError,
}: {
    instanceName: string;
    snapshotName: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onError: (err: string | null) => void;
}) {
    const [isLoading, setIsLoading] = React.useState(false);
    const shortName = snapshotName.split("/").pop() || "";
    const { restoreSnapshot } = useSnapshots(instanceName);

    const handleRestore = async () => {
        setIsLoading(true);
        onError(null);

        try {
            await restoreSnapshot(snapshotName);
            onOpenChange(false);
        } catch (err: any) {
            onError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Restore Snapshot</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to restore {instanceName} to snapshot{" "}
                        <span className="font-semibold">{shortName}</span>? This will
                        overwrite the current state.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button onClick={handleRestore} disabled={isLoading}>
                        {isLoading && <Spinner className="mr-2 h-4 w-4" />}
                        Restore
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

function DeleteSnapshotDialog({
    instanceName,
    snapshotName,
    open,
    onOpenChange,
    onError,
}: {
    instanceName: string;
    snapshotName: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onError: (err: string | null) => void;
}) {
    const [isLoading, setIsLoading] = React.useState(false);
    const shortName = snapshotName.split("/").pop() || "";
    const { deleteSnapshot } = useSnapshots(instanceName);

    const handleDelete = async () => {
        setIsLoading(true);
        onError(null);

        try {
            await deleteSnapshot(snapshotName);
            onOpenChange(false);
        } catch (err: any) {
            onError(err.message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Delete Snapshot</DialogTitle>
                    <DialogDescription>
                        Are you sure you want to delete snapshot{" "}
                        <span className="font-semibold">{shortName}</span>? This action
                        cannot be undone.
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                    <Button variant="outline" onClick={() => onOpenChange(false)}>
                        Cancel
                    </Button>
                    <Button
                        variant="destructive"
                        onClick={handleDelete}
                        disabled={isLoading}
                    >
                        {isLoading && <Spinner className="mr-2 h-4 w-4" />}
                        Delete
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
