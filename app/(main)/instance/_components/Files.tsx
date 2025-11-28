"use client";

import React from "react";
import { Instance } from "../../instances/_lib/instances.d";
import { useFiles } from "../_hooks/useFiles";
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
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/app/_components/ui/breadcrumb";
import {
    FileIcon,
    FolderIcon,
    MoreHorizontal,
    UploadIcon,
    PlusIcon,
    TrashIcon,
    DownloadIcon,
    ArrowUpIcon,
    HomeIcon,
    SaveIcon,
    XIcon,
    PencilIcon,
} from "lucide-react";
import { Spinner } from "@/app/_components/ui/spinner";
import { Alert, AlertDescription, AlertTitle } from "@/app/_components/ui/alert";
import Editor from "@monaco-editor/react";

export function Files({ instance }: { instance: Instance }) {
    const [currentPath, setCurrentPath] = React.useState("/");
    const {
        files,
        isLoading,
        isError,
        uploadFile,
        createDirectory,
        deleteFile,
        downloadFile,
        fetchFileContent,
        saveFileContent
    } = useFiles(instance.name, currentPath);

    const [actionError, setActionError] = React.useState<string | null>(null);
    const [isCreateDirOpen, setIsCreateDirOpen] = React.useState(false);
    const [isUploadOpen, setIsUploadOpen] = React.useState(false);

    // Editor State
    const [editingFile, setEditingFile] = React.useState<string | null>(null);
    const [fileContent, setFileContent] = React.useState<string>("");
    const [isFetchingContent, setIsFetchingContent] = React.useState(false);
    const [isSaving, setIsSaving] = React.useState(false);

    const handleNavigate = (path: string) => {
        setCurrentPath(path);
        setActionError(null);
        setEditingFile(null);
    };

    const handleUp = () => {
        if (editingFile) {
            setEditingFile(null);
            return;
        }
        if (currentPath === "/") return;
        const parentPath = currentPath.substring(0, currentPath.lastIndexOf("/"));
        handleNavigate(parentPath || "/");
    };

    const handleEdit = async (fileName: string) => {
        const filePath = `${currentPath === "/" ? "" : currentPath}/${fileName}`;
        setEditingFile(filePath);
        setIsFetchingContent(true);
        setActionError(null);
        try {
            const content = await fetchFileContent(filePath);
            setFileContent(content);
        } catch (err: any) {
            setActionError(err.message);
            setEditingFile(null);
        } finally {
            setIsFetchingContent(false);
        }
    };

    const handleSave = async () => {
        if (!editingFile) return;
        setIsSaving(true);
        setActionError(null);
        try {
            await saveFileContent(editingFile, fileContent);
            setEditingFile(null);
        } catch (err: any) {
            setActionError(err.message);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        setEditingFile(null);
        setFileContent("");
    };

    const breadcrumbs = React.useMemo(() => {
        const path = editingFile ? editingFile : currentPath;
        const parts = path.split("/").filter(Boolean);
        return parts.map((part, index) => {
            const crumbPath = "/" + parts.slice(0, index + 1).join("/");
            return { name: part, path: crumbPath };
        });
    }, [currentPath, editingFile]);

    return (
        <div className="space-y-4">
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon" onClick={handleUp} disabled={currentPath === "/" && !editingFile}>
                        <ArrowUpIcon className="h-4 w-4" />
                    </Button>
                    <Breadcrumb>
                        <BreadcrumbList>
                            <BreadcrumbItem>
                                <BreadcrumbLink onClick={() => handleNavigate("/")} className="cursor-pointer">
                                    <HomeIcon className="h-4 w-4" />
                                </BreadcrumbLink>
                            </BreadcrumbItem>
                            {breadcrumbs.map((crumb, index) => (
                                <React.Fragment key={crumb.path}>
                                    <BreadcrumbSeparator />
                                    <BreadcrumbItem>
                                        <BreadcrumbLink
                                            onClick={() => !editingFile && handleNavigate(crumb.path)}
                                            className={!editingFile ? "cursor-pointer" : ""}
                                        >
                                            {crumb.name}
                                        </BreadcrumbLink>
                                    </BreadcrumbItem>
                                </React.Fragment>
                            ))}
                        </BreadcrumbList>
                    </Breadcrumb>
                </div>

                {editingFile ? (
                    <div className="flex gap-2">
                        <Button variant="outline" onClick={handleCancel} disabled={isSaving}>
                            <XIcon className="mr-2 h-4 w-4" />
                            Cancel
                        </Button>
                        <Button onClick={handleSave} disabled={isSaving}>
                            {isSaving ? <Spinner className="mr-2 h-4 w-4" /> : <SaveIcon className="mr-2 h-4 w-4" />}
                            Save
                        </Button>
                    </div>
                ) : (
                    <div className="flex gap-2">
                        <CreateDirectoryDialog
                            currentPath={currentPath}
                            open={isCreateDirOpen}
                            onOpenChange={setIsCreateDirOpen}
                            onCreate={(name) => createDirectory(currentPath, name).catch(e => setActionError(e.message))}
                        />
                        <UploadFileDialog
                            currentPath={currentPath}
                            open={isUploadOpen}
                            onOpenChange={setIsUploadOpen}
                            onUpload={(file) => uploadFile(currentPath, file).catch(e => setActionError(e.message))}
                        />
                    </div>
                )}
            </div>

            {actionError && (
                <Alert variant="destructive">
                    <AlertTitle>Action Failed</AlertTitle>
                    <AlertDescription>{actionError}</AlertDescription>
                </Alert>
            )}

            <div className="rounded-md border bg-background">
                {editingFile ? (
                    <div className="h-[600px] w-full">
                        {isFetchingContent ? (
                            <div className="flex h-full items-center justify-center">
                                <Spinner className="size-8" />
                            </div>
                        ) : (
                            <Editor
                                height="100%"
                                defaultLanguage="plaintext" // We could try to detect language from extension
                                value={fileContent}
                                onChange={(value) => setFileContent(value || "")}
                                theme="vs-dark" // Or based on system theme
                                options={{
                                    minimap: { enabled: false },
                                    fontSize: 14,
                                }}
                            />
                        )}
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-[30px]"></TableHead>
                                <TableHead>Name</TableHead>
                                <TableHead className="w-[70px]"></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">
                                        <Spinner className="mx-auto h-6 w-6" />
                                    </TableCell>
                                </TableRow>
                            ) : isError ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center text-destructive">
                                        Failed to load files.
                                    </TableCell>
                                </TableRow>
                            ) : files.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">
                                        Empty directory.
                                    </TableCell>
                                </TableRow>
                            ) : (
                                files.map((file: string) => (
                                    <FileRow
                                        key={file}
                                        name={file}
                                        currentPath={currentPath}
                                        onNavigate={handleNavigate}
                                        onEdit={() => handleEdit(file)}
                                        onDownload={() => downloadFile(`${currentPath === "/" ? "" : currentPath}/${file}`)}
                                        onDelete={() => deleteFile(`${currentPath === "/" ? "" : currentPath}/${file}`).catch(e => setActionError(e.message))}
                                    />
                                ))
                            )}
                        </TableBody>
                    </Table>
                )}
            </div>
        </div>
    );
}

