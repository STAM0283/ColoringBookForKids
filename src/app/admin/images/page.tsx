import { AssetManagementList } from "@/components/admin/asset-management-list";
import { ImageCreateManager } from "@/components/admin/image-create-manager";

export default function ImagesAdminPage() {
  return <ImageCreateManager><AssetManagementList kind="images"/></ImageCreateManager>;
}
