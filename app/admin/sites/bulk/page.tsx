import { PageContainer } from "@/components/panel/PageContainer";
import { PageHeader } from "@/components/panel/PageHeader";
import { BulkSiteUpload } from "@/components/sites/BulkSiteUpload";

export default function AdminBulkImportPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Bulk import sites"
        description="Add or update your platform-owned sites at once from a CSV — metrics and Guest Post / Niche Edit prices included. Admin sites go live immediately."
      />
      <BulkSiteUpload />
    </PageContainer>
  );
}