function FileRow({
    name,
    currentPath,
    onNavigate,
    onEdit,
    onDownload,
    onDelete,
}: {
    name: string;
    currentPath: string;
    onNavigate: (path: string) => void;
    onEdit: () => void;
    onDownload: () => void;
    onDelete: () => void;
}) {
    // Basic heuristic: if it has no extension, it MIGHT be a folder?
    // Or we just let user try to navigate.
    // Ideally we'd have type info.
    const isLikelyDirectory = !name.includes(".");

    const handlePrimaryAction = () => {
        if (isLikelyDirectory) {
            onNavigate(`${currentPath === "/" ? "" : currentPath}/${name}`);
        } else {
            onEdit();
        }
    };

    return (
        <TableRow>
            <TableCell>
                {isLikelyDirectory ? <FolderIcon className="h-4 w-4 text-blue-500" /> : <FileIcon className="h-4 w-4 text-gray-500" />}
            </TableCell>
            <TableCell className="font-medium cursor-pointer hover:underline" onClick={handlePrimaryAction}>
                {name}
            </TableCell>
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
                        {!isLikelyDirectory && (
                            <DropdownMenuItem onClick={onEdit}>
                                <PencilIcon className="mr-2 h-4 w-4" />
                                Edit
                            </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={onDownload}>
                            <DownloadIcon className="mr-2 h-4 w-4" />
                            Download
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onNavigate(`${currentPath === "/" ? "" : currentPath}/${name}`)}>
                            <FolderIcon className="mr-2 h-4 w-4" />
                            Open
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                            onClick={onDelete}
                            className="text-destructive focus:text-destructive"
                        >
                            <TrashIcon className="mr-2 h-4 w-4" />
                            Delete
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </TableCell>
        </TableRow>
    );
}

function CreateDirectoryDialog({
    currentPath,
    open,
    onOpenChange,
    onCreate,
}: {
    currentPath: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreate: (name: string) => Promise<void>;
}) {
    const [name, setName] = React.useState("");
    const [isLoading, setIsLoading] = React.useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsLoading(true);
        try {
            await onCreate(name);
            onOpenChange(false);
            setName("");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button variant="outline">
                    <PlusIcon className="mr-2 h-4 w-4" />
                    New Folder
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Create Directory</DialogTitle>
                    <DialogDescription>
                        Create a new directory in {currentPath}.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Directory Name</Label>
                        <Input
                            id="name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="new-folder"
                            required
                        />
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

function UploadFileDialog({
    currentPath,
    open,
    onOpenChange,
    onUpload,
}: {
    currentPath: string;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUpload: (file: File) => Promise<void>;
}) {
    const [file, setFile] = React.useState<File | null>(null);
    const [isLoading, setIsLoading] = React.useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!file) return;
        setIsLoading(true);
        try {
            await onUpload(file);
            onOpenChange(false);
            setFile(null);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogTrigger asChild>
                <Button>
                    <UploadIcon className="mr-2 h-4 w-4" />
                    Upload File
                </Button>
            </DialogTrigger>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Upload File</DialogTitle>
                    <DialogDescription>
                        Upload a file to {currentPath}.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="file">File</Label>
                        <Input
                            id="file"
                            type="file"
                            onChange={(e) => setFile(e.target.files?.[0] || null)}
                            required
                        />
                    </div>
                    <DialogFooter>
                        <Button type="submit" disabled={isLoading || !file}>
                            {isLoading && <Spinner className="mr-2 h-4 w-4" />}
                            Upload
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
