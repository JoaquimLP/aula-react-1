import { enableMapSet } from "immer";
import { create } from "zustand";
import { immer } from 'zustand/middleware/immer';
import { uploadFileToStorage } from "../http/upload-file-to-storage";
import { CanceledError } from "axios";
import { useShallow } from "zustand/shallow";
import { useCompressImage } from "./compress-image";

export type Upload = {
    name: string;
    file: File;
    status: 'processing' | 'success' | 'error' | 'cancelled',
    abortController: AbortController;
    originalSizeInBytes: number;
    uploadSizeInBytes: number;
    compressedSizeInBytes?: number;
    remoteUrl?: string;
}

type UploadState = {
   uploads: Map<string, Upload>
   addUploads: (files: File[]) => void
   cancelUpload: (uploadId: string) => void
}

enableMapSet();

export const useUpload= create<UploadState, [["zustand/immer", never]]>(immer((set, get) => {

    function updateUpload(uploadId: string, data: Partial<Upload>) {
        const upload = get().uploads.get(uploadId);

        if (!upload) return;

        set(state => {
            state.uploads.set(uploadId, {...upload, ...data});
        });
    }

    async function processUpload(uploadId: string) {
        const upload = get().uploads.get(uploadId);

        if (!upload) return;

        try {
            const compressedFile = await useCompressImage({
                file: upload.file,
                maxWidth: 1000,
                maxHeight: 1000,
                quality: 0.8
            })
            updateUpload(uploadId, {compressedSizeInBytes: compressedFile.size})
            const {url} = await uploadFileToStorage(
                {
                    file: compressedFile,
                    onProgress: (sizeInBytes) => {
                        updateUpload(uploadId, {uploadSizeInBytes: sizeInBytes})
                    }
                }, 
                {signal: upload.abortController.signal}
            );

            updateUpload(uploadId, {status: 'success', remoteUrl: url})
        } catch (error) {
            if (error instanceof CanceledError) {
                updateUpload(uploadId, {status: 'cancelled'})
            } else {
                updateUpload(uploadId, {status: 'error'})
            }
        }
    }

    function cancelUpload(uploadId: string) {
        const upload = get().uploads.get(uploadId);

        if (!upload) return;

        upload.abortController.abort();

        updateUpload(uploadId, {status: 'cancelled'})
    }

    function addUploads(files: File[]) {
        console.log(files);
        for (const file of files) {
            const uploadId = crypto.randomUUID();
            const abortController = new AbortController();
            const upload: Upload = {
                name: file.name,
                file,
                status: 'processing',
                abortController,
                originalSizeInBytes: file.size,
                uploadSizeInBytes: file.size,
            }

            set(state => {
                state.uploads.set(uploadId, upload);
            });

            processUpload(uploadId);
        }
    }
    return {
        uploads: new Map(),
        addUploads,
        cancelUpload,
    }
}))

export const usePendingUploads = () => {

    return useUpload(useShallow(
        store => {
            const isThereAnyPendingUpload = Array
                .from(store.uploads.values())
                .some(upload => upload.status === 'processing');
    
            if (!isThereAnyPendingUpload){
                return {isThereAnyPendingUpload, globalPercentage: 100}
            }
    
            const {total, uploaded} = Array.from(store.uploads.values()).reduce(
                (acc, upload) => {
                    if (upload.compressedSizeInBytes) {
                        acc.total += upload.compressedSizeInBytes;
               
                    }
                    acc.uploaded += upload.uploadSizeInBytes || upload.originalSizeInBytes;
                    return acc;
                },
                {total: 0, uploaded: 0}
            )
    
            const globalPercentage = Math.min(Math.round((uploaded * 100) / total), 100);
    
            return {isThereAnyPendingUpload, globalPercentage}
        }
    ))
}