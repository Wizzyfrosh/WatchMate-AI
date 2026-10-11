import { type VideoRecord, type Transcript } from "@watchmate/contracts";
export interface LoadedContent {
    catalog: VideoRecord[];
    videoMap: Map<string, VideoRecord>;
    transcriptMap: Map<string, Transcript>;
}
export declare function loadContent(contentDirPath: string): LoadedContent;
//# sourceMappingURL=content-loader.d.ts.map