import { PageContainer } from "@/components/panel/PageContainer";
import { PageHeader } from "@/components/panel/PageHeader";
import { SiteSubmissionForm } from "@/components/sites/SiteSubmissionForm";

export default function AdminNewSitePage() {
  return (
    <PageContainer width="narrow">
      <PageHeader
        title="Add a site"
        description="Admin-owned sites are auto-approved and visible on the marketplace immediately."
      />
      <SiteSubmissionForm redirectTo="/admin/sites" />
    </PageContainer>
  );
}
