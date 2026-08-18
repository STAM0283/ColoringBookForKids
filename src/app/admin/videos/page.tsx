import { AssetManagementList } from "@/components/admin/asset-management-list";
import { VideoCreateManager } from "@/components/admin/video-create-manager";

export default function VideosAdminPage() {
  return <VideoCreateManager><AssetManagementList kind="videos"/></VideoCreateManager>;
}
