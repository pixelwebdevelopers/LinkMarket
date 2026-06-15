import { PageContainer } from "@/components/panel/PageContainer";
import { PageHeader } from "@/components/panel/PageHeader";
import { BulkSiteUpload } from "@/components/sites/BulkSiteUpload";

export default function ResellerBulkImportPage() {
  return (
    <PageContainer>
      <PageHeader
        title="Bulk import sites"
        description="Add or update many sites at once from a CSV file — including metrics and Guest Post / Niche Edit prices."
      />
      <BulkSiteUpload />
    </PageContainer>
  );
}
