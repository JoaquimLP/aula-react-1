import * as Progress from "@radix-ui/react-progress";
import { Download, ImageUp, Link2, RefreshCcw, X } from "lucide-react";
import { Button } from "./ui/button";
import { motion } from "motion/react";
import { useUpload, type Upload } from "../store/uploads";
import { formatBytes } from "../utils/format-bytes";
import { downloadUrl } from "../utils/download-url";

interface UploadWidgetUploadItemProps {
    upload: Upload;
    uploadId: string;
}

export function UploadWidgetUploadItem({ upload, uploadId }: UploadWidgetUploadItemProps) {
    const cancelUpload = useUpload(state => state.cancelUpload);

    const progress = Math.min(
        upload.compressedSizeInBytes ? Math.round((upload.uploadSizeInBytes * 100) / upload.compressedSizeInBytes) : 0,
        100
    );

    return (
        <motion.div
            className="p-3 rounded-lg flex flex-col gap-3 shadow-shape-content bg-white/2 relative overflow-hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
        >
            <div className="flex flex-col gap-1">
                <span className="text-xs font-medium flex items-center gap-1">
                    <ImageUp className="size-4 text-zinc-300" strokeWidth={1.5} />
                    <span className="max-w-[180px] truncate" >{upload.name}</span>
                </span>
                <span className="text-xxs text-zinc-400 flex items-center gap-1.5">
                    <span className="line-through">{formatBytes(upload.originalSizeInBytes)}</span>
                    <div className="size-1 bg-zinc-700 rounded-full" />
                    <span>
                        {formatBytes(upload.compressedSizeInBytes || upload.originalSizeInBytes)}
                        <span className="text-green-400 ml-1">
                            {upload.compressedSizeInBytes ? `- ${Math.round((upload.originalSizeInBytes - upload.compressedSizeInBytes) / upload.originalSizeInBytes * 100)}%` : '0'}
                        </span>
                    </span>
                    <div className="size-1 rounded-full bg-zinc-700" />
                    {upload.status == 'processing' && <span>{progress}%</span>}
                    {upload.status == 'error' && <span className="text-red-400">Error</span>}
                    {upload.status == 'cancelled' && <span className="text-yellow-400">Cancelled</span>}
                    {upload.status == 'success' && <span className="text-green-400">100%</span>}
                </span>
            </div>
            <Progress.Root
                value={progress}
                data-status={upload.status}
                className="bg-zinc-800 rounded-full h-1 overflow-hidden group"
            >
                <Progress.Indicator className="bg-indigo-500 h-1 group-data-[status=success]:bg-green-400 group-data-[status=error]:bg-red-400 
                group-data-[status=cancelled]:bg-yellow-400 transition-all"
                    style={{ width: upload.status === "processing" ? `${progress}%` : "100%" }} />
            </Progress.Root>
            <div className="absolute top-2 right-2 flex items-center gap-1">
                <Button
                    size="icon-sm"
                    aria-disabled={!upload.remoteUrl}
                    onClick={() => {
                        if (upload.remoteUrl) {
                            downloadUrl(upload.remoteUrl);
                        }
                    }}
                >
                    <Download className="size-4" strokeWidth={1.5} />
                    <span className="sr-only">Download compressed image</span>
                </Button>

                <Button
                    disabled={!upload.remoteUrl}
                    size="icon-sm"
                    onClick={() => upload.remoteUrl && navigator.clipboard.writeText(upload.remoteUrl)}
                >
                    <Link2 className="size-4" strokeWidth={1.5} />
                    <span className="sr-only">Copy remote URL</span>
                </Button>
                <Button
                    disabled={!['cancelled', 'error'].includes(upload.status)}
                    size="icon-sm"
                >
                    <RefreshCcw className="size-4" strokeWidth={1.5} />
                    <span className="sr-only">Retry upload</span>
                </Button>
                <Button disabled={upload.status !== 'processing'} size="icon-sm" onClick={() => cancelUpload(uploadId)}>
                    <X className="size-4" strokeWidth={1.5} />
                    <span className="sr-only">Cancel upload</span>
                </Button>
            </div>

        </motion.div>
    )
}
