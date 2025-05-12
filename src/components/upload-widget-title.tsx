import { UploadCloud } from "lucide-react";
import { usePendingUploads } from "../store/uploads";

export function UploadWidgetTitle() {
    const {isThereAnyPendingUpload, globalPercentage} = usePendingUploads();

    return (
        <div className="flex items-center gap-1.5 text-sm font-medium">
            <UploadCloud className="size-4 text-zinc-400" strokeWidth={1.5} />
            {
                isThereAnyPendingUpload ? (
                    <>
                        <span>Uploads Files</span>
                        <span className="text-xs text-zinc-400 tabular-nums">
                            {globalPercentage}%
                        </span>
                    </>
                ) : (
                    <span>Uploads Files</span>
                )
            }
        </div>
    )
}
